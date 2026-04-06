import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
	EndpointManifestDefinition,
	EndpointManifestEndpointDefinition,
} from '@wp-typia/block-runtime/metadata-core';
import type { JsonSchemaDocument } from '../../../packages/wp-typia-block-runtime/src/schema-core';
import {
	buildWordPressAiArtifacts,
	type ProjectedWordPressAbilitiesDocument,
	type WordPressAbilityProjectionConfig,
	type WordPressAiInputSchemaTransformContext,
} from '../../../packages/create/src/internal/wordpress-ai';

import { BLOCKS } from './block-config';
export type {
	ProjectedWordPressAbilitiesDocument,
	ProjectedWordPressAbilityDefinition,
	WordPressAbilityProjectionConfig,
} from '../../../packages/create/src/internal/wordpress-ai';

const WORDPRESS_AI_ROOT = 'wordpress-ai';

export const COUNTER_AI_RESPONSE_SCHEMA_RELATIVE_PATH = path.join(
	WORDPRESS_AI_ROOT,
	'counter-response.ai.schema.json'
);

export const COUNTER_ABILITIES_RELATIVE_PATH = path.join(
	WORDPRESS_AI_ROOT,
	'counter.abilities.json'
);

export const COUNTER_ABILITY_CATEGORY = {
	id: 'persistence-examples',
	label: 'Persistence Examples',
} as const;

export const COUNTER_WORDPRESS_ABILITY_CONFIG: Record<
	string,
	WordPressAbilityProjectionConfig
> = {
	getPersistenceCounterState: {
		annotations: {
			idempotent: true,
			readonly: true,
		},
		categoryId: COUNTER_ABILITY_CATEGORY.id,
		executeCallback: 'persistence_examples_execute_get_counter_ability',
		label: 'Get Counter State',
		permissionCallback: 'persistence_examples_can_read_counter_ability',
		showInRest: true,
	},
	incrementPersistenceCounterState: {
		annotations: {
			destructive: false,
			idempotent: false,
			readonly: false,
		},
		categoryId: COUNTER_ABILITY_CATEGORY.id,
		executeCallback:
			'persistence_examples_execute_increment_counter_ability',
		label: 'Increment Counter State',
		permissionCallback:
			'persistence_examples_can_execute_increment_counter_ability',
		showInRest: true,
	},
} as const satisfies Record< string, WordPressAbilityProjectionConfig >;

const SCRIPT_DIR = path.dirname( fileURLToPath( import.meta.url ) );
const EXAMPLE_ROOT = path.resolve( SCRIPT_DIR, '..' );
const COUNTER_BLOCK = ( () => {
	const block = BLOCKS.find( ( candidate ) => candidate.slug === 'counter' );
	if ( ! block ) {
		throw new Error(
			'Could not find the persistence counter block configuration.'
		);
	}

	return block;
} )();

function toAbilityId( operationId: string ): string {
	return `persistence-examples/${ operationId
		.replace( /([a-z0-9])([A-Z])/g, '$1-$2' )
		.toLowerCase() }`;
}

function getBlockArtifactPath(
	blockSlug: string,
	relativePath: string
): string {
	return path.join( EXAMPLE_ROOT, 'src', 'blocks', blockSlug, relativePath );
}

async function loadJsonDocument(
	blockSlug: string,
	relativePath: string
): Promise< JsonSchemaDocument & Record< string, unknown > > {
	const decoded = JSON.parse(
		await readFile(
			getBlockArtifactPath( blockSlug, relativePath ),
			'utf8'
		)
	) as unknown;

	if (
		! decoded ||
		typeof decoded !== 'object' ||
		Array.isArray( decoded )
	) {
		throw new Error(
			`Expected ${ relativePath } to decode to a JSON object.`
		);
	}

	return decoded as JsonSchemaDocument & Record< string, unknown >;
}

