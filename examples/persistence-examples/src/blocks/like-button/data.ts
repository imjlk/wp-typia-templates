import {
	useEndpointMutation,
	useEndpointQuery,
	type UseEndpointMutationOptions,
	type UseEndpointQueryOptions,
} from '@wp-typia/rest/react';

import { resolveRestNonce } from '../../shared/rest';
import type {
	PersistenceLikeStatusQuery,
	PersistenceLikeStatusResponse,
	PersistenceToggleLikeRequest,
} from './api-types';
import { likeStatusEndpoint, toggleLikeEndpoint } from './api';

function buildNonceRequestOptions( restNonce?: string ) {
	const nonce = resolveRestNonce( restNonce );

	return nonce
		? {
				requestOptions: {
					headers: {
						'X-WP-Nonce': nonce,
					},
				},
		  }
		: undefined;
}

interface ToggleLikeMutationContext< Context > {
	previous: PersistenceLikeStatusResponse | undefined;
	userContext: Context | undefined;
}

export interface UsePersistenceLikeStatusQueryOptions<
	Selected = PersistenceLikeStatusResponse,
> extends Omit<
		UseEndpointQueryOptions<
			PersistenceLikeStatusQuery,
			PersistenceLikeStatusResponse,
			Selected
		>,
		'resolveCallOptions'
	> {
	restNonce?: string;
}

export interface UseToggleLikeMutationOptions< Context = unknown >
	extends Omit<
		UseEndpointMutationOptions<
			PersistenceToggleLikeRequest,
			PersistenceLikeStatusResponse,
			ToggleLikeMutationContext< Context >
		>,
		'invalidate' | 'onError' | 'onMutate' | 'resolveCallOptions'
	> {
	onError?: (
		error: unknown,
		request: PersistenceToggleLikeRequest,
		client: import('@wp-typia/rest/react').EndpointDataClient,
		context: Context | undefined
	) => void | Promise< void >;
	onMutate?: (
		request: PersistenceToggleLikeRequest,
		client: import('@wp-typia/rest/react').EndpointDataClient
	) => Context | Promise< Context >;
	restNonce?: string;
}

export function usePersistenceLikeStatusQuery<
	Selected = PersistenceLikeStatusResponse,
>(
	request: PersistenceLikeStatusQuery,
	options: UsePersistenceLikeStatusQueryOptions< Selected > = {}
) {
	const { restNonce, ...queryOptions } = options;

	return useEndpointQuery( likeStatusEndpoint, request, {
		...queryOptions,
		resolveCallOptions: () => buildNonceRequestOptions( restNonce ),
	} );
}

export function useToggleLikeMutation< Context = unknown >(
	options: UseToggleLikeMutationOptions< Context > = {}
) {
	const { onError, onMutate, restNonce, ...mutationOptions } = options;

	return useEndpointMutation( toggleLikeEndpoint, {
		...mutationOptions,
		invalidate: ( _data, request ) => ( {
			endpoint: likeStatusEndpoint,
			request: {
				postId: request.postId,
				resourceKey: request.resourceKey,
			},
		} ),
		onError: async ( error, request, client, context ) => {
			if ( context?.previous ) {
				client.setData(
					likeStatusEndpoint,
					{
						postId: request.postId,
						resourceKey: request.resourceKey,
					},
					context.previous
				);
			}

			await onError?.( error, request, client, context?.userContext );
		},
		onMutate: async ( request, client ) => {
			const queryRequest = {
				postId: request.postId,
				resourceKey: request.resourceKey,
			} satisfies PersistenceLikeStatusQuery;
			const previous = client.getData( likeStatusEndpoint, queryRequest );

			if ( previous !== undefined ) {
				client.setData( likeStatusEndpoint, queryRequest, ( current ) => {
					if ( ! current ) {
						return current;
					}

					const nextLiked = ! current.likedByCurrentUser;
					return {
						...current,
						count: Math.max(
							0,
							current.count + ( nextLiked ? 1 : -1 )
						),
						likedByCurrentUser: nextLiked,
					};
				} );
			}

			let userContext: Context | undefined;
			try {
				userContext = onMutate
					? await onMutate( request, client )
					: undefined;
			} catch ( error ) {
				if ( previous !== undefined ) {
					client.setData( likeStatusEndpoint, queryRequest, previous );
				}
				throw error;
			}

			return {
				previous,
				userContext,
			};
		},
		resolveCallOptions: () => buildNonceRequestOptions( restNonce ),
	} );
}
