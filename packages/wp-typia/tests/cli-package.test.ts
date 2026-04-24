import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { WP_TYPIA_TOP_LEVEL_COMMAND_NAMES } from '../src/command-contract';
import {
  hasFlagBeforeTerminator,
  parseGlobalFlags,
  runNodeCli,
} from '../src/node-cli';

import { runUtf8Command } from '../../../tests/helpers/process-utils';
import {
  createBlockExternalFixturePath,
  linkWorkspaceNodeModules,
  scaffoldOfficialWorkspace,
} from '../../wp-typia-project-tools/tests/helpers/scaffold-test-harness.js';

const packageRoot = path.resolve(import.meta.dir, '..');
const entryPath = path.join(packageRoot, 'bin', 'wp-typia.js');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
);
const projectToolsPackageManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(packageRoot, '..', 'wp-typia-project-tools', 'package.json'),
    'utf8',
  ),
);
const runtimeBridgeSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'runtime-bridge.ts'),
  'utf8',
);
const doctorCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'doctor.ts'),
  'utf8',
);
const createCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'create.ts'),
  'utf8',
);
const addCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'add.ts'),
  'utf8',
);
const syncCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'sync.ts'),
  'utf8',
);
const migrateCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'migrate.ts'),
  'utf8',
);
const templatesCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'templates.ts'),
  'utf8',
);
const nodeCliSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'node-cli.ts'),
  'utf8',
);
const cliSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'cli.ts'),
  'utf8',
);
const fullRuntimeEntrypoint = path.join(packageRoot, 'dist-bunli', 'cli.js');
const addFlowSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'ui', 'add-flow.tsx'),
  'utf8',
);
const createFlowSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'ui', 'create-flow.tsx'),
  'utf8',
);

function runCapturedCommand(
  command: string,
  args: string[],
  options: Parameters<typeof spawnSync>[2] = {},
) {
  return spawnSync(command, args, {
    ...options,
    encoding: 'utf8',
  });
}

function withoutAIAgentEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    AGENT: '',
    AMP_CURRENT_THREAD_ID: '',
    CLAUDECODE: '',
    CLAUDE_CODE: '',
    CODEX_CI: '',
    CODEX_SANDBOX: '',
    CODEX_THREAD_ID: '',
    CURSOR_AGENT: '',
    GEMINI_CLI: '',
    OPENCODE: '',
  };
}

function withoutLocalBunEnv(): NodeJS.ProcessEnv {
  return {
    ...withoutAIAgentEnv(),
    BUN_BIN: path.join(os.tmpdir(), 'wp-typia-missing-bun'),
    PATH: path.dirname(process.execPath),
  };
}

function createSyncFixture(options: {
  packageManager?: string | null;
  scripts: Record<string, string>;
  withSyncTypesMarker?: boolean;
  withSyncRestMarker?: boolean;
}): { fixtureRoot: string; logPath: string } {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'wp-typia-sync-fixture-'),
  );
  const logPath = path.join(fixtureRoot, '.sync-log.jsonl');

  fs.mkdirSync(path.join(fixtureRoot, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: path.basename(fixtureRoot),
        ...(options.packageManager === null
          ? {}
          : {
              packageManager: options.packageManager ?? 'npm@11.6.1',
            }),
        private: true,
        scripts: options.scripts,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'scripts', 'record.mjs'),
    `import fs from "node:fs";
import path from "node:path";

const [, , label, ...args] = process.argv;
const logPath = path.join(process.cwd(), ".sync-log.jsonl");
fs.appendFileSync(logPath, \`\${JSON.stringify({ args, label })}\n\`);
`,
    'utf8',
  );
  if (options.withSyncTypesMarker !== false) {
    fs.writeFileSync(
      path.join(fixtureRoot, 'scripts', 'sync-types-to-block-json.ts'),
      'export {};\n',
      'utf8',
    );
  }

  if (options.withSyncRestMarker) {
    fs.writeFileSync(
      path.join(fixtureRoot, 'scripts', 'sync-rest-contracts.ts'),
      'export {};\n',
      'utf8',
    );
  }

  return { fixtureRoot, logPath };
}

function createRetrofitInitFixture(): string {
  const fixtureRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'wp-typia-init-fixture-'),
  );
  fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(fixtureRoot, 'package.json'),
    `${JSON.stringify(
      {
        name: path.basename(fixtureRoot),
        private: true,
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'src', 'block.json'),
    `${JSON.stringify(
      {
        name: 'create-block/retrofit-init',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'src', 'types.ts'),
    'export interface RetrofitInitAttributes {}\n',
    'utf8',
  );
  fs.writeFileSync(
    path.join(fixtureRoot, 'src', 'save.tsx'),
    'export default function Save() { return null; }\n',
    'utf8',
  );
  return fixtureRoot;
}

function readSyncLog(
  logPath: string,
): Array<{ args: string[]; label: string }> {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  return fs
    .readFileSync(logPath, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { args: string[]; label: string });
}

function parseJsonObjectFromOutput<T>(output: string): T {
  const trimmed = output.trim();
  const jsonStart = trimmed.startsWith('{') ? 0 : trimmed.lastIndexOf('\n{');
  const jsonSource = (
    jsonStart >= 0
      ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1)
      : trimmed
  ).trim();
  return JSON.parse(jsonSource) as T;
}

function parseJsonArrayFromOutput<T>(output: string): T {
  const trimmed = output.trim();
  const jsonStart = trimmed.startsWith('[') ? 0 : trimmed.lastIndexOf('\n[');
  const jsonSource = (
    jsonStart >= 0
      ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1)
      : trimmed
  ).trim();
  return JSON.parse(jsonSource) as T;
}

