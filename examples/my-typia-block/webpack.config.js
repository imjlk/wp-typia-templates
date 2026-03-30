const fs = require( 'fs' );
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

const METADATA_FILENAMES = new Set( [
	'block.json',
	'render.php',
	'typia.manifest.json',
	'typia-validator.php',
	'typia-migration-registry.php',
] );

class MetadataAssetPlugin {
	apply( compiler ) {
		compiler.hooks.thisCompilation.tap(
			'MetadataAssetPlugin',
			( compilation ) => {
				compilation.hooks.processAssets.tap(
					{
						name: 'MetadataAssetPlugin',
						stage: compiler.webpack.Compilation
							.PROCESS_ASSETS_STAGE_ADDITIONS,
					},
					() => {
						for ( const entry of getMetadataEntries() ) {
							if ( compilation.getAsset( entry.outputPath ) ) {
								continue;
							}

							compilation.emitAsset(
								entry.outputPath,
								new compiler.webpack.sources.RawSource(
									fs.readFileSync( entry.inputPath )
								)
							);
						}
					}
				);
			}
		);
	}
}

function getMetadataEntries() {
	const entries = [];

	for ( const filename of METADATA_FILENAMES ) {
		const rootFilePath = path.resolve( process.cwd(), filename );
		if ( fs.existsSync( rootFilePath ) ) {
			entries.push( {
				inputPath: rootFilePath,
				outputPath: filename,
			} );
		}
	}

	const srcDir = path.resolve( process.cwd(), 'src' );
	if ( ! fs.existsSync( srcDir ) ) {
		return entries;
	}

	for ( const inputPath of findMetadataFiles( srcDir ) ) {
		entries.push( {
			inputPath,
			outputPath: path.relative( srcDir, inputPath ),
		} );
	}

	return entries;
}

function findMetadataFiles( directory ) {
	const metadataFiles = [];

	for ( const entry of fs.readdirSync( directory, {
		withFileTypes: true,
	} ) ) {
		const entryPath = path.join( directory, entry.name );

		if ( entry.isDirectory() ) {
			metadataFiles.push( ...findMetadataFiles( entryPath ) );
			continue;
		}
		if ( entry.isFile() && METADATA_FILENAMES.has( entry.name ) ) {
			metadataFiles.push( entryPath );
		}
	}

	return metadataFiles;
}

module.exports = async () => {
	const { default: UnpluginTypia } = await import(
		'@typia/unplugin/webpack'
	);

	return {
		...defaultConfig,
		resolve: {
			...( defaultConfig.resolve || {} ),
			alias: {
				...( defaultConfig.resolve?.alias || {} ),
				'@wp-typia/create/runtime/defaults': path.resolve(
					process.cwd(),
					'../../packages/create/src/runtime/defaults.ts'
				),
				'@wp-typia/create/runtime/validation': path.resolve(
					process.cwd(),
					'../../packages/create/src/runtime/validation.ts'
				),
			},
		},
		plugins: [
			UnpluginTypia(),
			...( defaultConfig.plugins || [] ),
			new MetadataAssetPlugin(),
		],
	};
};
