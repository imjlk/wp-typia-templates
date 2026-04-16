import type { IValidation } from "@typia/interface";

import {
	isValidationResult,
	normalizeValidationError,
	toValidationResult,
	type ValidationError,
	type ValidationLike,
	type ValidationResult,
} from "./internal/runtime-primitives.js";

export type {
	ValidationError,
	ValidationLike,
	ValidationResult,
} from "./internal/runtime-primitives.js";
export {
	isValidationResult,
	normalizeValidationError,
	toValidationResult,
} from "./internal/runtime-primitives.js";

function toHeadersRecord(input: unknown): Record<string, string | string[] | undefined> {
	if (input instanceof Headers) {
		const record: Record<string, string> = {};
		input.forEach((value, key) => {
			record[key] = value;
		});
		return record;
	}

	if (input !== null && typeof input === "object" && !Array.isArray(input)) {
		return input as Record<string, string | string[] | undefined>;
	}

	return {};
}

function toQueryInput(input: unknown): string | URLSearchParams {
	if (typeof input === "string" || input instanceof URLSearchParams) {
		return input;
	}

	if (input !== null && typeof input === "object" && !Array.isArray(input)) {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
			if (value === undefined || value === null) {
				continue;
			}
			if (Array.isArray(value)) {
				for (const item of value) {
					params.append(key, String(item));
				}
				continue;
			}
			params.set(key, String(value));
		}
		return params;
	}

	return "";
}

function toQueryRecord(input: string | URLSearchParams): Record<string, string> {
	const params = typeof input === "string" ? new URLSearchParams(input) : input;
	return Object.fromEntries(params.entries());
}

export function createQueryDecoder<T extends object>(
	validate?: (input: string | URLSearchParams) => ValidationLike<T> | IValidation<T>,
): (input: unknown) => ValidationResult<T> {
	return (input: unknown) => {
		const queryInput = toQueryInput(input);
		if (validate) {
			return toValidationResult(validate(queryInput));
		}

		return {
			data: toQueryRecord(queryInput) as T,
			errors: [],
			isValid: true,
		};
	};
}

export function createHeadersDecoder<T extends object>(
	validate?: (
		input: Record<string, string | string[] | undefined>,
	) => ValidationLike<T> | IValidation<T>,
): (input: unknown) => ValidationResult<T> {
	return (input: unknown) => {
		const headersRecord = toHeadersRecord(input);
		if (validate) {
			return toValidationResult(validate(headersRecord));
		}

		return {
			data: headersRecord as T,
			errors: [],
			isValid: true,
		};
	};
}

function decodePrimitiveParameter(input: string): string | number | boolean | bigint | null {
	if (input === "null") {
		return null;
	}

	if (input === "true") {
		return true;
	}

	if (input === "false") {
		return false;
	}

	if (/^-?\d+$/.test(input)) {
		const numericValue = Number(input);
		if (Number.isSafeInteger(numericValue)) {
			return numericValue;
		}

		try {
			return BigInt(input);
		} catch {
			return input;
		}
	}

	if (/^-?(?:\d+\.\d+|\d+\.|\.\d+)$/.test(input)) {
		const numericValue = Number(input);
		if (!Number.isNaN(numericValue)) {
			return numericValue;
		}
	}

	return input;
}

export function createParameterDecoder<T extends string | number | boolean | bigint | null>(): (
	input: string,
) => T {
	return ((input: string) => decodePrimitiveParameter(input) as T);
}
