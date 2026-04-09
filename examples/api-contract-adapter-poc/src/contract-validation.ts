import Ajv2020, { type ErrorObject, type ValidateFunction } from 'ajv/dist/2020.js';

import type { ValidationError, ValidationResult } from '@wp-typia/api-client';
import counterBootstrapQuerySchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-bootstrap-query.schema.json';
import counterBootstrapResponseSchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-bootstrap-response.schema.json';
import counterQuerySchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-query.schema.json';
import counterResponseSchema from '../../persistence-examples/src/blocks/counter/api-schemas/counter-response.schema.json';
import incrementRequestSchema from '../../persistence-examples/src/blocks/counter/api-schemas/increment-request.schema.json';
import type {
	PersistenceCounterBootstrapQuery,
	PersistenceCounterBootstrapResponse,
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from '../../persistence-examples/src/blocks/counter/api-types';

const UINT32_MAX = 4_294_967_295;

const ajv = new Ajv2020({
	allErrors: true,
	strict: false,
});

ajv.addKeyword({
	keyword: 'x-typeTag',
	schemaType: 'string',
	validate(typeTag: string, data: unknown): boolean {
		if (typeTag !== 'uint32') {
			return false;
		}

		return (
			typeof data === 'number' &&
			Number.isInteger(data) &&
			data >= 0 &&
			data <= UINT32_MAX
		);
	},
});

const validateCounterQuerySchema =
	ajv.compile<PersistenceCounterQuery>(counterQuerySchema);
const validateCounterBootstrapQuerySchema =
	ajv.compile<PersistenceCounterBootstrapQuery>(counterBootstrapQuerySchema);
const validateIncrementRequestSchema =
	ajv.compile<PersistenceCounterIncrementRequest>(incrementRequestSchema);
const validateCounterBootstrapResponseSchema =
	ajv.compile<PersistenceCounterBootstrapResponse>(counterBootstrapResponseSchema);
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
	counterBootstrapQuery: (
		input: unknown
	): ValidationResult<PersistenceCounterBootstrapQuery> =>
		runSchemaValidation(validateCounterBootstrapQuerySchema, input),
	counterBootstrapResponse: (
		input: unknown
	): ValidationResult<PersistenceCounterBootstrapResponse> =>
		runSchemaValidation(validateCounterBootstrapResponseSchema, input),
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

export const counterOperationResponseValidators = {
	getPersistenceCounterBootstrap: counterContractValidators.counterBootstrapResponse,
	getPersistenceCounterState: counterContractValidators.counterResponse,
	incrementPersistenceCounterState: counterContractValidators.counterResponse,
} as const;
