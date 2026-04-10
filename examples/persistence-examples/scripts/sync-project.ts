/* eslint-disable no-console */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface SyncCliOptions {
	check: boolean;
}

function parseCliOptions( argv: string[] ): SyncCliOptions {
	const options: SyncCliOptions = {
		check: false,
	};

	for ( const argument of argv ) {
		if ( argument === '--check' ) {
			options.check = true;
			continue;
		}

		throw new Error( `Unknown sync flag: ${ argument }` );
	}

	return options;
}

function getLocalTsxBinary() {
	const projectDir = process.cwd();
	const binaryName = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';
	const binaryPath = path.join(
		projectDir,
		'node_modules',
		'.bin',
		binaryName
	);

	if ( ! fs.existsSync( binaryPath ) ) {
		throw new Error(
			`Missing local tsx binary at ${ binaryPath }. Run the project install step first.`
		);
	}

	return binaryPath;
}

function runSyncScript( scriptPath: string, options: SyncCliOptions ) {
	const args = [ scriptPath ];
	if ( options.check ) {
		args.push( '--check' );
	}

	execFileSync( getLocalTsxBinary(), args, {
		cwd: process.cwd(),
		stdio: 'inherit',
	} );
}

const options = parseCliOptions( process.argv.slice( 2 ) );
const projectDir = process.cwd();

runSyncScript(
	path.join( projectDir, 'scripts', 'sync-types-to-block-json.ts' ),
	options
);
runSyncScript(
	path.join( projectDir, 'scripts', 'sync-rest-contracts.ts' ),
	options
);

console.log(
	options.check
		? 'Verified metadata and REST artifacts through sync --check.'
		: 'Refreshed metadata and REST artifacts through sync.'
);
