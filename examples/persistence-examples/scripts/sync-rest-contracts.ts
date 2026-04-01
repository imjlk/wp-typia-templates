/* eslint-disable no-console */
import path from 'node:path';

import {
	syncRestOpenApi,
	syncTypeSchemas,
} from '@wp-typia/create/metadata-core';

import { BLOCKS } from './block-config';

async function main() {
	for ( const block of BLOCKS ) {
		for ( const contract of block.contracts ) {
			await syncTypeSchemas( {
				jsonSchemaFile: path.join(
					'src',
					'blocks',
					block.slug,
					'api-schemas',
					`${ contract.baseName }.schema.json`
				),
				openApiFile: path.join(
					'src',
					'blocks',
					block.slug,
					'api-schemas',
					`${ contract.baseName }.openapi.json`
				),
				sourceTypeName: contract.sourceTypeName,
				typesFile: block.apiTypesFile,
			} );
		}

		await syncRestOpenApi( {
			contracts: Object.fromEntries(
				block.contracts.map( ( contract ) => [
					contract.baseName,
					{
						sourceTypeName: contract.sourceTypeName,
					},
				] )
			),
			endpoints: block.endpoints,
			openApiFile: block.openApiFile,
			openApiInfo: block.openApiInfo,
			typesFile: block.apiTypesFile,
		} );
	}

	console.log( '✅ REST contract schemas and endpoint-aware OpenAPI documents generated from TypeScript types!' );
}

main().catch( ( error ) => {
	console.error( '❌ REST contract sync failed:', error );
	process.exit( 1 );
} );
