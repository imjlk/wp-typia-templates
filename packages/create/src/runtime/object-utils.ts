/**
 * Generic record type used for JSON-like plain-object inspection.
 */
export type UnknownRecord = Record<string, unknown>;

/**
 * Check whether a value is a plain object record.
 *
 * @param value Runtime value to inspect.
 * @returns `true` when the value is a non-null plain object with an
 * `Object.prototype` or `null` prototype.
 */
export function isPlainObject(value: unknown): value is UnknownRecord {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
