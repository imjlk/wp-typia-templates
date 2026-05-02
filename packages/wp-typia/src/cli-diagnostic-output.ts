import {
  createCliCommandError,
  serializeCliDiagnosticError,
  type CliDiagnosticCode,
} from '@wp-typia/project-tools/cli-diagnostics';
import { resolveEntrypointCliCommand } from './cli-command-resolution';
import { isSupportedCliOutputFormat } from './cli-output-format';

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

function writeStructuredCliJsonToStderr(
  payload: Record<string, unknown>,
): void {
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
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
  if (args.formatExplicit) {
    return args.format === 'json' && isSupportedCliOutputFormat(args.format);
  }

  return (
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
    writeStructuredCliJsonToStderr({
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

  writeStructuredCliJsonToStderr({
    error: serializeCliDiagnosticError(
      createCliCommandError({
        command: resolveEntrypointCliCommand(argv),
        error,
      }),
    ),
    ok: false,
  });
  process.exitCode = 1;
  return true;
}
