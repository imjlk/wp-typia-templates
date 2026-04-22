import fs from 'node:fs/promises';
import path from 'node:path';

import { bunliConfig } from '../bunli.config';
import {
  ensureRuntimeBuildDependencies,
  packageRoot,
  PROJECT_TOOLS_ALIASES,
  WP_TYPIA_EXTERNALS,
} from './runtime-build-dependencies';

const buildConfig = bunliConfig.build;

if (!buildConfig?.entry || !buildConfig?.outdir) {
  throw new Error(
    'wp-typia bunli.config.ts is missing build.entry or build.outdir.',
  );
}

const fullRuntimeEntrypoint = path.resolve(packageRoot, buildConfig.entry);
const generatedMetadataEntrypoint = path.resolve(
  packageRoot,
  '.bunli',
  'commands.gen.ts',
);
const nodeRuntimeEntrypoint = path.resolve(packageRoot, 'src', 'node-cli.ts');
const isLinkedInstalledWpTypiaRuntime = packageRoot.includes(
  `${path.sep}node_modules${path.sep}.bun${path.sep}`,
);
const outdir = path.resolve(packageRoot, buildConfig.outdir);
const generatedMetadataOutdir = path.join(outdir, '.bunli');
async function buildFullBunliRuntime() {
  const result = await Bun.build({
    alias: PROJECT_TOOLS_ALIASES,
    entrypoints: [fullRuntimeEntrypoint],
    external: WP_TYPIA_EXTERNALS,
    format: 'esm',
    naming: {
      asset: '.bunli/[name]-[hash].[ext]',
      chunk: '[name]-[hash].[ext]',
      entry: '[name].[ext]',
    },
    outdir,
    root: packageRoot,
    sourcemap: buildConfig.sourcemap ? 'external' : 'none',
    // Keep the repo-owned runtime split so canonical help/completion flows
    // avoid eagerly resolving heavy external runtime packages, but collapse
    // linked installed-package rebuilds into a single file to avoid Bun asset
    // path collisions inside `.bun` store copies used by generated smoke.
    splitting: !isLinkedInstalledWpTypiaRuntime,
    target: 'bun',
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function buildGeneratedMetadataRuntime() {
  const result = await Bun.build({
    alias: PROJECT_TOOLS_ALIASES,
    entrypoints: [generatedMetadataEntrypoint],
    external: WP_TYPIA_EXTERNALS,
    format: 'esm',
    outdir: generatedMetadataOutdir,
    sourcemap: buildConfig.sourcemap ? 'external' : 'none',
    splitting: false,
    target: 'bun',
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

async function buildNodeFallbackRuntime() {
  const result = await Bun.build({
    entrypoints: [nodeRuntimeEntrypoint],
    format: 'esm',
    outdir,
    packages: 'external',
    sourcemap: buildConfig.sourcemap ? 'external' : 'none',
    target: 'node',
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }
}

await ensureRuntimeBuildDependencies();
await fs.rm(outdir, { force: true, recursive: true });
await fs.mkdir(outdir, { recursive: true });

await buildFullBunliRuntime();
await buildGeneratedMetadataRuntime();
await buildNodeFallbackRuntime();

await fs.access(path.join(outdir, 'cli.js'));
await fs.access(path.join(generatedMetadataOutdir, 'commands.gen.js'));
await fs.access(path.join(outdir, 'node-cli.js'));
