import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';

import packageJson from '../package.json';
import { runNodeCli, runNodeCliEntrypoint } from '../src/node-cli';

async function captureNodeCli(
  argv: string[],
  options: {
    cwd?: string;
    entrypoint?: boolean;
  } = {},
): Promise<{
  error: unknown;
  exitCode: string | number;
  stderr: string;
  stdout: string;
}> {
  const originalCwd = process.cwd();
  const originalExitCode = process.exitCode;
  const originalError = console.error;
  const originalLog = console.log;
  const originalStderrWrite = process.stderr.write;
  const originalWarn = console.warn;
  const stderr: string[] = [];
  const stdout: string[] = [];
  let error: unknown;

  process.exitCode = 0;
  console.log = (...args: unknown[]) => {
    stdout.push(args.map(String).join(' '));
  };
  console.error = (...args: unknown[]) => {
    stderr.push(args.map(String).join(' '));
  };
  console.warn = (...args: unknown[]) => {
    stderr.push(args.map(String).join(' '));
  };
  process.stderr.write = ((chunk: unknown, ...args: unknown[]) => {
    stderr.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
    const callback = args.find(
      (arg): arg is (error?: Error | null) => void =>
        typeof arg === 'function',
    );
    callback?.();
    return true;
  }) as typeof process.stderr.write;

  try {
    if (options.cwd) {
      process.chdir(options.cwd);
    }
    try {
      if (options.entrypoint) {
        await runNodeCliEntrypoint(argv);
      } else {
        await runNodeCli(argv);
      }
    } catch (caught) {
      error = caught;
    }

    return {
      error,
      exitCode: process.exitCode ?? 0,
      stderr: stderr.join('\n'),
      stdout: stdout.join('\n'),
    };
  } finally {
    if (options.cwd) {
      process.chdir(originalCwd);
    }
    console.error = originalError;
    console.log = originalLog;
    console.warn = originalWarn;
    process.stderr.write = originalStderrWrite;
    process.exitCode = originalExitCode;
  }
}

