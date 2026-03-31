/* eslint-disable no-console */
import { syncBlockMetadata } from '@wp-typia/create/metadata-core';

async function main() {
	const result = await syncBlockMetadata( {
		blockJsonFile: 'block.json',
		jsonSchemaFile: 'typia.schema.json',
		manifestFile: 'typia.manifest.json',
		openApiFile: 'typia.openapi.json',
		sourceTypeName: 'MyTypiaBlockAttributes',
		typesFile: 'src/types.ts',
	} );

	console.log(
		'✅ block.json, typia.manifest.json, typia-validator.php, typia.schema.json, and typia.openapi.json were generated from TypeScript types!'
	);
	console.log( '📝 Generated attributes:', result.attributeNames );

	if ( result.lossyProjectionWarnings.length > 0 ) {
		console.warn(
			'⚠️ Some Typia constraints were preserved only in typia.manifest.json:'
		);
		for ( const warning of result.lossyProjectionWarnings ) {
			console.warn( `   - ${ warning }` );
		}
	}

	if ( result.phpGenerationWarnings.length > 0 ) {
		console.warn(
			'⚠️ Some Typia constraints are not yet enforced by typia-validator.php:'
		);
		for ( const warning of result.phpGenerationWarnings ) {
			console.warn( `   - ${ warning }` );
		}
	}
}

main().catch( ( error ) => {
	console.error( '❌ Type sync failed:', error );
	process.exit( 1 );
} );
