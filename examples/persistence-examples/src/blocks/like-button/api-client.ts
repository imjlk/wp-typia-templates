import {
	callEndpoint,
	createEndpoint,
	type EndpointCallOptions,
} from '@wp-typia/api-client';
import type {
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse,
	PersistenceToggleLikeRequest,
} from './api-types';
import { apiValidators } from './api-validators';

export const getPersistenceLikeStatusEndpoint = createEndpoint<
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse
>( {
	authMode: 'public-read',
	method: 'GET',
	operationId: 'getPersistenceLikeStatus',
	path: '/persistence-examples/v1/likes',
	requestLocation: 'query',
	validateRequest: apiValidators.likeStatusQuery,
	validateResponse: apiValidators.likeStatusResponse,
} );

export function getPersistenceLikeStatus(
	request: PersistenceLikeStatusQuery,
	options: EndpointCallOptions
) {
	return callEndpoint( getPersistenceLikeStatusEndpoint, request, options );
}

export const togglePersistenceLikeStatusEndpoint = createEndpoint<
	PersistenceToggleLikeRequest,
	PersistenceLikeStatusResponse
>( {
	authMode: 'authenticated-rest-nonce',
	method: 'POST',
	operationId: 'togglePersistenceLikeStatus',
	path: '/persistence-examples/v1/likes',
	requestLocation: 'body',
	validateRequest: apiValidators.toggleLikeRequest,
	validateResponse: apiValidators.likeStatusResponse,
} );

export function togglePersistenceLikeStatus(
	request: PersistenceToggleLikeRequest,
	options: EndpointCallOptions
) {
	return callEndpoint(
		togglePersistenceLikeStatusEndpoint,
		request,
		options
	);
}
