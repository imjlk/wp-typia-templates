import { cloneJsonValue } from './json-utils.js';
import type { JsonSchemaObject } from './schema-core.js';

export function cloneJsonValueIfDefined<T>(value: T | undefined): T | undefined {
  return value === undefined ? undefined : cloneJsonValue(value);
}

export function isJsonSchemaObject(value: unknown): value is JsonSchemaObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Narrow a `typia.llm` artifact field before applying JSON Schema mutations.
 *
 * @param value Candidate schema value emitted by `typia.llm`.
 * @param context Human-readable artifact path for diagnostics.
 * @returns The value narrowed to the shared JSON Schema object shape.
 */
export function assertJsonSchemaObject(
  value: unknown,
  context: string,
): JsonSchemaObject {
  if (isJsonSchemaObject(value)) {
    return value;
  }

  throw new Error(`${context} must be a JSON Schema object.`);
}
