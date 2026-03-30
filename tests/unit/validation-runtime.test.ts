import { describe, expect, test } from 'bun:test';

import {
	createAttributeUpdater,
	formatValidationError,
	formatValidationErrors,
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
		const nullErrors = toValidationResult({
			errors: null,
			success: false,
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

		expect(nullErrors).toEqual({
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

	test('createAttributeUpdater blocks invalid patches and reports the validation result', () => {
		const patches: Array<Partial<{ content: string; isVisible: boolean }>> = [];
		const validationErrors: Array<ValidationResult<{ content: string; isVisible: boolean }>> = [];
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
			(validation) => {
				validationErrors.push(validation);
			}
		);

		expect(updateAttribute('content', 'Still invalid')).toBe(false);
		expect(patches).toEqual([]);
		expect(validationErrors).toHaveLength(1);
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
});
