import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dir, '..', '..');

function readJson(relativePath: string): Record<string, unknown> {
	return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')) as Record<string, unknown>;
}

describe('repository DX baseline', () => {
	test('root package scripts expose maintainer aggregate commands', () => {
		const packageJson = readJson('package.json');
		const scripts = packageJson.scripts as Record<string, string>;

		expect(scripts['lint:repo']).toBeDefined();
		expect(scripts['lint:all']).toBeDefined();
		expect(scripts['format:check']).toBeDefined();
		expect(scripts['test:all']).toBeDefined();
		expect(scripts['ci:local']).toBeDefined();
	});

	test('root ESLint scope stays on repo infrastructure while examples keep wp-scripts ownership', () => {
		const packageJson = readJson('package.json');
		const scripts = packageJson.scripts as Record<string, string>;
		const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.mjs'), 'utf8');

		expect(eslintConfig).toContain('scripts/**/*');
		expect(eslintConfig).toContain('tests/**/*');
		expect(eslintConfig).toContain('examples/**');
		expect(scripts['examples:lint']).toContain('ESLINT_USE_FLAT_CONFIG=false');
	});

	test('.vscode workspace baseline exists', () => {
		expect(fs.existsSync(path.join(repoRoot, '.vscode', 'extensions.json'))).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, '.vscode', 'settings.json'))).toBe(true);
	});

	test('docs explain lint ownership and ci:local guidance', () => {
		const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
		const contributing = fs.readFileSync(path.join(repoRoot, 'CONTRIBUTING.md'), 'utf8');

		expect(readme).toContain('bun run ci:local');
		expect(readme).toContain('Root ESLint covers repository infrastructure code');
		expect(contributing).toContain('Linting ownership is intentionally split');
		expect(contributing).toContain('bun run lint:repo');
	});
});
