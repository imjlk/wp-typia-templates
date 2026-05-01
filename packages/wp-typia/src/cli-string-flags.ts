import {
  CLI_DIAGNOSTIC_CODES,
  createCliDiagnosticCodeError,
} from '@wp-typia/project-tools/cli-diagnostics';

type OptionalCliStringFlagMode = 'loose' | 'strict';

function readOptionalCliStringFlagValue(
  flags: Record<string, unknown>,
  name: string,
  mode: OptionalCliStringFlagMode,
): string | undefined {
  const value = flags[name];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      `\`--${name}\` requires a value.`,
    );
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (mode === 'strict') {
      throw createCliDiagnosticCodeError(
        CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
        `\`--${name}\` requires a value.`,
      );
    }

    return undefined;
  }

  return mode === 'strict' ? value : trimmed;
}

export function readOptionalLooseStringFlag(
  flags: Record<string, unknown>,
  name: string,
): string | undefined {
  return readOptionalCliStringFlagValue(flags, name, 'loose');
}

export function readOptionalStrictStringFlag(
  flags: Record<string, unknown>,
  name: string,
): string | undefined {
  return readOptionalCliStringFlagValue(flags, name, 'strict');
}

export function requireStrictStringFlag(
  flags: Record<string, unknown>,
  name: string,
  message: string,
): string {
  const value = readOptionalStrictStringFlag(flags, name);
  if (!value) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      message,
    );
  }

  return value;
}

export function readOptionalPairedStrictStringFlags(
  flags: Record<string, unknown>,
  leftName: string,
  rightName: string,
  message: string,
): readonly [string | undefined, string | undefined] {
  const leftValue = readOptionalStrictStringFlag(flags, leftName);
  const rightValue = readOptionalStrictStringFlag(flags, rightName);
  if (Boolean(leftValue) !== Boolean(rightValue)) {
    throw createCliDiagnosticCodeError(
      CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
      message,
    );
  }

  return [leftValue, rightValue] as const;
}
