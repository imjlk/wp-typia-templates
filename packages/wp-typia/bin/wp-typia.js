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

if (!fs.existsSync(cliEntrypoint)) {
	console.error(
		"❌ wp-typia could not locate its built CLI runtime. Reinstall the published package, or run `bun run build` when using a source checkout.",
	);
	process.exit(1);
}

const argv = process.argv.slice(2);
const command = firstPositional(argv);
const shouldUseFullRuntime = command ? fullRuntimeCommands.has(command) : false;

if (shouldUseFullRuntime) {
	const bunCheck = spawnSync(bunBinary, ["--version"], {
		env: process.env,
		stdio: "ignore",
	});

	if (!bunCheck.error && bunCheck.status === 0) {
		const result = spawnSync(bunBinary, [cliEntrypoint, ...argv], {
			cwd: process.cwd(),
			env: process.env,
			stdio: "inherit",
		});
		process.exit(result.status ?? 1);
	}
}

if (!fs.existsSync(nodeCliEntrypoint)) {
	console.error(
		"❌ wp-typia could not locate its Node fallback runtime. Reinstall the published package, or run `bun run build` when using a source checkout.",
	);
	process.exit(1);
}

const cliModule = await import(pathToFileURL(nodeCliEntrypoint).href);
await cliModule.runNodeCliEntrypoint(argv);
