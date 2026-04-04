import {
	callEndpoint,
	createEndpoint,
	type EndpointCallOptions,
} from '@wp-typia/api-client';
import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from './api-types';
import { apiValidators } from './api-validators';

export const getPersistenceCounterStateEndpoint = createEndpoint<
	PersistenceCounterQuery,
	PersistenceCounterResponse
>( {
	authMode: 'public-read',
	method: 'GET',
	operationId: 'getPersistenceCounterState',
	path: '/persistence-examples/v1/counter',
	validateRequest: apiValidators.counterQuery,
	validateResponse: apiValidators.counterResponse,
} );

export function getPersistenceCounterState(
	request: PersistenceCounterQuery,
	options: EndpointCallOptions
) {
	return callEndpoint( getPersistenceCounterStateEndpoint, request, options );
}

export const incrementPersistenceCounterStateEndpoint = createEndpoint<
	PersistenceCounterIncrementRequest,
	PersistenceCounterResponse
>( {
	authMode: 'public-signed-token',
	method: 'POST',
	operationId: 'incrementPersistenceCounterState',
	path: '/persistence-examples/v1/counter',
	validateRequest: apiValidators.incrementRequest,
	validateResponse: apiValidators.counterResponse,
} );

export function incrementPersistenceCounterState(
	request: PersistenceCounterIncrementRequest,
	options: EndpointCallOptions
) {
	return callEndpoint(
		incrementPersistenceCounterStateEndpoint,
		request,
		options
	);
}
