#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const LINT_CONFIG_FILES = [
  '.eslintrc.js',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  'eslint.config.js',
  '.eslintrc',
];

function hasArg(args, ...candidates) {
  return candidates.some((candidate) => args.includes(candidate));
}

function hasFileArg(args) {
  return args.some((arg) => !arg.startsWith('-'));
}

function hasProjectFile(projectDir, fileName) {
  return fs.existsSync(path.join(projectDir, fileName));
}

function hasPackageProp(projectRequire, propertyName) {
  try {
    const packageJson = projectRequire('./package.json');
    return Object.prototype.hasOwnProperty.call(packageJson, propertyName);
  } catch {
    return false;
  }
}

const projectDir = process.cwd();
const projectRequire = createRequire(path.join(projectDir, 'package.json'));
const args = process.argv.slice(2);

const hasLintConfig =
  hasArg(args, '-c', '--config') ||
  LINT_CONFIG_FILES.some((fileName) => hasProjectFile(projectDir, fileName)) ||
  hasPackageProp(projectRequire, 'eslintConfig');

const wpScriptsPackageJsonPath = projectRequire.resolve(
  '@wordpress/scripts/package.json',
);
const wpScriptsDir = path.dirname(wpScriptsPackageJsonPath);
const eslintPackageJsonPath = projectRequire.resolve('eslint/package.json');
const eslintPackageJson = JSON.parse(
  fs.readFileSync(eslintPackageJsonPath, 'utf8'),
);
const eslintDir = path.dirname(eslintPackageJsonPath);
const eslintBinPath = path.join(
  eslintDir,
  typeof eslintPackageJson.bin === 'string'
    ? eslintPackageJson.bin
    : eslintPackageJson.bin.eslint,
);
const defaultConfigArgs = hasLintConfig
  ? []
  : [
      '--no-eslintrc',
      '--config',
      path.join(wpScriptsDir, 'config', '.eslintrc.js'),
    ];
const defaultIgnoreArgs =
  hasArg(args, '--ignore-path') || hasProjectFile(projectDir, '.eslintignore')
    ? []
    : ['--ignore-path', path.join(wpScriptsDir, 'config', '.eslintignore')];
const defaultExtArgs = hasArg(args, '--ext') ? [] : ['--ext', 'js,jsx,ts,tsx'];
const defaultFilesArgs = hasFileArg(args) ? [] : ['.'];

const result = spawnSync(
  process.execPath,
  [
    eslintBinPath,
    ...defaultConfigArgs,
    ...defaultIgnoreArgs,
    ...defaultExtArgs,
    ...args,
    ...defaultFilesArgs,
  ],
  {
    env: {
      ...process.env,
      ESLINT_USE_FLAT_CONFIG: 'false',
    },
    stdio: 'inherit',
  },
);

process.exit(result.status ?? 1);
