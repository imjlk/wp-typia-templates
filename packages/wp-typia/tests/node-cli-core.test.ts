import { afterEach, describe, expect, test } from 'bun:test';

import packageJson from '../package.json';
import { runNodeCli } from '../src/node-cli';

async function captureNodeCli(argv: string[]): Promise<{
  error: unknown;
  exitCode: string | number;
  stdout: string;
}> {
  const originalExitCode = process.exitCode;
  const originalLog = console.log;
  const lines: string[] = [];
  let error: unknown;

  process.exitCode = 0;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };

  try {
    try {
      await runNodeCli(argv);
    } catch (caught) {
      error = caught;
    }

    return {
      error,
      exitCode: process.exitCode ?? 0,
      stdout: lines.join('\n'),
    };
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
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
    expect(createHelp.stdout).toContain('--template');

    expect(commandHelp.error).toBeUndefined();
    expect(commandHelp.exitCode).toBe(0);
    expect(commandHelp.stdout).toContain('wp-typia templates <list|inspect>');
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

  test('keeps Bun-only top-level commands on the unsupported-command diagnostic path', async () => {
    const result = await captureNodeCli(['skills', 'list']);

    expect(result.stdout).toBe('');
    expect(result.error).toMatchObject({
      code: 'unsupported-command',
      command: 'skills',
    });
  });
});
