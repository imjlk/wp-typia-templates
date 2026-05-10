import type { ReadlinePrompt } from '@wp-typia/project-tools/cli-prompt';
import type { AlternateBufferCompletionPayload } from './ui/alternate-buffer-lifecycle';
import { buildMigrationCompletionPayload } from './runtime-bridge-output';
import { readOptionalLooseStringFlag } from './cli-string-flags';
import {
  pushFlag,
  shouldWrapCliCommandError,
  wrapCliCommandError,
} from './runtime-bridge-shared';

export type MigrateExecutionInput = {
  command?: string;
  cwd: string;
  flags: Record<string, unknown>;
  prompt?: ReadlinePrompt;
  renderLine?: (line: string) => void;
};

const loadMigrationsRuntime = () =>
  import('@wp-typia/project-tools/migrations');

export async function executeMigrateCommand({
  command,
  cwd,
  flags,
  prompt,
  renderLine,
}: MigrateExecutionInput): Promise<AlternateBufferCompletionPayload | void> {
  const { formatMigrationHelpText, parseMigrationArgs, runMigrationCommand } =
    await loadMigrationsRuntime();
  if (!command) {
    console.log(formatMigrationHelpText());
    return;
  }

  try {
    const argv = [command];
    pushFlag(argv, 'all', flags.all);
    pushFlag(argv, 'force', flags.force);
    pushFlag(
      argv,
      'current-migration-version',
      readOptionalLooseStringFlag(flags, 'current-migration-version'),
    );
    pushFlag(
      argv,
      'migration-version',
      readOptionalLooseStringFlag(flags, 'migration-version'),
    );
    pushFlag(
      argv,
      'from-migration-version',
      readOptionalLooseStringFlag(flags, 'from-migration-version'),
    );
    pushFlag(
      argv,
      'to-migration-version',
      readOptionalLooseStringFlag(flags, 'to-migration-version'),
    );
    pushFlag(
      argv,
      'iterations',
      readOptionalLooseStringFlag(flags, 'iterations'),
    );
    pushFlag(argv, 'seed', readOptionalLooseStringFlag(flags, 'seed'));

    const parsed = parseMigrationArgs(argv);
    const lines: string[] | null = renderLine ? [] : null;
    const captureLine = (line: string) => {
      lines?.push(line);
      if (renderLine) {
        renderLine(line);
        return;
      }
      console.log(line);
    };
    const result = await runMigrationCommand(parsed, cwd, {
      prompt,
      renderLine: captureLine,
    });
    if (renderLine) {
      return result &&
        typeof result === 'object' &&
        'cancelled' in result &&
        result.cancelled === true
        ? undefined
        : buildMigrationCompletionPayload({
            command: parsed.command ?? 'plan',
            lines: lines ?? [],
          });
    }

    if (
      result &&
      typeof result === 'object' &&
      'cancelled' in result &&
      result.cancelled === true
    ) {
      return;
    }
  } catch (error) {
    if (!shouldWrapCliCommandError({ renderLine })) {
      throw error;
    }
    throw await wrapCliCommandError('migrate', error);
  }
}
