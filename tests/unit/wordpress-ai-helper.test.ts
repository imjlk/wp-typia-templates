import { describe, expect, test } from 'bun:test';

import type { JsonSchemaDocument } from '@wp-typia/create';

import counterQuerySchema from '../../examples/persistence-examples/src/blocks/counter/api-schemas/counter-query.schema.json';
import counterResponseSchema from '../../examples/persistence-examples/src/blocks/counter/api-schemas/counter-response.schema.json';
import incrementRequestSchema from '../../examples/persistence-examples/src/blocks/counter/api-schemas/increment-request.schema.json';
import counterResponseAiSchema from '../../examples/persistence-examples/src/blocks/counter/wordpress-ai/counter-response.ai.schema.json';
import { BLOCKS } from '../../examples/persistence-examples/scripts/block-config';
import {
	COUNTER_ABILITY_CATEGORY,
	COUNTER_WORDPRESS_ABILITY_CONFIG,
} from '../../examples/persistence-examples/scripts/wordpress-ai-projections';
import {
	buildWordPressAiArtifacts,
	buildWordPressAbilitiesDocument,
	projectWordPressAiSchema,
} from '../../packages/create/src/internal/wordpress-ai';

const counterManifest = BLOCKS.find( ( block ) => block.slug === 'counter' )
	?.restManifest;
type ProjectableSchemaDocument = JsonSchemaDocument & Record< string, unknown >;

const counterQuerySchemaDocument =
	counterQuerySchema as ProjectableSchemaDocument;
const counterResponseSchemaDocument =
	counterResponseSchema as ProjectableSchemaDocument;
const incrementRequestSchemaDocument =
	incrementRequestSchema as ProjectableSchemaDocument;
const counterResponseAiSchemaDocument =
	counterResponseAiSchema as ProjectableSchemaDocument;
const inputSchemas = {
	'counter-query': counterQuerySchemaDocument,
	'increment-request': incrementRequestSchemaDocument,
} as const;

