export function normalizeOptionalSubmitString(
  value: unknown,
): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function appendNormalizedOptionalStringFields(
  sanitized: Record<string, unknown>,
  values: Record<string, unknown>,
  fieldNames: Iterable<string>,
): Record<string, unknown> {
  for (const fieldName of fieldNames) {
    const normalizedValue = normalizeOptionalSubmitString(values[fieldName]);
    if (normalizedValue !== undefined) {
      sanitized[fieldName] = normalizedValue;
    }
  }

  return sanitized;
}

export function appendTruthyBooleanFields(
  sanitized: Record<string, unknown>,
  values: Record<string, unknown>,
  fieldNames: Iterable<string>,
): Record<string, unknown> {
  for (const fieldName of fieldNames) {
    if (values[fieldName] === true) {
      sanitized[fieldName] = true;
    }
  }

  return sanitized;
}

export function sanitizeVisibleSubmitValues(
  values: Record<string, unknown>,
  fieldNames: Iterable<string>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const fieldName of fieldNames) {
    const value = values[fieldName];
    const normalizedValue = normalizeOptionalSubmitString(value);
    if (normalizedValue !== undefined) {
      sanitized[fieldName] = normalizedValue;
      continue;
    }

    if (typeof value !== 'string' && value !== undefined && value !== null) {
      sanitized[fieldName] = value;
    }
  }

  return sanitized;
}
