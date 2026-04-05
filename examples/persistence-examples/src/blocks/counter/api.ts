import { callEndpoint, resolveRestRouteUrl } from '@wp-typia/rest';

import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
} from './api-types';
import {
	getPersistenceCounterStateEndpoint,
	incrementPersistenceCounterStateEndpoint,
} from './api-client';

export const counterEndpoint = {
	...getPersistenceCounterStateEndpoint,
	buildRequestOptions: () => ( {
		url: resolveRestRouteUrl( getPersistenceCounterStateEndpoint.path ),
	} ),
};

export const incrementCounterEndpoint = {
	...incrementPersistenceCounterStateEndpoint,
	buildRequestOptions: () => ( {
		url: resolveRestRouteUrl(
			incrementPersistenceCounterStateEndpoint.path
		),
	} ),
};

export function fetchCounter( request: PersistenceCounterQuery ) {
	return callEndpoint( counterEndpoint, request );
}

export function incrementCounter(
	request: PersistenceCounterIncrementRequest
) {
	return callEndpoint( incrementCounterEndpoint, request );
}
