import fs from "node:fs/promises";
import path from "node:path";

import { bunliConfig } from "../bunli.config";

const packageRoot = path.resolve(import.meta.dir, "..");
const buildConfig = bunliConfig.build;

if (!buildConfig?.entry || !buildConfig?.outdir) {
	throw new Error("wp-typia bunli.config.ts is missing build.entry or build.outdir.");
}

const fullRuntimeEntrypoint = path.resolve(packageRoot, buildConfig.entry);
const nodeRuntimeEntrypoint = path.resolve(packageRoot, "src", "node-cli.ts");
const outdir = path.resolve(packageRoot, buildConfig.outdir);
const projectToolsRuntimeDir = path.resolve(
	packageRoot,
	"..",
	"wp-typia-project-tools",
	"dist",
	"runtime",
);
const apiClientDistDir = path.resolve(packageRoot, "..", "wp-typia-api-client", "dist");
const PROJECT_TOOLS_ALIASES = {
	"@wp-typia/api-client/runtime-primitives": path.join(
		apiClientDistDir,
		"runtime-primitives.js",
	),
	"@wp-typia/api-client/internal/runtime-primitives": path.join(
		apiClientDistDir,
		"internal",
		"runtime-primitives.js",
	),
	"@wp-typia/project-tools/cli-add": path.join(projectToolsRuntimeDir, "cli-add.js"),
	"@wp-typia/project-tools/cli-diagnostics": path.join(
		projectToolsRuntimeDir,
		"cli-diagnostics.js",
	),
	"@wp-typia/project-tools/cli-doctor": path.join(projectToolsRuntimeDir, "cli-doctor.js"),
	"@wp-typia/project-tools/cli-prompt": path.join(projectToolsRuntimeDir, "cli-prompt.js"),
	"@wp-typia/project-tools/cli-scaffold": path.join(projectToolsRuntimeDir, "cli-scaffold.js"),
	"@wp-typia/project-tools/cli-templates": path.join(
		projectToolsRuntimeDir,
		"cli-templates.js",
	),
	"@wp-typia/project-tools/hooked-blocks": path.join(
		projectToolsRuntimeDir,
		"hooked-blocks.js",
	),
	"@wp-typia/project-tools/migrations": path.join(projectToolsRuntimeDir, "migrations.js"),
	"@wp-typia/project-tools/package-managers": path.join(
		projectToolsRuntimeDir,
		"package-managers.js",
	),
	"@wp-typia/project-tools/workspace-project": path.join(
		projectToolsRuntimeDir,
		"workspace-project.js",
	),
};
const WP_TYPIA_EXTERNALS = [
	"@wp-typia/api-client",
	"@wp-typia/api-client/*",
	"@wp-typia/block-runtime",
	"@wp-typia/block-runtime/*",
	"@wp-typia/block-types",
	"@wp-typia/block-types/*",
	"@wp-typia/rest",
	"@wp-typia/rest/*",
];

async function buildFullBunliRuntime() {
	const result = await Bun.build({
		alias: PROJECT_TOOLS_ALIASES,
		entrypoints: [fullRuntimeEntrypoint],
		external: WP_TYPIA_EXTERNALS,
		format: "esm",
		outdir,
		sourcemap: buildConfig.sourcemap ? "external" : "none",
		splitting: true,
		target: "bun",
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
		format: "esm",
		outdir,
		packages: "external",
		sourcemap: buildConfig.sourcemap ? "external" : "none",
		target: "node",
	});

	if (!result.success) {
		for (const log of result.logs) {
			console.error(log);
		}
		process.exit(1);
	}
}

await fs.rm(outdir, { force: true, recursive: true });
await fs.mkdir(outdir, { recursive: true });

await buildFullBunliRuntime();
await buildNodeFallbackRuntime();

await fs.access(path.join(outdir, "cli.js"));
await fs.access(path.join(outdir, "node-cli.js"));
