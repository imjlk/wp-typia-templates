#!/usr/bin/env node

import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntrypoint = path.join(packageRoot, "dist-bunli", "cli.js");
const nodeCliEntrypoint = path.join(packageRoot, "dist-bunli", "node-cli.js");
const bunBinary = process.env.BUN_BIN || "bun";
const fullRuntimeCommands = new Set(["complete", "completions", "mcp", "skills"]);
const valueOptions = new Set(["--config", "--format", "--id", "--output-dir", "-c", "-p", "-t"]);
const buildScriptEntrypoint = path.join(packageRoot, "scripts", "build-bunli-runtime.ts");
const sourceCliEntrypoint = path.join(packageRoot, "src", "cli.ts");

function firstPositional(argv) {
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg || arg === "--") {
			break;
		}
		if (valueOptions.has(arg)) {
			index += 1;
			continue;
		}
		if (
			arg.startsWith("--config=") ||
			arg.startsWith("--format=") ||
			arg.startsWith("--id=") ||
			arg.startsWith("--output-dir=")
		) {
			continue;
		}
		if (!arg.startsWith("-") || arg === "-") {
			return arg;
		}
	}
	return undefined;
}

function isWorkingBunBinary() {
	const bunCheck = spawnSync(bunBinary, ["--version"], {
		env: process.env,
		stdio: "ignore",
	});

	return !bunCheck.error && bunCheck.status === 0;
}

function canAutobuildSourceCheckout() {
	return fs.existsSync(buildScriptEntrypoint) && fs.existsSync(sourceCliEntrypoint);
}

function ensureBuiltRuntime() {
	if (fs.existsSync(cliEntrypoint) && fs.existsSync(nodeCliEntrypoint)) {
		return true;
	}

	if (!canAutobuildSourceCheckout() || !isWorkingBunBinary()) {
		return false;
	}

	const buildResult = spawnSync(bunBinary, ["run", "build"], {
		cwd: packageRoot,
		env: process.env,
		stdio: "inherit",
	});

	if (buildResult.status !== 0) {
		process.exit(buildResult.status ?? 1);
	}

	return fs.existsSync(cliEntrypoint) && fs.existsSync(nodeCliEntrypoint);
}

const argv = process.argv.slice(2);
const command = firstPositional(argv);
const shouldUseFullRuntime =
	Boolean(argv.includes("--help")) ||
	command === "help" ||
	(command ? fullRuntimeCommands.has(command) : false);
const hasBuiltRuntime = ensureBuiltRuntime();

if (shouldUseFullRuntime) {
	if (isWorkingBunBinary()) {
		if (!hasBuiltRuntime) {
			console.error(
				"❌ wp-typia could not locate its built CLI runtime. Reinstall the published package, or run `bun run build` when using a source checkout.",
			);
			process.exit(1);
		}
		const result = spawnSync(bunBinary, [cliEntrypoint, ...argv], {
			cwd: process.cwd(),
			env: process.env,
			stdio: "inherit",
		});
		process.exit(result.status ?? 1);
	}

	console.error(
		`❌ wp-typia ${command} requires Bun. Install Bun locally, run with bunx, or set BUN_BIN to a working Bun executable.`,
	);
	process.exit(1);
}

if (!hasBuiltRuntime || !fs.existsSync(nodeCliEntrypoint)) {
	console.error(
		"❌ wp-typia could not locate its Node fallback runtime. Reinstall the published package, or run `bun run build` when using a source checkout.",
	);
	process.exit(1);
}

const cliModule = await import(pathToFileURL(nodeCliEntrypoint).href);
await cliModule.runNodeCliEntrypoint(argv);
