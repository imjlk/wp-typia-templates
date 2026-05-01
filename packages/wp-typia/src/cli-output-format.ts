import {
  CLI_DIAGNOSTIC_CODES,
  createCliCommandError,
} from '@wp-typia/project-tools/cli-diagnostics';
import { COMMAND_ROUTING_METADATA } from './command-option-metadata';
import { findFirstPositional } from '../bin/argv-walker.js';

export const SUPPORTED_CLI_OUTPUT_FORMATS = ['json', 'toon'] as const;

export type CliOutputFormat = (typeof SUPPORTED_CLI_OUTPUT_FORMATS)[number];

export function formatSupportedCliOutputFormats(): string {
  return SUPPORTED_CLI_OUTPUT_FORMATS.join(', ');
}

export function isSupportedCliOutputFormat(
  value: string | undefined,
): value is CliOutputFormat {
  return SUPPORTED_CLI_OUTPUT_FORMATS.includes(value as CliOutputFormat);
}

export function formatInvalidCliOutputFormatMessage(value: string): string {
  return `Invalid --format value "${value}". Supported values: ${formatSupportedCliOutputFormats()}.`;
}

function resolveEntrypointCliCommand(argv: string[]): string {
  return findFirstPositional(argv, COMMAND_ROUTING_METADATA) ?? 'wp-typia';
}

function assertSupportedCliOutputFormat(
  value: string,
  argv: string[],
): void {
  if (isSupportedCliOutputFormat(value)) {
    return;
  }

  throw createCliCommandError({
    code: CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
    command: resolveEntrypointCliCommand(argv),
    detailLines: [formatInvalidCliOutputFormatMessage(value)],
  });
}

export function validateCliOutputFormatArgv(argv: string[]): void {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === '--') {
      return;
    }

    if (arg === '--format') {
      const next = argv[index + 1];
      if (next && !next.startsWith('-')) {
        assertSupportedCliOutputFormat(next, argv);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith('--format=')) {
      const value = arg.slice('--format='.length);
      if (value) {
        assertSupportedCliOutputFormat(value, argv);
      }
    }
  }
}
