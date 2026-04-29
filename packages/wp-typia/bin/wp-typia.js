#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  fullRuntimeCommands,
  interactiveRuntimeCommands,
  longValueOptions,
  reservedCommands,
  shortValueOptions,
} from './routing-metadata.generated.js';
import {
  getRuntimeRoutingInvocation,
  shouldRouteToFullRuntime,
} from './runtime-routing.js';

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const cliEntrypoint = path.join(packageRoot, 'dist-bunli', 'cli.js');
const nodeCliEntrypoint = path.join(packageRoot, 'dist-bunli', 'node-cli.js');
const bunBinary = process.env.BUN_BIN || 'bun';
const fullRuntimeCommandSet = new Set(fullRuntimeCommands);
const interactiveRuntimeCommandSet = new Set(interactiveRuntimeCommands);
const longValueOptionSet = new Set(longValueOptions);
const reservedCommandSet = new Set(reservedCommands);
const shortValueOptionSet = new Set(shortValueOptions);
const buildScriptEntrypoint = path.join(
  packageRoot,
  'scripts',
  'build-bunli-runtime.ts',
);
const sourceCliEntrypoint = path.join(packageRoot, 'src', 'cli.ts');
const standaloneGuidance =
  'Prefer not to install Bun? Use the standalone wp-typia binary from the GitHub release assets.';

function isWorkingBunBinary() {
  const bunCheck = spawnSync(bunBinary, ['--version'], {
    env: process.env,
    stdio: 'ignore',
  });

  return !bunCheck.error && bunCheck.status === 0;
}

function canAutobuildSourceCheckout() {
  return (
    fs.existsSync(buildScriptEntrypoint) && fs.existsSync(sourceCliEntrypoint)
  );
}

function ensureBuiltRuntime() {
  if (fs.existsSync(cliEntrypoint) && fs.existsSync(nodeCliEntrypoint)) {
    return true;
  }

  if (!canAutobuildSourceCheckout() || !isWorkingBunBinary()) {
    return false;
  }

  const buildResult = spawnSync(bunBinary, ['run', 'build'], {
    cwd: packageRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (buildResult.status !== 0) {
    process.exit(buildResult.status ?? 1);
  }

  return fs.existsSync(cliEntrypoint) && fs.existsSync(nodeCliEntrypoint);
}

const argv = process.argv.slice(2);
const { command } = getRuntimeRoutingInvocation(argv, {
  longValueOptions: longValueOptionSet,
  reservedCommands: reservedCommandSet,
  shortValueOptions: shortValueOptionSet,
});
const commandRequiresFullRuntime = command
  ? fullRuntimeCommandSet.has(command)
  : false;
const hasBuiltRuntime = ensureBuiltRuntime();
const hasWorkingBun = isWorkingBunBinary();
const shouldUseFullRuntime = shouldRouteToFullRuntime({
  argv,
  fullRuntimeCommands: fullRuntimeCommandSet,
  hasBuiltRuntime,
  hasWorkingBun,
  interactiveRuntimeCommands: interactiveRuntimeCommandSet,
  longValueOptions: longValueOptionSet,
  reservedCommands: reservedCommandSet,
  shortValueOptions: shortValueOptionSet,
});

// Keep common help and explicit non-TUI calls on the human-readable Node fallback
// even when Bun is present.
if (hasWorkingBun && hasBuiltRuntime && shouldUseFullRuntime) {
  const result = spawnSync(bunBinary, [cliEntrypoint, ...argv], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

if (commandRequiresFullRuntime) {
  if (!hasBuiltRuntime) {
    console.error(
      'Error: wp-typia could not locate its built CLI runtime. Reinstall the published package, or run `bun run build` when using a source checkout.',
    );
    process.exit(1);
  }

  console.error(
    `Error: wp-typia ${command} requires Bun. Install Bun locally, run with bunx, or set BUN_BIN to a working Bun executable. ${standaloneGuidance}`,
  );
  process.exit(1);
}

if (!hasBuiltRuntime || !fs.existsSync(nodeCliEntrypoint)) {
  console.error(
    'Error: wp-typia could not locate its Node fallback runtime. Reinstall the published package, or run `bun run build` when using a source checkout.',
  );
  process.exit(1);
}

const cliModule = await import(pathToFileURL(nodeCliEntrypoint).href);
await cliModule.runNodeCliEntrypoint(argv);
