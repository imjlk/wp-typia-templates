import { defineCommand } from '@bunli/core';

import {
  buildCommandOptions,
  SYNC_OPTION_METADATA,
} from '../command-option-metadata';
import {
  emitCliDiagnosticFailure,
  prefersStructuredCliOutput,
} from '../cli-diagnostic-output';
import { executeSyncCommand } from '../runtime-bridge';
import {
  buildSyncDryRunPayload,
  printCompletionPayload,
} from '../runtime-bridge-output';
import { resolveSyncExecutionTarget } from '../runtime-bridge-sync';

export const syncCommand = defineCommand({
  description:
    'Run the generated-project sync workflow from a scaffolded project or official workspace root.',
  handler: async (args) => {
    const target = resolveSyncExecutionTarget(
      args.positional[0] as string | undefined,
    );
    const check = Boolean(args.flags.check);
    const dryRun = Boolean(args.flags['dry-run']);
    const prefersStructuredOutput = prefersStructuredCliOutput(args);

    try {
      const sync = await executeSyncCommand({
        captureOutput: prefersStructuredOutput && !dryRun,
        check,
        cwd: args.cwd,
        dryRun,
        target,
      });
      if (prefersStructuredOutput) {
        args.output({ sync });
        return;
      }
      if (dryRun) {
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
      emitCliDiagnosticFailure(args, {
        command: 'sync',
        error,
      });
    }
  },
  name: 'sync',
  options: buildCommandOptions(SYNC_OPTION_METADATA),
});

export default syncCommand;
