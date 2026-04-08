#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliEntrypoint = path.join(packageRoot, "src", "cli.ts");
const bunBinary = process.env.BUN_BIN || "bun";

const result = spawnSync(
	bunBinary,
	[
		"--eval",
		`
			const [moduleUrl, ...argv] = process.argv.slice(1);
			const mod = await import(moduleUrl);
			await mod.main(argv);
		`,
		pathToFileURL(cliEntrypoint).href,
		...process.argv.slice(2),
	],
	{
	cwd: process.cwd(),
	encoding: "utf8",
	env: process.env,
	stdio: ["inherit", "pipe", "pipe"],
},
);

if (result.error) {
	console.error(
		"❌ wp-typia requires Bun 1.3.11+ to run the Bunli-powered CLI. Install Bun or set BUN_BIN to a compatible runtime.",
	);
	console.error(result.error instanceof Error ? result.error.message : result.error);
	process.exit(1);
}

if ((result.status ?? 1) === 0) {
	if (result.stdout) {
		process.stdout.write(result.stdout);
	} else if (result.stderr) {
		process.stdout.write(result.stderr);
	}
} else {
	if (result.stderr) {
		process.stderr.write(result.stderr);
	}
	if (result.stdout) {
		process.stdout.write(result.stdout);
	}
}

process.exit(result.status ?? 1);
