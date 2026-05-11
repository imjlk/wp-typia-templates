import { defineCommand } from '@bunli/core';

import {
  buildCommandOptions,
  INIT_OPTION_METADATA,
} from '../command-option-metadata';
import {
  emitCliDiagnosticFailure,
  prefersStructuredCliOutput,
} from '../cli-diagnostic-output';
import { resolveCommandOutputAdapters } from './output-adapters';
import { executeInitCommand } from '../runtime-bridge';
import { buildStructuredInitSuccessPayload } from '../runtime-bridge-output';

export const initCommand = defineCommand({
  defaultFormat: 'toon',
  description:
    'Preview or apply the minimum wp-typia retrofit plan for an existing project.',
  handler: async (args) => {
    const prefersStructuredOutput = prefersStructuredCliOutput(args);
    const { printLine, warnLine } = resolveCommandOutputAdapters(args);

    try {
      const plan = await executeInitCommand(
        {
          apply: Boolean(args.flags.apply),
          cwd: args.cwd,
          packageManager:
            typeof args.flags['package-manager'] === 'string'
              ? args.flags['package-manager']
              : undefined,
          projectDir: args.positional[0] as string | undefined,
        },
        {
          emitOutput: !prefersStructuredOutput,
          printLine,
          warnLine,
        },
      );
      if (prefersStructuredOutput) {
        args.output(buildStructuredInitSuccessPayload(plan));
      }
    } catch (error) {
      emitCliDiagnosticFailure(args, {
        command: 'init',
        error,
      });
    }
  },
  name: 'init',
  options: buildCommandOptions(INIT_OPTION_METADATA),
});

export default initCommand;
