import { describe, expect, test } from 'bun:test';

import {
	createAttributeUpdater,
	createNestedAttributeUpdater,
	formatValidationError,
	formatValidationErrors,
	mergeNestedAttributeUpdate,
	toNestedAttributePatch,
	toValidationResult,
	toValidationState,
	type ValidationResult,
} from '../../packages/create/src/runtime/validation';

describe('runtime validation helpers', () => {
	test('formatValidationError includes path, expectation, and received value type', () => {
		expect(
			formatValidationError({
				expected: 'string',
				path: 'attributes.content',
				value: 42,
			})
		).toBe('attributes.content: string expected, got number');
	});

	test('formatValidationErrors formats multiple validation issues', () => {
		expect(
			formatValidationErrors([
				{
					expected: 'string',
					path: 'attributes.content',
					value: 42,
				},
				{
					expected: 'boolean',
					path: 'attributes.isVisible',
					value: 'yes',
				},
			])
		).toEqual([
			'attributes.content: string expected, got number',
			'attributes.isVisible: boolean expected, got string',
		]);
	});

	test('toValidationResult normalizes raw typia output into typed validation errors', () => {
		const result = toValidationResult({
			errors: [
				{
					expected: 'string',
					path: 'attributes.content',
					value: 10,
				},
			],
			success: false,
		});

		expect(result).toEqual({
			data: undefined,
			errors: [
				{
					description: undefined,
					expected: 'string',
					path: 'attributes.content',
					value: 10,
				},
			],
			isValid: false,
		});
	});

	test('toValidationResult tolerates malformed typia-like payloads', () => {
		const nullResult = toValidationResult(null);
		const nullErrors = toValidationResult({
			errors: null,
			success: false,
		});
		const truthySuccess = toValidationResult({
			data: 'unexpected',
			success: 'yes',
		});
		const mixedErrors = toValidationResult({
			errors: [
				null,
				'boom',
				{
					value: 99,
				},
			],
			success: false,
		});

		expect(nullResult).toEqual({
			data: undefined,
			errors: [],
			isValid: false,
		});
		expect(nullErrors).toEqual({
			data: undefined,
			errors: [],
			isValid: false,
		});
		expect(truthySuccess).toEqual({
			data: undefined,
			errors: [],
			isValid: false,
		});
		expect(mixedErrors.errors).toEqual([
			{
				description: undefined,
				expected: 'unknown',
				path: '(root)',
				value: undefined,
			},
			{
				description: undefined,
				expected: 'unknown',
				path: '(root)',
				value: undefined,
			},
			{
				description: undefined,
				expected: 'unknown',
				path: '(root)',
				value: 99,
			},
		]);
	});

	test('toValidationState derives formatted messages from a validation result', () => {
		const state = toValidationState({
			data: undefined,
			errors: [
				{
					expected: 'string',
					path: '(root)',
					value: false,
				},
			],
			isValid: false,
		});

		expect(state.errorMessages).toEqual(['(root): string expected, got boolean']);
	});

	test('createAttributeUpdater applies valid patches', () => {
		const patches: Array<Partial<{ content: string; isVisible: boolean }>> = [];
		const updateAttribute = createAttributeUpdater(
			{ content: 'Hello', isVisible: true },
			(patch) => {
				patches.push(patch);
			},
			(value): ValidationResult<{ content: string; isVisible: boolean }> => ({
				data: value,
				errors: [],
				isValid: true,
			})
		);

		expect(updateAttribute('content', 'Updated')).toBe(true);
		expect(patches).toEqual([{ content: 'Updated' }]);
	});

	test('createAttributeUpdater blocks invalid patches and reports the validation result and key', () => {
		const patches: Array<Partial<{ content: string; isVisible: boolean }>> = [];
		const validationErrors: Array<ValidationResult<{ content: string; isVisible: boolean }>> = [];
		const validationKeys: Array<'content' | 'isVisible'> = [];
		const updateAttribute = createAttributeUpdater(
			{ content: 'Hello', isVisible: true },
			(patch) => {
				patches.push(patch);
			},
			(): ValidationResult<{ content: string; isVisible: boolean }> => ({
				errors: [
					{
						expected: 'string',
						path: 'content',
						value: 123,
					},
				],
				isValid: false,
			}),
			(validation, key) => {
				validationErrors.push(validation);
				validationKeys.push(key);
			}
		);

		expect(updateAttribute('content', 'Still invalid')).toBe(false);
		expect(patches).toEqual([]);
		expect(validationErrors).toHaveLength(1);
		expect(validationKeys).toEqual(['content']);
		expect(validationErrors[0]?.errors[0]?.path).toBe('content');
	});

	test('createAttributeUpdater handles invalid patches without an error callback', () => {
		const patches: Array<Partial<{ content: string; isVisible: boolean }>> = [];
		const updateAttribute = createAttributeUpdater(
			{ content: 'Hello', isVisible: true },
			(patch) => {
				patches.push(patch);
			},
			(): ValidationResult<{ content: string; isVisible: boolean }> => ({
				errors: [
					{
						expected: 'string',
						path: 'content',
						value: 123,
					},
				],
				isValid: false,
			})
		);

		expect(updateAttribute('content', 'Still invalid')).toBe(false);
		expect(patches).toEqual([]);
	});

	test('toNestedAttributePatch creates a top-level patch for dotted paths without mutating the source object', () => {
		const attributes = {
			content: 'Hello',
			padding: {
				bottom: 4,
				left: 4,
				right: 4,
				top: 4,
			},
		};

		const patch = toNestedAttributePatch(attributes, 'padding.top', 12);

		expect(patch).toEqual({
			padding: {
				bottom: 4,
				left: 4,
				right: 4,
				top: 12,
			},
		});
		expect(attributes.padding.top).toBe(4);
	});

	test('mergeNestedAttributeUpdate applies dotted path updates to the next validation payload', () => {
		const attributes = {
			content: 'Hello',
			padding: {
				bottom: 4,
				left: 4,
				right: 4,
				top: 4,
			},
		};

		expect(mergeNestedAttributeUpdate(attributes, 'padding.left', 16)).toEqual({
			content: 'Hello',
			padding: {
				bottom: 4,
				left: 16,
				right: 4,
				top: 4,
			},
		});
	});

	test('createNestedAttributeUpdater applies valid dotted path patches', () => {
		const patches: Array<
			Partial<{
				content: string;
				padding: { bottom: number; left: number; right: number; top: number };
			}>
		> = [];
		const updateAttribute = createNestedAttributeUpdater(
			{
				content: 'Hello',
				padding: {
					bottom: 4,
					left: 4,
					right: 4,
					top: 4,
				},
			},
			(patch) => {
				patches.push(patch);
			},
			(value): ValidationResult<{
				content: string;
				padding: { bottom: number; left: number; right: number; top: number };
			}> => ({
				data: value,
				errors: [],
				isValid: true,
			})
		);

		expect(updateAttribute('padding.top', 24)).toBe(true);
		expect(patches).toEqual([
			{
				padding: {
					bottom: 4,
					left: 4,
					right: 4,
					top: 24,
				},
			},
		]);
	});

	test('createNestedAttributeUpdater blocks invalid dotted path patches and reports the path', () => {
		const patches: Array<
			Partial<{
				content: string;
				padding: { bottom: number; left: number; right: number; top: number };
			}>
		> = [];
		const validationPaths: string[] = [];
		const updateAttribute = createNestedAttributeUpdater(
			{
				content: 'Hello',
				padding: {
					bottom: 4,
					left: 4,
					right: 4,
					top: 4,
				},
			},
			(patch) => {
				patches.push(patch);
			},
			(): ValidationResult<{
				content: string;
				padding: { bottom: number; left: number; right: number; top: number };
			}> => ({
				errors: [
					{
						expected: 'number',
						path: 'padding.top',
						value: -1,
					},
				],
				isValid: false,
			}),
			( validation, path ) => {
				validationPaths.push(path);
				expect(validation.errors[0]?.path).toBe('padding.top');
			}
		);

		expect(updateAttribute('padding.top', -1)).toBe(false);
		expect(patches).toEqual([]);
		expect(validationPaths).toEqual(['padding.top']);
	});
});
