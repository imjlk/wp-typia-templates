import packageJson from '../package.json';
import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
  formatCliDiagnosticError,
  serializeCliDiagnosticError,
} from '@wp-typia/project-tools/cli-diagnostics';
import {
  ALL_COMMAND_OPTION_METADATA,
  ADD_OPTION_METADATA,
  buildCommandOptionParser,
  CREATE_OPTION_METADATA,
  extractKnownOptionValuesFromArgv,
  parseCommandArgvWithMetadata,
  resolveCommandOptionValues,
} from './command-option-metadata';
import { prefersStructuredCliArgv } from './cli-diagnostic-output';
import {
  normalizeCliOutputFormatArgv,
  validateCliOutputFormatArgv,
} from './cli-output-format';
import {
  getTemplateById,
  listTemplates,
} from '@wp-typia/project-tools/cli-templates';
import {
  getAddBlockDefaults,
  getCreateDefaults,
  loadWpTypiaUserConfig,
  loadWpTypiaUserConfigFromSource,
  mergeWpTypiaUserConfig,
} from './config';
import { extractWpTypiaConfigOverride } from './config-override';
import type { PrintLine } from './print-line';
import {
  executeDoctorCommand,
  executeInitCommand,
  executeMigrateCommand,
  executeSyncCommand,
  executeTemplatesCommand,
} from './runtime-bridge';
import {
  buildStructuredInitSuccessPayload,
  buildSyncDryRunPayload,
  printCompletionPayload,
} from './runtime-bridge-output';
import { resolveSyncExecutionTarget } from './runtime-bridge-sync';
import {
  normalizeWpTypiaArgv,
  resolveCanonicalCommandContext,
} from './command-contract';
import { dispatchNodeFallbackAdd } from './node-fallback/dispatchers/add';
import { dispatchNodeFallbackCreate } from './node-fallback/dispatchers/create';
import {
  NODE_FALLBACK_HELP_RENDERERS,
  STANDALONE_GUIDANCE_LINE,
  renderGeneralHelp,
  renderNoCommandHelp,
} from './node-fallback/help';
import type {
  NodeFallbackCommandDispatcher,
  NodeFallbackDispatchContext,
  NodeFallbackExecutableCommandName,
  NodeFallbackGlobalFlags,
} from './node-fallback/types';

const NODE_FALLBACK_OPTION_PARSER = buildCommandOptionParser(
  ALL_COMMAND_OPTION_METADATA,
);
const NODE_FALLBACK_BOOLEAN_OPTION_NAMES = ['help', 'version'] as const;
const printLine: PrintLine = (line) => {
  console.log(line);
};
const warnLine: PrintLine = (line) => {
  console.warn(line);
};

export function hasFlagBeforeTerminator(argv: string[], flag: string): boolean {
  for (const arg of argv) {
    if (arg === '--') {
      return false;
    }
    if (arg === flag) {
      return true;
    }
  }

  return false;
}

export function parseGlobalFlags(argv: string[]): {
  argv: string[];
  flags: NodeFallbackGlobalFlags;
} {
  const { argv: nextArgv, flags } = extractKnownOptionValuesFromArgv(argv, {
    optionNames: ['format', 'id'],
    parser: NODE_FALLBACK_OPTION_PARSER,
  });

  return {
    argv: nextArgv,
    flags: {
      format: typeof flags.format === 'string' ? flags.format : undefined,
      id: typeof flags.id === 'string' ? flags.id : undefined,
    },
  };
}

async function applyNodeFallbackConfigDefaults(
  command: string | undefined,
  subcommand: string | undefined,
  flags: Record<string, unknown>,
  configOverridePath: string | undefined,
  cwd: string,
): Promise<Record<string, unknown>> {
  let config = await loadWpTypiaUserConfig(cwd);
  if (configOverridePath) {
    const overrideConfig = await loadWpTypiaUserConfigFromSource(
      cwd,
      configOverridePath,
    );
    config = mergeWpTypiaUserConfig(config, overrideConfig);
  }

  if (command === 'create') {
    return {
      ...flags,
      ...resolveCommandOptionValues(CREATE_OPTION_METADATA, {
        defaults: getCreateDefaults(config),
        flags,
      }),
    };
  }

  if (command === 'add' && subcommand === 'block') {
    return {
      ...flags,
      ...resolveCommandOptionValues(ADD_OPTION_METADATA, {
        defaults: getAddBlockDefaults(config),
        flags,
      }),
    };
  }

  return flags;
}

function parseArgv(argv: string[]) {
  return parseCommandArgvWithMetadata(argv, {
    extraBooleanOptionNames: NODE_FALLBACK_BOOLEAN_OPTION_NAMES,
    parser: NODE_FALLBACK_OPTION_PARSER,
  });
}

