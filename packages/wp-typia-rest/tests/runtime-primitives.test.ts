import { describe, expect, test } from "bun:test";

import * as apiClientInternal from "../../wp-typia-api-client/dist/internal/runtime-primitives.js";

import * as restRoot from "../src/index";
import * as restInternal from "../src/internal/runtime-primitives";

describe("@wp-typia/rest runtime primitive shims", () => {
	test("forwards shared helpers from api-client by identity", () => {
		expect(restInternal.isPlainObject).toBe(apiClientInternal.isPlainObject);
		expect(restInternal.isFormDataLike).toBe(apiClientInternal.isFormDataLike);
		expect(restInternal.normalizeValidationError).toBe(
			apiClientInternal.normalizeValidationError,
		);
		expect(restInternal.isValidationResult).toBe(
			apiClientInternal.isValidationResult,
		);
		expect(restInternal.toValidationResult).toBe(
			apiClientInternal.toValidationResult,
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
			apiClientInternal.normalizeValidationError(rawError),
		);
		expect(
			restInternal.toValidationResult({
				errors: [rawError],
				success: false,
			}),
		).toEqual(
			apiClientInternal.toValidationResult({
				errors: [rawError],
				success: false,
			}),
		);
		expect(restInternal.isFormDataLike(formData)).toBe(true);
		expect(apiClientInternal.isFormDataLike(formData)).toBe(true);
	});

	test("keeps the rest root surface transport-oriented", () => {
		expect("isPlainObject" in restRoot).toBe(false);
		expect("isFormDataLike" in restRoot).toBe(false);
		expect("normalizeValidationError" in restRoot).toBe(true);
		expect("isValidationResult" in restRoot).toBe(true);
		expect("toValidationResult" in restRoot).toBe(true);
	});
});
