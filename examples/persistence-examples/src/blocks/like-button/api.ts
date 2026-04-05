import { callEndpoint, resolveRestRouteUrl } from '@wp-typia/rest';

import { resolveRestNonce } from '../../shared/rest';
import type {
	PersistenceLikeStatusQuery,
	PersistenceToggleLikeRequest,
} from './api-types';
import {
	getPersistenceLikeStatusEndpoint,
	togglePersistenceLikeStatusEndpoint,
} from './api-client';

export const likeStatusEndpoint = {
	...getPersistenceLikeStatusEndpoint,
	buildRequestOptions: () => ( {
		url: resolveRestRouteUrl( getPersistenceLikeStatusEndpoint.path ),
	} ),
};

export const toggleLikeEndpoint = {
	...togglePersistenceLikeStatusEndpoint,
	buildRequestOptions: () => ( {
		url: resolveRestRouteUrl( togglePersistenceLikeStatusEndpoint.path ),
	} ),
};

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
