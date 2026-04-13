import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dir, '..', '..');

function readJson(relativePath: string): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'),
  ) as Record<string, unknown>;
}

describe('repository DX baseline', () => {
  test('root package scripts expose maintainer aggregate commands', () => {
    const packageJson = readJson('package.json');
    const scripts = packageJson.scripts as Record<string, string>;

    expect(scripts['lint:repo']).toBeDefined();
    expect(scripts['lint:all']).toBeDefined();
    expect(scripts['format:check']).toBeDefined();
    expect(scripts['maintenance-automation:validate']).toBe(
      'node scripts/validate-maintenance-automation-policy.mjs',
    );
    expect(scripts['formatting-policy:validate']).toBe(
      'node scripts/validate-formatting-toolchain-policy.mjs',
    );
    expect(scripts['test:all']).toBeDefined();
    expect(scripts['ci:local']).toBeDefined();
    expect(scripts['ci:local']).toContain(
      'bun run maintenance-automation:validate',
    );
    expect(scripts['ci:local']).toContain('bun run formatting-policy:validate');
    expect(scripts['ci:local']).toContain('bun run format:check');
    expect(scripts['typescript-runtime:validate']).toBe(
      'node scripts/validate-typescript-runtime-dependency-placement.mjs',
    );
    expect(scripts['examples:build']).toBe(
      'node scripts/run-clean-examples-build.mjs',
    );
  });

  test('root ESLint scope stays on repo infrastructure while examples keep wp-scripts ownership', () => {
    const packageJson = readJson('package.json');
    const scripts = packageJson.scripts as Record<string, string>;
    const eslintConfig = fs.readFileSync(
      path.join(repoRoot, 'eslint.config.mjs'),
      'utf8',
    );

    expect(eslintConfig).toContain('scripts/**/*');
    expect(eslintConfig).toContain('tests/**/*');
    expect(eslintConfig).toMatch(
      /const repoIgnores = \[[\s\S]*["']examples\/\*\*["']/,
    );
    expect(scripts).toHaveProperty('examples:lint');
    expect(scripts['examples:lint']).toContain('ESLINT_USE_FLAT_CONFIG=false');
  });

  test('.vscode workspace baseline exists', () => {
    expect(
      fs.existsSync(path.join(repoRoot, '.vscode', 'extensions.json')),
    ).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, '.vscode', 'settings.json'))).toBe(
      true,
    );
  });

  test('repo meta docs and GitHub templates exist', () => {
    expect(fs.existsSync(path.join(repoRoot, 'UPGRADE.md'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'SECURITY.md'))).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'formatting-toolchain-policy.md'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'maintenance-automation-policy.md'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'block-generator-architecture.md'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'block-generator-tool-contract.md'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, 'docs', 'external-template-layer-composition.md'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(repoRoot, '.github', 'dependabot.yml')),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, '.github', 'workflows', 'dependency-audit.yml'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md')),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'bug-report.yml'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'feature-request.yml'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'docs-process.yml'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'config.yml'),
      ),
    ).toBe(true);
  });

  test('example build cleanliness guard exists', () => {
    const guardScript = fs.readFileSync(
      path.join(repoRoot, 'scripts', 'run-clean-examples-build.mjs'),
      'utf8',
    );

    expect(guardScript).toContain('git');
    expect(guardScript).toContain(
      'Example builds modified files under examples/.',
    );
  });

  test('docs explain lint ownership and ci:local guidance', () => {
    const readme = fs.readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
    const contributing = fs.readFileSync(
      path.join(repoRoot, 'CONTRIBUTING.md'),
      'utf8',
    );
    const cliReadme = fs.readFileSync(
      path.join(repoRoot, 'packages', 'wp-typia', 'README.md'),
      'utf8',
    );
    const workspaceWebpackTemplate = fs.readFileSync(
      path.join(
        repoRoot,
        'packages',
        'create-workspace-template',
        'webpack.config.js.mustache',
      ),
      'utf8',
    );

    expect(readme).toContain('bun run ci:local');
    expect(readme).toContain(
      '[Block Generator Architecture](docs/block-generator-architecture.md)',
    );
    expect(readme).toContain(
      '[Block Generator Tool Contract](docs/block-generator-tool-contract.md)',
    );
    expect(readme).toContain(
      '[External Template-Layer Composition RFC](docs/external-template-layer-composition.md)',
    );
    expect(readme).toContain(
      'Root ESLint covers repository infrastructure code',
    );
    expect(readme).toContain(
      '[Formatting Toolchain Policy](docs/formatting-toolchain-policy.md)',
    );
    expect(readme).toContain(
      '[Maintenance Automation Policy](docs/maintenance-automation-policy.md)',
    );
    expect(readme).toContain('Prettier 3.8.2');
    expect(readme).toContain('bun run maintenance-automation:validate');
    expect(readme).toContain('bun run formatting-policy:validate');
    expect(readme).toContain('## Who this is for');
    expect(readme).toContain('[Upgrade Guide](UPGRADE.md)');
    expect(readme).toContain('[Security Policy](SECURITY.md)');
    expect(contributing).toContain('Linting ownership is intentionally split');
    expect(contributing).toContain('Formatting ownership is also explicit');
    expect(contributing).toContain('Maintenance automation is explicit too');
    expect(contributing).toContain('bun run lint:repo');
    expect(contributing).toContain('bun run maintenance-automation:validate');
    expect(contributing).toContain('bun run formatting-policy:validate');
    expect(contributing).toContain('## Project meta docs');
    expect(contributing).toContain('[`UPGRADE.md`](./UPGRADE.md)');
    expect(contributing).toContain('[`SECURITY.md`](./SECURITY.md)');
    expect(contributing).toContain(
      '[`docs/block-generator-architecture.md`](./docs/block-generator-architecture.md)',
    );
    expect(contributing).toContain(
      '[`docs/block-generator-tool-contract.md`](./docs/block-generator-tool-contract.md)',
    );
    expect(contributing).toContain(
      '[`docs/external-template-layer-composition.md`](./docs/external-template-layer-composition.md)',
    );
    expect(contributing).toContain(
      '[`docs/formatting-toolchain-policy.md`](./docs/formatting-toolchain-policy.md)',
    );
    expect(contributing).toContain(
      '[`docs/maintenance-automation-policy.md`](./docs/maintenance-automation-policy.md)',
    );
    expect(contributing).toContain('Dependabot');
    expect(contributing).toContain('release/sampo');
    expect(contributing).toContain('## Generated project toolchain matrix');
    expect(contributing).toContain('## TypeScript runtime dependency audit');
    expect(contributing).toContain('`bun run typescript-runtime:validate`');
    expect(contributing).toContain(
      '`@wp-typia/block-runtime` keeps `typescript` in `dependencies`',
    );
    expect(contributing).toContain(
      '`@wp-typia/project-tools` keeps `typescript` in `dependencies`',
    );
    expect(contributing).toContain('`typia` 12.x');
    expect(contributing).toContain('`@wordpress/scripts` 30.x');
    expect(cliReadme).toMatch(
      /https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/UPGRADE\.md/,
    );
    expect(cliReadme).toMatch(
      /https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/SECURITY\.md/,
    );
    expect(workspaceWebpackTemplate).toContain(
      'loadCompatibleTypiaWebpackPlugin',
    );
    expect(workspaceWebpackTemplate).toContain('projectRoot: process.cwd()');
  });
});
