#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FORMATTING_TOOLCHAIN_POLICY = Object.freeze({
  eslintConfigPrettierVersion: '10.1.8',
  prettierVersion: '3.8.2',
  rootFormatCheckScript: 'node scripts/check-repo-format.mjs',
  rootPolicyValidateScript:
    'node scripts/validate-formatting-toolchain-policy.mjs',
  generatedPackageManifestPaths: Object.freeze([
    'packages/wp-typia-project-tools/templates/_shared/base/package.json.mustache',
    'packages/wp-typia-project-tools/templates/_shared/persistence/core/package.json.mustache',
    'packages/wp-typia-project-tools/templates/interactivity/package.json.mustache',
    'packages/wp-typia-project-tools/templates/_shared/compound/core/package.json.mustache',
    'packages/wp-typia-project-tools/templates/_shared/compound/persistence/package.json.mustache',
  ]),
  workspaceExamplePackagePaths: Object.freeze([
    'examples/api-contract-adapter-poc/package.json',
    'examples/my-typia-block/package.json',
    'examples/persistence-examples/package.json',
    'examples/compound-patterns/package.json',
  ]),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readRelativeJson(repoRoot, relativePath) {
  return readJsonFile(path.join(repoRoot, relativePath));
}

function readRelativeText(repoRoot, relativePath) {
  return readTextFile(path.join(repoRoot, relativePath));
}

function validateGeneratedTemplateManifest(
  relativePath,
  sourceText,
  expectedVersion,
  errors,
) {
  const manifest = JSON.parse(sourceText);
  const devDependencyPrettier = manifest.devDependencies?.prettier;

  if (devDependencyPrettier === undefined) {
    errors.push(
      `${relativePath} must declare devDependencies.prettier="${expectedVersion}".`,
    );
    return;
  }

  if (devDependencyPrettier !== expectedVersion) {
    errors.push(
      `${relativePath} must declare devDependencies.prettier="${expectedVersion}", found ${JSON.stringify(devDependencyPrettier)}.`,
    );
  }
}

function getLintJobBlock(workflowSource) {
  const lines = workflowSource.split('\n');
  const startIndex = lines.findIndex((line) => line === '  lint:');

  if (startIndex < 0) {
    return '';
  }

  const lintBlockLines = [];

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (index > startIndex && /^ {2}[A-Za-z0-9_-]+:/.test(line)) {
      break;
    }
    lintBlockLines.push(line);
  }

  return lintBlockLines.join('\n');
}

export function validateFormattingToolchainPolicy(
  repoRoot = DEFAULT_REPO_ROOT,
) {
  const errors = [];
  const packageJson = readRelativeJson(repoRoot, 'package.json');
  const scripts = packageJson.scripts ?? {};
  const devDependencies = packageJson.devDependencies ?? {};
  const policy = FORMATTING_TOOLCHAIN_POLICY;

  if (devDependencies.prettier !== policy.prettierVersion) {
    errors.push(
      `package.json must declare devDependencies.prettier="${policy.prettierVersion}", found ${JSON.stringify(devDependencies.prettier ?? null)}.`,
    );
  }

  if (
    devDependencies['eslint-config-prettier'] !==
    policy.eslintConfigPrettierVersion
  ) {
    errors.push(
      `package.json must declare devDependencies.eslint-config-prettier="${policy.eslintConfigPrettierVersion}", found ${JSON.stringify(devDependencies['eslint-config-prettier'] ?? null)}.`,
    );
  }

  if (scripts['format:check'] !== policy.rootFormatCheckScript) {
    errors.push(
      `package.json must keep scripts["format:check"]="${policy.rootFormatCheckScript}", found ${JSON.stringify(scripts['format:check'] ?? null)}.`,
    );
  }

  if (
    scripts['formatting-policy:validate'] !== policy.rootPolicyValidateScript
  ) {
    errors.push(
      `package.json must keep scripts["formatting-policy:validate"]="${policy.rootPolicyValidateScript}", found ${JSON.stringify(scripts['formatting-policy:validate'] ?? null)}.`,
    );
  }

  const ciLocal =
    typeof scripts['ci:local'] === 'string' ? scripts['ci:local'] : '';
  for (const requiredCommand of [
    'bun run formatting-policy:validate',
    'bun run format:check',
  ]) {
    if (!ciLocal.includes(requiredCommand)) {
      errors.push(
        `package.json must include "${requiredCommand}" in scripts["ci:local"].`,
      );
    }
  }

  for (const relativePath of policy.workspaceExamplePackagePaths) {
    const examplePackageJson = readRelativeJson(repoRoot, relativePath);
    const examplePrettier = examplePackageJson.devDependencies?.prettier;

    if (examplePrettier !== policy.prettierVersion) {
      errors.push(
        `${relativePath} must declare devDependencies.prettier="${policy.prettierVersion}", found ${JSON.stringify(examplePrettier ?? null)}.`,
      );
    }
  }

  for (const relativePath of policy.generatedPackageManifestPaths) {
    validateGeneratedTemplateManifest(
      relativePath,
      readRelativeText(repoRoot, relativePath),
      policy.prettierVersion,
      errors,
    );
  }

  const lintJobBlock = getLintJobBlock(
    readRelativeText(repoRoot, '.github/workflows/ci.yml'),
  );
  for (const requiredRunLine of [
    'run: bun run formatting-policy:validate',
    'run: bun run format:check',
  ]) {
    if (!lintJobBlock.includes(requiredRunLine)) {
      errors.push(
        `.github/workflows/ci.yml lint job must include "${requiredRunLine}".`,
      );
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

export function runCli({
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const result = validateFormattingToolchainPolicy(cwd);

  if (!result.valid) {
    stderr.write('Invalid formatting/toolchain policy detected:\n');
    for (const error of result.errors) {
      stderr.write(`- ${error}\n`);
    }
    return 1;
  }

  stdout.write('Validated formatting/toolchain policy.\n');
  return 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';

if (invokedPath === __filename) {
  process.exitCode = runCli();
}