function renderVersion(
  options: {
    format?: string;
  } = {},
) {
  if (options.format === 'json') {
    printLine(
      JSON.stringify(
        {
          ok: true,
          data: {
            type: 'version',
            name: packageJson.name,
            version: packageJson.version,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  printLine(`wp-typia ${packageJson.version}`);
}

function renderTemplatesJson(
  flags: NodeFallbackGlobalFlags,
  subcommand: string,
) {
  if (subcommand === 'list') {
    printLine(
      JSON.stringify(
        {
          templates: listTemplates(),
        },
        null,
        2,
      ),
    );
    return;
  }

  const templateId = flags.id;
  if (!templateId) {
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      command: 'templates',
      detailLines: ['`wp-typia templates inspect` requires <template-id>.'],
    });
  }
  const template = getTemplateById(templateId);
  if (!template) {
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
      command: 'templates',
      detailLines: [`Unknown template "${templateId}".`],
    });
  }
  printLine(
    JSON.stringify(
      {
        template,
      },
      null,
      2,
    ),
  );
}

function renderUnsupportedCommand(command: string) {
  throw createCliCommandError({
    code: CLI_DIAGNOSTIC_CODES.UNSUPPORTED_COMMAND,
    command: command,
    detailLines: [
      [
        `The Bun-free fallback runtime does not support \`${command}\` yet.`,
        'Supported without Bun: `--version`, `--help`, non-interactive `create`/`init`/`add`/`migrate`, `doctor`, `sync`, `templates list`, and `templates inspect`.',
        `Install Bun 1.3.11+ or use \`bunx wp-typia ...\` for the full Bunli-powered runtime. ${STANDALONE_GUIDANCE_LINE}`,
      ].join(' '),
    ],
    summary: 'This command requires the Bun-powered runtime.',
  });
}

async function renderDoctorJson(): Promise<void> {
  const [
    { getDoctorChecks },
    { createCliCommandError, getDoctorFailureDetailLines },
  ] = await Promise.all([
    import('@wp-typia/project-tools/cli-doctor'),
    import('@wp-typia/project-tools/cli-diagnostics'),
  ]);
  const checks = await getDoctorChecks(process.cwd());
  printLine(
    JSON.stringify(
      {
        checks,
      },
      null,
      2,
    ),
  );
  if (checks.some((check) => check.status === 'fail')) {
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
      command: 'doctor',
      detailLines: getDoctorFailureDetailLines(checks),
      summary: 'One or more doctor checks failed.',
    });
  }
}

const NODE_FALLBACK_COMMAND_DISPATCHERS = {
  add: dispatchNodeFallbackAdd,
  create: dispatchNodeFallbackCreate,
  doctor: async ({ cwd, mergedFlags }: NodeFallbackDispatchContext) => {
    if (mergedFlags.format === 'json') {
      await renderDoctorJson();
      return;
    }
    await executeDoctorCommand(cwd);
  },
  init: async ({
    cwd,
    mergedFlags,
    positionals,
    printLine,
    warnLine,
  }: NodeFallbackDispatchContext) => {
    const plan = await executeInitCommand(
      {
        apply: Boolean(mergedFlags.apply),
        cwd,
        packageManager:
          typeof mergedFlags['package-manager'] === 'string'
            ? mergedFlags['package-manager']
            : undefined,
        projectDir: positionals[1],
      },
      {
        emitOutput: mergedFlags.format !== 'json',
        printLine,
        warnLine,
      },
    );
    if (mergedFlags.format === 'json') {
      printLine(
        JSON.stringify(buildStructuredInitSuccessPayload(plan), null, 2),
      );
    }
  },
  migrate: async ({
    cwd,
    mergedFlags,
    positionals,
    printLine,
  }: NodeFallbackDispatchContext) => {
    await executeMigrateCommand({
      command: positionals[1],
      cwd,
      flags: mergedFlags,
      printLine,
    });
  },
  sync: async ({
    cwd,
    mergedFlags,
    positionals,
    printLine,
    warnLine,
  }: NodeFallbackDispatchContext) => {
    try {
      const syncTarget = resolveSyncExecutionTarget(positionals[1]);
      const sync = await executeSyncCommand({
        captureOutput:
          mergedFlags.format === 'json' && !Boolean(mergedFlags['dry-run']),
        check: Boolean(mergedFlags.check),
        cwd,
        dryRun: Boolean(mergedFlags['dry-run']),
        target: syncTarget,
      });
      if (mergedFlags.format === 'json') {
        printLine(
          JSON.stringify(
            {
              sync,
            },
            null,
            2,
          ),
        );
        return;
      }
      if (sync.dryRun) {
        printCompletionPayload(
          buildSyncDryRunPayload({
            check: sync.check,
            packageManager: sync.packageManager,
            plannedCommands: sync.plannedCommands,
            projectDir: sync.projectDir,
            target: sync.target,
          }),
          {
            printLine,
            warnLine,
          },
        );
      }
    } catch (error) {
      throw createCliCommandError({
        command: 'sync',
        error,
      });
    }
  },
  templates: async ({
    mergedFlags,
    positionals,
  }: NodeFallbackDispatchContext) => {
    const subcommand = positionals[1];
    const templateId =
      typeof mergedFlags.id === 'string'
        ? mergedFlags.id
        : (positionals[2] as string | undefined);
    const resolvedSubcommand = templateId ? 'inspect' : (subcommand ?? 'list');
    if (resolvedSubcommand !== 'list' && resolvedSubcommand !== 'inspect') {
      throw createCliCommandError({
        code: CLI_DIAGNOSTIC_CODES.INVALID_COMMAND,
        command: 'templates',
        detailLines: [
          `Unknown templates subcommand "${resolvedSubcommand}". Expected list or inspect.`,
        ],
      });
    }
    if (mergedFlags.format === 'json') {
      renderTemplatesJson(
        {
          format: mergedFlags.format as string | undefined,
          id: templateId,
        },
        resolvedSubcommand,
      );
      return;
    }
    await executeTemplatesCommand({
      flags: {
        id: templateId,
        subcommand: resolvedSubcommand,
      },
    });
  },
} satisfies Record<
  NodeFallbackExecutableCommandName,
  NodeFallbackCommandDispatcher
