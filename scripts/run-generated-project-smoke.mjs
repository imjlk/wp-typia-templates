#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../packages/create");
const entryPath = path.resolve(packageRoot, "dist/cli.js");
const PACKAGE_MANAGERS = {
	bun: {
		packageManagerField: "bun@1.3.10",
	},
	npm: {
		packageManagerField: "npm@11.6.1",
	},
	pnpm: {
		packageManagerField: "pnpm@8.3.1",
	},
	yarn: {
		packageManagerField: "yarn@3.2.4",
	},
};

function parseArgs(argv) {
	const parsed = {
		dataStorage: undefined,
		packageManager: undefined,
		persistencePolicy: undefined,
		projectName: undefined,
		runtime: undefined,
		template: undefined,
		variant: undefined,
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
		if (arg === "--data-storage") {
			parsed.dataStorage = next;
			index += 1;
			continue;
		}
		if (arg === "--variant") {
			parsed.variant = next;
			index += 1;
			continue;
		}
		if (arg === "--project-name") {
			parsed.projectName = next;
			index += 1;
			continue;
		}
		if (arg === "--persistence-policy") {
			parsed.persistencePolicy = next;
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

function getPackageManager(packageManager) {
	const manager = PACKAGE_MANAGERS[packageManager];
	if (!manager) {
		throw new Error(`Unknown package manager: ${packageManager}`);
	}

	return manager;
}

function ensureCreateWpTypiaBuilt() {
	const blockTypesDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-block-types/dist/index.js",
	);
	const restDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-rest/dist/index.js",
	);
	if (fs.existsSync(entryPath) && fs.existsSync(blockTypesDistPath) && fs.existsSync(restDistPath)) {
		return;
	}

	run("bun", ["run", "--filter", "@wp-typia/block-types", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/rest", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/create", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
}

function hasPhpBinary() {
	try {
		execFileSync("php", ["-v"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
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

	for (const artifact of ["block.json", "typia.manifest.json", "typia-validator.php"]) {
		const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
		if (!found) {
			throw new Error(
				`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`,
			);
		}
	}
}

function assertPersistenceTemplateArtifacts(projectDir, projectName) {
	const candidateDirs = [
		path.join(projectDir, "build", projectName),
		path.join(projectDir, "build"),
	];

	for (const artifact of [
		"typia.schema.json",
		"typia.openapi.json",
		path.join("api-schemas", "counter-query.schema.json"),
		path.join("api-schemas", "counter-response.schema.json"),
		path.join("api-schemas", "increment-request.schema.json"),
	]) {
		const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
		if (!found) {
			throw new Error(`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`);
		}
	}
}

function assertCompoundTemplateArtifacts(projectDir, projectName) {
	const parentDir = path.join(projectDir, "build", "blocks", projectName);
	const childDir = path.join(projectDir, "build", "blocks", `${projectName}-item`);

	for (const dir of [parentDir, childDir]) {
		for (const artifact of ["block.json", "typia.manifest.json", "typia-validator.php"]) {
			if (!fs.existsSync(path.join(dir, artifact))) {
				throw new Error(`Expected ${artifact} in ${dir}`);
			}
		}
	}
}

function assertCompoundPersistenceArtifacts(projectDir, projectName) {
	const parentDir = path.join(projectDir, "build", "blocks", projectName);

	for (const artifact of [
		"typia.schema.json",
		"typia.openapi.json",
		path.join("api-schemas", "counter-query.schema.json"),
		path.join("api-schemas", "counter-response.schema.json"),
		path.join("api-schemas", "increment-request.schema.json"),
	]) {
		if (!fs.existsSync(path.join(parentDir, artifact))) {
			throw new Error(`Expected ${artifact} in ${parentDir}`);
		}
	}
}

function lintPhpArtifact(filePath) {
	if (!hasPhpBinary()) {
		return;
	}

	run("php", ["-l", filePath], {
		stdio: "ignore",
	});
}

function rewriteWorkspaceDependencies(projectDir) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const localCreateDependency = `file:${path.resolve(__dirname, "../packages/create")}`;
	const localBlockTypesDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-block-types")}`;
	const localRestDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-rest")}`;

	if (packageJson.devDependencies?.["@wp-typia/create"]) {
		packageJson.devDependencies["@wp-typia/create"] = localCreateDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/create"]) {
		packageJson.dependencies["@wp-typia/create"] = localCreateDependency;
	}
	if (packageJson.devDependencies?.["@wp-typia/block-types"]) {
		packageJson.devDependencies["@wp-typia/block-types"] = localBlockTypesDependency;
	}
	if (packageJson.devDependencies?.["@wp-typia/rest"]) {
		packageJson.devDependencies["@wp-typia/rest"] = localRestDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/block-types"]) {
		packageJson.dependencies["@wp-typia/block-types"] = localBlockTypesDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/rest"]) {
		packageJson.dependencies["@wp-typia/rest"] = localRestDependency;
	}

	packageJson.overrides = {
		...(packageJson.overrides ?? {}),
		"@wp-typia/block-types": localBlockTypesDependency,
		"@wp-typia/create": localCreateDependency,
		"@wp-typia/rest": localRestDependency,
	};
	packageJson.pnpm = {
		...(packageJson.pnpm ?? {}),
		overrides: {
			...(packageJson.pnpm?.overrides ?? {}),
			"@wp-typia/block-types": localBlockTypesDependency,
			"@wp-typia/create": localCreateDependency,
			"@wp-typia/rest": localRestDependency,
		},
	};
	packageJson.resolutions = {
		...(packageJson.resolutions ?? {}),
		"@wp-typia/block-types": localBlockTypesDependency,
		"@wp-typia/create": localCreateDependency,
		"@wp-typia/rest": localRestDependency,
	};

	fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function main() {
	const { runtime, template, packageManager, projectName, variant, dataStorage, persistencePolicy } = parseArgs(process.argv.slice(2));

	if (!runtime || !template || !packageManager || !projectName) {
		throw new Error(
			"Usage: node scripts/run-generated-project-smoke.mjs --runtime <node|bun> --template <id> [--variant <name>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] --package-manager <id> --project-name <name>",
		);
	}

	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-generated-smoke-"));
	const projectDir = path.join(tempRoot, projectName);

	try {
		ensureCreateWpTypiaBuilt();

		run(runtime, [
			entryPath,
			projectDir,
			"--template",
			template,
			...(variant ? ["--variant", variant] : []),
			...(dataStorage ? ["--data-storage", dataStorage] : []),
			...(persistencePolicy ? ["--persistence-policy", persistencePolicy] : []),
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

		rewriteWorkspaceDependencies(projectDir);

		ensureCorepackPackageManager(packageManager);

		const [installCommand, installArgs] = getInstallCommand(packageManager);
		run(installCommand, installArgs, {
			cwd: projectDir,
			env: {
				...process.env,
				...(packageManager === "yarn"
					? { YARN_ENABLE_IMMUTABLE_INSTALLS: "false" }
					: {}),
			},
		});

		const [buildCommand, buildArgs] = getRunCommand(packageManager);
		run(buildCommand, buildArgs, { cwd: projectDir });

		if (template === "compound") {
			assertCompoundTemplateArtifacts(projectDir, projectName);
		} else {
			assertBuildArtifacts(projectDir, projectName);
		}
		if (template === "persistence") {
			assertPersistenceTemplateArtifacts(projectDir, projectName);
		}
		if (template === "compound" && (dataStorage || persistencePolicy)) {
			assertCompoundPersistenceArtifacts(projectDir, projectName);
		}
		for (const artifact of [
			path.join(projectDir, "build", projectName, "typia-validator.php"),
			path.join(projectDir, "build", "typia-validator.php"),
			path.join(projectDir, "build", "blocks", projectName, "typia-validator.php"),
			path.join(projectDir, "build", "blocks", `${projectName}-item`, "typia-validator.php"),
		]) {
			if (fs.existsSync(artifact)) {
				lintPhpArtifact(artifact);
			}
		}
	} finally {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	}
}

main();
