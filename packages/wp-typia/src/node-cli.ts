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
  type CommandOptionMetadataMap,
  DOCTOR_OPTION_METADATA,
  extractKnownOptionValuesFromArgv,
  formatNodeFallbackOptionHelp,
  INIT_OPTION_METADATA,
  MIGRATE_OPTION_METADATA,
  parseCommandArgvWithMetadata,
  resolveCommandOptionValues,
  SYNC_OPTION_METADATA,
  TEMPLATES_OPTION_METADATA,
} from './command-option-metadata';
import { resolveEntrypointCliCommand } from './cli-command-resolution';
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
  formatAddKindList,
  formatAddKindUsagePlaceholder,
} from './add-kind-registry';
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
  executeAddCommand,
  executeCreateCommand,
  executeDoctorCommand,
  executeInitCommand,
  executeMigrateCommand,
  executeSyncCommand,
  executeTemplatesCommand,
} from './runtime-bridge';
import {
  buildStructuredInitSuccessPayload,
  buildStructuredCompletionSuccessPayload,
  buildSyncDryRunPayload,
  extractCompletionProjectDir,
  printCompletionPayload,
} from './runtime-bridge-output';
import { resolveSyncExecutionTarget } from './runtime-bridge-sync';
import {
  WP_TYPIA_CANONICAL_CREATE_USAGE,
  WP_TYPIA_CANONICAL_MIGRATE_USAGE,
  WP_TYPIA_FUTURE_COMMAND_TREE,
  WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES,
  WP_TYPIA_POSITIONAL_ALIAS_USAGE,
  normalizeWpTypiaArgv,
} from './command-contract';

type GlobalFlags = {
  format?: string;
  id?: string;
};
type NodeFallbackTopLevelCommandName =
  (typeof WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES)[number];
type NodeFallbackExecutableCommandName = Exclude<
  NodeFallbackTopLevelCommandName,
  'help' | 'version'
>;
type NodeFallbackDispatchContext = {
  cwd: string;
  mergedFlags: Record<string, unknown>;
  positionals: string[];
};
type NodeFallbackCommandHelpConfig = {
  bodyLines?: string[];
  heading: string;
  optionMetadata: CommandOptionMetadataMap;
};

const NODE_FALLBACK_OPTION_PARSER = buildCommandOptionParser(
  ALL_COMMAND_OPTION_METADATA,
);
const NODE_FALLBACK_BOOLEAN_OPTION_NAMES = ['help', 'version'] as const;
const STANDALONE_GUIDANCE_LINE =
  'Prefer not to install Bun? Use the standalone wp-typia binary from the GitHub release assets.';

const NODE_FALLBACK_RUNTIME_SUMMARY_LINES = [
  'Runtime: Node fallback',
  'Human-readable fallback for common non-interactive create/init/add/migrate flows, doctor, sync, templates, --help, and --version when Bun is unavailable.',
  `Install Bun 1.3.11+ or use \`bunx wp-typia ...\` for the full Bunli/OpenTUI runtime and Bun-only command surfaces such as \`skills\`, \`completions\`, and \`mcp\`. ${STANDALONE_GUIDANCE_LINE}`,
  'Output markers: WP_TYPIA_ASCII=1 forces ASCII markers, WP_TYPIA_ASCII=0 opts back into Unicode markers, and non-empty NO_COLOR requests ASCII markers when WP_TYPIA_ASCII is unset.',
];

const printLine: PrintLine = (line) => {
  console.log(line);
};

function printBlock(lines: string[]) {
  for (const line of lines) {
    printLine(line);
  }
}

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
  flags: GlobalFlags;
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

function renderGeneralHelp() {
  printBlock([
    `wp-typia ${packageJson.version}`,
    '',
    'Canonical CLI package for wp-typia scaffolding and project workflows.',
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Commands:',
    ...WP_TYPIA_FUTURE_COMMAND_TREE.map(
      (command) => `- ${command.name}: ${command.description}`,
    ),
    '',
    'Canonical usage:',
    `- ${WP_TYPIA_CANONICAL_CREATE_USAGE}`,
    '- wp-typia init [project-dir]',
    `- ${WP_TYPIA_CANONICAL_MIGRATE_USAGE}`,
    `- ${WP_TYPIA_POSITIONAL_ALIAS_USAGE}`,
  ]);
}

/**
 * Render one Node fallback command help screen from shared command metadata.
 */
function renderNodeFallbackCommandHelp(config: NodeFallbackCommandHelpConfig) {
  printBlock([
    config.heading,
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    ...(config.bodyLines ? [...config.bodyLines, ''] : []),
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(config.optionMetadata),
  ]);
}

