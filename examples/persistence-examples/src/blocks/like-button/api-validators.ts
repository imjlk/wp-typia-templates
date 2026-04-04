import typia from 'typia';

import {
	toValidationResult,
	type ValidationResult,
} from '@wp-typia/api-client';
import type {
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse,
	PersistenceToggleLikeRequest,
} from './api-types';

const validateLikeStatusQuery =
	typia.createValidate< PersistenceLikeStatusQuery >();
const validateToggleLikeRequest =
	typia.createValidate< PersistenceToggleLikeRequest >();
const validateLikeStatusResponse =
	typia.createValidate< PersistenceLikeStatusResponse >();

export const apiValidators = {
	likeStatusQuery: (
		input: unknown
	): ValidationResult< PersistenceLikeStatusQuery > =>
		toValidationResult( validateLikeStatusQuery( input ) ),
	likeStatusResponse: (
		input: unknown
	): ValidationResult< PersistenceLikeStatusResponse > =>
		toValidationResult( validateLikeStatusResponse( input ) ),
	toggleLikeRequest: (
		input: unknown
	): ValidationResult< PersistenceToggleLikeRequest > =>
		toValidationResult( validateToggleLikeRequest( input ) ),
};
