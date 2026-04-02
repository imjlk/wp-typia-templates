/* eslint-disable no-console */
import path from 'node:path';

import {
	syncRestOpenApi,
	syncTypeSchemas,
} from '@wp-typia/create/metadata-core';

import { BLOCKS } from './block-config';

async function main() {
	for ( const block of BLOCKS ) {
		const contracts = block.restManifest.contracts;

		for ( const [ baseName, contract ] of Object.entries( contracts ) ) {
			await syncTypeSchemas( {
				jsonSchemaFile: path.join(
					'src',
					'blocks',
					block.slug,
					'api-schemas',
					`${ baseName }.schema.json`
				),
				openApiFile: path.join(
					'src',
					'blocks',
					block.slug,
					'api-schemas',
					`${ baseName }.openapi.json`
				),
				sourceTypeName: contract.sourceTypeName,
				typesFile: block.apiTypesFile,
			} );
		}

		await syncRestOpenApi( {
			manifest: block.restManifest,
			openApiFile: block.openApiFile,
			typesFile: block.apiTypesFile,
		} );
	}

	console.log(
		'✅ REST contract schemas and endpoint-aware OpenAPI documents generated from TypeScript types!'
	);
}

main().catch( ( error ) => {
	console.error( '❌ REST contract sync failed:', error );
	process.exit( 1 );
} );
