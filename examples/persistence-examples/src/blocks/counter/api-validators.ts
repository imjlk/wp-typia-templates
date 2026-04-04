import typia from 'typia';

import {
	toValidationResult,
	type ValidationResult,
} from '@wp-typia/api-client';
import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from './api-types';

const validateCounterQuery = typia.createValidate< PersistenceCounterQuery >();
const validateIncrementRequest =
	typia.createValidate< PersistenceCounterIncrementRequest >();
const validateCounterResponse =
	typia.createValidate< PersistenceCounterResponse >();

export const apiValidators = {
	counterQuery: (
		input: unknown
	): ValidationResult< PersistenceCounterQuery > =>
		toValidationResult( validateCounterQuery( input ) ),
	counterResponse: (
		input: unknown
	): ValidationResult< PersistenceCounterResponse > =>
		toValidationResult( validateCounterResponse( input ) ),
	incrementRequest: (
		input: unknown
	): ValidationResult< PersistenceCounterIncrementRequest > =>
		toValidationResult( validateIncrementRequest( input ) ),
};
