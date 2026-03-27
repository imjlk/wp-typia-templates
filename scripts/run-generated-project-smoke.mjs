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

function getRunScriptCommand(packageManager, scriptName, extraArgs = []) {
	const scriptArgs = extraArgs.length > 0 ? [scriptName, "--", ...extraArgs] : [scriptName];

	switch (packageManager) {
		case "bun":
			return ["bun", ["run", ...scriptArgs]];
		case "npm":
			return ["npm", ["run", ...scriptArgs]];
		case "pnpm":
			return ["corepack", ["pnpm", "run", ...scriptArgs]];
		default:
			return ["corepack", ["yarn", "run", ...scriptArgs]];
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

function assertAdvancedMigrationArtifacts(projectDir) {
	const requiredFiles = [
		path.join(projectDir, "src", "migrations", "config.ts"),
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"),
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"),
		path.join(projectDir, "src", "migrations", "generated", "registry.ts"),
		path.join(projectDir, "src", "migrations", "generated", "deprecated.ts"),
		path.join(projectDir, "src", "migrations", "generated", "verify.ts"),
		path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-1.0.0.ts"),
		path.join(projectDir, "src", "migrations", "fixtures", "1.0.0.json"),
	];

	for (const filePath of requiredFiles) {
		if (!fs.existsSync(filePath)) {
			throw new Error(`Expected advanced migration artifact at ${filePath}`);
		}
	}
}

function rewriteAdvancedMigrationDependency(projectDir) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const localDependency = `file:${path.resolve(__dirname, "../packages/create-wp-typia")}`;

	if (packageJson.devDependencies?.["create-wp-typia"]) {
		packageJson.devDependencies["create-wp-typia"] = localDependency;
	}
	if (packageJson.dependencies?.["create-wp-typia"]) {
		packageJson.dependencies["create-wp-typia"] = localDependency;
	}

	fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
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

		if (template === "advanced") {
			rewriteAdvancedMigrationDependency(projectDir);
		}

		ensureCorepackPackageManager(packageManager);

		const [installCommand, installArgs] = getInstallCommand(packageManager);
		run(installCommand, installArgs, { cwd: projectDir });

		if (template === "advanced") {
			for (const [scriptName, args] of [
				["migration:init", []],
				["migration:snapshot", ["--version", "1.0.0"]],
				["migration:scaffold", ["--from", "1.0.0"]],
				["migration:verify", ["--all"]],
			]) {
				const [command, commandArgs] = getRunScriptCommand(packageManager, scriptName, args);
				run(command, commandArgs, { cwd: projectDir });
			}

			assertAdvancedMigrationArtifacts(projectDir);
		}

		const [buildCommand, buildArgs] = getRunCommand(packageManager);
		run(buildCommand, buildArgs, { cwd: projectDir });

		assertBuildArtifacts(projectDir, projectName);
	} finally {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	}
}

main();
