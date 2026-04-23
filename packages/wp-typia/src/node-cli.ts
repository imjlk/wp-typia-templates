import packageJson from '../package.json';
import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
  formatCliDiagnosticError,
  serializeCliDiagnosticError,
} from '@wp-typia/project-tools/cli-diagnostics';
import {
  ADD_OPTION_METADATA,
  buildCommandOptionParser,
  CREATE_OPTION_METADATA,
  formatNodeFallbackOptionHelp,
  GLOBAL_OPTION_METADATA,
  MIGRATE_OPTION_METADATA,
  parseCommandArgvWithMetadata,
  resolveCommandOptionValues,
  SYNC_OPTION_METADATA,
  TEMPLATES_OPTION_METADATA,
} from './command-option-metadata';
import {
  getTemplateById,
  listTemplates,
} from '@wp-typia/project-tools/cli-templates';
import { formatAddKindUsagePlaceholder } from './add-kind-registry';
import {
  getAddBlockDefaults,
  getCreateDefaults,
  loadWpTypiaUserConfig,
  loadWpTypiaUserConfigFromSource,
  mergeWpTypiaUserConfig,
} from './config';
import { extractWpTypiaConfigOverride } from './config-override';
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
  buildSyncDryRunPayload,
  printCompletionPayload,
} from './runtime-bridge-output';
import {
  WP_TYPIA_CANONICAL_CREATE_USAGE,
  WP_TYPIA_CANONICAL_MIGRATE_USAGE,
  WP_TYPIA_FUTURE_COMMAND_TREE,
  WP_TYPIA_POSITIONAL_ALIAS_USAGE,
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
  normalizeWpTypiaArgv,
} from './command-contract';

type GlobalFlags = {
  format?: string;
  id?: string;
};

const NODE_FALLBACK_OPTION_PARSER = buildCommandOptionParser(
  GLOBAL_OPTION_METADATA,
  CREATE_OPTION_METADATA,
  ADD_OPTION_METADATA,
  MIGRATE_OPTION_METADATA,
  SYNC_OPTION_METADATA,
  TEMPLATES_OPTION_METADATA,
);
const NODE_FALLBACK_BOOLEAN_OPTION_NAMES = ['help', 'version'] as const;
const STANDALONE_GUIDANCE_LINE =
  'Prefer not to install Bun? Use the standalone wp-typia binary from the GitHub release assets.';

const NODE_FALLBACK_RUNTIME_SUMMARY_LINES = [
  'Runtime: Node fallback',
  'Human-readable fallback for common non-interactive create/init/add/migrate flows, doctor, sync, templates, --help, and --version when Bun is unavailable.',
  `Install Bun 1.3.11+ or use \`bunx wp-typia ...\` for the full Bunli/OpenTUI runtime and Bun-only command surfaces such as \`skills\`, \`completions\`, and \`mcp\`. ${STANDALONE_GUIDANCE_LINE}`,
];

function printLine(line = '') {
  console.log(line);
}

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
  const nextArgv: string[] = [];
  const flags: GlobalFlags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === '--') {
      nextArgv.push(...argv.slice(index));
      break;
    }

    if (arg === '--format' || arg === '--id') {
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) {
        throw new Error(`\`${arg}\` requires a value.`);
      }
      if (arg === '--format') {
        flags.format = next;
      } else {
        flags.id = next;
      }
      index += 1;
      continue;
    }

    if (arg.startsWith('--format=')) {
      flags.format = arg.slice('--format='.length);
      continue;
    }

    if (arg.startsWith('--id=')) {
      flags.id = arg.slice('--id='.length);
      continue;
    }

    nextArgv.push(arg);
  }

  return {
    argv: nextArgv,
    flags,
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

function renderTemplatesHelp() {
  printBlock([
    'wp-typia templates <list|inspect>',
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(TEMPLATES_OPTION_METADATA),
  ]);
}

function renderCreateHelp() {
  printBlock([
    `Usage: ${WP_TYPIA_CANONICAL_CREATE_USAGE}`,
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(CREATE_OPTION_METADATA),
  ]);
}

function renderInitHelp() {
  printBlock([
    'Usage: wp-typia init [project-dir]',
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Preview-only retrofit planner for existing WordPress block or plugin projects. No files are written yet.',
  ]);
}

function renderAddHelp() {
  printBlock([
    'Usage: wp-typia add <kind> <name>',
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(ADD_OPTION_METADATA),
  ]);
}

function renderMigrateHelp() {
  printBlock([
    `Usage: ${WP_TYPIA_CANONICAL_MIGRATE_USAGE}`,
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(MIGRATE_OPTION_METADATA),
  ]);
}

function renderSyncHelp() {
  printBlock([
    'Usage: wp-typia sync',
    '',
    ...NODE_FALLBACK_RUNTIME_SUMMARY_LINES,
    '',
    'Supported flags:',
    ...formatNodeFallbackOptionHelp(SYNC_OPTION_METADATA),
  ]);
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
      command: 'doctor',
      detailLines: getDoctorFailureDetailLines(checks),
      summary: 'One or more doctor checks failed.',
    });
  }
}

