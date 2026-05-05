import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
} from '@wp-typia/project-tools/cli-diagnostics';
import { formatAddKindUsagePlaceholder } from '../../add-kind-registry';
import { executeAddCommand } from '../../runtime-bridge';
import {
  buildStructuredCompletionSuccessPayload,
  extractCompletionProjectDir,
} from '../../runtime-bridge-output';
import type { NodeFallbackDispatchContext } from '../types';

export async function dispatchNodeFallbackAdd({
  cwd,
  mergedFlags,
  positionals,
  printLine,
}: NodeFallbackDispatchContext): Promise<void> {
  if (!positionals[1]) {
    if (mergedFlags.format !== 'json') {
      const { formatAddHelpText } =
        await import('@wp-typia/project-tools/cli-add');
      printLine(formatAddHelpText());
    }
    throw createCliCommandError({
      code: CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      command: 'add',
      detailLines: [
        `\`wp-typia add\` requires <kind>. Usage: wp-typia add ${formatAddKindUsagePlaceholder()} ...`,
      ],
    });
  }

  // Add-specific normalization stays here: map positionals to kind/name and
  // switch JSON mode to structured completion output.
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
}
