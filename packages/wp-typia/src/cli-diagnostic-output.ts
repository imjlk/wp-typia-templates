import {
  createCliCommandError,
  serializeCliDiagnosticError,
  type CliDiagnosticCode,
} from '@wp-typia/project-tools/cli-diagnostics';
import { COMMAND_ROUTING_METADATA } from './command-option-metadata';
import { findFirstPositional } from '../bin/argv-walker.js';

type CliStructuredOutputArgs = {
  agent?: unknown;
  context?: {
    store?: {
      isAIAgent?: boolean;
    };
  };
  format?: string;
  formatExplicit?: boolean;
  output: (payload: Record<string, unknown>) => void;
};

type EmitCliDiagnosticFailureOptions = {
  code?: CliDiagnosticCode;
  command: string;
  detailLines?: string[];
  error?: unknown;
  extraOutput?: Record<string, unknown>;
  summary?: string;
};

function resolveEntrypointCliCommand(argv: string[]): string {
  return findFirstPositional(argv, COMMAND_ROUTING_METADATA) ?? 'wp-typia';
}

export function prefersStructuredCliArgv(argv: string[]): boolean {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === '--') {
      return false;
    }

    if (arg === '--format') {
      return argv[index + 1] === 'json';
    }

    if (arg.startsWith('--format=')) {
      return arg.slice('--format='.length) === 'json';
    }
  }

  return false;
}

export function prefersStructuredCliOutput(
  args: CliStructuredOutputArgs,
): boolean {
  return (
    (args.formatExplicit && args.format !== 'toon') ||
    Boolean(args.agent) ||
    Boolean(args.context?.store?.isAIAgent)
  );
}

export function emitCliDiagnosticFailure(
  args: CliStructuredOutputArgs,
  options: EmitCliDiagnosticFailureOptions,
): true | never {
  const diagnostic = createCliCommandError(options);
  if (prefersStructuredCliOutput(args)) {
    args.output({
      ...(options.extraOutput ?? {}),
      error: serializeCliDiagnosticError(diagnostic),
      ok: false,
    });
    process.exitCode = 1;
    return true;
  }

  throw diagnostic;
}

export function writeStructuredCliDiagnosticError(
  argv: string[],
  error: unknown,
): boolean {
  if (!prefersStructuredCliArgv(argv)) {
    return false;
  }

  console.log(
    JSON.stringify(
      {
        error: serializeCliDiagnosticError(
          createCliCommandError({
            command: resolveEntrypointCliCommand(argv),
            error,
          }),
        ),
        ok: false,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
  return true;
}
