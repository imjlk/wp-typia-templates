import { isPlainObject as isSharedPlainObject } from "@wp-typia/api-client/runtime-primitives";

/**
 * Generic record type used for JSON-like plain-object inspection.
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * Delegate plain-object detection to the shared runtime primitive owner.
 *
 * @param value Runtime value to inspect.
 * @returns `true` when the value is a non-null plain object with an
 * `Object.prototype` or `null` prototype.
 */
export function isPlainObject(value: unknown): value is UnknownRecord {
	return isSharedPlainObject(value);
}
