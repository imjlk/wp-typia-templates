import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ValidationError, ValidationResult } from '@wp-typia/rest';
import counterQuerySchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-query.schema.json';
import counterResponseSchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-response.schema.json';
import incrementRequestSchema from '../../persistence-examples/src/blocks/counter/api-schemas/increment-request.schema.json';
import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from '../../persistence-examples/src/blocks/counter/api-types';

const ajv = new Ajv2020({
	allErrors: true,
	strict: false,
});

const validateCounterQuerySchema =
	ajv.compile<PersistenceCounterQuery>(counterQuerySchema);
const validateIncrementRequestSchema =
	ajv.compile<PersistenceCounterIncrementRequest>(incrementRequestSchema);
const validateCounterResponseSchema =
	ajv.compile<PersistenceCounterResponse>(counterResponseSchema);

function normalizeError(error: ErrorObject): ValidationError {
	return {
		description: error.message,
		expected: error.keyword,
		path: error.instancePath || '(root)',
		value: error.params,
	};
}

function runSchemaValidation<T>(
	validator: ValidateFunction<T>,
	input: unknown
): ValidationResult<T> {
	if (validator(input)) {
		return {
			data: input as T,
			errors: [],
			isValid: true,
		};
	}

	return {
		data: undefined,
		errors: (validator.errors ?? []).map(normalizeError),
		isValid: false,
	};
}

export const counterContractValidators = {
	counterQuery: (input: unknown): ValidationResult<PersistenceCounterQuery> =>
		runSchemaValidation(validateCounterQuerySchema, input),
	counterResponse: (
		input: unknown
	): ValidationResult<PersistenceCounterResponse> =>
		runSchemaValidation(validateCounterResponseSchema, input),
	incrementRequest: (
		input: unknown
	): ValidationResult<PersistenceCounterIncrementRequest> =>
		runSchemaValidation(validateIncrementRequestSchema, input),
};
