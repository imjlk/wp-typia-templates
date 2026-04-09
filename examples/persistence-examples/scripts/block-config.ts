import { defineEndpointManifest } from '@wp-typia/block-runtime/metadata-core';

export const BLOCKS = [
	{
		apiTypesFile: 'src/blocks/counter/api-types.ts',
		attributeTypeName: 'PersistenceCounterAttributes',
		restManifest: defineEndpointManifest( {
			contracts: {
				'counter-query': {
					sourceTypeName: 'PersistenceCounterQuery',
				},
				'counter-bootstrap-query': {
					sourceTypeName: 'PersistenceCounterBootstrapQuery',
				},
				'increment-request': {
					sourceTypeName: 'PersistenceCounterIncrementRequest',
				},
				'counter-bootstrap-response': {
					sourceTypeName: 'PersistenceCounterBootstrapResponse',
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
				{
					auth: 'public',
					method: 'GET',
					operationId: 'getPersistenceCounterBootstrap',
					path: '/persistence-examples/v1/counter/bootstrap',
					queryContract: 'counter-bootstrap-query',
					responseContract: 'counter-bootstrap-response',
					summary: 'Read fresh counter write bootstrap state for the current viewer.',
					tags: [ 'Counter' ],
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
				'like-bootstrap-query': {
					sourceTypeName: 'PersistenceLikeBootstrapQuery',
				},
				'toggle-like-request': {
					sourceTypeName: 'PersistenceToggleLikeRequest',
				},
				'like-bootstrap-response': {
					sourceTypeName: 'PersistenceLikeBootstrapResponse',
				},
				'like-status-response': {
					sourceTypeName: 'PersistenceLikeStatusResponse',
				},
				'toggle-like-response': {
					sourceTypeName: 'PersistenceToggleLikeResponse',
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
					responseContract: 'toggle-like-response',
					summary: 'Toggle the current like status.',
					tags: [ 'Like Button' ],
					wordpressAuth: {
						mechanism: 'rest-nonce',
					},
				},
				{
					auth: 'public',
					method: 'GET',
					operationId: 'getPersistenceLikeBootstrap',
					path: '/persistence-examples/v1/likes/bootstrap',
					queryContract: 'like-bootstrap-query',
					responseContract: 'like-bootstrap-response',
					summary: 'Read fresh viewer-aware like bootstrap state.',
					tags: [ 'Like Button' ],
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
