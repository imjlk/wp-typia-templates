import { callEndpoint, createEndpoint } from '@wp-typia/rest';

import { apiValidators } from './api-validators';
import type {
	MyTypiaBlockCounterQuery,
	MyTypiaBlockCounterResponse,
	MyTypiaBlockIncrementRequest,
} from './api-types';

const COUNTER_PATH = '/my-typia-block/v1/counter';

function getRestRoot(): string {
	const wpApiSettings = (
		window as typeof window & {
			wpApiSettings?: { root?: string };
		}
	 ).wpApiSettings;

	if (
		typeof wpApiSettings?.root === 'string' &&
		wpApiSettings.root.length > 0
	) {
		return wpApiSettings.root;
	}

	return `${ window.location.origin }/wp-json/`;
}

function toRestUrl( routePath: string ): string {
	return new URL( routePath.replace( /^\//, '' ), getRestRoot() ).toString();
}

function resolveRestNonce( fallback?: string ): string | undefined {
	if ( typeof fallback === 'string' && fallback.length > 0 ) {
		return fallback;
	}

	const wpApiSettings = (
		window as typeof window & {
			wpApiSettings?: { nonce?: string };
		}
	 ).wpApiSettings;

	return typeof wpApiSettings?.nonce === 'string' &&
		wpApiSettings.nonce.length > 0
		? wpApiSettings.nonce
		: undefined;
}

const counterEndpoint = createEndpoint<
	MyTypiaBlockCounterQuery,
	MyTypiaBlockCounterResponse
>( {
	buildRequestOptions: () => ( { url: toRestUrl( COUNTER_PATH ) } ),
	method: 'GET',
	path: COUNTER_PATH,
	validateRequest: apiValidators.counterQuery,
	validateResponse: apiValidators.counterResponse,
} );

const incrementCounterEndpoint = createEndpoint<
	MyTypiaBlockIncrementRequest,
	MyTypiaBlockCounterResponse
>( {
	buildRequestOptions: () => ( { url: toRestUrl( COUNTER_PATH ) } ),
	method: 'POST',
	path: COUNTER_PATH,
	validateRequest: apiValidators.incrementRequest,
	validateResponse: apiValidators.counterResponse,
} );

export function getCounter( request: MyTypiaBlockCounterQuery ) {
	return callEndpoint( counterEndpoint, request );
}

export function incrementCounter(
	request: MyTypiaBlockIncrementRequest,
	restNonce?: string
) {
	const nonce = resolveRestNonce( restNonce );

	return callEndpoint( incrementCounterEndpoint, request, {
		requestOptions: nonce
			? {
					headers: {
						'X-WP-Nonce': nonce,
					},
			  }
			: undefined,
	} );
}
