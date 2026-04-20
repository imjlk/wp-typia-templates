import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

import {
  WP_TYPIA_BUNLI_MIGRATION_DOC,
  WP_TYPIA_CANONICAL_CREATE_USAGE,
  WP_TYPIA_CANONICAL_MIGRATE_USAGE,
  WP_TYPIA_FUTURE_COMMAND_TREE,
  WP_TYPIA_POSITIONAL_ALIAS_USAGE,
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
  normalizeWpTypiaArgv,
} from '../src/command-contract';
import { wpTypiaCommands } from '../src/command-list';

const packageRoot = path.resolve(import.meta.dir, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);

describe('wp-typia Bunli preparation', () => {
  test('checks in the Bunli prep tree while promoting a built CLI runtime', () => {
    expect(packageManifest.bin['wp-typia']).toBe('bin/wp-typia.js');
    expect(packageManifest.files).toContain('dist-bunli/');
    expect(packageManifest.files).toContain('bunli.config.ts');
    expect(packageManifest.scripts['bunli:build']).toBe('bun run build');
    expect(packageManifest.scripts['bunli:dev']).toBe('bun src/cli.ts');
    expect(packageManifest.scripts['bunli:test']).toBe(
      'bun test tests/*.test.ts',
    );
    expect(packageManifest.scripts.prepack).toBe('bun run build');
    expect(packageManifest.engines.bun).toBe('>=1.3.11');
    expect(packageManifest.devDependencies.bunli).toBe('0.9.0');
    expect(packageManifest.dependencies['@bunli/core']).toBe('0.9.0');
    expect(packageManifest.devDependencies['@bunli/test']).toBe('0.6.0');
    expect(fs.existsSync(path.join(packageRoot, 'bunli.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(packageRoot, 'src', 'cli.ts'))).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'create.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'sync.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'add.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'templates.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'migrate.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'mcp.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'doctor.ts')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(packageRoot, '.bunli', 'commands.gen.ts')),
    ).toBe(true);
  });

  test('runtime rebuild fallback targets sibling linked packages directly', () => {
    const runtimeBuildScript = fs.readFileSync(
      path.join(packageRoot, 'scripts', 'build-bunli-runtime.ts'),
      'utf8',
    );
    const fullRuntimeSection = runtimeBuildScript.slice(
      runtimeBuildScript.indexOf('async function buildFullBunliRuntime()'),
      runtimeBuildScript.indexOf('async function buildGeneratedMetadataRuntime()'),
    );

    expect(runtimeBuildScript).toContain(
      'const requireFromWpTypia = createRequire(',
    );
    expect(runtimeBuildScript).toContain(
      "path.join(packageRoot, 'package.json')",
    );
    expect(runtimeBuildScript).toContain(
      "requireFromWpTypia.resolve('@wp-typia/project-tools/package.json')",
    );
    expect(runtimeBuildScript).toContain(
      "requireFromWpTypia.resolve('@wp-typia/api-client/package.json')",
    );
    expect(runtimeBuildScript).toContain(
      "requireFromProjectTools.resolve('@wp-typia/block-runtime/package.json')",
    );
    expect(runtimeBuildScript).toContain(
      'wp-typia Bun runtime recovery requires Bun to be available.',
    );
    expect(runtimeBuildScript).toContain(
      "['x', 'tsc', '-p', buildStep.tsconfig]",
    );
    expect(runtimeBuildScript).toContain(
      "dependencies: ['@wp-typia/api-client'",
    );
    expect(runtimeBuildScript).toContain(
      "dependencies: ['@wp-typia/api-client', '@wp-typia/block-runtime']",
    );
    expect(runtimeBuildScript).toContain('tsconfig.runtime.json');
    expect(runtimeBuildScript).toContain('tsconfig.build.json');
    expect(runtimeBuildScript).toContain(
      'Unable to match missing wp-typia runtime alias artifacts to rebuild steps',
    );
    expect(runtimeBuildScript).toContain('Failed to build ${buildStep.label}');
    expect(runtimeBuildScript).toContain(
      'wp-typia runtime alias artifacts still missing after rebuild',
    );
    expect(runtimeBuildScript).toContain(
      'const buildRoot = path.parse(packageRoot).root;',
    );
    expect(fullRuntimeSection).toContain("naming: {");
    expect(fullRuntimeSection).toContain("asset: '[dir]/[name]-[hash].[ext]'");
    expect(fullRuntimeSection).toContain("chunk: '[dir]/[name]-[hash].[ext]'");
    expect(fullRuntimeSection).toContain("entry: '[name].[ext]'");
    expect(fullRuntimeSection).toContain('root: buildRoot');
    expect(fullRuntimeSection).toContain('splitting: true');
  });

  test('future Bunli command tree preserves the reserved top-level taxonomy', async () => {
    expect(WP_TYPIA_FUTURE_COMMAND_TREE.map((command) => command.name)).toEqual(
      Array.from(WP_TYPIA_TOP_LEVEL_COMMAND_NAMES),
    );
    expect(wpTypiaCommands.map((command) => command.name)).toEqual(
      Array.from(WP_TYPIA_TOP_LEVEL_COMMAND_NAMES),
    );
    expect(
      fs.readFileSync(path.join(packageRoot, 'src', 'cli.ts'), 'utf8'),
    ).toContain('createCLI(');
  });

  test('maintainer docs keep wp-typia as the only CLI owner', () => {
    const migrationDocSourcePath = path.join(
      repoRoot,
      'apps',
      'docs',
      'src',
      'content',
      'docs',
      'maintainers',
      'bunli-cli-migration.md',
    );
    const migrationDoc = fs.readFileSync(migrationDocSourcePath, 'utf8');

    expect(WP_TYPIA_BUNLI_MIGRATION_DOC).toBe(
      'https://imjlk.github.io/wp-typia/maintainers/bunli-cli-migration/',
    );
    expect(migrationDoc).toContain(
      '`@wp-typia/project-tools` must remain non-CLI',
    );
    expect(migrationDoc).toContain('`npx wp-typia`');
    expect(migrationDoc).toContain('`bunx wp-typia`');
    expect(migrationDoc).toContain('`dist-bunli/cli.js`');
    expect(migrationDoc).toContain('`>=1.3.11`');
    expect(migrationDoc).toContain(`\`${WP_TYPIA_CANONICAL_CREATE_USAGE}\``);
    expect(migrationDoc).toContain(`\`${WP_TYPIA_CANONICAL_MIGRATE_USAGE}\``);
    expect(migrationDoc).toContain(`\`${WP_TYPIA_POSITIONAL_ALIAS_USAGE}\``);
    expect(migrationDoc).not.toContain('`@wp-typia/create`');
    expect(fs.existsSync(path.join(repoRoot, 'packages', 'create'))).toBe(
      false,
    );
  });

  test('alias normalization ignores option values before the first command positional', () => {
    expect(normalizeWpTypiaArgv(['--template', 'basic', 'demo-block'])).toEqual(
      ['--template', 'basic', 'create', 'demo-block'],
    );
    expect(
      normalizeWpTypiaArgv(['--format', 'json', 'templates', 'list']),
    ).toEqual(['--format', 'json', 'templates', 'list']);
    expect(normalizeWpTypiaArgv(['-t', 'basic', 'demo-block'])).toEqual([
      '-t',
      'basic',
      'create',
      'demo-block',
    ]);
    expect(
      normalizeWpTypiaArgv(['--config', './custom.json', 'templates', 'list']),
    ).toEqual(['--config', './custom.json', 'templates', 'list']);
    expect(
      normalizeWpTypiaArgv(['-c', './custom.json', 'templates', 'list']),
    ).toEqual(['-c', './custom.json', 'templates', 'list']);
    expect(normalizeWpTypiaArgv(['help'])).toEqual(['help']);
    expect(normalizeWpTypiaArgv(['version'])).toEqual(['version']);
    expect(normalizeWpTypiaArgv(['demo-block', '--template', 'basic'])).toEqual(
      ['create', 'demo-block', '--template', 'basic'],
    );
    expect(() => normalizeWpTypiaArgv(['github:acme/template'])).toThrow(
      /The positional alias only accepts unambiguous local project directories/,
    );
    expect(() => normalizeWpTypiaArgv(['.'])).toThrow(
      /The positional alias does not scaffold into `\.`/,
    );
    expect(() => normalizeWpTypiaArgv(['./'])).toThrow(
      /The positional alias does not scaffold into `\.\/`/,
    );
    expect(
      normalizeWpTypiaArgv([
        'add',
        'hooked-block',
        'promo-card',
        '--anchor',
        'core/post-content',
        '--position',
        'after',
      ]),
    ).toEqual([
      'add',
      'hooked-block',
      'promo-card',
      '--anchor',
      'core/post-content',
      '--position',
      'after',
    ]);
    expect(() =>
      normalizeWpTypiaArgv(['templates', 'inspect', '--id']),
    ).toThrow(/`--id` requires a value\./);
    expect(() => normalizeWpTypiaArgv(['mcp', 'sync', '--output-dir'])).toThrow(
      /`--output-dir` requires a value\./,
    );
    expect(() => normalizeWpTypiaArgv(['temlates', 'list'])).toThrow(
      /only accepts a single project directory.*check the command spelling.*`list`/s,
    );
  });
});
