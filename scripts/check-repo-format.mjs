import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(import.meta.dirname, '..');

function resolvePrettierBin() {
  const tryResolve = (candidate) => {
    try {
      return require.resolve(candidate);
    } catch {
      return null;
    }
  };

  for (const candidate of [
    'prettier/bin/prettier.cjs',
    'prettier/bin-prettier.js',
  ]) {
    const resolved = tryResolve(candidate);
    if (resolved) {
      return resolved;
    }
  }

  throw new Error(
    'Unable to resolve the Prettier CLI entrypoint for the configured formatter baseline.',
  );
}

const prettierBin = resolvePrettierBin();
const prettierMode = process.argv.includes('--write') ? '--write' : '--check';

const patterns = [
  'README.md',
  'CONTRIBUTING.md',
  'UPGRADE.md',
  'SECURITY.md',
  'docs/**/*.md',
  'examples/EXAMPLES.md',
  'packages/*/README.md',
  'package.json',
  'composer.json',
  'prettier.config.mjs',
  'eslint.config.mjs',
  'playwright.config.ts',
  'typedoc.json',
  'tsconfig.json',
  'tsconfig.base.json',
  '.vscode/*.json',
  '.github/**/*.md',
  '.github/**/*.yml',
  '.sampo/changesets/*.md',
  'scripts/check-repo-format.mjs',
  'scripts/validate-formatting-toolchain-policy.mjs',
];

const ignoredFiles = new Set(['docs/API.md']);

function shouldIgnoreFile(filePath) {
  return ignoredFiles.has(filePath) || filePath.startsWith('docs/api/');
}

const files = [
  ...new Set(
    patterns.flatMap((pattern) =>
      globSync(pattern, { cwd: repoRoot, nodir: true }),
    ),
  ),
].filter((filePath) => !shouldIgnoreFile(filePath));

if (files.length === 0) {
  console.log('No repo-format files matched.');
  process.exit(0);
}

execFileSync(process.execPath, [prettierBin, prettierMode, ...files], {
  cwd: repoRoot,
  stdio: 'inherit',
});
