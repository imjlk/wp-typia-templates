import { callEndpoint, createEndpoint } from '@wp-typia/rest';

import { buildRestPath, resolveExampleRestRoute } from '../../shared/rest';
import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from './api-types';
import { apiValidators } from './api-validators';

const COUNTER_PATH = '/counter';

export const counterEndpoint = createEndpoint<
	PersistenceCounterQuery,
	PersistenceCounterResponse
>( {
	buildRequestOptions: () => ( {
		url: resolveExampleRestRoute( COUNTER_PATH ),
	} ),
	method: 'GET',
	path: buildRestPath( COUNTER_PATH ),
	validateRequest: apiValidators.counterQuery,
	validateResponse: apiValidators.counterResponse,
} );

export const incrementCounterEndpoint = createEndpoint<
	PersistenceCounterIncrementRequest,
	PersistenceCounterResponse
>( {
	buildRequestOptions: () => ( {
		url: resolveExampleRestRoute( COUNTER_PATH ),
	} ),
	method: 'POST',
	path: buildRestPath( COUNTER_PATH ),
	validateRequest: apiValidators.incrementRequest,
	validateResponse: apiValidators.counterResponse,
} );

export function fetchCounter( request: PersistenceCounterQuery ) {
	return callEndpoint( counterEndpoint, request );
}

export function incrementCounter(
	request: PersistenceCounterIncrementRequest
) {
	return callEndpoint( incrementCounterEndpoint, request );
}
