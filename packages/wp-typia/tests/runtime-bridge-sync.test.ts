import { afterAll, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { executeSyncCommand } from '../src/runtime-bridge-sync';

const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'wp-typia-sync-bridge-'),
);

function writeSyncFixture(options: {
  files?: string[];
  name: string;
  packageManager?: string | null;
  scripts: Record<string, string>;
  withInstallMarker?: boolean;
}) {
  const projectDir = path.join(tempRoot, options.name);
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(
      {
        name: options.name,
        ...(options.packageManager === null
          ? {}
          : { packageManager: options.packageManager ?? 'npm@10.9.0' }),
        scripts: options.scripts,
      },
      null,
      2,
    ),
    'utf8',
  );
  if (options.withInstallMarker) {
    fs.mkdirSync(path.join(projectDir, 'node_modules'), {
      recursive: true,
    });
  }
  for (const file of options.files ?? []) {
    fs.writeFileSync(path.join(projectDir, file), '', 'utf8');
  }
  return projectDir;
}

afterAll(() => {
  fs.rmSync(tempRoot, { force: true, recursive: true });
});

test('sync fails early with install guidance when local dependencies are missing', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-no-install',
    scripts: {
      sync: 'tsx scripts/sync-project.ts',
    },
  });

  const error = await executeSyncCommand({ cwd: projectDir }).catch(
    (thrown) => thrown,
  );

  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toContain('npm install');
  expect((error as Error).message).toContain('wp-typia sync');
  expect((error as Error).message).toContain('tsx');
});

test('dry-run sync previews commands without requiring installed dependencies', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-dry-run-preview',
    scripts: {
      sync: 'tsx scripts/sync-project.ts',
    },
  });

  const result = await executeSyncCommand({
    check: true,
    cwd: projectDir,
    dryRun: true,
  });

  expect(result.dryRun).toBe(true);
  expect(result.executedCommands).toBeUndefined();
  expect(result.plannedCommands).toEqual([
    {
      args: ['run', 'sync', '--', '--check'],
      command: 'npm',
      displayCommand: 'npm run sync -- --check',
      scriptName: 'sync',
    },
  ]);
});

test('sync infers package manager from shared lockfile and PnP signals', async () => {
  const cases = [
    {
      command: 'yarn',
      displayCommand: 'yarn run sync --check',
      files: ['.pnp.cjs'],
      name: 'demo-sync-yarn-pnp',
      packageManager: 'yarn',
    },
    {
      command: 'npm',
      displayCommand: 'npm run sync -- --check',
      files: ['package-lock.json'],
      name: 'demo-sync-npm-lock',
      packageManager: 'npm',
    },
    {
      command: 'npm',
      displayCommand: 'npm run sync -- --check',
      files: ['npm-shrinkwrap.json'],
      name: 'demo-sync-npm-shrinkwrap',
      packageManager: 'npm',
    },
    {
      command: 'pnpm',
      displayCommand: 'pnpm run sync --check',
      files: ['pnpm-lock.yaml'],
      name: 'demo-sync-pnpm-lock',
      packageManager: 'pnpm',
    },
    {
      command: 'bun',
      displayCommand: 'bun run sync --check',
      files: ['bun.lockb'],
      name: 'demo-sync-bun-lock',
      packageManager: 'bun',
    },
    {
      command: 'npm',
      displayCommand: 'npm run sync -- --check',
      files: [],
      name: 'demo-sync-npm-fallback',
      packageManager: 'npm',
    },
  ] as const;

  for (const testCase of cases) {
    const projectDir = writeSyncFixture({
      files: [...testCase.files],
      name: testCase.name,
      packageManager: null,
      scripts: {
        sync: 'node scripts/record.mjs sync',
      },
    });
    const result = await executeSyncCommand({
      check: true,
      cwd: projectDir,
      dryRun: true,
    });

    expect(result.packageManager).toBe(testCase.packageManager);
    expect(result.plannedCommands[0]).toMatchObject({
      command: testCase.command,
      displayCommand: testCase.displayCommand,
      scriptName: 'sync',
    });
  }
});

test('sync can capture executed script output for structured callers', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-capture-output',
    scripts: {
      sync: 'node scripts/record.mjs sync',
    },
    withInstallMarker: true,
  });
  const scriptsDir = path.join(projectDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(scriptsDir, 'record.mjs'),
    [
      'const [, , label] = process.argv;',
      'console.log(`ran:${label}`);',
      'console.error(`stderr:${label}`);',
    ].join('\n'),
    'utf8',
  );

  const result = await executeSyncCommand({
    captureOutput: true,
    cwd: projectDir,
  });

  expect(result.executedCommands).toHaveLength(1);
  expect(result.executedCommands?.[0]).toMatchObject({
    args: ['run', 'sync'],
    command: 'npm',
    displayCommand: 'npm run sync',
    exitCode: 0,
    scriptName: 'sync',
    stderr: 'stderr:sync\n',
  });
  expect(result.executedCommands?.[0]?.stdout).toContain('ran:sync\n');
});

