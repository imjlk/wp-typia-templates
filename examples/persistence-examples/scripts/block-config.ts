import { defineEndpointManifest } from '@wp-typia/create/metadata-core';

export const BLOCKS = [
	{
		apiTypesFile: 'src/blocks/counter/api-types.ts',
		attributeTypeName: 'PersistenceCounterAttributes',
		restManifest: defineEndpointManifest( {
			contracts: {
				'counter-query': {
					sourceTypeName: 'PersistenceCounterQuery',
				},
				'increment-request': {
					sourceTypeName: 'PersistenceCounterIncrementRequest',
				},
				'counter-response': {
					sourceTypeName: 'PersistenceCounterResponse',
				},
			},
			endpoints: [
				{
					auth: 'public',
					method: 'GET',
					operationId: 'getPersistenceCounterState',
					path: '/persistence-examples/v1/counter',
					queryContract: 'counter-query',
					responseContract: 'counter-response',
					summary: 'Read the current counter state.',
					tags: [ 'Counter' ],
				},
				{
					auth: 'public-write-protected',
					bodyContract: 'increment-request',
					method: 'POST',
					operationId: 'incrementPersistenceCounterState',
					path: '/persistence-examples/v1/counter',
					responseContract: 'counter-response',
					summary: 'Increment the current counter state.',
					tags: [ 'Counter' ],
					wordpressAuth: {
						mechanism: 'public-signed-token',
					},
				},
			],
			info: {
				title: 'Persistence Counter REST API',
				version: '1.0.0',
			},
		} ),
		openApiFile: 'src/blocks/counter/api.openapi.json',
		slug: 'counter',
		typesFile: 'src/blocks/counter/types.ts',
	},
	{
		apiTypesFile: 'src/blocks/like-button/api-types.ts',
		attributeTypeName: 'PersistenceLikeButtonAttributes',
		restManifest: defineEndpointManifest( {
			contracts: {
				'like-status-query': {
					sourceTypeName: 'PersistenceLikeStatusQuery',
				},
				'toggle-like-request': {
					sourceTypeName: 'PersistenceToggleLikeRequest',
				},
				'like-status-response': {
					sourceTypeName: 'PersistenceLikeStatusResponse',
				},
			},
			endpoints: [
				{
					auth: 'public',
					method: 'GET',
					operationId: 'getPersistenceLikeStatus',
					path: '/persistence-examples/v1/likes',
					queryContract: 'like-status-query',
					responseContract: 'like-status-response',
					summary: 'Read the current like status.',
					tags: [ 'Like Button' ],
				},
				{
					auth: 'authenticated',
					bodyContract: 'toggle-like-request',
					method: 'POST',
					operationId: 'togglePersistenceLikeStatus',
					path: '/persistence-examples/v1/likes',
					responseContract: 'like-status-response',
					summary: 'Toggle the current like status.',
					tags: [ 'Like Button' ],
					wordpressAuth: {
						mechanism: 'rest-nonce',
					},
				},
			],
			info: {
				title: 'Persistence Like Button REST API',
				version: '1.0.0',
			},
		} ),
		openApiFile: 'src/blocks/like-button/api.openapi.json',
		slug: 'like-button',
		typesFile: 'src/blocks/like-button/types.ts',
	},
] as const;
