/* eslint-disable no-console */
import path from 'node:path';

import { syncBlockMetadata } from '@wp-typia/create/metadata-core';

import { BLOCKS } from './block-config';

async function main() {
	for ( const block of BLOCKS ) {
		const baseDir = path.join( 'src', 'blocks', block.slug );
		const result = await syncBlockMetadata( {
			blockJsonFile: path.join( baseDir, 'block.json' ),
			jsonSchemaFile: path.join( baseDir, 'typia.schema.json' ),
			manifestFile: path.join( baseDir, 'typia.manifest.json' ),
			openApiFile: path.join( baseDir, 'typia.openapi.json' ),
			sourceTypeName: block.attributeTypeName,
			typesFile: block.typesFile,
		} );

		console.log(
			`✅ ${ block.slug }: block.json, typia.manifest.json, typia-validator.php, typia.schema.json, and typia.openapi.json were generated from TypeScript types!`
		);
		console.log( '📝 Generated attributes:', result.attributeNames );
	}
}

main().catch( ( error ) => {
	console.error( '❌ Type sync failed:', error );
	process.exit( 1 );
} );
