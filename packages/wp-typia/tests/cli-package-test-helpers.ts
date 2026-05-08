import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import {
  fullRuntimeCommands,
  interactiveRuntimeCommands,
  longValueOptions,
  reservedCommands,
  shortValueOptions,
} from '../bin/routing-metadata.generated.js';
import { shouldRouteToFullRuntime } from '../bin/runtime-routing.js';

export const packageRoot = path.resolve(import.meta.dir, '..');
export const entryPath = path.join(packageRoot, 'bin', 'wp-typia.js');
export const fullRuntimeEntrypoint = path.join(
  packageRoot,
  'dist-bunli',
  'cli.js',
);

export function runCapturedCommand(
  command: string,
  args: string[],
  options: Parameters<typeof spawnSync>[2] = {},
) {
  return spawnSync(command, args, {
    ...options,
    encoding: 'utf8',
  });
}

export function withoutAIAgentEnv(): NodeJS.ProcessEnv {
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

export function withoutLocalBunEnv(): NodeJS.ProcessEnv {
  return {
    ...withoutAIAgentEnv(),
    BUN_BIN: path.join(os.tmpdir(), 'wp-typia-missing-bun'),
    PATH: path.dirname(process.execPath),
  };
}

export function shouldRouteTestInvocationToFullRuntime(
  argv: string[],
  options: {
    hasBuiltRuntime?: boolean;
    hasWorkingBun?: boolean;
    isTTY?: boolean;
    term?: string;
  } = {},
): boolean {
  return shouldRouteToFullRuntime({
    argv,
    fullRuntimeCommands,
    hasBuiltRuntime: options.hasBuiltRuntime ?? true,
    hasWorkingBun: options.hasWorkingBun ?? true,
    interactiveRuntimeCommands,
    longValueOptions,
    reservedCommands,
    shortValueOptions,
    stdin: { isTTY: options.isTTY ?? true },
    stdout: { isTTY: options.isTTY ?? true },
    term: options.term ?? 'xterm-256color',
  });
}

export function parseJsonObjectFromOutput<T>(output: string): T {
  const trimmed = output.trim();
  const jsonStart = trimmed.startsWith('{') ? 0 : trimmed.lastIndexOf('\n{');
  const jsonSource = (
    jsonStart >= 0
      ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1)
      : trimmed
  ).trim();
  return JSON.parse(jsonSource) as T;
}

export function parseJsonArrayFromOutput<T>(output: string): T {
  const trimmed = output.trim();
  const jsonStart = trimmed.startsWith('[') ? 0 : trimmed.lastIndexOf('\n[');
  const jsonSource = (
    jsonStart >= 0
      ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1)
      : trimmed
  ).trim();
  return JSON.parse(jsonSource) as T;
}
