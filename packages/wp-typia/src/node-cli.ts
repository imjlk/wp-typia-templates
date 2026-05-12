import { createCliCommandError } from '@wp-typia/project-tools/cli-diagnostics';
import {
  ALL_COMMAND_OPTION_METADATA,
  ADD_OPTION_METADATA,
  buildCommandOptionParser,
  CREATE_OPTION_METADATA,
  extractKnownOptionValuesFromArgv,
  parseCommandArgvWithMetadata,
  resolveCommandOptionValues,
} from './command-option-metadata';
import {
  normalizeCliOutputFormatArgv,
  validateCliOutputFormatArgv,
} from './cli-output-format';
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
  executeInitCommand,
  executeMigrateCommand,
  executeSyncCommand,
} from './runtime-bridge';
import {
  buildStructuredInitSuccessPayload,
  buildSyncDryRunPayload,
  printCompletionPayload,
} from './runtime-bridge-output';
import { resolveSyncExecutionTarget } from './runtime-bridge-sync';
import { normalizeWpTypiaArgv } from './command-contract';
import { dispatchNodeFallbackDoctor } from './node-fallback/doctor';
import { dispatchNodeFallbackAdd } from './node-fallback/dispatchers/add';
import { dispatchNodeFallbackCreate } from './node-fallback/dispatchers/create';
import {
  createNodeFallbackNoCommandCliError,
  handleNodeFallbackEntrypointError,
  throwUnsupportedNodeFallbackCommand,
} from './node-fallback/errors';
import {
  NODE_FALLBACK_HELP_RENDERERS,
  renderGeneralHelp,
  renderNoCommandHelp,
} from './node-fallback/help';
import { dispatchNodeFallbackTemplates } from './node-fallback/templates';
import type {
  NodeFallbackCommandDispatcher,
  NodeFallbackDispatchContext,
  NodeFallbackExecutableCommandName,
  NodeFallbackGlobalFlags,
} from './node-fallback/types';
import { renderNodeFallbackVersion } from './node-fallback/version';

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

const NODE_FALLBACK_COMMAND_DISPATCHERS = {
  add: dispatchNodeFallbackAdd,
  create: dispatchNodeFallbackCreate,
  doctor: dispatchNodeFallbackDoctor,
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
  templates: dispatchNodeFallbackTemplates,
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
    const noCommandError = createNodeFallbackNoCommandCliError();
    if (rawMergedFlags.format !== 'json') {
      renderNoCommandHelp(printLine);
    }
    throw noCommandError;
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
    renderNodeFallbackVersion(printLine, {
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

  throwUnsupportedNodeFallbackCommand(command ?? '(missing)');
}

export async function runNodeCliEntrypoint(
  argv = process.argv.slice(2),
): Promise<void> {
  try {
    await runNodeCli(argv);
  } catch (error) {
    await handleNodeFallbackEntrypointError(error, argv);
  }
}
