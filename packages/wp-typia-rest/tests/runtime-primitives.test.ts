import { describe, expect, test } from "bun:test";

import * as apiClientRuntimePrimitives from "../../wp-typia-api-client/src/runtime-primitives";

import * as restRoot from "../src/index";
import * as restInternal from "../src/internal/runtime-primitives";

describe("@wp-typia/rest runtime primitive shims", () => {
	test("forwards shared helpers from api-client by identity", () => {
		expect(restInternal.isPlainObject).toBe(apiClientRuntimePrimitives.isPlainObject);
		expect(restInternal.isFormDataLike).toBe(apiClientRuntimePrimitives.isFormDataLike);
		expect(restInternal.normalizeValidationError).toBe(
			apiClientRuntimePrimitives.normalizeValidationError,
		);
		expect(restInternal.isValidationResult).toBe(
			apiClientRuntimePrimitives.isValidationResult,
		);
		expect(restInternal.toValidationResult).toBe(
			apiClientRuntimePrimitives.toValidationResult,
		);
	});

	test("keeps validation normalization and form-data detection aligned", () => {
		const rawError = {
			description: "Bad title",
			expected: "string",
			path: "body.title",
			value: 7,
		};
		const formData = new FormData();

		expect(restInternal.normalizeValidationError(rawError)).toEqual(
			apiClientRuntimePrimitives.normalizeValidationError(rawError),
		);
		expect(
			restInternal.toValidationResult({
				errors: [rawError],
				success: false,
			}),
		).toEqual(
			apiClientRuntimePrimitives.toValidationResult({
				errors: [rawError],
				success: false,
			}),
		);
		expect(restInternal.isFormDataLike(formData)).toBe(true);
		expect(apiClientRuntimePrimitives.isFormDataLike(formData)).toBe(true);
	});

	test("keeps the rest root surface transport-oriented", () => {
		expect("isPlainObject" in restRoot).toBe(false);
		expect("isFormDataLike" in restRoot).toBe(false);
		expect("normalizeValidationError" in restRoot).toBe(true);
		expect("isValidationResult" in restRoot).toBe(true);
		expect("toValidationResult" in restRoot).toBe(true);
	});
});