test('sync execution failures carry a stable command-execution code', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-failure-code',
    scripts: {
      sync: 'node scripts/fail.mjs',
    },
    withInstallMarker: true,
  });
  const scriptsDir = path.join(projectDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(scriptsDir, 'fail.mjs'),
    ['console.error("sync failed intentionally");', 'process.exit(42);'].join(
      '\n',
    ),
    'utf8',
  );

  const error = await executeSyncCommand({
    captureOutput: true,
    cwd: projectDir,
  }).catch((thrown) => thrown);

  expect(error).toBeInstanceOf(Error);
  expect((error as { code?: string }).code).toBe('command-execution');
  expect((error as Error).message).toContain('npm run sync');
});

test('legacy split sync plans include sync-ai after sync-rest when the project opts in', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-with-ai',
    scripts: {
      'sync-ai': 'node scripts/record.mjs sync-ai',
      'sync-rest': 'node scripts/record.mjs sync-rest',
      'sync-types': 'node scripts/record.mjs sync-types',
    },
  });

  const result = await executeSyncCommand({
    check: true,
    cwd: projectDir,
    dryRun: true,
  });

  expect(result.target).toBe('default');
  expect(result.plannedCommands).toEqual([
    {
      args: ['run', 'sync-types', '--', '--check'],
      command: 'npm',
      displayCommand: 'npm run sync-types -- --check',
      scriptName: 'sync-types',
    },
    {
      args: ['run', 'sync-rest', '--', '--check'],
      command: 'npm',
      displayCommand: 'npm run sync-rest -- --check',
      scriptName: 'sync-rest',
    },
    {
      args: ['run', 'sync-ai', '--', '--check'],
      command: 'npm',
      displayCommand: 'npm run sync-ai -- --check',
      scriptName: 'sync-ai',
    },
  ]);
});

test('sync ai targets the dedicated sync-ai script only', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-ai-only',
    scripts: {
      sync: 'node scripts/record.mjs sync',
      'sync-ai': 'node scripts/record.mjs sync-ai',
    },
    withInstallMarker: true,
  });
  const scriptsDir = path.join(projectDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(scriptsDir, 'record.mjs'),
    ['const [, , label] = process.argv;', 'console.log(`ran:${label}`);'].join(
      '\n',
    ),
    'utf8',
  );

  const result = await executeSyncCommand({
    captureOutput: true,
    check: true,
    cwd: projectDir,
    target: 'ai',
  });

  expect(result.target).toBe('ai');
  expect(result.executedCommands).toHaveLength(1);
  expect(result.executedCommands?.[0]).toMatchObject({
    args: ['run', 'sync-ai', '--', '--check'],
    command: 'npm',
    displayCommand: 'npm run sync-ai -- --check',
    scriptName: 'sync-ai',
  });
  expect(result.executedCommands?.[0]?.stdout).toContain('ran:sync-ai\n');
});

test('sync ai preserves the legacy sync-wordpress-ai script key when needed', async () => {
  const projectDir = writeSyncFixture({
    name: 'demo-sync-ai-legacy-only',
    scripts: {
      'sync-wordpress-ai': 'node scripts/record.mjs sync-wordpress-ai',
    },
    withInstallMarker: true,
  });
  const scriptsDir = path.join(projectDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(
    path.join(scriptsDir, 'record.mjs'),
    ['const [, , label] = process.argv;', 'console.log(`ran:${label}`);'].join(
      '\n',
    ),
    'utf8',
  );

  const result = await executeSyncCommand({
    captureOutput: true,
    check: true,
    cwd: projectDir,
    target: 'ai',
  });

  expect(result.target).toBe('ai');
  expect(result.executedCommands).toHaveLength(1);
  expect(result.executedCommands?.[0]).toMatchObject({
    args: ['run', 'sync-wordpress-ai', '--', '--check'],
    command: 'npm',
    displayCommand: 'npm run sync-wordpress-ai -- --check',
    scriptName: 'sync-wordpress-ai',
  });
  expect(result.executedCommands?.[0]?.stdout).toContain(
    'ran:sync-wordpress-ai\n',
  );
});
