import {
	useEndpointMutation,
	useEndpointQuery,
	type UseEndpointMutationOptions,
	type UseEndpointQueryOptions,
} from '@wp-typia/rest/react';

import type {
	PersistenceCounterIncrementRequest,
	PersistenceCounterQuery,
	PersistenceCounterResponse,
} from './api-types';
import { counterEndpoint, incrementCounterEndpoint } from './api';

interface CounterMutationContext< Context > {
	previous: PersistenceCounterResponse | undefined;
	userContext: Context | undefined;
}

export type UsePersistenceCounterQueryOptions<
	Selected = PersistenceCounterResponse,
> = UseEndpointQueryOptions< PersistenceCounterResponse, Selected >;

export interface UseIncrementCounterMutationOptions< Context = unknown >
	extends Omit<
		UseEndpointMutationOptions<
			PersistenceCounterIncrementRequest,
			PersistenceCounterResponse,
			CounterMutationContext< Context >
		>,
		'invalidate' | 'onError' | 'onMutate'
	> {
	onError?: (
		error: unknown,
		request: PersistenceCounterIncrementRequest,
		client: import('@wp-typia/rest/react').EndpointDataClient,
		context: Context | undefined
	) => void | Promise< void >;
	onMutate?: (
		request: PersistenceCounterIncrementRequest,
		client: import('@wp-typia/rest/react').EndpointDataClient
	) => Context | Promise< Context >;
}

export function usePersistenceCounterQuery<
	Selected = PersistenceCounterResponse,
>(
	request: PersistenceCounterQuery,
	options: UsePersistenceCounterQueryOptions< Selected > = {}
) {
	return useEndpointQuery( counterEndpoint, request, options );
}

export function useIncrementCounterMutation< Context = unknown >(
	options: UseIncrementCounterMutationOptions< Context > = {}
) {
	const { onError, onMutate, ...mutationOptions } = options;

	return useEndpointMutation( incrementCounterEndpoint, {
		...mutationOptions,
		invalidate: ( _data, request ) => ( {
			endpoint: counterEndpoint,
			request: {
				postId: request.postId,
				resourceKey: request.resourceKey,
			},
		} ),
		onError: async ( error, request, client, context ) => {
			if ( context?.previous ) {
				client.setData(
					counterEndpoint,
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
			} satisfies PersistenceCounterQuery;
			const previous = client.getData( counterEndpoint, queryRequest );

			if ( previous !== undefined ) {
				client.setData( counterEndpoint, queryRequest, ( current ) => {
					if ( ! current ) {
						return current;
					}

					return {
						...current,
						count: Math.max(
							0,
							current.count + ( request.delta ?? 1 )
						),
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
					client.setData( counterEndpoint, queryRequest, previous );
				}
				throw error;
			}

			return {
				previous,
				userContext,
			};
		},
	} );
}
