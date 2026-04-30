import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { COMMAND_ROUTING_METADATA } from '../src/command-option-metadata';
import {
  WP_TYPIA_BUN_REQUIRED_TOP_LEVEL_COMMAND_NAMES,
  WP_TYPIA_BUNLI_MIGRATION_DOC,
  WP_TYPIA_CANONICAL_CREATE_USAGE,
  WP_TYPIA_CANONICAL_MIGRATE_USAGE,
  WP_TYPIA_FUTURE_COMMAND_TREE,
  WP_TYPIA_POSITIONAL_ALIAS_USAGE,
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
  normalizeWpTypiaArgv,
} from '../src/command-contract';
import { ADD_KIND_IDS } from '../src/add-kind-registry';
import { wpTypiaCommands } from '../src/command-list';
import {
  fullRuntimeCommands,
  longValueOptions,
  shortValueOptions,
} from '../bin/routing-metadata.generated.js';

const packageRoot = path.resolve(import.meta.dir, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);
const runtimeDependencyHelperSource = fs.readFileSync(
  path.join(packageRoot, 'scripts', 'runtime-build-dependencies.ts'),
  'utf8',
);

describe('wp-typia Bunli preparation', () => {
  test('checks in the Bunli prep tree while promoting a built CLI runtime', () => {
    expect(packageManifest.bin['wp-typia']).toBe('bin/wp-typia.js');
    expect(packageManifest.files).toContain('dist-bunli/');
    expect(packageManifest.files).not.toContain('bunli.config.ts');
    expect(packageManifest.scripts['bunli:build']).toBe('bun run build');
    expect(packageManifest.scripts['bunli:dev']).toBe('bun src/cli.ts');
    expect(packageManifest.scripts['bunli:test']).toBe(
      'bun test tests/*.test.ts',
    );
    expect(packageManifest.scripts['generate:routing']).toBe(
      'node scripts/generate-routing-metadata.mjs',
    );
    expect(packageManifest.scripts['validate:routing']).toBe(
      'node scripts/generate-routing-metadata.mjs --check',
    );
    expect(packageManifest.scripts.generate).toBe(
      'node scripts/generate-routing-metadata.mjs && bun scripts/generate-bunli-metadata.ts',
    );
    expect(packageManifest.scripts['build:standalone']).toBe(
      'bun scripts/build-standalone-runtime.ts --targets native --outdir ./dist-standalone',
    );
    expect(packageManifest.scripts['build:standalone:release']).toBe(
      'bun scripts/build-standalone-runtime.ts --targets darwin-arm64,darwin-x64,linux-arm64,linux-x64,windows-x64 --outdir ./.cache/standalone/raw',
    );
    expect(packageManifest.scripts.prepack).toBe(
      'bun run build && node ./scripts/publish-runtime-maps.mjs prepare',
    );
    expect(packageManifest.scripts.postpack).toBe(
      'node ./scripts/publish-runtime-maps.mjs restore',
    );
    expect(packageManifest.scripts.clean).toContain('dist-standalone');
    expect(packageManifest.scripts.clean).toContain('.cache/standalone');
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
      fs.existsSync(path.join(packageRoot, 'src', 'commands', 'init.ts')),
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
    expect(
      fs.existsSync(
        path.join(packageRoot, 'bin', 'routing-metadata.generated.js'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(packageRoot, 'bin', 'routing-metadata.generated.d.ts'),
      ),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(packageRoot, 'scripts', 'publish-runtime-maps.mjs'),
      ),
    ).toBe(true);
  });

  test('generates bin routing metadata from shared command and option metadata', () => {
    const binEntrypointSource = fs.readFileSync(
      path.join(packageRoot, 'bin', 'wp-typia.js'),
      'utf8',
    );
    const runtimeRoutingSource = fs.readFileSync(
      path.join(packageRoot, 'bin', 'runtime-routing.js'),
      'utf8',
    );

    expect(fullRuntimeCommands).toEqual(
      Array.from(WP_TYPIA_BUN_REQUIRED_TOP_LEVEL_COMMAND_NAMES),
    );
    expect(longValueOptions).toEqual(COMMAND_ROUTING_METADATA.longValueOptions);
    expect(shortValueOptions).toEqual(
      COMMAND_ROUTING_METADATA.shortValueOptions,
    );
    expect(binEntrypointSource).toMatch(
      /from ['"]\.\/routing-metadata\.generated\.js['"]/,
    );
    expect(binEntrypointSource).toMatch(/from ['"]\.\/runtime-routing\.js['"]/);
    expect(runtimeRoutingSource).toMatch(/from ['"]\.\/argv-walker\.js['"]/);
    expect(binEntrypointSource).not.toContain(
      'const fullRuntimeCommands = new Set([',
    );
    expect(binEntrypointSource).not.toContain(
      'const longValueOptions = new Set([',
    );
    expect(binEntrypointSource).not.toContain(
      'const shortValueOptions = new Set([',
    );
  });

  test('validates routing metadata with node without requiring bunli generation', () => {
    const result = spawnSync(
      'node',
      ['scripts/generate-routing-metadata.mjs', '--check'],
      {
        cwd: packageRoot,
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('Routing metadata is out of date');
  });

  test('runtime rebuild fallback targets sibling linked packages directly', () => {
    const runtimeBuildScript = fs.readFileSync(
      path.join(packageRoot, 'scripts', 'build-bunli-runtime.ts'),
      'utf8',
    );
    const fullRuntimeSection = runtimeBuildScript.slice(
      runtimeBuildScript.indexOf('async function buildFullBunliRuntime()'),
      runtimeBuildScript.indexOf(
        'async function buildGeneratedMetadataRuntime()',
      ),
    );

    expect(runtimeDependencyHelperSource).toContain(
      'const requireFromWpTypia = createRequire(',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'path.join(packageRoot, "package.json")',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'requireFromWpTypia.resolve("@wp-typia/project-tools/package.json")',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'requireFromWpTypia.resolve("@wp-typia/api-client/package.json")',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'requireFromProjectTools.resolve("@wp-typia/block-runtime/package.json")',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'wp-typia Bun runtime recovery requires Bun to be available.',
    );
    expect(runtimeDependencyHelperSource).toContain(
      '["x", "tsc", "-p", buildStep.tsconfig]',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'dependencies: ["@wp-typia/api-client"]',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'dependencies: ["@wp-typia/api-client", "@wp-typia/block-runtime"]',
    );
    expect(runtimeDependencyHelperSource).toContain('tsconfig.runtime.json');
    expect(runtimeDependencyHelperSource).toContain('tsconfig.build.json');
    expect(runtimeDependencyHelperSource).toContain(
      'Unable to match missing wp-typia runtime alias artifacts to rebuild steps',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'Failed to build ${buildStep.label}',
    );
    expect(runtimeDependencyHelperSource).toContain(
      'wp-typia runtime alias artifacts still missing after rebuild',
    );
    expect(runtimeBuildScript).toContain(
      'const isLinkedInstalledWpTypiaRuntime = packageRoot.includes(',
    );
    expect(runtimeBuildScript).toContain(
      '`${path.sep}node_modules${path.sep}.bun${path.sep}`',
    );
    expect(fullRuntimeSection).toContain('naming: {');
    expect(fullRuntimeSection).toContain("asset: '.bunli/[name]-[hash].[ext]'");
    expect(fullRuntimeSection).toContain("chunk: '[name]-[hash].[ext]'");
    expect(fullRuntimeSection).toContain("entry: '[name].[ext]'");
    expect(fullRuntimeSection).toContain('root: packageRoot');
    expect(fullRuntimeSection).toContain(
      'splitting: !isLinkedInstalledWpTypiaRuntime',
    );
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

  test('future Bunli command tree exposes every supported add kind', () => {
    const addCommand = WP_TYPIA_FUTURE_COMMAND_TREE.find(
      (command) => command.name === 'add',
    );

    expect(addCommand?.subcommands).toEqual([...ADD_KIND_IDS]);
    expect(addCommand?.subcommands).toContain('admin-view');
    expect(addCommand?.subcommands).toContain('ability');
    expect(addCommand?.subcommands).toContain('ai-feature');
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
    expect(migrationDoc).toContain('`install-wp-typia.sh`');
    expect(migrationDoc).toContain('`install-wp-typia.ps1`');
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
