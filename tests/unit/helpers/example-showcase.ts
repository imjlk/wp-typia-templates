import { execSync } from 'node:child_process';
import * as path from 'node:path';

const EXAMPLE_DIR = path.join(import.meta.dir, '../../../examples/my-typia-block');

let exampleSynced = false;

export function getExampleShowcaseDir(): string {
	return EXAMPLE_DIR;
}

export function ensureExampleShowcaseSynced(): void {
	if (exampleSynced) {
		return;
	}

	execSync('bun run sync-types', {
		cwd: EXAMPLE_DIR,
		stdio: 'inherit',
	});

	exampleSynced = true;
}