describe( 'WordPress AI internal helper', () => {
	test( 'projects canonical JSON Schema documents with the ai-structured-output profile', () => {
		expect(
			projectWordPressAiSchema( counterResponseSchemaDocument )
		).toEqual( counterResponseAiSchemaDocument );
	} );

	test( 'builds abilities documents from endpoint manifests with projected input and output schemas', async () => {
		expect( counterManifest ).toBeDefined();

		const abilitiesDocument = await buildWordPressAbilitiesDocument( {
			abilityConfig: COUNTER_WORDPRESS_ABILITY_CONFIG,
			category: COUNTER_ABILITY_CATEGORY,
			generatedFrom: {
				blockSlug: 'counter',
				responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
				schemaProfile: 'ai-structured-output',
			},
			loadInputSchema: async ( _endpoint, contractName ) => {
				const schema = inputSchemas[ contractName as keyof typeof inputSchemas ];
				if ( ! schema ) {
					throw new Error( `Unexpected contract "${ contractName }".` );
				}

				return schema;
			},
			manifest: counterManifest!,
				outputSchema: counterResponseAiSchemaDocument,
			} );

		expect( abilitiesDocument.category ).toEqual( COUNTER_ABILITY_CATEGORY );
		expect( abilitiesDocument.abilities ).toHaveLength( 2 );

		expect( abilitiesDocument.abilities ).toEqual( [
			expect.objectContaining( {
				authIntent: 'public',
				authMode: 'public-read',
				category: COUNTER_ABILITY_CATEGORY.id,
				method: 'GET',
				operationId: 'getPersistenceCounterState',
				outputSchema: counterResponseAiSchemaDocument,
				path: '/persistence-examples/v1/counter',
			} ),
			expect.objectContaining( {
				authIntent: 'public-write-protected',
				authMode: 'public-signed-token',
				category: COUNTER_ABILITY_CATEGORY.id,
				method: 'POST',
				operationId: 'incrementPersistenceCounterState',
				outputSchema: counterResponseAiSchemaDocument,
				path: '/persistence-examples/v1/counter',
				wordpressAuth: {
					mechanism: 'public-signed-token',
					publicTokenField: 'publicWriteToken',
				},
			} ),
		] );

		const getAbility = abilitiesDocument.abilities[ 0 ];
		const postAbility = abilitiesDocument.abilities[ 1 ];

		expect( getAbility?.inputSchema ).toEqual(
			projectWordPressAiSchema( counterQuerySchemaDocument )
		);
		expect( postAbility?.inputSchema ).toEqual(
			projectWordPressAiSchema( incrementRequestSchemaDocument )
		);
		expect(
			( postAbility?.inputSchema as { required?: string[] } | null )?.required
		).not.toContain( 'publicWriteToken' );
	} );

	test( 'fails clearly when an endpoint is missing WordPress-only ability metadata', async () => {
		expect( counterManifest ).toBeDefined();

		await expect(
			buildWordPressAbilitiesDocument( {
				abilityConfig: {
					getPersistenceCounterState:
						COUNTER_WORDPRESS_ABILITY_CONFIG.getPersistenceCounterState,
				},
				category: COUNTER_ABILITY_CATEGORY,
				generatedFrom: {
					blockSlug: 'counter',
					responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
					schemaProfile: 'ai-structured-output',
				},
				loadInputSchema: async ( _endpoint, contractName ) => {
					const schema = inputSchemas[ contractName as keyof typeof inputSchemas ];
					if ( ! schema ) {
						throw new Error( `Unexpected contract "${ contractName }".` );
					}

					return schema;
				},
				manifest: counterManifest!,
				outputSchema: counterResponseAiSchemaDocument,
			} )
		).rejects.toThrow(
			'Missing WordPress ability projection config for operationId "incrementPersistenceCounterState".'
		);
	} );

	test( 'fails clearly when ability config category ids drift from the document category', async () => {
		expect( counterManifest ).toBeDefined();

		await expect(
			buildWordPressAbilitiesDocument( {
				abilityConfig: {
					...COUNTER_WORDPRESS_ABILITY_CONFIG,
					getPersistenceCounterState: {
						...COUNTER_WORDPRESS_ABILITY_CONFIG.getPersistenceCounterState,
						categoryId: 'mismatched-category',
					},
				},
				category: COUNTER_ABILITY_CATEGORY,
				generatedFrom: {
					blockSlug: 'counter',
					responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
					schemaProfile: 'ai-structured-output',
				},
				loadInputSchema: async ( _endpoint, contractName ) => {
					const schema = inputSchemas[ contractName as keyof typeof inputSchemas ];
					if ( ! schema ) {
						throw new Error( `Unexpected contract "${ contractName }".` );
					}

					return schema;
				},
				manifest: counterManifest!,
				outputSchema: counterResponseAiSchemaDocument,
			} )
		).rejects.toThrow(
			'Operation "getPersistenceCounterState" uses categoryId "mismatched-category" but document category is "persistence-examples".'
		);
	} );

	test( 'fails clearly when endpoints do not share the same response contract', async () => {
		expect( counterManifest ).toBeDefined();

		await expect(
			buildWordPressAiArtifacts( {
				abilityConfig: COUNTER_WORDPRESS_ABILITY_CONFIG,
				category: COUNTER_ABILITY_CATEGORY,
				generatedFrom: {
					blockSlug: 'counter',
					responseSchemaPath: 'wordpress-ai/counter-response.ai.schema.json',
					schemaProfile: 'ai-structured-output',
				},
				loadInputSchema: async ( _endpoint, contractName ) => {
					const schema = inputSchemas[ contractName as keyof typeof inputSchemas ];
					if ( ! schema ) {
						throw new Error( `Unexpected contract "${ contractName }".` );
					}

					return schema;
				},
				manifest: {
					...counterManifest!,
					contracts: {
						...counterManifest!.contracts,
						'alt-counter-response': {
							sourceTypeName: 'PersistenceCounterResponse',
						},
					},
					endpoints: counterManifest!.endpoints.map( ( endpoint, index ) =>
						index === 0
							? endpoint
							: {
									...endpoint,
									responseContract: 'alt-counter-response',
							  }
					),
				},
				responseSchema: counterResponseSchemaDocument,
			} )
		).rejects.toThrow(
			'Endpoint "incrementPersistenceCounterState" uses response contract "alt-counter-response" but expected shared response contract "counter-response".'
		);
	} );
} );
