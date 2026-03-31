/* eslint-disable no-console */
import { syncTypeSchemas } from '@wp-typia/create/metadata-core';

const CONTRACTS = [
	{
		baseName: 'counter-query',
		sourceTypeName: 'MyTypiaBlockCounterQuery',
	},
	{
		baseName: 'increment-request',
		sourceTypeName: 'MyTypiaBlockIncrementRequest',
	},
	{
		baseName: 'counter-response',
		sourceTypeName: 'MyTypiaBlockCounterResponse',
	},
] as const;

async function main() {
	for ( const contract of CONTRACTS ) {
		await syncTypeSchemas( {
			jsonSchemaFile: `src/api-schemas/${ contract.baseName }.schema.json`,
			openApiFile: `src/api-schemas/${ contract.baseName }.openapi.json`,
			sourceTypeName: contract.sourceTypeName,
			typesFile: 'src/api-types.ts',
		} );
	}

	console.log( '✅ REST contract schemas generated from TypeScript types!' );
}

main().catch( ( error ) => {
	console.error( '❌ REST contract sync failed:', error );
	process.exit( 1 );
} );
