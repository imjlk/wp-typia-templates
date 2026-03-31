import { callEndpoint, createEndpoint } from '@wp-typia/rest';

import {
	buildRestPath,
	resolveExampleRestRoute,
	resolveRestNonce,
} from '../../shared/rest';
import type {
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse,
	PersistenceToggleLikeRequest,
} from './api-types';
import { apiValidators } from './api-validators';

const LIKE_PATH = '/likes';

export const likeStatusEndpoint = createEndpoint<
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse
>( {
	buildRequestOptions: () => ( {
		url: resolveExampleRestRoute( LIKE_PATH ),
	} ),
	method: 'GET',
	path: buildRestPath( LIKE_PATH ),
	validateRequest: apiValidators.likeStatusQuery,
	validateResponse: apiValidators.likeStatusResponse,
} );

export const toggleLikeEndpoint = createEndpoint<
	PersistenceToggleLikeRequest,
	PersistenceLikeStatusResponse
>( {
	buildRequestOptions: () => ( {
		url: resolveExampleRestRoute( LIKE_PATH ),
	} ),
	method: 'POST',
	path: buildRestPath( LIKE_PATH ),
	validateRequest: apiValidators.toggleLikeRequest,
	validateResponse: apiValidators.likeStatusResponse,
} );

export function fetchLikeStatus(
	request: PersistenceLikeStatusQuery,
	restNonce?: string
) {
	const nonce = resolveRestNonce( restNonce );

	return callEndpoint( likeStatusEndpoint, request, {
		requestOptions: nonce
			? {
					headers: {
						'X-WP-Nonce': nonce,
					},
			  }
			: undefined,
	} );
}

export function toggleLike(
	request: PersistenceToggleLikeRequest,
	restNonce?: string
) {
	const nonce = resolveRestNonce( restNonce );

	return callEndpoint( toggleLikeEndpoint, request, {
		requestOptions: nonce
			? {
					headers: {
						'X-WP-Nonce': nonce,
					},
			  }
			: undefined,
	} );
}
