#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { getPackageManager } from "../packages/create-wp-typia/lib/package-managers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryPath = path.resolve(__dirname, "../packages/create-wp-typia/lib/entry.js");

function parseArgs(argv) {
	const parsed = {
		packageManager: undefined,
		projectName: undefined,
		runtime: undefined,
		template: undefined,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		if (arg === "--runtime") {
			parsed.runtime = next;
			index += 1;
			continue;
		}
		if (arg === "--template") {
			parsed.template = next;
			index += 1;
			continue;
		}
		if (arg === "--package-manager") {
			parsed.packageManager = next;
			index += 1;
			continue;
		}
		if (arg === "--project-name") {
			parsed.projectName = next;
			index += 1;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return parsed;
}

function run(command, args, options = {}) {
	return execFileSync(command, args, {
		stdio: "inherit",
		...options,
	});
}

function getRunCommand(packageManager) {
	switch (packageManager) {
		case "bun":
			return ["bun", ["run", "build"]];
		case "npm":
			return ["npm", ["run", "build"]];
		case "pnpm":
			return ["corepack", ["pnpm", "run", "build"]];
		default:
			return ["corepack", ["yarn", "run", "build"]];
	}
}

function getInstallCommand(packageManager) {
	switch (packageManager) {
		case "bun":
			return ["bun", ["install"]];
		case "npm":
			return ["npm", ["install"]];
		case "pnpm":
			return ["corepack", ["pnpm", "install"]];
		default:
			return ["corepack", ["yarn", "install"]];
	}
}

function ensureCorepackPackageManager(packageManager) {
	if (packageManager !== "pnpm" && packageManager !== "yarn") {
		return;
	}

	run("corepack", ["prepare", getPackageManager(packageManager).packageManagerField, "--activate"]);
}

function assertBuildArtifacts(projectDir, projectName) {
	const candidateDirs = [
		path.join(projectDir, "build", projectName),
		path.join(projectDir, "build"),
	];

	for (const artifact of ["block.json", "typia.manifest.json"]) {
		const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
		if (!found) {
			throw new Error(
				`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`,
			);
		}
	}
}

function main() {
	const { runtime, template, packageManager, projectName } = parseArgs(process.argv.slice(2));

	if (!runtime || !template || !packageManager || !projectName) {
		throw new Error(
			"Usage: node scripts/run-generated-project-smoke.mjs --runtime <node|bun> --template <id> --package-manager <id> --project-name <name>",
		);
	}

	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-generated-smoke-"));
	const projectDir = path.join(tempRoot, projectName);

	try {
		run(runtime, [
			entryPath,
			projectDir,
			"--template",
			template,
			"--yes",
			"--no-install",
			"--package-manager",
			packageManager,
		]);

		const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
		const expectedPackageManager = getPackageManager(packageManager).packageManagerField;
		if (packageJson.packageManager !== expectedPackageManager) {
			throw new Error(
				`Expected packageManager ${expectedPackageManager}, received ${packageJson.packageManager}`,
			);
		}

		ensureCorepackPackageManager(packageManager);

		const [installCommand, installArgs] = getInstallCommand(packageManager);
		run(installCommand, installArgs, { cwd: projectDir });

		const [buildCommand, buildArgs] = getRunCommand(packageManager);
		run(buildCommand, buildArgs, { cwd: projectDir });

		assertBuildArtifacts(projectDir, projectName);
	} finally {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	}
}

main();
