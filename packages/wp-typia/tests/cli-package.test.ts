import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES,
  WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
} from '../src/command-contract';
import {
  hasFlagBeforeTerminator,
  parseGlobalFlags,
  runNodeCli,
} from '../src/node-cli';

import { runUtf8Command } from '../../../tests/helpers/process-utils';
import {
  entryPath,
  fullRuntimeEntrypoint,
  packageRoot,
  parseJsonArrayFromOutput,
  parseJsonObjectFromOutput,
  runCapturedCommand,
  shouldRouteTestInvocationToFullRuntime,
  withoutAIAgentEnv,
  withoutLocalBunEnv,
} from './cli-package-test-helpers';

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
const runtimeBridgeStartupSources = [
  runtimeBridgeSource,
  ...[
    'runtime-bridge-add.ts',
    'runtime-bridge-create.ts',
    'runtime-bridge-doctor.ts',
    'runtime-bridge-init.ts',
    'runtime-bridge-migrate.ts',
    'runtime-bridge-shared.ts',
    'runtime-bridge-templates.ts',
  ].map((fileName) =>
    fs.readFileSync(path.join(packageRoot, 'src', fileName), 'utf8'),
  ),
];
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
const initCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'init.ts'),
  'utf8',
);
const templatesCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'templates.ts'),
  'utf8',
);
const outputAdaptersSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'output-adapters.ts'),
  'utf8',
);
const mcpCommandSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'commands', 'mcp.ts'),
  'utf8',
);
const nodeCliSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'node-cli.ts'),
  'utf8',
);
const nodeFallbackHelpSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'node-fallback', 'help.ts'),
  'utf8',
);
const cliSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'cli.ts'),
  'utf8',
);
const addFlowSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'ui', 'add-flow.tsx'),
  'utf8',
);
const createFlowSource = fs.readFileSync(
  path.join(packageRoot, 'src', 'ui', 'create-flow.tsx'),
  'utf8',
);

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
      projectToolsPackageManifest.exports['./cli-add-kind-ids'],
    ).toBeDefined();
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
    for (const source of runtimeBridgeStartupSources) {
      expect(source).not.toMatch(/from ["']@wp-typia\/project-tools["']/);
    }
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
    expect(nodeCliSource).toContain('normalizeCliOutputFormatArgv');
    expect(nodeCliSource).toContain('parseGlobalFlags(outputFormatArgv)');
    expect(nodeCliSource).not.toContain('const STRING_FLAG_NAMES = new Set([');
    expect(nodeCliSource).not.toContain('const BOOLEAN_FLAG_NAMES = new Set([');
    expect(nodeCliSource).not.toContain('const SHORT_FLAG_MAP = new Map<');
    expect(createCommandSource).toContain('resolveCommandOptionValues');
    expect(addCommandSource).toContain('resolveCommandOptionValues');
    expect(migrateCommandSource).toContain('resolveCommandOptionValues');
    expect(mcpCommandSource).toContain('buildCommandOptions');
    expect(mcpCommandSource).toContain('MCP_OPTION_METADATA');
    expect(mcpCommandSource).toContain('printMcpToolGroupSummary');
    expect(mcpCommandSource).not.toContain('console.log');
    expect(mcpCommandSource).not.toContain('schema: z.string().optional()');
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

  test('routes interactive create/add/migrate invocations to the Bunli runtime when Bun and a TTY are available', () => {
    expect(shouldRouteTestInvocationToFullRuntime([])).toBe(false);
    expect(shouldRouteTestInvocationToFullRuntime(['create'])).toBe(true);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create', '--dry-run']),
    ).toBe(true);
    expect(shouldRouteTestInvocationToFullRuntime(['add'])).toBe(true);
    expect(shouldRouteTestInvocationToFullRuntime(['migrate'])).toBe(true);
    expect(shouldRouteTestInvocationToFullRuntime(['demo-block'])).toBe(true);
    expect(shouldRouteTestInvocationToFullRuntime(['mcp', 'list'])).toBe(true);

    expect(
      shouldRouteTestInvocationToFullRuntime(['create'], {
        hasWorkingBun: false,
      }),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create'], {
        hasBuiltRuntime: false,
      }),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create'], {
        isTTY: false,
      }),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create'], {
        term: 'dumb',
      }),
    ).toBe(false);
    expect(shouldRouteTestInvocationToFullRuntime(['create', '--help'])).toBe(
      false,
    );
    expect(shouldRouteTestInvocationToFullRuntime(['create', '-h'])).toBe(
      false,
    );
    expect(
      shouldRouteTestInvocationToFullRuntime([
        'create',
        '--help=false',
        '--help',
      ]),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime([
        'create',
        'demo-block',
        '--format',
        'json',
      ]),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create', 'demo-block', '--yes']),
    ).toBe(false);
    expect(
      shouldRouteTestInvocationToFullRuntime(['create', 'demo-block', '-y']),
    ).toBe(false);
    expect(shouldRouteTestInvocationToFullRuntime(['temlates', 'list'])).toBe(
      false,
    );
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
    const doctorHelpOutput = runUtf8Command('node', [
      entryPath,
      'doctor',
      '--help',
    ]);

    for (const commandName of WP_TYPIA_TOP_LEVEL_COMMAND_NAMES) {
      expect(helpOutput).toContain(commandName);
    }
    expect(helpOutput).toContain('Runtime: Node fallback');
    expect(helpOutput).toContain('non-empty NO_COLOR requests ASCII markers');
    expect(helpOutput).toContain('create: Scaffold a new wp-typia project.');
    expect(createHelpOutput).toContain('--external-layer-source');
    expect(createHelpOutput).toContain('--external-layer-id');
    expect(createHelpOutput).toContain('--alternate-render-targets');
    expect(createHelpOutput).toContain('Query Loop');
    expect(initHelpOutput).toContain('Preview-by-default retrofit planner');
    expect(initHelpOutput).toContain('--apply');
    expect(initHelpOutput).toContain('--package-manager');
    expect(addHelpOutput).toContain('--external-layer-source');
    expect(addHelpOutput).toContain('--external-layer-id');
    expect(addHelpOutput).toContain('--alternate-render-targets');
    expect(addHelpOutput).toContain(
      'interactive flows let you choose it when omitted and non-interactive runs default to basic',
    );
    expect(addHelpOutput).toContain('admin-view');
    expect(addHelpOutput).toContain('ability');
    expect(addHelpOutput).toContain('ai-feature');
    expect(addHelpOutput).toContain('editor-plugin');
    expect(doctorHelpOutput).toContain(
      '`json` for machine-readable doctor check output or `text` for human-readable output',
    );
    expect(doctorHelpOutput).not.toContain('toon');
  });

  test('prints structured init plans through the canonical bin', () => {
    const fixtureRoot = createRetrofitInitFixture();

    try {
      const output = runUtf8Command(
        process.execPath,
        [entryPath, 'init', '--format', 'json'],
        {
          cwd: fixtureRoot,
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        data?: {
          command?: string;
          completion?: {
            nextSteps?: string[];
            title?: string;
          };
          detectedLayout?: { kind?: string; blockNames?: string[] };
          files?: string[];
          mode?: string;
          nextSteps?: string[];
          packageManager?: string;
          plan?: {
            commandMode?: string;
            packageChanges?: {
              scripts?: Array<{ name?: string }>;
            };
          };
          projectDir?: string;
          status?: string;
        };
        ok?: boolean;
      }>(output);

      expect(parsed.ok).toBe(true);
      expect(parsed.data?.command).toBe('init');
      expect(parsed.data?.status).toBe('preview');
      expect(parsed.data?.mode).toBe('preview');
      expect(parsed.data?.plan?.commandMode).toBe('preview-only');
      expect(parsed.data?.detectedLayout?.kind).toBe('single-block');
      expect(parsed.data?.detectedLayout?.blockNames).toEqual([
        'create-block/retrofit-init',
      ]);
      expect(
        parsed.data?.plan?.packageChanges?.scripts?.map(
          (script) => script.name,
        ),
      ).toEqual(['sync', 'sync-types', 'typecheck']);
      expect(parsed.data?.projectDir).toBe(fs.realpathSync(fixtureRoot));
      expect(parsed.data?.packageManager).toBe('npm');
      expect(parsed.data?.files).toEqual(
        expect.arrayContaining([
          'scripts/block-config.ts',
          'scripts/sync-types-to-block-json.ts',
          'scripts/sync-project.ts',
          'src/typia.manifest.json',
          'src/typia.schema.json',
        ]),
      );
      expect(parsed.data?.completion?.title).toContain('Retrofit init plan');
      expect(parsed.data?.completion?.nextSteps).toContain(
        `npx --yes wp-typia@${packageManifest.version} doctor`,
      );
      expect(parsed.data).not.toHaveProperty('nextSteps');
    } finally {
      fs.rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  test('applies retrofit init through the canonical bin in Node fallback JSON mode', () => {
    const fixtureRoot = createRetrofitInitFixture();

    try {
      const output = runUtf8Command(
        process.execPath,
        [
          entryPath,
          'init',
          '--apply',
          '--package-manager',
          'pnpm',
          '--format',
          'json',
        ],
        {
          cwd: fixtureRoot,
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        data?: {
          command?: string;
          completion?: {
            title?: string;
          };
          files?: string[];
          mode?: string;
          packageManager?: string;
          plan?: {
            commandMode?: string;
            plannedFiles?: Array<{ action?: string; path?: string }>;
          };
          projectDir?: string;
          status?: string;
        };
        ok?: boolean;
      }>(output);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(fixtureRoot, 'package.json'), 'utf8'),
      ) as {
        packageManager?: string;
        scripts?: Record<string, string>;
      };

      expect(parsed.ok).toBe(true);
      expect(parsed.data?.command).toBe('init');
      expect(parsed.data?.status).toBe('applied');
      expect(parsed.data?.mode).toBe('apply');
      expect(parsed.data?.plan?.commandMode).toBe('apply');
      expect(parsed.data?.packageManager).toBe('pnpm');
      expect(parsed.data?.projectDir).toBe(fs.realpathSync(fixtureRoot));
      expect(parsed.data?.plan?.plannedFiles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            action: 'add',
            path: 'scripts/block-config.ts',
          }),
          expect.objectContaining({
            action: 'add',
            path: 'scripts/sync-types-to-block-json.ts',
          }),
          expect.objectContaining({
            action: 'add',
            path: 'scripts/sync-project.ts',
          }),
        ]),
      );
      expect(parsed.data?.files).toEqual(
        expect.arrayContaining([
          'scripts/block-config.ts',
          'scripts/sync-types-to-block-json.ts',
          'scripts/sync-project.ts',
        ]),
      );
      expect(parsed.data?.completion?.title).toContain('Applied retrofit init');
      expect(packageJson.packageManager).toBe('pnpm@8.3.1');
      expect(packageJson.scripts?.sync).toBe('tsx scripts/sync-project.ts');
      expect(packageJson.scripts?.typecheck).toBe(
        'pnpm run sync --check && tsc --noEmit',
      );
      expect(
        fs.existsSync(path.join(fixtureRoot, 'scripts', 'block-config.ts')),
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(fixtureRoot, 'scripts', 'sync-types-to-block-json.ts'),
        ),
      ).toBe(true);
      expect(
        fs.existsSync(path.join(fixtureRoot, 'scripts', 'sync-project.ts')),
      ).toBe(true);
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

  test('guides source checkout bootstrap when project-tools dist is missing', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-source-bootstrap-'),
    );
    const sourcePackageRoot = path.join(tempRoot, 'packages', 'wp-typia');
    const sourceProjectToolsRoot = path.join(
      tempRoot,
      'packages',
      'wp-typia-project-tools',
    );
    const fakeBunPath = path.join(tempRoot, 'fake-bun.mjs');
    const fakeBunLogPath = path.join(tempRoot, 'fake-bun.log');

    try {
      fs.writeFileSync(
        path.join(tempRoot, 'package.json'),
        `${JSON.stringify({
          private: true,
          workspaces: ['packages/*'],
        })}\n`,
        'utf8',
      );
      fs.mkdirSync(path.join(sourcePackageRoot, 'scripts'), {
        recursive: true,
      });
      fs.mkdirSync(path.join(sourcePackageRoot, 'src'), { recursive: true });
      fs.mkdirSync(sourceProjectToolsRoot, { recursive: true });
      fs.cpSync(
        path.join(packageRoot, 'bin'),
        path.join(sourcePackageRoot, 'bin'),
        { recursive: true },
      );
      fs.writeFileSync(
        path.join(sourcePackageRoot, 'package.json'),
        `${JSON.stringify(
          {
            name: 'wp-typia',
            scripts: {
              build: 'bun run generate && bun scripts/build-bunli-runtime.ts',
            },
            type: 'module',
          },
          null,
          2,
        )}\n`,
        'utf8',
      );
      fs.writeFileSync(
        path.join(sourcePackageRoot, 'scripts', 'build-bunli-runtime.ts'),
        'export {};\n',
        'utf8',
      );
      fs.writeFileSync(
        path.join(sourcePackageRoot, 'src', 'cli.ts'),
        'export {};\n',
        'utf8',
      );
      fs.writeFileSync(
        path.join(sourceProjectToolsRoot, 'package.json'),
        `${JSON.stringify({
          name: '@wp-typia/project-tools',
          type: 'module',
        })}\n`,
        'utf8',
      );
      fs.writeFileSync(
        fakeBunPath,
        `#!/usr/bin/env node
import fs from 'node:fs';

const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--version') {
  console.log('1.3.11');
  process.exit(0);
}

fs.appendFileSync(${JSON.stringify(fakeBunLogPath)}, \`\${JSON.stringify(args)}\\n\`);
if (
  args[0] === 'run' &&
  args[1] === '--filter' &&
  args[2] === '@wp-typia/project-tools' &&
  args[3] === 'build'
) {
  console.error('simulated project-tools build failure');
  process.exit(17);
}

process.exit(0);
`,
        'utf8',
      );
      fs.chmodSync(fakeBunPath, 0o755);

      const result = runCapturedCommand(
        process.execPath,
        [path.join(sourcePackageRoot, 'bin', 'wp-typia.js'), '--version'],
        {
          env: {
            ...withoutAIAgentEnv(),
            BUN_BIN: fakeBunPath,
            PATH: [
              path.dirname(process.execPath),
              process.env.PATH ?? '',
            ].join(path.delimiter),
          },
        },
      );
      const fakeBunCalls = fs
        .readFileSync(fakeBunLogPath, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as string[]);

      expect(result.status).toBe(17);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain(
        'source checkout is missing @wp-typia/project-tools build artifacts',
      );
      expect(result.stderr.replace(/\\/g, '/')).toContain(
        'packages/wp-typia-project-tools/dist/runtime/cli-diagnostics.js',
      );
      expect(result.stderr).toContain(
        'bun run --filter @wp-typia/project-tools build',
      );
      expect(result.stderr).toContain('repository root');
      expect(fakeBunCalls).toEqual([
        ['run', '--filter', '@wp-typia/project-tools', 'build'],
      ]);
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('renders general and command help without requiring a local Bun binary', () => {
    const noCommandResult = runCapturedCommand(process.execPath, [entryPath], {
      env: withoutLocalBunEnv(),
    });
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

    expect(noCommandResult.status).toBe(1);
    expect(noCommandResult.stderr).toBe('');
    expect(noCommandResult.stdout).toContain(
      'Canonical CLI package for wp-typia scaffolding',
    );
    expect(noCommandResult.stdout).toContain(
      'No command provided. Run wp-typia --help for usage information.',
    );
    expect(noCommandResult.stdout).toContain('Runtime: Node fallback');
    expect(helpResult.status).toBe(0);
    expect(helpResult.stderr).toBe('');
    expect(helpResult.stdout).not.toContain('No command provided.');
    expect(helpResult.stdout).toContain(
      'Canonical CLI package for wp-typia scaffolding',
    );
    expect(helpResult.stdout).toContain('Runtime: Node fallback');
    expect(helpResult.stdout).toContain('standalone wp-typia binary');
    expect(helpResult.stdout).toContain(
      'WP_TYPIA_ASCII=1 forces ASCII markers',
    );
    expect(createHelpResult.status).toBe(0);
    expect(createHelpResult.stderr).toBe('');
    expect(createHelpResult.stdout).toContain('--external-layer-source');
    expect(createHelpResult.stdout).toContain('--external-layer-id');
    expect(createHelpResult.stdout).toContain('--alternate-render-targets');
  });

  test('keeps every node-fallback registry command wired to the fallback help path', () => {
    for (const commandName of WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES) {
      const argv =
        commandName === 'help' || commandName === 'version'
          ? [entryPath, commandName]
          : [entryPath, commandName, '--help'];
      const result = runCapturedCommand(process.execPath, argv, {
        env: withoutLocalBunEnv(),
      });

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).not.toContain('does not support');
      if (commandName !== 'version') {
        expect(result.stdout).toContain('Runtime: Node fallback');
      }
    }
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

  test('normalizes --help <bun-only-command> into command help when Bun is available', () => {
    const result = runCapturedCommand(process.execPath, [entryPath, '--help', 'mcp']);
    const parsed = JSON.parse(result.stdout.trim()) as {
      data?: { path?: string[]; text?: string; type?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(parsed.ok).toBe(true);
    expect(parsed.data?.type).toBe('help');
    expect(parsed.data?.path).toEqual(['mcp']);
    expect(parsed.data?.text).toContain('Usage: wp-typia mcp [options]');
  });

  test('keeps --help <bun-only-command> on clear Bun guidance when Bun is unavailable', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, '--help', 'mcp'],
      {
        env: withoutLocalBunEnv(),
      },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('requires Bun');
    expect(result.stderr).not.toContain('BunliValidationError');
    expect(result.stderr).toContain(
      'Install Bun locally, run with bunx, or set BUN_BIN',
    );
    expect(result.stderr).toContain('standalone wp-typia binary');
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
    expect(initCommandSource).toContain(
      'buildCommandOptions(INIT_OPTION_METADATA)',
    );
    expect(syncCommandSource).toContain(
      'buildCommandOptions(SYNC_OPTION_METADATA)',
    );
    expect(doctorCommandSource).toContain(
      'buildCommandOptions(DOCTOR_OPTION_METADATA)',
    );
    expect(migrateCommandSource).toContain(
      'buildCommandOptions(MIGRATE_OPTION_METADATA)',
    );
    expect(migrateCommandSource).toContain('resolveCommandPrintLine');
    expect(migrateCommandSource).toMatch(
      /executeMigrateCommand\(\{[\s\S]*printLine,/,
    );
    expect(nodeCliSource).toMatch(
      /migrate:\s*async\s*\(\{[\s\S]*printLine,[\s\S]*executeMigrateCommand\(\{[\s\S]*printLine,/,
    );
    expect(templatesCommandSource).toContain(
      'buildCommandOptions(TEMPLATES_OPTION_METADATA)',
    );
    expect(nodeCliSource).toMatch(/from ['"]\.\/command-option-metadata['"]/);
    expect(nodeCliSource).toContain("from './node-fallback/help'");
    expect(nodeFallbackHelpSource).toContain(
      'renderNodeFallbackCommandHelp(printLine, config)',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: CREATE_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: INIT_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: ADD_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: SYNC_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: DOCTOR_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: MIGRATE_OPTION_METADATA',
    );
    expect(nodeFallbackHelpSource).toContain(
      'optionMetadata: TEMPLATES_OPTION_METADATA',
    );
  });

  test('passes explicit output adapters from Bunli command handlers into runtime bridges', () => {
    expect(outputAdaptersSource).toContain('resolveCommandOutputAdapters');
    expect(outputAdaptersSource).toContain('process.stdout.write');
    expect(outputAdaptersSource).toContain('process.stderr.write');

    expect(addCommandSource).toContain('resolveCommandOutputAdapters');
    expect(addCommandSource).toMatch(
      /executeAddCommand\(\{[\s\S]*printLine,[\s\S]*warnLine,/,
    );
    expect(createCommandSource).toContain('resolveCommandOutputAdapters');
    expect(createCommandSource).toMatch(
      /executeCreateCommand\(\{[\s\S]*printLine,[\s\S]*warnLine,/,
    );
    expect(initCommandSource).toContain('resolveCommandOutputAdapters');
    expect(initCommandSource).toMatch(
      /executeInitCommand\([\s\S]*\{[\s\S]*printLine,[\s\S]*warnLine,/,
    );
    expect(migrateCommandSource).toContain('resolveCommandPrintLine');
    expect(migrateCommandSource).toMatch(
      /executeMigrateCommand\(\{[\s\S]*printLine,/,
    );
    expect(templatesCommandSource).toContain('resolveCommandPrintLine');
    expect(templatesCommandSource).toMatch(
      /executeTemplatesCommand\(\{[\s\S]*\},\s*printLine\)/,
    );
  });

  test('packs a built dist-bunli runtime for the published CLI entrypoint', () => {
    const rootSegment = path.basename(os.homedir());
    const packDestination = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-pack-'),
    );
    const packResult = (() => {
      try {
        return runCapturedCommand(
          'npm',
          ['pack', '--json', '--pack-destination', packDestination],
          {
            cwd: packageRoot,
            env: {
              ...process.env,
              WP_TYPIA_SKIP_POSTPACK_RESTORE: '',
            },
          },
        );
      } finally {
        fs.rmSync(packDestination, { force: true, recursive: true });
      }
    })();

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
      tarball?.files.some((entry) => entry.path === 'bin/argv-walker.js'),
    ).toBe(true);
    expect(
      tarball?.files.some((entry) => entry.path === 'bin/argv-walker.d.ts'),
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

  test('emits a machine-readable malformed package JSON code for sync in Node fallback JSON mode', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-sync-malformed-json-'),
    );
    const packageJsonPath = path.join(tempRoot, 'package.json');

    try {
      fs.writeFileSync(packageJsonPath, '{\n', 'utf8');

      const result = runCapturedCommand(
        'node',
        [entryPath, 'sync', '--format', 'json'],
        {
          cwd: tempRoot,
          env: {
            ...withoutAIAgentEnv(),
            BUN_BIN: path.join(os.tmpdir(), 'wp-typia-missing-bun'),
          },
        },
      );
      const parsed = parseJsonObjectFromOutput<{
        error?: {
          code?: string;
          command?: string;
          detailLines?: string[];
          kind?: string;
        };
        ok?: boolean;
      }>(result.stderr);

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(parsed.ok).toBe(false);
      expect(parsed.error?.kind).toBe('command-execution');
      expect(parsed.error?.command).toBe('sync');
      expect(parsed.error?.code).toBe('invalid-argument');
      expect(parsed.error?.detailLines?.join('\n')).toContain(
        `Unable to parse ${fs.realpathSync(packageJsonPath)}`,
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
  });

  test('emits a machine-readable invalid-command error code for sync subcommands in Node fallback JSON mode', () => {
    const result = runCapturedCommand(
      process.execPath,
      [entryPath, 'sync', 'unknown', '--format', 'json'],
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
    expect(parsed.error?.command).toBe('sync');
    expect(parsed.error?.code).toBe('invalid-command');
  });

  test('rejects invalid output formats before Node fallback command execution', () => {
    const cases = [
      ['create', 'demo-format', '--dry-run', '--format', 'jso'],
      ['add', 'block', 'promo-card', '--dry-run', '--format', 'jso'],
      ['init', '--format', 'jso'],
      ['doctor', '--format', 'jso'],
      ['templates', 'list', '--format', 'jso'],
      ['sync', '--format', 'jso'],
    ];

    for (const args of cases) {
      const result = runCapturedCommand(process.execPath, [entryPath, ...args], {
        env: withoutLocalBunEnv(),
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Invalid --format value "jso".');
      expect(result.stderr).toContain('Supported values: json, text.');
    }
  });

  test('preserves command metadata for invalid templates subcommands in Node fallback JSON mode', async () => {
    await expect(
      runNodeCli(['templates', 'unknown', '--format', 'json']),
    ).rejects.toMatchObject({
      code: 'invalid-command',
      command: 'templates',
    });
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
    const parsed = JSON.parse(result.stderr.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('mcp');
    expect(parsed.error?.code).toBe('configuration-missing');
  });

  test('emits a machine-readable invalid-argument error code for malformed mcp schema sources', () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wp-typia-mcp-invalid-schema-'),
    );
    const schemaPath = path.join(tempRoot, 'mcp-tools.json');
    const configPath = path.join(tempRoot, 'wp-typia.config.json');

    try {
      fs.writeFileSync(
        schemaPath,
        `${JSON.stringify(
          {
            namespace: 'demo',
            tools: [{ description: 'Missing a tool name' }],
          },
          null,
          2,
        )}\n`,
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

      const result = runCapturedCommand('node', [
        entryPath,
        '--config',
        configPath,
        'mcp',
        'list',
        '--format',
        'json',
      ]);
      const parsed = JSON.parse(result.stderr.trim()) as {
        error?: {
          code?: string;
          command?: string;
          detailLines?: string[];
          kind?: string;
        };
        ok?: boolean;
      };

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(parsed.ok).toBe(false);
      expect(parsed.error?.kind).toBe('command-execution');
      expect(parsed.error?.command).toBe('mcp');
      expect(parsed.error?.code).toBe('invalid-argument');
      expect(parsed.error?.detailLines?.join('\n')).toContain(
        `Schema source "${schemaPath}" must contain either one MCPToolGroup object or an array of MCP tools.`,
      );
    } finally {
      fs.rmSync(tempRoot, { force: true, recursive: true });
    }
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
      const parsed = JSON.parse(result.stderr.trim()) as {
        error?: { code?: string; command?: string; kind?: string };
        ok?: boolean;
      };

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

  test('rejects invalid output formats before Bun runtime command execution', () => {
    const cases = [
      ['create', 'demo-format', '--dry-run', '--format', 'jso'],
      ['add', 'block', 'promo-card', '--dry-run', '--format', 'jso'],
      ['init', '--format', 'jso'],
      ['doctor', '--format', 'jso'],
      ['templates', 'list', '--format', 'jso'],
      ['sync', '--format', 'jso'],
    ];

    for (const args of cases) {
      const result = runCapturedCommand('bun', [fullRuntimeEntrypoint, ...args], {
        env: withoutAIAgentEnv(),
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('Invalid --format value "jso".');
      expect(result.stderr).toContain('Supported values: json, text.');
    }
  });

  test('accepts text as the public human-readable format in Bun runtime', () => {
    const result = runCapturedCommand(
      'bun',
      [fullRuntimeEntrypoint, 'create', '--format', 'text'],
      {
        env: withoutAIAgentEnv(),
      },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('Error: wp-typia create failed');
    expect(result.stderr).not.toContain('Invalid --format value "text".');
    expect(result.stderr).not.toContain('Supported values:');
  });

  test('emits a machine-readable missing-argument error code for top-level config parsing in Bun runtime JSON mode', () => {
    const result = runCapturedCommand(
      'bun',
      [fullRuntimeEntrypoint, '--config', '--format', 'json'],
      {
        env: withoutAIAgentEnv(),
      },
    );
    const parsed = JSON.parse(result.stderr.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('wp-typia');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('emits a machine-readable invalid-argument error code for positional-alias typos after value options in Bun runtime JSON mode', () => {
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
    const parsed = JSON.parse(result.stderr.trim()) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('temlates');
    expect(parsed.error?.code).toBe('invalid-argument');
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
