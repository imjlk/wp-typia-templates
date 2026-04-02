/* eslint-disable no-console */
import { syncCounterWordPressAiArtifacts } from './wordpress-ai-projections';

async function main() {
	await syncCounterWordPressAiArtifacts();
	console.log(
		'✅ WordPress AI projection artifacts generated from the persistence counter contracts!'
	);
}

main().catch( ( error ) => {
	console.error( '❌ WordPress AI projection sync failed:', error );
	process.exit( 1 );
} );
