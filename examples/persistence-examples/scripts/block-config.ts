export const BLOCKS = [
	{
		apiTypesFile: 'src/blocks/counter/api-types.ts',
		attributeTypeName: 'PersistenceCounterAttributes',
		contracts: [
			{
				baseName: 'counter-query',
				sourceTypeName: 'PersistenceCounterQuery',
			},
			{
				baseName: 'increment-request',
				sourceTypeName: 'PersistenceCounterIncrementRequest',
			},
			{
				baseName: 'counter-response',
				sourceTypeName: 'PersistenceCounterResponse',
			},
		],
		endpoints: [
			{
				authMode: 'public-read',
				method: 'GET',
				operationId: 'getPersistenceCounterState',
				path: '/persistence-examples/v1/counter',
				queryContract: 'counter-query',
				responseContract: 'counter-response',
				summary: 'Read the current counter state.',
				tags: [ 'Counter' ],
			},
			{
				authMode: 'public-signed-token',
				bodyContract: 'increment-request',
				method: 'POST',
				operationId: 'incrementPersistenceCounterState',
				path: '/persistence-examples/v1/counter',
				responseContract: 'counter-response',
				summary: 'Increment the current counter state.',
				tags: [ 'Counter' ],
			},
		],
		openApiFile: 'src/blocks/counter/api.openapi.json',
		openApiInfo: {
			title: 'Persistence Counter REST API',
			version: '1.0.0',
		},
		slug: 'counter',
		typesFile: 'src/blocks/counter/types.ts',
	},
	{
		apiTypesFile: 'src/blocks/like-button/api-types.ts',
		attributeTypeName: 'PersistenceLikeButtonAttributes',
		contracts: [
			{
				baseName: 'like-status-query',
				sourceTypeName: 'PersistenceLikeStatusQuery',
			},
			{
				baseName: 'toggle-like-request',
				sourceTypeName: 'PersistenceToggleLikeRequest',
			},
			{
				baseName: 'like-status-response',
				sourceTypeName: 'PersistenceLikeStatusResponse',
			},
		],
		endpoints: [
			{
				authMode: 'public-read',
				method: 'GET',
				operationId: 'getPersistenceLikeStatus',
				path: '/persistence-examples/v1/likes',
				queryContract: 'like-status-query',
				responseContract: 'like-status-response',
				summary: 'Read the current like status.',
				tags: [ 'Like Button' ],
			},
			{
				authMode: 'authenticated-rest-nonce',
				bodyContract: 'toggle-like-request',
				method: 'POST',
				operationId: 'togglePersistenceLikeStatus',
				path: '/persistence-examples/v1/likes',
				responseContract: 'like-status-response',
				summary: 'Toggle the current like status.',
				tags: [ 'Like Button' ],
			},
		],
		openApiFile: 'src/blocks/like-button/api.openapi.json',
		openApiInfo: {
			title: 'Persistence Like Button REST API',
			version: '1.0.0',
		},
		slug: 'like-button',
		typesFile: 'src/blocks/like-button/types.ts',
	},
] as const;