const NODE_FALLBACK_COMMAND_HELP_CONFIG = {
  add: {
    bodyLines: [`Supported kinds: ${formatAddKindList()}`],
    heading: 'Usage: wp-typia add <kind> <name>',
    optionMetadata: ADD_OPTION_METADATA,
  },
  create: {
    heading: `Usage: ${WP_TYPIA_CANONICAL_CREATE_USAGE}`,
    optionMetadata: CREATE_OPTION_METADATA,
  },
  doctor: {
    bodyLines: [
      'Runs read-only environment readiness checks. Official wp-typia workspace roots also get inventory, source-tree drift, iframe/API v3 compatibility, and shared convention checks.',
    ],
    heading: 'Usage: wp-typia doctor [--format json]',
    optionMetadata: DOCTOR_OPTION_METADATA,
  },
  init: {
    bodyLines: [
      'Preview-by-default retrofit planner for existing WordPress block or plugin projects. Re-run with --apply to write package.json updates and helper scripts.',
    ],
    heading: 'Usage: wp-typia init [project-dir]',
    optionMetadata: INIT_OPTION_METADATA,
  },
  migrate: {
    heading: `Usage: ${WP_TYPIA_CANONICAL_MIGRATE_USAGE}`,
    optionMetadata: MIGRATE_OPTION_METADATA,
  },
  sync: {
    heading: 'Usage: wp-typia sync [ai]',
    optionMetadata: SYNC_OPTION_METADATA,
  },
  templates: {
    heading: 'wp-typia templates <list|inspect>',
    optionMetadata: TEMPLATES_OPTION_METADATA,
  },
} satisfies Record<NodeFallbackExecutableCommandName, NodeFallbackCommandHelpConfig>;

const NODE_FALLBACK_HELP_RENDERERS = Object.fromEntries(
  Object.entries(NODE_FALLBACK_COMMAND_HELP_CONFIG).map(([command, config]) => [
    command,
    () => renderNodeFallbackCommandHelp(config),
  ]),
) as Record<NodeFallbackExecutableCommandName, () => void>;

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

function renderTemplatesJson(flags: GlobalFlags, subcommand: string) {
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
  add: async ({
    cwd,
    mergedFlags,
    positionals,
  }: NodeFallbackDispatchContext) => {
    if (!positionals[1]) {
      const { formatAddHelpText } =
        await import('@wp-typia/project-tools/cli-add');
      printLine(formatAddHelpText());
      throw createCliCommandError({
        code: CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
        command: 'add',
        detailLines: [
          `\`wp-typia add\` requires <kind>. Usage: wp-typia add ${formatAddKindUsagePlaceholder()} ...`,
        ],
      });
    }
    if (mergedFlags.format === 'json') {
      let completion;
      try {
        completion = await executeAddCommand({
          cwd,
          emitOutput: false,
          flags: mergedFlags,
          interactive: false,
          kind: positionals[1],
          name: positionals[2],
        });
      } catch (error) {
        throw createCliCommandError({
          command: 'add',
          error,
        });
      }
      printLine(
        JSON.stringify(
          buildStructuredCompletionSuccessPayload('add', completion, {
            dryRun: Boolean(mergedFlags['dry-run']),
            kind: positionals[1],
            name: positionals[2],
            projectDir: extractCompletionProjectDir(completion) ?? cwd,
          }),
          null,
          2,
        ),
      );
      return;
    }
    await executeAddCommand({
      cwd,
      flags: mergedFlags,
      interactive: undefined,
      kind: positionals[1],
      name: positionals[2],
    });
  },
  create: async ({
    cwd,
    mergedFlags,
    positionals,
  }: NodeFallbackDispatchContext) => {
    const projectDir = positionals[1];
    if (!projectDir) {
      throw createCliCommandError({
        code: CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
        command: 'create',
        detailLines: [
          '`wp-typia create` requires <project-dir>.',
          '`--dry-run` still needs a logical project directory name because wp-typia derives slugs, package names, and planned file paths from it.',
        ],
      });
    }
    let completion;
    try {
      completion = await executeCreateCommand({
        cwd,
        emitOutput: mergedFlags.format !== 'json',
        flags: mergedFlags,
        interactive: mergedFlags.format === 'json' ? false : undefined,
        projectDir,
      });
    } catch (error) {
      throw createCliCommandError({
        command: 'create',
        error,
      });
    }
    if (mergedFlags.format === 'json') {
      printLine(
        JSON.stringify(
          buildStructuredCompletionSuccessPayload('create', completion, {
            dryRun: Boolean(mergedFlags['dry-run']),
            projectDir: extractCompletionProjectDir(completion) ?? projectDir,
            template:
              typeof mergedFlags.template === 'string'
                ? mergedFlags.template
                : undefined,
          }),
          null,
          2,
        ),
      );
    }
  },
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
  }: NodeFallbackDispatchContext) => {
    await executeMigrateCommand({
      command: positionals[1],
      cwd,
      flags: mergedFlags,
    });
  },
  sync: async ({
    cwd,
    mergedFlags,
    positionals,
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
  (context: NodeFallbackDispatchContext) => Promise<void>
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
    renderGeneralHelp();
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
        helpRenderer();
        return;
      }
      if (helpTarget === 'help' || helpTarget === 'version') {
        renderGeneralHelp();
        return;
      }
    } else {
      renderGeneralHelp();
      return;
    }
    renderGeneralHelp();
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
        command: resolveEntrypointCliCommand(argv),
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
