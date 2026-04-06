export type UnknownRecord = Record<string, unknown>;

export function isPlainObject(value: unknown): value is UnknownRecord {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