export async function runNodeCli(argv = process.argv.slice(2)): Promise<void> {
  const normalizedArgv = normalizeWpTypiaArgv(argv);
  const { argv: argvWithoutConfigOverride, configOverridePath } =
    extractWpTypiaConfigOverride(normalizedArgv);
  const { argv: cliArgv, flags } = parseGlobalFlags(argvWithoutConfigOverride);
  const { flags: commandFlags, positionals } = parseArgv(cliArgv);
  const rawMergedFlags: Record<string, unknown> = {
    ...commandFlags,
    ...flags,
  };
  const [command, subcommand] = positionals;
  const helpRequested =
    cliArgv.length === 0 ||
    hasFlagBeforeTerminator(cliArgv, '--help') ||
    command === 'help';
  const versionRequested =
    hasFlagBeforeTerminator(cliArgv, '--version') || command === 'version';

  if (helpRequested) {
    if (command === 'templates') {
      renderTemplatesHelp();
      return;
    }
    if (command === 'create') {
      renderCreateHelp();
      return;
    }
    if (command === 'init') {
      renderInitHelp();
      return;
    }
    if (command === 'add') {
      renderAddHelp();
      return;
    }
    if (command === 'migrate') {
      renderMigrateHelp();
      return;
    }
    if (command === 'sync') {
      renderSyncHelp();
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

  if (command === 'templates') {
    const templateId =
      typeof mergedFlags.id === 'string'
        ? mergedFlags.id
        : (positionals[2] as string | undefined);
    const resolvedSubcommand = templateId ? 'inspect' : (subcommand ?? 'list');
    if (resolvedSubcommand !== 'list' && resolvedSubcommand !== 'inspect') {
      throw new Error(
        `Unknown templates subcommand "${resolvedSubcommand}". Expected list or inspect.`,
      );
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
    return;
  }

  if (command === 'create') {
    const projectDir = positionals[1];
    if (!projectDir) {
      throw createCliCommandError({
        command: 'create',
        detailLines: [
          '`wp-typia create` requires <project-dir>.',
          '`--dry-run` still needs a logical project directory name because wp-typia derives slugs, package names, and planned file paths from it.',
        ],
      });
    }
    await executeCreateCommand({
      cwd: process.cwd(),
      flags: mergedFlags,
      interactive: false,
      projectDir,
    });
    return;
  }

  if (command === 'init') {
    const plan = await executeInitCommand(
      {
        cwd: process.cwd(),
        projectDir: positionals[1],
      },
      {
        emitOutput: mergedFlags.format !== 'json',
      },
    );
    if (mergedFlags.format === 'json') {
      printLine(
        JSON.stringify(
          {
            init: plan,
          },
          null,
          2,
        ),
      );
    }
    return;
  }

  if (command === 'add') {
    if (!positionals[1]) {
      const { formatAddHelpText } =
        await import('@wp-typia/project-tools/cli-add');
      printLine(formatAddHelpText());
      throw createCliCommandError({
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
          cwd: process.cwd(),
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
          {
            completion,
          },
          null,
          2,
        ),
      );
      return;
    }
    await executeAddCommand({
      cwd: process.cwd(),
      flags: mergedFlags,
      interactive: false,
      kind: positionals[1],
      name: positionals[2],
    });
    return;
  }

  if (command === 'migrate') {
    await executeMigrateCommand({
      command: positionals[1],
      cwd: process.cwd(),
      flags: mergedFlags,
    });
    return;
  }

  if (command === 'doctor') {
    if (mergedFlags.format === 'json') {
      await renderDoctorJson();
      return;
    }
    await executeDoctorCommand(process.cwd());
    return;
  }

  if (command === 'sync') {
    try {
      const sync = await executeSyncCommand({
        captureOutput:
          mergedFlags.format === 'json' && !Boolean(mergedFlags['dry-run']),
        check: Boolean(mergedFlags.check),
        cwd: process.cwd(),
        dryRun: Boolean(mergedFlags['dry-run']),
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
          }),
        );
      }
    } catch (error) {
      throw createCliCommandError({
        command: 'sync',
        error,
      });
    }
    return;
  }

  renderUnsupportedCommand(command ?? '(missing)');
}

export async function runNodeCliEntrypoint(
  argv = process.argv.slice(2),
): Promise<void> {
  try {
    await runNodeCli(argv);
  } catch (error) {
    let prefersStructuredErrorOutput = false;
    try {
      const normalizedArgv = normalizeWpTypiaArgv(argv);
      const { argv: argvWithoutConfigOverride } =
        extractWpTypiaConfigOverride(normalizedArgv);
      const { flags } = parseGlobalFlags(argvWithoutConfigOverride);
      prefersStructuredErrorOutput = flags.format === 'json';
    } catch {}

    if (prefersStructuredErrorOutput) {
      console.error(
        JSON.stringify(
          {
            ok: false,
            error: serializeCliDiagnosticError(error),
          },
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }
    console.error(`Error: ${await formatCliDiagnosticError(error)}`);
    process.exitCode = 1;
  }
}
