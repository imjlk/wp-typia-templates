import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const measuredRuns = 5;
const warmupRuns = 1;

function ensureBuildArtifacts() {
	const requiredPaths = [
		path.join(repoRoot, "packages", "create", "dist", "cli.js"),
		path.join(repoRoot, "packages", "create", "dist", "runtime", "template-render.js"),
	];

	for (const requiredPath of requiredPaths) {
		if (!fs.existsSync(requiredPath)) {
			throw new Error(
				`Missing build artifact: ${path.relative(repoRoot, requiredPath)}. Run "bun run build" first.`,
			);
		}
	}
}

function median(values) {
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[middle - 1] + sorted[middle]) / 2
		: sorted[middle];
}

function formatMs(value) {
	return `${value.toFixed(1)}ms`;
}

function measureProcessCommand(command, args, cwd) {
	const startedAt = performance.now();
	execFileSync(command, args, {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
		env: {
			...process.env,
			FORCE_COLOR: "0",
			NO_COLOR: "1",
		},
	});
	return performance.now() - startedAt;
}

async function measureTemplateRenderingHotPath() {
	const modulePath = path.join(
		repoRoot,
		"packages",
		"create",
		"dist",
		"runtime",
		"template-render.js",
	);
	const { copyRenderedDirectory } = await import(pathToFileURL(modulePath).href);
	const sourceDir = fs.mkdtempSync(
		path.join(os.tmpdir(), "wp-typia-template-render-benchmark-source-"),
	);
	const destinationRoot = fs.mkdtempSync(
		path.join(os.tmpdir(), "wp-typia-template-render-benchmark-dest-"),
	);

	try {
		for (let index = 0; index < 40; index += 1) {
			const templateDir = path.join(sourceDir, `section-${index}`);
			fs.mkdirSync(templateDir, { recursive: true });
			fs.writeFileSync(
				path.join(templateDir, `{{slug}}-${index}.mustache`),
				[
					"export const title = '{{title}}';",
					"export const description = '{{description}}';",
					"export const namespace = '{{namespace}}';",
					"export const slug = '{{slug}}';",
					"export const cssClass = '{{className}}';",
					"export const summary = '{{summary}}';",
					"export const repeated = '{{title}}::{{description}}::{{title}}';",
				].join("\n"),
				"utf8",
			);
		}

		const startedAt = performance.now();
		for (let iteration = 0; iteration < 15; iteration += 1) {
			const targetDir = path.join(destinationRoot, `run-${iteration}`);
			await copyRenderedDirectory(sourceDir, targetDir, {
				className: "wp-block-demo__card",
				description: "Performance fixture for repeated Mustache rendering.",
				namespace: "demo/performance",
				slug: "hot-path",
				summary: "Repeated rendering workload",
				title: "Performance Fixture",
			});
		}
		return performance.now() - startedAt;
	} finally {
		fs.rmSync(sourceDir, { force: true, recursive: true });
		fs.rmSync(destinationRoot, { force: true, recursive: true });
	}
}

async function runScenario(name, run) {
	for (let iteration = 0; iteration < warmupRuns; iteration += 1) {
		await run();
	}

	const durations = [];
	for (let iteration = 0; iteration < measuredRuns; iteration += 1) {
		durations.push(await run());
	}

	return {
		durations,
		median: median(durations),
		name,
	};
}

async function main() {
	ensureBuildArtifacts();

	const scenarios = [
		{
			name: "compound sync-types",
			run: () =>
				measureProcessCommand("bun", ["run", "sync-types"], path.join(repoRoot, "examples", "compound-patterns")),
		},
		{
			name: "persistence sync-rest",
			run: () =>
				measureProcessCommand("bun", ["run", "sync-rest"], path.join(repoRoot, "examples", "persistence-examples")),
		},
		{
			name: "cli templates list",
			run: () =>
				measureProcessCommand(
					"node",
					["packages/create/dist/cli.js", "templates", "list"],
					repoRoot,
				),
		},
		{
			name: "cli doctor",
			run: () =>
				measureProcessCommand("node", ["packages/create/dist/cli.js", "doctor"], repoRoot),
		},
		{
			name: "template render hot path",
			run: () => measureTemplateRenderingHotPath(),
		},
	];

	console.log(`Benchmarking create/runtime hot paths from ${repoRoot}`);
	console.log(`Warmup runs: ${warmupRuns}`);
	console.log(`Measured runs: ${measuredRuns}`);

	for (const scenario of scenarios) {
		const result = await runScenario(scenario.name, scenario.run);
		console.log(
			`${result.name.padEnd(26)} median=${formatMs(result.median)} samples=[${result.durations
				.map((value) => formatMs(value))
				.join(", ")}]`,
		);
	}
}

main().catch((error) => {
	console.error("benchmark:create-runtime failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
