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
		slug: 'like-button',
		typesFile: 'src/blocks/like-button/types.ts',
	},
] as const;