function createTempRoot(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function removeTempRoot(tempRoot: string): void {
  fs.rmSync(tempRoot, { force: true, recursive: true });
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

describe('Node fallback CLI core routing', () => {
  afterEach(() => {
    process.exitCode = 0;
  });

  test('prints general help and marks no-command invocations as errors', async () => {
    const result = await captureNodeCli([]);

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain(`wp-typia ${packageJson.version}`);
    expect(result.stdout).toContain(
      'Canonical CLI package for wp-typia scaffolding',
    );
    expect(result.stdout).toContain('Runtime: Node fallback');
    expect(result.stdout).toContain('Commands:');
  });

  test('routes explicit help flags and help targets to the fallback help renderers', async () => {
    const generalHelp = await captureNodeCli(['--help']);
    const createHelp = await captureNodeCli(['--help', 'create']);
    const commandHelp = await captureNodeCli(['help', 'templates']);

    expect(generalHelp.error).toBeUndefined();
    expect(generalHelp.exitCode).toBe(0);
    expect(generalHelp.stdout).toContain('Commands:');
    expect(generalHelp.stdout).toContain('standalone wp-typia binary');

    expect(createHelp.error).toBeUndefined();
    expect(createHelp.exitCode).toBe(0);
    expect(createHelp.stdout).toContain('Usage: wp-typia create <project-dir>');
    expect(createHelp.stdout).toContain('Runtime: Node fallback');
    expect(createHelp.stdout).toContain('Supported flags:');
    expect(createHelp.stdout).toContain('--template');

    expect(commandHelp.error).toBeUndefined();
    expect(commandHelp.exitCode).toBe(0);
    expect(commandHelp.stdout).toContain('wp-typia templates <list|inspect>');
    expect(commandHelp.stdout).toContain('Runtime: Node fallback');
    expect(commandHelp.stdout).toContain('Supported flags:');
    expect(commandHelp.stdout).toContain('--id');
  });

  test('falls back to general help for unknown help targets without dispatching commands', async () => {
    const result = await captureNodeCli(['help', 'definitely-not-a-command']);

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Commands:');
    expect(result.stdout).toContain(
      'Canonical CLI package for wp-typia scaffolding',
    );
    expect(result.stdout).not.toContain('Usage: wp-typia create <project-dir>');
  });

  test('prints human and structured version output from the fallback runtime', async () => {
    const human = await captureNodeCli(['--version']);
    const text = await captureNodeCli(['version', '--format', 'text']);
    const legacyToon = await captureNodeCli(['version', '--format', 'toon']);
    const structured = await captureNodeCli(['version', '--format', 'json']);
    const parsed = JSON.parse(structured.stdout) as {
      data?: { name?: string; type?: string; version?: string };
      ok?: boolean;
    };

    expect(human.error).toBeUndefined();
    expect(human.exitCode).toBe(0);
    expect(human.stdout.trim()).toBe(`wp-typia ${packageJson.version}`);

    expect(text.error).toBeUndefined();
    expect(text.exitCode).toBe(0);
    expect(text.stdout.trim()).toBe(`wp-typia ${packageJson.version}`);

    expect(legacyToon.error).toBeUndefined();
    expect(legacyToon.exitCode).toBe(0);
    expect(legacyToon.stdout.trim()).toBe(`wp-typia ${packageJson.version}`);

    expect(structured.error).toBeUndefined();
    expect(structured.exitCode).toBe(0);
    expect(parsed.ok).toBe(true);
    expect(parsed.data?.name).toBe('wp-typia');
    expect(parsed.data?.type).toBe('version');
    expect(parsed.data?.version).toBe(packageJson.version);
  });

  test('dispatches create dry-runs through the Node fallback runtime', async () => {
    const tempRoot = createTempRoot('wp-typia-node-create-');

    try {
      const result = await captureNodeCli(
        ['create', 'demo-card', '--dry-run', '--template', 'basic', '--yes'],
        { cwd: tempRoot },
      );

      expect(result.error).toBeUndefined();
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('Dry run for Demo Card');
      expect(result.stdout).toContain('Template: basic');
      expect(result.stdout).toContain('No files were written');
      expect(fs.existsSync(path.join(tempRoot, 'demo-card'))).toBe(false);
    } finally {
      removeTempRoot(tempRoot);
    }
  });

  test('keeps add dispatch on stdout help and command diagnostics for missing kinds', async () => {
    const result = await captureNodeCli(['add']);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Usage:');
    expect(result.stdout).toContain('wp-typia add block <name>');
    expect(result.error).toMatchObject({
      code: 'missing-argument',
      command: 'add',
    });
  });

  test('dispatches init structured previews from the Node fallback runtime', async () => {
    const tempRoot = createTempRoot('wp-typia-node-init-');

    try {
      const result = await captureNodeCli(['init', '--format', 'json'], {
        cwd: tempRoot,
      });
      const parsed = JSON.parse(result.stdout) as {
        data?: {
          command?: string;
          detectedLayout?: { kind?: string };
          mode?: string;
          packageManager?: string;
        };
        ok?: boolean;
      };

      expect(result.error).toBeUndefined();
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(parsed.ok).toBe(true);
      expect(parsed.data?.command).toBe('init');
      expect(parsed.data?.mode).toBe('preview');
      expect(parsed.data?.packageManager).toBe('npm');
      expect(parsed.data?.detectedLayout?.kind).toBe('unsupported');
    } finally {
      removeTempRoot(tempRoot);
    }
  });

  test('rejects invalid output formats before Node fallback dispatch', async () => {
    const result = await captureNodeCli(['templates', 'list', '--format', 'jso']);

    expect(result.stdout).toBe('');
    expect(result.stderr).toBe('');
    expect(result.error).toMatchObject({
      code: 'invalid-argument',
      command: 'templates',
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toContain(
      'Invalid --format value "jso". Supported values: json, text.',
    );
  });

  test('emits structured command output when --format json is explicit', async () => {
    const tempRoot = createTempRoot('wp-typia-node-json-create-');

    try {
      const result = await captureNodeCli(
        [
          'create',
          'json-card',
          '--dry-run',
          '--template',
          'basic',
          '--yes',
          '--format',
          'json',
        ],
        { cwd: tempRoot },
      );
      const parsed = JSON.parse(result.stdout) as {
        data?: {
          command?: string;
          dryRun?: boolean;
          files?: string[];
          template?: string;
        };
        ok?: boolean;
      };

      expect(result.error).toBeUndefined();
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(parsed.ok).toBe(true);
      expect(parsed.data?.command).toBe('create');
      expect(parsed.data?.dryRun).toBe(true);
      expect(parsed.data?.template).toBe('basic');
      expect(parsed.data?.files).toContain('src/block.json');
    } finally {
      removeTempRoot(tempRoot);
    }
  });

  test('applies --config overrides before dispatching create defaults', async () => {
    const tempRoot = createTempRoot('wp-typia-node-config-create-');
    writeJson(path.join(tempRoot, 'wp-typia.config.json'), {
      create: {
        'dry-run': true,
        'package-manager': 'pnpm',
        template: 'interactivity',
        yes: true,
      },
    });

    try {
      const result = await captureNodeCli(
        [
          'create',
          'config-card',
          '--config',
          'wp-typia.config.json',
          '--format',
          'json',
        ],
        { cwd: tempRoot },
      );
      const parsed = JSON.parse(result.stdout) as {
        data?: {
          completion?: { summaryLines?: string[] };
          dryRun?: boolean;
          files?: string[];
          template?: string;
        };
        ok?: boolean;
      };

      expect(result.error).toBeUndefined();
      expect(result.exitCode).toBe(0);
      expect(result.stderr).toBe('');
      expect(parsed.ok).toBe(true);
      expect(parsed.data?.dryRun).toBe(true);
      expect(parsed.data?.template).toBe('interactivity');
      expect(parsed.data?.completion?.summaryLines).toContain(
        'Package manager: pnpm',
      );
      expect(parsed.data?.files).toContain('src/interactivity.ts');
    } finally {
      removeTempRoot(tempRoot);
    }
  });

  test('captures structured entrypoint errors on stderr', async () => {
    const result = await captureNodeCli(['create', '--format', 'json'], {
      entrypoint: true,
    });
    const parsed = JSON.parse(result.stderr) as {
      error?: { code?: string; command?: string; kind?: string };
      ok?: boolean;
    };

    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe('');
    expect(parsed.ok).toBe(false);
    expect(parsed.error?.kind).toBe('command-execution');
    expect(parsed.error?.command).toBe('create');
    expect(parsed.error?.code).toBe('missing-argument');
  });

  test('keeps Bun-only top-level commands on the unsupported-command diagnostic path', async () => {
    const result = await captureNodeCli(['skills', 'list']);

    expect(result.stdout).toBe('');
    expect(result.error).toMatchObject({
      code: 'unsupported-command',
      command: 'skills',
    });
  });
});