describe('wp-typia package', () => {
  test('owns the canonical CLI bin and keeps project-tools as a library dependency', () => {
    expect(packageManifest.name).toBe('wp-typia');
    expect(packageManifest.bin['wp-typia']).toBe('bin/wp-typia.js');
    expect(packageManifest.dependencies['@wp-typia/project-tools']).toBe(
      projectToolsPackageManifest.version,
    );
    expect(projectToolsPackageManifest.bin).toBeUndefined();
    expect(projectToolsPackageManifest.exports['./cli']).toBeUndefined();
    expect(projectToolsPackageManifest.exports['./cli-add']).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./cli-diagnostics'],
    ).toBeDefined();
    expect(projectToolsPackageManifest.exports['./cli-doctor']).toBeDefined();
    expect(projectToolsPackageManifest.exports['./cli-prompt']).toBeDefined();
    expect(projectToolsPackageManifest.exports['./cli-scaffold']).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./cli-templates'],
    ).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./compound-inner-blocks'],
    ).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./hooked-blocks'],
    ).toBeDefined();
    expect(projectToolsPackageManifest.exports['./migrations']).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./package-managers'],
    ).toBeDefined();
    expect(projectToolsPackageManifest.exports['./temp-roots']).toBeDefined();
    expect(
      projectToolsPackageManifest.exports['./workspace-project'],
    ).toBeDefined();
  });

  test('keeps CLI React dependencies dedupe-friendly for Bunli peers', () => {
    expect(packageManifest.dependencies.react).toBe(
      packageManifest.dependencies['react-dom'],
    );
    expect(packageManifest.dependencies.react).toMatch(/^\^/);
    expect(packageManifest.dependencies['react-dom']).toMatch(/^\^/);
  });

  test('avoids eager project-tools root imports on CLI startup paths', () => {
    expect(runtimeBridgeSource).not.toMatch(
      /from ["']@wp-typia\/project-tools["']/,
    );
    expect(doctorCommandSource).not.toMatch(
      /from ["']@wp-typia\/project-tools["']/,
    );
    expect(addFlowSource).not.toMatch(/from ["']@wp-typia\/project-tools["']/);
    expect(createFlowSource).not.toMatch(
      /from ["']@wp-typia\/project-tools["']/,
    );
  });

  test('derives fallback parsing and first-party initial values from shared metadata helpers', () => {
    expect(nodeCliSource).toContain('parseCommandArgvWithMetadata');
    expect(nodeCliSource).toContain('resolveCommandOptionValues');
    expect(nodeCliSource).not.toContain('const STRING_FLAG_NAMES = new Set([');
    expect(nodeCliSource).not.toContain('const BOOLEAN_FLAG_NAMES = new Set([');
    expect(nodeCliSource).not.toContain('const SHORT_FLAG_MAP = new Map<');
    expect(createCommandSource).toContain('resolveCommandOptionValues');
    expect(addCommandSource).toContain('resolveCommandOptionValues');
    expect(migrateCommandSource).toContain('resolveCommandOptionValues');
  });

  test('gates interactive TUI rendering on real terminal capability and avoids hard exit short-circuits', () => {
    expect(createCommandSource).toContain('supportsInteractiveTui');
    expect(addCommandSource).toContain('supportsInteractiveTui');
    expect(migrateCommandSource).toContain('supportsInteractiveTui');
    expect(createCommandSource).not.toMatch(
      /typeof\s+Bun\s*!==\s*["']undefined["']/,
    );
    expect(addCommandSource).not.toMatch(
      /typeof\s+Bun\s*!==\s*["']undefined["']/,
    );
    expect(migrateCommandSource).not.toMatch(
      /typeof\s+Bun\s*!==\s*["']undefined["']/,
    );
    expect(nodeCliSource).toContain('process.exitCode = 1');
    expect(nodeCliSource).not.toMatch(/process\.exit\s*\(\s*1\s*\)/);
    expect(cliSource).toContain('process.exitCode = 1');
    expect(cliSource).not.toMatch(/process\.exit\s*\(\s*1\s*\)/);
  });

  test('renders help output through the canonical bin', () => {
    const helpOutput = runUtf8Command('node', [entryPath, '--help']);
    const createHelpOutput = runUtf8Command('node', [
      entryPath,
      'create',
      '--help',
    ]);
    const initHelpOutput = runUtf8Command('node', [
      entryPath,
      'init',
      '--help',
    ]);
    const addHelpOutput = runUtf8Command('node', [entryPath, 'add', '--help']);

    for (const commandName of WP_TYPIA_TOP_LEVEL_COMMAND_NAMES) {
      expect(helpOutput).toContain(commandName);
    }
    expect(helpOutput).toContain('Runtime: Node fallback');
    expect(helpOutput).toContain('create: Scaffold a new wp-typia project.');
    expect(createHelpOutput).toContain('--external-layer-source');
    expect(createHelpOutput).toContain('--external-layer-id');
    expect(createHelpOutput).toContain('--alternate-render-targets');
    expect(createHelpOutput).toContain('Query Loop');
    expect(initHelpOutput).toContain('Preview-only retrofit planner');
    expect(addHelpOutput).toContain('--external-layer-source');
    expect(addHelpOutput).toContain('--external-layer-id');
    expect(addHelpOutput).toContain('--alternate-render-targets');
    expect(addHelpOutput).toContain('ability');
    expect(addHelpOutput).toContain('editor-plugin');
  });

  test('prints structured init plans through the canonical bin', () => {
    const fixtureRoot = createRetrofitInitFixture();

    try {
      const output = runUtf8Command(
        'node',
        [entryPath, 'init', '--format', 'json'],
        {
          cwd: fixtureRoot,
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        init?: {
          detectedLayout?: { kind?: string; blockNames?: string[] };
          nextSteps?: string[];
          packageChanges?: {
            scripts?: Array<{ name?: string }>;
          };
          status?: string;
        };
      }>(output);

      expect(parsed.init?.status).toBe('preview');
      expect(parsed.init?.detectedLayout?.kind).toBe('single-block');
      expect(parsed.init?.detectedLayout?.blockNames).toEqual([
        'create-block/retrofit-init',
      ]);
      expect(
        parsed.init?.packageChanges?.scripts?.map((script) => script.name),
      ).toEqual(['sync', 'sync-types', 'typecheck']);
      expect(parsed.init?.nextSteps).toContain(
        `npx --yes wp-typia@${packageManifest.version} doctor`,
      );
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('renders a human-readable version line through the canonical bin', () => {
    const output = runUtf8Command('node', [entryPath, '--version']);

    expect(output.trim()).toBe(`wp-typia ${packageManifest.version}`);
  });

  test('keeps structured version output opt-in through --format json', () => {
    const output = runUtf8Command('node', [
      entryPath,
      '--version',
      '--format',
      'json',
    ]);
    const parsed = parseJsonObjectFromOutput<{
      data?: { name?: string; type?: string; version?: string };
      ok?: boolean;
    }>(output);

    expect(parsed.ok).toBe(true);
    expect(parsed.data?.type).toBe('version');
    expect(parsed.data?.name).toBe('wp-typia');
    expect(parsed.data?.version).toBe(packageManifest.version);
  });

  test('runs the published human-readable version path without requiring a local Bun binary', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, '--version'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout.trim()).toBe(`wp-typia ${packageManifest.version}`);
  });

  test('renders general and command help without requiring a local Bun binary', () => {
    const helpResult = runCapturedCommand(
      process.execPath,
      [entryPath, '--help'],
      {
        env: withoutLocalBunEnv(),
      },
    );
    const createHelpResult = runCapturedCommand(
      process.execPath,
      [entryPath, 'create', '--help'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(helpResult.status).toBe(0);
    expect(helpResult.stderr).toBe('');
    expect(helpResult.stdout).toContain(
      'Canonical CLI package for wp-typia scaffolding',
    );
    expect(helpResult.stdout).toContain('Runtime: Node fallback');
    expect(helpResult.stdout).toContain('standalone wp-typia binary');
    expect(createHelpResult.status).toBe(0);
    expect(createHelpResult.stderr).toBe('');
    expect(createHelpResult.stdout).toContain('--external-layer-source');
    expect(createHelpResult.stdout).toContain('--external-layer-id');
    expect(createHelpResult.stdout).toContain('--alternate-render-targets');
  });

  test('guides Bun-only commands toward standalone binaries when Bun is unavailable', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'skills', 'list'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('requires Bun');
    expect(result.stderr).toContain(
      'Install Bun locally, run with bunx, or set BUN_BIN',
    );
    expect(result.stderr).toContain('standalone wp-typia binary');
    expect(result.stderr).toContain('GitHub release assets');
  });

  test('keeps value-taking options from being mistaken for Bun-only commands', () => {
    const targetDir = path.join(
      os.tmpdir(),
      `wp-typia-mcp-namespace-${Date.now()}`,
    );
    const result = runCapturedCommand(
      process.execPath,
      [
        entryPath,
        '--namespace',
        'mcp',
        'create',
        targetDir,
        '--template',
        'basic',
        '--package-manager',
        'npm',
        '--yes',
        '--no-install',
      ],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('requires Bun');
    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src', 'block.json'))).toBe(true);
  });

  test('derives Bunli and Node fallback option metadata from the same source', () => {
    expect(createCommandSource).toContain(
      'buildCommandOptions(CREATE_OPTION_METADATA)',
    );
    expect(addCommandSource).toContain(
      'buildCommandOptions(ADD_OPTION_METADATA)',
    );
    expect(syncCommandSource).toContain(
      'buildCommandOptions(SYNC_OPTION_METADATA)',
    );
    expect(migrateCommandSource).toContain(
      'buildCommandOptions(MIGRATE_OPTION_METADATA)',
    );
    expect(templatesCommandSource).toContain(
      'buildCommandOptions(TEMPLATES_OPTION_METADATA)',
    );
    expect(nodeCliSource).toMatch(/from ['"]\.\/command-option-metadata['"]/);
    expect(nodeCliSource).toContain(
      'formatNodeFallbackOptionHelp(CREATE_OPTION_METADATA)',
    );
    expect(nodeCliSource).toContain(
      'formatNodeFallbackOptionHelp(ADD_OPTION_METADATA)',
    );
    expect(nodeCliSource).toContain(
      'formatNodeFallbackOptionHelp(SYNC_OPTION_METADATA)',
    );
    expect(nodeCliSource).toContain(
      'formatNodeFallbackOptionHelp(MIGRATE_OPTION_METADATA)',
    );
    expect(nodeCliSource).toContain(
      'formatNodeFallbackOptionHelp(TEMPLATES_OPTION_METADATA)',
    );
  });

  test('packs a built dist-bunli runtime for the published CLI entrypoint', () => {
    const rootSegment = path.basename(os.homedir());
    const packResult = runCapturedCommand(
      'npm',
      ['pack', '--json', '--pack-destination', packageRoot],
      {
        cwd: packageRoot,
        env: {
          ...process.env,
          WP_TYPIA_SKIP_POSTPACK_RESTORE: '',
        },
      },
    );

    expect(packResult.status).toBe(0);
    const parsed = parseJsonArrayFromOutput<
      Array<{
        filename: string;
        files: Array<{ path: string }>;
      }>
    >(packResult.stdout);
    const tarball = parsed[0];
    expect(
      tarball?.files.some((entry) => entry.path === 'dist-bunli/cli.js'),
    ).toBe(true);
    expect(
      tarball?.files.some(
        (entry) => entry.path === 'dist-bunli/.bunli/commands.gen.js',
      ),
    ).toBe(true);
    expect(
      tarball?.files.some((entry) =>
        entry.path.startsWith('dist-bunli/.bunli/tree-sitter-'),
      ),
    ).toBe(true);
    expect(
      tarball?.files.some((entry) => entry.path === 'dist-bunli/node-cli.js'),
    ).toBe(true);
    expect(tarball?.files.some((entry) => entry.path.endsWith('.map'))).toBe(
      false,
    );
    expect(
      tarball?.files.some((entry) => entry.path === 'bin/wp-typia.js'),
    ).toBe(true);
    expect(
      tarball?.files.some(
        (entry) => entry.path === 'bin/routing-metadata.generated.js',
      ),
    ).toBe(true);
    expect(
      tarball?.files.some(
        (entry) => entry.path === 'bin/routing-metadata.generated.d.ts',
      ),
    ).toBe(true);
    expect(
      tarball?.files.some((entry) => entry.path === 'bunli.config.ts'),
    ).toBe(false);
    expect(
      tarball?.files.some((entry) =>
        entry.path.startsWith(`dist-bunli/${rootSegment}/`),
      ),
    ).toBe(false);
    expect(
      tarball?.files.some((entry) => entry.path === '.bunli/commands.gen.ts'),
    ).toBe(false);
    expect(tarball?.files.some((entry) => entry.path === 'src/cli.ts')).toBe(
      false,
    );
    expect(
      fs.existsSync(path.join(packageRoot, 'dist-bunli', 'cli.js.map')),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(packageRoot, 'dist-bunli', '.bunli', 'commands.gen.js.map'),
      ),
    ).toBe(true);

    if (tarball?.filename) {
      fs.rmSync(path.join(packageRoot, tarball.filename), { force: true });
    }
  }, 30000);

  test('rejects sync outside a generated project root with explicit guidance', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-sync-outside-'),
    );

    try {
      expect(() =>
        runUtf8Command('node', [entryPath, 'sync'], {
          cwd: tempRoot,
        }),
      ).toThrow(
        /run `wp-typia sync` from a scaffolded project or official workspace root that already contains generated sync scripts/i,
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('prefers the project-local sync script and forwards --check', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        sync: 'node scripts/record.mjs sync',
        'sync-rest': 'node scripts/record.mjs sync-rest',
        'sync-types': 'node scripts/record.mjs sync-types',
      },
      withSyncRestMarker: true,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('accepts custom scaffold sync scripts without the built-in sync-types marker', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        sync: 'node scripts/record.mjs sync',
      },
      withSyncTypesMarker: false,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('infers npm when a legacy sync project omits the packageManager field', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      packageManager: null,
      scripts: {
        sync: 'node scripts/record.mjs sync',
      },
      withSyncTypesMarker: false,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('falls back to sync-types only for legacy single-block projects', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-types': 'node scripts/record.mjs sync-types',
      },
    });

    try {
      runUtf8Command('node', [entryPath, 'sync'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: [],
          label: 'sync-types',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('falls back to sync-types without requiring the built-in marker layout', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-types': 'node scripts/record.mjs sync-types',
      },
      withSyncTypesMarker: false,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: [],
          label: 'sync-types',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('falls back to sync-types then sync-rest for legacy persistence projects', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-rest': 'node scripts/record.mjs sync-rest',
        'sync-types': 'node scripts/record.mjs sync-types',
      },
      withSyncRestMarker: true,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync-types',
        },
        {
          args: ['--check'],
          label: 'sync-rest',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('includes sync-ai in the planned split sync workflow when a project opts in', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-ai': 'node scripts/record.mjs sync-ai',
        'sync-rest': 'node scripts/record.mjs sync-rest',
        'sync-types': 'node scripts/record.mjs sync-types',
      },
      withSyncRestMarker: true,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync-types',
        },
        {
          args: ['--check'],
          label: 'sync-rest',
        },
        {
          args: ['--check'],
          label: 'sync-ai',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('runs sync ai through the dedicated sync-ai script in Node fallback', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        sync: 'node scripts/record.mjs sync',
        'sync-ai': 'node scripts/record.mjs sync-ai',
      },
      withSyncTypesMarker: false,
    });

    try {
      runUtf8Command('node', [entryPath, 'sync', 'ai', '--check'], {
        cwd: fixtureRoot,
      });

      expect(readSyncLog(logPath)).toEqual([
        {
          args: ['--check'],
          label: 'sync-ai',
        },
      ]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('previews sync commands without running scripts in Node fallback dry-run JSON mode', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-rest': 'node scripts/record.mjs sync-rest',
        'sync-types': 'node scripts/record.mjs sync-types',
      },
      withSyncRestMarker: true,
    });

    try {
      const result = runCapturedCommand(
        process.execPath,
        [entryPath, 'sync', '--dry-run', '--format', 'json'],
        {
          cwd: fixtureRoot,
          env: withoutLocalBunEnv(),
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        sync?: {
          dryRun?: boolean;
          executedCommands?: unknown[];
          plannedCommands?: Array<{ displayCommand?: string }>;
        };
      }>(result.stdout);

      expect(result.status).toBe(0);
      expect(parsed.sync?.dryRun).toBe(true);
      expect(parsed.sync?.executedCommands).toBeUndefined();
      expect(parsed.sync?.plannedCommands).toMatchObject([
        {
          displayCommand: 'npm run sync-types',
        },
        {
          displayCommand: 'npm run sync-rest',
        },
      ]);
      expect(readSyncLog(logPath)).toEqual([]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('previews sync ai commands without running scripts in Node fallback dry-run JSON mode', () => {
    const { fixtureRoot, logPath } = createSyncFixture({
      scripts: {
        'sync-ai': 'node scripts/record.mjs sync-ai',
      },
      withSyncTypesMarker: false,
    });

    try {
      const result = runCapturedCommand(
        process.execPath,
        [entryPath, 'sync', 'ai', '--dry-run', '--format', 'json'],
        {
          cwd: fixtureRoot,
          env: withoutLocalBunEnv(),
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        sync?: {
          dryRun?: boolean;
          plannedCommands?: Array<{
            args?: string[];
            command?: string;
            displayCommand?: string;
            scriptName?: string;
          }>;
          target?: string;
        };
      }>(result.stdout);

      expect(result.status).toBe(0);
      expect(parsed.sync?.dryRun).toBe(true);
      expect(parsed.sync?.target).toBe('ai');
      expect(parsed.sync?.plannedCommands).toEqual([
        {
          args: ['run', 'sync-ai'],
          command: 'npm',
          displayCommand: 'npm run sync-ai',
          scriptName: 'sync-ai',
        },
      ]);
      expect(readSyncLog(logPath)).toEqual([]);
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('renders sync help with preview-oriented dry-run guidance in Node fallback', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'sync', '--help'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage: wp-typia sync [ai]');
    expect(result.stdout).toContain('--check');
    expect(result.stdout).toContain('--dry-run');
  });

  test('rejects the removed migrations alias with actionable guidance', () => {
    expect(() =>
      runUtf8Command('node', [entryPath, 'migrations', 'plan']),
    ).toThrow(/removed in favor of `wp-typia migrate`/);
  });

  test('requires --block for add variation', () => {
    expect(() =>
      runUtf8Command('node', [entryPath, 'add', 'variation', 'promo-card']),
    ).toThrow('`wp-typia add variation` requires --block <block-slug>.');
  });

  test('requires --anchor and --position for add hooked-block', () => {
    expect(() =>
      runUtf8Command('node', [entryPath, 'add', 'hooked-block', 'promo-card']),
    ).toThrow(
      '`wp-typia add hooked-block` requires --anchor <anchor-block-name>.',
    );
    expect(() =>
      runUtf8Command('node', [
        entryPath,
        'add',
        'hooked-block',
        'promo-card',
        '--anchor',
        'core/post-content',
      ]),
    ).toThrow(
      '`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.',
    );
  });

  test('requires a project directory for the explicit create command', () => {
    expect(() => runUtf8Command('node', [entryPath, 'create'])).toThrow(
      '`wp-typia create` requires <project-dir>.',
    );
    expect(() =>
      runUtf8Command('node', [entryPath, 'create', '--dry-run']),
    ).toThrow(/`--dry-run` still needs a logical project directory name/);
  });

  test('surfaces external template timeout codes in structured create failures', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-create-timeout-template-'),
    );
    const targetDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-create-timeout-output-'),
    );
    fs.rmSync(targetDir, { force: true, recursive: true });
    fs.cpSync(createBlockExternalFixturePath, fixtureRoot, { recursive: true });
    fs.rmSync(path.join(fixtureRoot, 'index.cjs'));
    fs.writeFileSync(
      path.join(fixtureRoot, 'index.mjs'),
      [
        'await new Promise((resolve) => setTimeout(resolve, 200));',
        'export default {',
        '  blockTemplatesPath: "block-templates",',
        '  assetsPath: "assets",',
        '};',
        '',
      ].join('\n'),
      'utf8',
    );

    const previousTimeout = process.env.WP_TYPIA_EXTERNAL_TEMPLATE_TIMEOUT_MS;
    process.env.WP_TYPIA_EXTERNAL_TEMPLATE_TIMEOUT_MS = '25';

    try {
      const result = runCapturedCommand(
        process.execPath,
        [
          entryPath,
          'create',
          targetDir,
          '--template',
          fixtureRoot,
          '--package-manager',
          'npm',
          '--yes',
          '--no-install',
          '--format',
          'json',
        ],
        {
          env: {
            ...withoutLocalBunEnv(),
            WP_TYPIA_EXTERNAL_TEMPLATE_TIMEOUT_MS: '25',
          },
        },
      );
      const diagnosticOutput = result.stderr.includes('{')
        ? result.stderr
        : result.stdout;
      const parsed = parseJsonObjectFromOutput<{
        error?: { code?: string; message?: string };
        ok?: boolean;
      }>(diagnosticOutput);

      expect(result.status).toBe(1);
      expect(parsed.ok).toBe(false);
      expect(parsed.error?.code).toBe('template-source-timeout');
      expect(parsed.error?.message).toContain(
        'Timed out while loading external template config',
      );
    } finally {
      if (previousTimeout === undefined) {
        delete process.env.WP_TYPIA_EXTERNAL_TEMPLATE_TIMEOUT_MS;
      } else {
        process.env.WP_TYPIA_EXTERNAL_TEMPLATE_TIMEOUT_MS = previousTimeout;
      }
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
      fs.rmSync(targetDir, { force: true, recursive: true });
    }
  });

  test('rejects typo-like positional alias invocations with extra arguments', () => {
    const result = runCapturedCommand('node', [entryPath, 'temlates', 'list'], {
      env: withoutAIAgentEnv(),
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'The positional alias only accepts a single project directory.',
    );
    expect(result.stderr).toContain('`wp-typia create <project-dir>`');
    expect(result.stderr).toContain('check the command spelling');
    expect(result.stderr).toContain('`list`');
  });

  test('formats create failures with a shared non-interactive diagnostic block', () => {
    const result = runCapturedCommand('node', [entryPath, 'create']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error: wp-typia create failed');
    expect(result.stderr).toContain(
      'Summary: Unable to complete the requested create workflow.',
    );
    expect(result.stderr).toContain(
      '- `wp-typia create` requires <project-dir>.',
    );
    expect(result.stderr).toContain(
      '`--dry-run` still needs a logical project directory name',
    );
  });

  test('emits a machine-readable missing-argument error code for create in Node fallback JSON mode', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'create', '--format', 'json'],
      {
        env: withoutLocalBunEnv(),
      },
    );
    const parsed = parseJsonObjectFromOutput<{
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    }>(result.stderr);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('create');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('formats add failures with a shared non-interactive diagnostic block', () => {
    const result = runCapturedCommand('node', [
      entryPath,
      'add',
      'variation',
      'promo-card',
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error: wp-typia add failed');
    expect(result.stderr).toContain(
      'Summary: Unable to complete the requested add workflow.',
    );
    expect(result.stderr).toContain(
      '- `wp-typia add variation` requires --block <block-slug>.',
    );
  });

  test('emits structured add completion output in Node fallback JSON mode', async () => {
    const projectDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-add-json-'),
    );

    try {
      await scaffoldOfficialWorkspace(projectDir);
      linkWorkspaceNodeModules(projectDir);

      const result = runCapturedCommand(
        process.execPath,
        [entryPath, 'add', 'block', 'promo-card', '--format', 'json'],
        {
          cwd: projectDir,
          env: withoutLocalBunEnv(),
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        completion?: {
          summaryLines?: string[];
          title?: string;
        };
      }>(result.stdout);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(parsed.completion?.title).toContain('Added workspace block');
      expect(parsed.completion?.summaryLines).toContain(
        'Template family: basic',
      );
      expect(
        fs.existsSync(
          path.join(projectDir, 'src', 'blocks', 'promo-card', 'block.json'),
        ),
      ).toBe(true);
    } finally {
      fs.rmSync(projectDir, { force: true, recursive: true });
    }
  });

  test('preserves add diagnostic metadata in Node fallback JSON mode on failure', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'add', 'variation', 'promo-card', '--format', 'json'],
      {
        env: withoutLocalBunEnv(),
      },
    );
    const parsed = parseJsonObjectFromOutput<{
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    }>(result.stderr);

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('add');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('emits a machine-readable outside-project-root error code for sync in Node fallback JSON mode', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-sync-json-'),
    );

    try {
      const result = runCapturedCommand(
        process.execPath,
        [entryPath, 'sync', '--format', 'json'],
        {
          cwd: tempRoot,
          env: withoutLocalBunEnv(),
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        error?: { code?: string; command?: string; kind?: string };
        ok?: boolean;
      }>(result.stderr);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(parsed.ok).toBe(false);
      expect(parsed.error?.kind).toBe('command-execution');
      expect(parsed.error?.command).toBe('sync');
      expect(parsed.error?.code).toBe('outside-project-root');
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('treats missing add kinds as an error while still printing help text', () => {
    const result = runCapturedCommand('node', [entryPath, 'add'], {
      env: withoutAIAgentEnv(),
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('wp-typia add block <name>');
    expect(result.stderr).toContain(
      '`wp-typia add` requires <kind>. Usage: wp-typia add <block|variation|pattern|binding-source|rest-resource|ability|ai-feature|editor-plugin|hooked-block> ...',
    );
  });

  test('node fallback source entry treats missing add kinds as an error while printing add help', async () => {
    const originalLog = console.log;
    const capturedStdout: string[] = [];
    console.log = (line = '') => {
      capturedStdout.push(String(line));
    };

    try {
      await expect(runNodeCli(['add'])).rejects.toThrow('wp-typia add failed');
      expect(capturedStdout.join('\n')).toContain('Usage:');
      expect(capturedStdout.join('\n')).toContain('wp-typia add block <name>');
      expect(capturedStdout.join('\n')).toContain(
        'wp-typia add ability <name>',
      );
      expect(capturedStdout.join('\n')).toContain(
        'wp-typia add ai-feature <name>',
      );
      expect(capturedStdout.join('\n')).toContain(
        'wp-typia add editor-plugin <name>',
      );
    } finally {
      console.log = originalLog;
    }
  });

  test('formats migrate failures with a shared non-interactive diagnostic block', () => {
    const result = runCapturedCommand('node', [entryPath, 'migrate', 'init']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Error: wp-typia migrate failed');
    expect(result.stderr).toContain(
      'Summary: Unable to complete the requested migration command.',
    );
    expect(result.stderr).toContain(
      '- `migrate init` requires --current-migration-version <label>.',
    );
  });

  test('formats doctor failures with a summary block while keeping streamed check output', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-doctor-diagnostics-'),
    );

    try {
      fs.writeFileSync(
        path.join(fixtureRoot, 'package.json'),
        `${JSON.stringify(
          {
            name: 'broken-workspace',
            private: true,
            wpTypia: {
              projectType: 'workspace',
            },
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const result = runCapturedCommand('node', [entryPath, 'doctor'], {
        cwd: fixtureRoot,
        env: withoutAIAgentEnv(),
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toContain('FAIL Doctor scope:');
      expect(result.stdout).toContain(
        'workspace diagnostics could not continue because a nearby wp-typia workspace candidate is invalid.',
      );
      expect(result.stdout).toContain('FAIL Workspace package metadata:');
      expect(result.stdout).toContain('FAIL wp-typia doctor summary:');
      expect(result.stderr).toContain('Error: wp-typia doctor failed');
      expect(result.stderr).toContain(
        'Summary: One or more doctor checks failed.',
      );
      expect(result.stderr).toContain('- Doctor scope:');
      expect(result.stderr).toContain('- Workspace package metadata:');
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('prints an explicit environment-only doctor scope outside workspace roots', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-doctor-scope-'),
    );

    try {
      const result = runCapturedCommand('node', [entryPath, 'doctor'], {
        cwd: fixtureRoot,
        env: withoutAIAgentEnv(),
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('PASS Doctor scope:');
      expect(result.stdout).toContain('Scope: environment-only.');
      expect(result.stdout).toContain('only covered environment readiness');
      expect(result.stdout).toContain('workspace root');
      expect(result.stdout).toContain('PASS wp-typia doctor summary:');
      expect(result.stderr).toBe('');
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('wraps doctor scope guidance in narrow terminals', () => {
    const fixtureRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-doctor-narrow-'),
    );

    try {
      const result = runCapturedCommand('node', [entryPath, 'doctor'], {
        cwd: fixtureRoot,
        env: {
          ...withoutAIAgentEnv(),
          COLUMNS: '54',
        },
      });

      expect(result.status).toBe(0);
      expect(result.stdout).toContain(
        [
          'PASS Doctor scope: Scope: environment-only. No',
          '  official wp-typia workspace root was detected, so',
        ].join('\n'),
      );
      expect(result.stdout).toContain(
        [
          '  this run only covered environment readiness. Re-run',
          '  `wp-typia doctor` from a workspace root if you',
        ].join('\n'),
      );
      expect(result.stdout).toContain('PASS wp-typia doctor summary:');
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('prints migrate help through the canonical verb', () => {
    const helpOutput = runUtf8Command('node', [entryPath, 'migrate']);
    expect(helpOutput).toContain('wp-typia migrate init');
  });

  test('exposes shell completions through the Bunli plugin surface', () => {
    const output = runUtf8Command('node', [entryPath, 'completions', 'bash']);

    expect(output).toContain('# bash completion for wp-typia');
    expect(output).toContain('wp-typia complete --');
  });

  test('exposes skills listing through the Bunli plugin surface', () => {
    const output = runUtf8Command('node', [entryPath, 'skills', 'list']);

    expect(output).toContain('"agents": [');
    expect(output).toMatch(/Detected|No agents detected/);
  });

  test('fails mcp list with actionable config guidance when no schema sources are configured', () => {
    const result = runCapturedCommand(
      'bun',
      [fullRuntimeEntrypoint, 'mcp', 'list'],
      {
        env: withoutAIAgentEnv(),
      },
    );

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).toContain(
      'No MCP schema sources are configured.',
    );
  });

  test('emits a machine-readable configuration-missing error code for mcp list', () => {
    const result = runCapturedCommand('node', [
      entryPath,
      'mcp',
      'list',
      '--format',
      'json',
    ]);
    const parsed = JSON.parse(result.stdout.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('mcp');
    expect(parsed.error?.code).toBe('configuration-missing');
  });

  test('emits a machine-readable missing-argument error code for create in Bun runtime JSON mode', () => {
    const result = runCapturedCommand(
      'bun',
      [fullRuntimeEntrypoint, 'create', '--format', 'json'],
      {
        env: withoutAIAgentEnv(),
      },
    );
    const parsed = JSON.parse(result.stdout.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('create');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('emits a machine-readable outside-project-root error code for sync in Bun runtime JSON mode', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-bun-sync-json-'),
    );

    try {
      const result = runCapturedCommand(
        'bun',
        [fullRuntimeEntrypoint, 'sync', '--format', 'json'],
        {
          cwd: tempRoot,
          env: withoutAIAgentEnv(),
        },
      );
      const parsed = JSON.parse(result.stdout.trim()) as {
        error?: { code?: string; command?: string; kind?: string };
        ok?: boolean;
      };

      expect(result.status).toBe(1);
      expect(result.stderr).toBe('');
      expect(parsed.ok).toBe(false);
      expect(parsed.error?.kind).toBe('command-execution');
      expect(parsed.error?.command).toBe('sync');
      expect(parsed.error?.code).toBe('outside-project-root');
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('emits a machine-readable missing-argument error code for top-level config parsing in Bun runtime JSON mode', () => {
    const result = runCapturedCommand(
      'bun',
      [fullRuntimeEntrypoint, '--config', '--format', 'json'],
      {
        env: withoutAIAgentEnv(),
      },
    );
    const parsed = JSON.parse(result.stdout.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('wp-typia');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('emits a machine-readable invalid-command error code for positional-alias typos after value options in Bun runtime JSON mode', () => {
    const result = runCapturedCommand(
      'bun',
      [
        fullRuntimeEntrypoint,
        '--template',
        'basic',
        'temlates',
        'list',
        '--format',
        'json',
      ],
      {
        env: withoutAIAgentEnv(),
      },
    );
    const parsed = JSON.parse(result.stdout.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('temlates');
    expect(parsed.error?.code).toBe('invalid-command');
  });

  test('loads MCP schema sources from an explicit --config override', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-mcp-config-'),
    );
    const schemaPath = path.join(tempRoot, 'mcp-tools.json');
    const configPath = path.join(tempRoot, 'wp-typia.config.json');

    try {
      fs.writeFileSync(
        schemaPath,
        `${JSON.stringify([{ description: 'Ping test tool', name: 'ping' }], null, 2)}\n`,
        'utf8',
      );
      fs.writeFileSync(
        configPath,
        `${JSON.stringify(
          {
            mcp: {
              schemaSources: [
                {
                  namespace: 'demo',
                  path: schemaPath,
                },
              ],
            },
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const output = runUtf8Command('node', [
        entryPath,
        '--config',
        configPath,
        'mcp',
        'list',
      ]);
      const parsed = JSON.parse(output) as {
        groups: Array<{
          namespace: string;
          toolCount: number;
          tools: string[];
        }>;
      };
      expect(parsed.groups).toEqual([
        {
          namespace: 'demo',
          toolCount: 1,
          tools: ['ping'],
        },
      ]);
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('loads baseline create defaults from package.json#wp-typia in the Node fallback', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-node-config-defaults-'),
    );
    const targetDir = path.join(tempRoot, 'demo-config-defaults');

    try {
      fs.writeFileSync(
        path.join(tempRoot, 'package.json'),
        `${JSON.stringify(
          {
            name: 'node-config-defaults',
            private: true,
            'wp-typia': {
              create: {
                'package-manager': 'npm',
                template: 'basic',
                yes: true,
                'no-install': true,
              },
            },
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const result = runCapturedCommand(
        process.execPath,
        [entryPath, 'create', targetDir],
        {
          cwd: tempRoot,
          env: withoutLocalBunEnv(),
        },
      );

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src', 'block.json'))).toBe(
        true,
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('honors explicit machine-readable output for mcp list', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-mcp-format-'),
    );
    const schemaPath = path.join(tempRoot, 'mcp-tools.json');
    const configPath = path.join(tempRoot, 'wp-typia.config.json');

    try {
      fs.writeFileSync(
        schemaPath,
        `${JSON.stringify([{ description: 'Ping test tool', name: 'ping' }], null, 2)}\n`,
        'utf8',
      );
      fs.writeFileSync(
        configPath,
        `${JSON.stringify(
          {
            mcp: {
              schemaSources: [
                {
                  namespace: 'demo',
                  path: schemaPath,
                },
              ],
            },
          },
          null,
          2,
        )}\n`,
        'utf8',
      );

      const output = runUtf8Command('node', [
        entryPath,
        '--config',
        configPath,
        'mcp',
        'list',
        '--format',
        'json',
      ]);
      const parsed = JSON.parse(output) as {
        groups: Array<{
          namespace: string;
          toolCount: number;
          tools: string[];
        }>;
      };
      expect(parsed.groups[0]).toEqual({
        namespace: 'demo',
        toolCount: 1,
        tools: ['ping'],
      });
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('honors explicit machine-readable output for templates list', () => {
    const output = runUtf8Command('node', [
      entryPath,
      'templates',
      'list',
      '--format',
      'json',
    ]);
    const parsed = JSON.parse(output) as {
      templates: Array<{ id: string }>;
    };

    expect(parsed.templates.length).toBeGreaterThan(0);
    expect(parsed.templates.some((entry) => entry.id === 'basic')).toBe(true);
    expect(parsed.templates.some((entry) => entry.id === 'query-loop')).toBe(
      true,
    );
    expect(
      parsed.templates.some(
        (entry) => entry.id === '@wp-typia/create-workspace-template',
      ),
    ).toBe(true);
  });

  test('renders human-readable template discovery hints for flags and workspace aliasing', () => {
    const output = runUtf8Command('node', [entryPath, 'templates', 'list']);

    expect(output).toContain(
      'Supports: --alternate-render-targets • --data-storage • --persistence-policy • external layers',
    );
    expect(output).toContain('Supports: --query-post-type • external layers');
    expect(output).toContain('Alias: workspace (`--template workspace`)');
  });

  test('keeps human-readable template inspect output focused on logical layers', () => {
    const basicOutput = runUtf8Command('node', [
      entryPath,
      'templates',
      'inspect',
      'basic',
    ]);
    const workspaceOutput = runUtf8Command('node', [
      entryPath,
      'templates',
      'inspect',
      'workspace',
    ]);

    expect(basicOutput).toStartWith('basic\n');
    expect(basicOutput).not.toContain(
      'basic          A lightweight WordPress block with Typia validation',
    );
    expect(basicOutput).toContain('Best for:');
    expect(basicOutput).toContain('Identity:');
    expect(basicOutput).toContain('Built-in template id: basic');
    expect(basicOutput).toContain('Logical layers:');
    expect(basicOutput).toContain('shared/base -> basic overlay');
    expect(basicOutput).not.toContain('Overlay path:');
    expect(basicOutput).not.toContain('/templates/basic');

    expect(workspaceOutput).toContain(
      'Official package: @wp-typia/create-workspace-template',
    );
    expect(workspaceOutput).toContain(
      'User-facing alias: workspace (`--template workspace`)',
    );
    expect(workspaceOutput).not.toContain('Overlay path:');
  });

  test('stops parsing global flags after -- in the Node fallback', () => {
    const parsed = parseGlobalFlags(['templates', 'list', '--', '--format']);

    expect(parsed.flags).toEqual({});
    expect(parsed.argv).toEqual(['templates', 'list', '--', '--format']);
  });

  test('ignores fallback help/version flags after --', () => {
    expect(hasFlagBeforeTerminator(['create', '--help'], '--help')).toBe(true);
    expect(hasFlagBeforeTerminator(['create', '--', '--help'], '--help')).toBe(
      false,
    );
    expect(
      hasFlagBeforeTerminator(['version', '--', '--version'], '--version'),
    ).toBe(false);
  });

  test('treats templates --id as an alias for templates inspect', () => {
    const output = runUtf8Command('node', [
      entryPath,
      'templates',
      '--id',
      'basic',
      '--format',
      'json',
    ]);
    const parsed = JSON.parse(output) as {
      template?: { id?: string; description?: string };
      templates?: Array<{ id: string }>;
    };

    expect(parsed.templates).toBeUndefined();
    expect(parsed.template?.id).toBe('basic');
    expect(parsed.template?.description).toContain('Typia validation');
  });

  test('inspects the official workspace template through the canonical templates command', () => {
    const output = runUtf8Command('node', [
      entryPath,
      'templates',
      'inspect',
      'workspace',
      '--format',
      'json',
    ]);
    const parsed = JSON.parse(output) as {
      template?: { id?: string; description?: string };
    };

    expect(parsed.template?.id).toBe('@wp-typia/create-workspace-template');
    expect(parsed.template?.description).toContain('official empty workspace');
  });

  test('rejects unknown short options in the Node fallback parser', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'create', '-x', 'demo-short-flag'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unknown option `-x`.');
  });
});