>;

export async function runNodeCli(argv = process.argv.slice(2)): Promise<void> {
  const normalizedArgv = normalizeWpTypiaArgv(argv);
  const { argv: argvWithoutConfigOverride, configOverridePath } =
    extractWpTypiaConfigOverride(normalizedArgv);
  validateCliOutputFormatArgv(argvWithoutConfigOverride);
  const outputFormatArgv = normalizeCliOutputFormatArgv(
    argvWithoutConfigOverride,
  );
  const { argv: cliArgv, flags } = parseGlobalFlags(outputFormatArgv);
  const { flags: commandFlags, positionals } = parseArgv(cliArgv);
  const rawMergedFlags: Record<string, unknown> = {
    ...commandFlags,
    ...flags,
  };
  const [command, subcommand] = positionals;
  const helpRequested =
    hasFlagBeforeTerminator(cliArgv, '--help') || command === 'help';
  const helpTarget = command === 'help' ? subcommand : command;
  const versionRequested =
    hasFlagBeforeTerminator(cliArgv, '--version') || command === 'version';

  if (cliArgv.length === 0) {
    renderNoCommandHelp(printLine);
    process.exitCode = 1;
    return;
  }

  if (helpRequested) {
    if (helpTarget) {
      const helpRenderer =
        NODE_FALLBACK_HELP_RENDERERS[
          helpTarget as NodeFallbackExecutableCommandName
        ];
      if (helpRenderer) {
        helpRenderer(printLine);
        return;
      }
      if (helpTarget === 'help' || helpTarget === 'version') {
        renderGeneralHelp(printLine);
        return;
      }
    } else {
      renderGeneralHelp(printLine);
      return;
    }
    renderGeneralHelp(printLine);
    return;
  }

  if (versionRequested) {
    renderVersion({
      format:
        typeof rawMergedFlags.format === 'string'
          ? rawMergedFlags.format
          : undefined,
    });
    return;
  }

  const mergedFlags = await applyNodeFallbackConfigDefaults(
    command,
    subcommand,
    rawMergedFlags,
    configOverridePath,
    process.cwd(),
  );

  const commandDispatcher =
    command &&
    NODE_FALLBACK_COMMAND_DISPATCHERS[
      command as NodeFallbackExecutableCommandName
    ];
  if (commandDispatcher) {
    await commandDispatcher({
      cwd: process.cwd(),
      mergedFlags,
      positionals,
      printLine,
      warnLine,
    });
    return;
  }

  renderUnsupportedCommand(command ?? '(missing)');
}

export async function runNodeCliEntrypoint(
  argv = process.argv.slice(2),
): Promise<void> {
  const prefersStructuredErrorOutput = prefersStructuredCliArgv(argv);

  try {
    await runNodeCli(argv);
  } catch (error) {
    if (prefersStructuredErrorOutput) {
      const diagnostic = createCliCommandError({
        command: resolveCanonicalCommandContext(argv),
        error,
      });
      process.stderr.write(
        `${JSON.stringify(
          {
            ok: false,
            error: serializeCliDiagnosticError(diagnostic),
          },
          null,
          2,
        )}\n`,
      );
      process.exitCode = 1;
      return;
    }
    console.error(`Error: ${await formatCliDiagnosticError(error)}`);
    process.exitCode = 1;
  }
}
