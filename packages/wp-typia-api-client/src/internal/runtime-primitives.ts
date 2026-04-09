import type { IValidation } from "@typia/interface";

export interface ValidationError {
	description?: string;
	expected: string;
	path: string;
	value: unknown;
}

export interface ValidationResult<T> {
	data?: T;
	errors: ValidationError[];
	isValid: boolean;
}

export type ValidationLike<T> =
	| IValidation<T>
	| {
			data?: unknown;
			errors?: unknown;
			success?: unknown;
	  };

export interface RawValidationError {
	description?: string;
	expected?: string;
	path?: string;
	value?: unknown;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

export function isFormDataLike(value: unknown): value is FormData {
	return typeof FormData !== "undefined" && value instanceof FormData;
}

export function normalizePath(path: unknown): string {
	return typeof path === "string" && path.length > 0 ? path : "(root)";
}

export function normalizeExpected(expected: unknown): string {
	return typeof expected === "string" && expected.length > 0
		? expected
		: "unknown";
}

export function normalizeValidationError(error: unknown): ValidationError {
	const raw = isPlainObject(error) ? (error as RawValidationError) : {};

	return {
		description:
			typeof raw.description === "string" ? raw.description : undefined,
		expected: normalizeExpected(raw.expected),
		path: normalizePath(raw.path),
		value: Object.prototype.hasOwnProperty.call(raw, "value")
			? raw.value
			: undefined,
	};
}

export function isValidationResult<T>(
	value: unknown
): value is ValidationResult<T> {
	return (
		isPlainObject(value) &&
		typeof value.isValid === "boolean" &&
		Array.isArray(value.errors)
	);
}

export function toValidationResult<T>(result: unknown): ValidationResult<T> {
	const rawResult = isPlainObject(result)
		? (result as {
				data?: unknown;
				errors?: unknown;
				success?: unknown;
			})
		: {};

	if (isValidationResult<T>(result)) {
		return result;
	}

	if (rawResult.success === true) {
		return {
			data: rawResult.data as T | undefined,
			errors: [],
			isValid: true,
		};
	}

	return {
		data: undefined,
		errors: Array.isArray(rawResult.errors)
			? rawResult.errors.map(normalizeValidationError)
			: [],
		isValid: false,
	};
}