function applyCounterAbilityInputSchemaPolicy( {
	endpoint,
	schema,
}: WordPressAiInputSchemaTransformContext ): JsonSchemaDocument &
	Record< string, unknown > {
	if ( endpoint.method !== 'POST' ) {
		return schema;
	}

	const properties =
		schema.properties &&
		typeof schema.properties === 'object' &&
		! Array.isArray( schema.properties )
			? { ...( schema.properties as Record< string, unknown > ) }
			: {};
	const required = Array.isArray( schema.required )
		? [ ...schema.required ]
		: [];
	const postIdSchema =
		properties.postId &&
		typeof properties.postId === 'object' &&
		! Array.isArray( properties.postId )
			? { ...( properties.postId as Record< string, unknown > ) }
			: null;
	const tokenSchema =
		properties.publicWriteToken &&
		typeof properties.publicWriteToken === 'object' &&
		! Array.isArray( properties.publicWriteToken )
			? {
					...( properties.publicWriteToken as Record<
						string,
						unknown
					> ),
			  }
			: null;

	if ( ! postIdSchema || ! tokenSchema ) {
		throw new Error(
			'The increment request schema must define both "postId" and "publicWriteToken" for the WordPress AI overlay.'
		);
	}

	postIdSchema.minimum = 1;
	properties.postId = postIdSchema;
	properties.publicWriteToken = tokenSchema;

	if ( ! required.includes( 'publicWriteToken' ) ) {
		required.push( 'publicWriteToken' );
	}

	return {
		...schema,
		properties,
		required,
	} as JsonSchemaDocument & Record< string, unknown >;
}

export async function buildCounterWordPressAiArtifacts( options?: {
	abilityConfig?: Record< string, WordPressAbilityProjectionConfig >;
	category?: {
		id: string;
		label: string;
	};
	manifest?: EndpointManifestDefinition;
} ): Promise< {
	abilitiesDocument: ProjectedWordPressAbilitiesDocument;
	aiResponseSchema: Record< string, unknown >;
} > {
	const manifest = options?.manifest ?? COUNTER_BLOCK.restManifest;
	const abilityConfig = ( options?.abilityConfig ??
		COUNTER_WORDPRESS_ABILITY_CONFIG ) as Record<
		string,
		WordPressAbilityProjectionConfig
	>;
	const category = options?.category ?? COUNTER_ABILITY_CATEGORY;

	const responseContractName = manifest.endpoints[ 0 ]?.responseContract;
	if ( ! responseContractName ) {
		throw new Error(
			'The counter manifest is missing its shared response contract.'
		);
	}

	const responseSchema = await loadJsonDocument(
		COUNTER_BLOCK.slug,
		path.join( 'api-schemas', `${ responseContractName }.schema.json` )
	);

	return buildWordPressAiArtifacts( {
		abilityConfig,
		buildAbilityId: toAbilityId,
		category,
		generatedFrom: {
			blockSlug: COUNTER_BLOCK.slug,
			responseSchemaPath: COUNTER_AI_RESPONSE_SCHEMA_RELATIVE_PATH,
			schemaProfile: 'ai-structured-output',
		},
		loadInputSchema: async (
			_endpoint: EndpointManifestEndpointDefinition,
			contractName: string
		) =>
			loadJsonDocument(
				COUNTER_BLOCK.slug,
				path.join( 'api-schemas', `${ contractName }.schema.json` )
			),
		manifest,
		responseSchema,
		transformInputSchema: applyCounterAbilityInputSchemaPolicy,
	} );
}

export async function syncCounterWordPressAiArtifacts() {
	const { abilitiesDocument, aiResponseSchema } =
		await buildCounterWordPressAiArtifacts();

	const outputDirectory = getBlockArtifactPath(
		COUNTER_BLOCK.slug,
		WORDPRESS_AI_ROOT
	);
	await mkdir( outputDirectory, {
		recursive: true,
	} );

	await writeFile(
		getBlockArtifactPath(
			COUNTER_BLOCK.slug,
			COUNTER_AI_RESPONSE_SCHEMA_RELATIVE_PATH
		),
		JSON.stringify( aiResponseSchema, null, 2 ) + '\n',
		'utf8'
	);

	await writeFile(
		getBlockArtifactPath(
			COUNTER_BLOCK.slug,
			COUNTER_ABILITIES_RELATIVE_PATH
		),
		JSON.stringify( abilitiesDocument, null, 2 ) + '\n',
		'utf8'
	);
}
