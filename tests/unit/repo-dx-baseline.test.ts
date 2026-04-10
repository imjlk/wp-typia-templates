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
		expect(scripts['examples:build']).toBe('node scripts/run-clean-examples-build.mjs');
	});

	test('root ESLint scope stays on repo infrastructure while examples keep wp-scripts ownership', () => {
		const packageJson = readJson('package.json');
		const scripts = packageJson.scripts as Record<string, string>;
		const eslintConfig = fs.readFileSync(path.join(repoRoot, 'eslint.config.mjs'), 'utf8');

		expect(eslintConfig).toContain('scripts/**/*');
		expect(eslintConfig).toContain('tests/**/*');
		expect(eslintConfig).toMatch(/const repoIgnores = \[[\s\S]*["']examples\/\*\*["']/);
		expect(scripts).toHaveProperty('examples:lint');
		expect(scripts['examples:lint']).toContain('ESLINT_USE_FLAT_CONFIG=false');
	});

	test('.vscode workspace baseline exists', () => {
		expect(fs.existsSync(path.join(repoRoot, '.vscode', 'extensions.json'))).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, '.vscode', 'settings.json'))).toBe(true);
	});

	test('repo meta docs and GitHub templates exist', () => {
		expect(fs.existsSync(path.join(repoRoot, 'UPGRADE.md'))).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, 'SECURITY.md'))).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'))).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'bug-report.yml'))).toBe(
			true,
		);
		expect(
			fs.existsSync(path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'feature-request.yml')),
		).toBe(true);
		expect(
			fs.existsSync(path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'docs-process.yml')),
		).toBe(true);
		expect(fs.existsSync(path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'config.yml'))).toBe(
			true,
		);
	});

	test('example build cleanliness guard exists', () => {
		const guardScript = fs.readFileSync(
			path.join(repoRoot, 'scripts', 'run-clean-examples-build.mjs'),
			'utf8',
		);

		expect(guardScript).toContain('git');
		expect(guardScript).toContain('Example builds modified files under examples/.');
	});

	test('docs explain lint ownership and ci:local guidance', () => {
		const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
		const contributing = fs.readFileSync(path.join(repoRoot, 'CONTRIBUTING.md'), 'utf8');
		const cliReadme = fs.readFileSync(path.join(repoRoot, 'packages', 'wp-typia', 'README.md'), 'utf8');

		expect(readme).toContain('bun run ci:local');
		expect(readme).toContain('Root ESLint covers repository infrastructure code');
		expect(readme).toContain('## Who this is for');
		expect(readme).toContain('[Upgrade Guide](UPGRADE.md)');
		expect(readme).toContain('[Security Policy](SECURITY.md)');
		expect(contributing).toContain('Linting ownership is intentionally split');
		expect(contributing).toContain('bun run lint:repo');
		expect(contributing).toContain('## Project meta docs');
		expect(contributing).toContain('[`UPGRADE.md`](./UPGRADE.md)');
		expect(contributing).toContain('[`SECURITY.md`](./SECURITY.md)');
		expect(cliReadme).toMatch(
			/https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/UPGRADE\.md/,
		);
		expect(cliReadme).toMatch(
			/https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/SECURITY\.md/,
		);
	});
});
