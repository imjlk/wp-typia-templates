#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
	findWorkspaceProtocolLeaks,
	getNpmCommand,
	getTarCommand,
	packWorkspacePackage,
	readPackedPackageManifest,
	repoRoot,
	withTempDir,
} from "./publish-package-utils.mjs";

const PACKAGE_CHAIN = [
	["packages/wp-typia-api-client", "@wp-typia/api-client"],
	["packages/wp-typia-rest", "@wp-typia/rest"],
	["packages/wp-typia-block-types", "@wp-typia/block-types"],
	["packages/wp-typia-block-runtime", "@wp-typia/block-runtime"],
	["packages/wp-typia-project-tools", "@wp-typia/project-tools"],
	["packages/wp-typia", "wp-typia"],
];
const GENERATED_PROJECT_OVERRIDE_PACKAGES = [
	"@wp-typia/api-client",
	"@wp-typia/rest",
	"@wp-typia/block-types",
	"@wp-typia/block-runtime",
];
const npmCommand = getNpmCommand();
const tarCommand = getTarCommand();

function run(command, args, options = {}) {
	return execFileSync(command, args, {
		cwd: repoRoot,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		...options,
	});
}

function createNodeOnlyEnv() {
	return {
		...process.env,
		BUN_BIN: path.join(os.tmpdir(), "wp-typia-missing-bun"),
		PATH: path.dirname(process.execPath),
	};
}

function runScript(projectDir, command, fileName, source, args = []) {
	const scriptPath = path.join(projectDir, fileName);
	fs.writeFileSync(scriptPath, source, "utf8");
	return run(command, [scriptPath, ...args], { cwd: projectDir });
}

function writeJson(filePath, value) {
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getInstalledWpTypiaCliPath(projectDir) {
	const installedManifest = readJson(
		path.join(projectDir, "node_modules", "wp-typia", "package.json"),
	);
	const binEntry =
		typeof installedManifest.bin === "string"
			? installedManifest.bin
			: installedManifest.bin?.["wp-typia"] ??
				Object.values(installedManifest.bin ?? {})[0];
	if (typeof binEntry !== "string" || binEntry.length === 0) {
		throw new Error("Unable to resolve wp-typia CLI entry from the installed package manifest.");
	}

	return path.join(projectDir, "node_modules", "wp-typia", binEntry);
}

function runWpTypiaCli(projectDir, cliPath, args) {
	return run("node", [cliPath, ...args], { cwd: projectDir });
}

function materializeTarballDependencies(projectDir, tarballs) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = readJson(packageJsonPath);
	const directDependencies = new Set();

	for (const field of ["dependencies", "devDependencies"] ) {
		const section = packageJson[field];
		if (!section || typeof section !== "object") {
			continue;
		}

		for (const packageName of GENERATED_PROJECT_OVERRIDE_PACKAGES) {
			if (typeof section[packageName] !== "string") {
				continue;
			}

			section[packageName] = `file:${tarballs.get(packageName)}`;
			directDependencies.add(packageName);
		}
	}

	packageJson.overrides ??= {};
	for (const packageName of GENERATED_PROJECT_OVERRIDE_PACKAGES) {
		if (directDependencies.has(packageName)) {
			continue;
		}

		packageJson.overrides[packageName] = `file:${tarballs.get(packageName)}`;
	}

	writeJson(packageJsonPath, packageJson);
}

function assertScaffoldDependencyRanges(projectDir, expectations) {
	const packageJson = readJson(path.join(projectDir, "package.json"));

	for (const [packageName, expectedRange] of Object.entries(expectations)) {
		const actualRange = packageJson.devDependencies?.[packageName];
		if (actualRange !== expectedRange) {
			throw new Error(
				`Generated ${path.basename(projectDir)} package.json expected ${packageName}=${expectedRange}, found ${JSON.stringify(actualRange ?? null)}.`,
			);
		}
	}
}

function assertFilesExist(projectDir, relativePaths) {
	for (const relativePath of relativePaths) {
		if (!fs.existsSync(path.join(projectDir, relativePath))) {
			throw new Error(
				`Expected ${path.basename(projectDir)} to contain ${relativePath}, but it was missing.`,
			);
		}
	}
}

function installGeneratedProject(projectDir, tarballs) {
	materializeTarballDependencies(projectDir, tarballs);
	run(npmCommand, ["install"], { cwd: projectDir });
}

function typecheckGeneratedProject(projectDir) {
	run(npmCommand, ["exec", "--", "tsc", "--noEmit"], { cwd: projectDir });
}

execFileSync("bun", ["run", "packages:build"], {
	cwd: repoRoot,
	stdio: "inherit",
});

withTempDir("wp-typia-publish-install-smoke-", (tempRoot) => {
	const tarballDir = path.join(tempRoot, "tarballs");
	const projectDir = path.join(tempRoot, "project");
	const tarballs = new Map();
	const packedManifests = new Map();

	for (const [packageDir, packageName] of PACKAGE_CHAIN) {
		const tarballPath = packWorkspacePackage(packageDir, tarballDir);
		tarballs.set(packageName, tarballPath);
		packedManifests.set(packageName, readPackedPackageManifest(tarballPath));

		if (packageName === "@wp-typia/rest") {
			const leaks = findWorkspaceProtocolLeaks(packedManifests.get(packageName));
			if (leaks.length > 0) {
				throw new Error(
					`Packed ${packageName} manifest still contains workspace protocol dependencies: ${leaks.join(", ")}`,
				);
			}
		}

		if (packageName === "wp-typia") {
			const tarballEntries = run(tarCommand, ["-tf", tarballPath]).trim().split("\n");
			if (!tarballEntries.includes("package/dist-bunli/cli.js")) {
				throw new Error("Packed wp-typia tarball is missing package/dist-bunli/cli.js.");
			}
			if (!tarballEntries.includes("package/dist-bunli/.bunli/commands.gen.js")) {
				throw new Error(
					"Packed wp-typia tarball is missing package/dist-bunli/.bunli/commands.gen.js.",
				);
			}
			if (tarballEntries.includes("package/.bunli/commands.gen.ts")) {
				throw new Error(
					"Packed wp-typia tarball should no longer publish package/.bunli/commands.gen.ts.",
				);
			}
			if (tarballEntries.includes("package/src/cli.ts")) {
				throw new Error("Packed wp-typia tarball should no longer publish package/src/cli.ts.");
			}
		}
	}

	fs.mkdirSync(projectDir, { recursive: true });
	writeJson(path.join(projectDir, "package.json"), {
		dependencies: {
			"wp-typia": `file:${tarballs.get("wp-typia")}`,
		},
		name: "wp-typia-publish-install-smoke",
		overrides: Object.fromEntries(
			[...tarballs.entries()].map(([packageName, tarballPath]) => [
				packageName,
				`file:${tarballPath}`,
			]),
		),
		private: true,
		packageManager: "bun@1.3.11",
	});

	run("bun", ["install"], { cwd: projectDir });

	const cliPath = getInstalledWpTypiaCliPath(projectDir);
	const versionOutput = run(process.execPath, [cliPath, "--version"], {
		cwd: projectDir,
		env: createNodeOnlyEnv(),
	}).trim();
	let parsed;
	try {
		parsed = JSON.parse(versionOutput);
	} catch {
		throw new Error(`wp-typia --version did not return JSON: ${versionOutput}`);
	}

	if (
		!parsed ||
		parsed.ok !== true ||
		parsed.data?.type !== "version" ||
		typeof parsed.data.version !== "string"
	) {
		throw new Error(`Unexpected wp-typia --version output: ${versionOutput}`);
	}

	const completionsOutput = run(process.execPath, [cliPath, "completions", "bash"], {
		cwd: projectDir,
	});
	if (!completionsOutput.includes("# bash completion for wp-typia")) {
		throw new Error(
			`wp-typia completions bash did not return the expected shell output: ${completionsOutput}`,
		);
	}

	runScript(
		projectDir,
		"bun",
		"wrapper-export-smoke.mjs",
		[
			'import "@wp-typia/block-types/blocks/registration";',
			'import { buildScaffoldBlockRegistration, defineScaffoldBlockMetadata, parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";',
			'import { defineManifestDocument } from "@wp-typia/block-runtime/editor";',
			'import { defineManifestDefaultsDocument, parseManifestDefaultsDocument } from "@wp-typia/block-runtime/defaults";',
			"",
			"for (const [name, value] of Object.entries({",
			"\tbuildScaffoldBlockRegistration,",
			"\tdefineScaffoldBlockMetadata,",
			"\tparseScaffoldBlockMetadata,",
			"\tdefineManifestDocument,",
			"\tdefineManifestDefaultsDocument,",
			"\tparseManifestDefaultsDocument,",
			"})) {",
			'\tif (typeof value !== "function") {',
			'\t\tthrow new Error(`Expected ${name} to be a function export.`);',
			"\t}",
			"}",
			"",
		].join("\n"),
	);

	const blockRuntimeSmokeDir = path.join(projectDir, "block-runtime-smoke");
	fs.mkdirSync(blockRuntimeSmokeDir, { recursive: true });
	fs.writeFileSync(
		path.join(blockRuntimeSmokeDir, "types.ts"),
		[
			"export interface CounterAttributes {",
			'\tlabel: string;',
			"\tcount: number;",
			"}",
			"",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(blockRuntimeSmokeDir, "block.json"),
		`${JSON.stringify({ name: "smoke/counter" }, null, 2)}\n`,
		"utf8",
	);
	runScript(
		projectDir,
		"node",
		"block-runtime-smoke.mjs",
		[
			'import fs from "node:fs";',
			'import path from "node:path";',
			'import { runSyncBlockMetadata } from "@wp-typia/block-runtime/metadata-core";',
			"",
			"const projectRoot = path.resolve(process.argv[2]);",
			"const report = await runSyncBlockMetadata(",
			"\t{",
			'\t\tblockJsonFile: "block.json",',
			'\t\tjsonSchemaFile: "schema.json",',
			'\t\tmanifestFile: "manifest.json",',
			'\t\topenApiFile: "openapi.json",',
			'\t\tphpValidatorFile: "validator.php",',
			"\t\tprojectRoot,",
			'\t\tsourceTypeName: "CounterAttributes",',
			'\t\ttypesFile: "types.ts",',
			"\t},",
			");",
			'if (report.status !== "success") {',
			"\tconst warningMessage = [",
			"\t\t...report.lossyProjectionWarnings,",
			"\t\t...report.phpGenerationWarnings,",
			'\t].join("; ");',
			'\tconst detail = report.failure?.message ?? (warningMessage || report.status);',
			'\tthrow new Error(`block-runtime smoke failed: ${detail}`);',
			"}",
			'for (const artifact of ["manifest.json", "schema.json", "openapi.json", "validator.php"]) {',
			"\tif (!fs.existsSync(path.join(projectRoot, artifact))) {",
			'\t\tthrow new Error(`Missing generated artifact: ${artifact}`);',
			"\t}",
			"}",
			"",
		].join("\n"),
		[blockRuntimeSmokeDir],
	);

	const projectToolsSmokeDir = path.join(projectDir, "project-tools-smoke");
	fs.mkdirSync(path.join(projectToolsSmokeDir, "scripts"), { recursive: true });
	fs.writeFileSync(
		path.join(projectToolsSmokeDir, "scripts", "block-config.ts"),
		[
			"export const BLOCKS = [",
			"\t{",
			'\t\tslug: "counter-card",',
			'\t\ttypesFile: "src/blocks/counter-card/types.ts",',
			"\t},",
			"];",
			"",
		].join("\n"),
		"utf8",
	);
	runScript(
		projectDir,
		"node",
		"project-tools-smoke.mjs",
		[
			'import { getWorkspaceBlockSelectOptions } from "@wp-typia/project-tools";',
			'import path from "node:path";',
			"",
			"const projectRoot = path.resolve(process.argv[2]);",
			"const options = getWorkspaceBlockSelectOptions(projectRoot);",
			'if (options.length !== 1 || options[0]?.value !== "counter-card") {',
			'\tthrow new Error(`Unexpected workspace options: ${JSON.stringify(options)}`);',
			"}",
			"",
		].join("\n"),
		[projectToolsSmokeDir],
	);

	const expectedRanges = {
		"@wp-typia/block-runtime": `^${packedManifests.get("@wp-typia/block-runtime").version}`,
		"@wp-typia/block-types": `^${packedManifests.get("@wp-typia/block-types").version}`,
	};

	const basicDir = path.join(projectDir, "demo-basic");
	runWpTypiaCli(projectDir, cliPath, [
		"create",
		"demo-basic",
		"--template",
		"basic",
		"--package-manager",
		"npm",
		"--namespace",
		"smoke-space",
		"--text-domain",
		"smoke-space",
		"--yes",
		"--no-install",
	]);
	assertScaffoldDependencyRanges(basicDir, expectedRanges);
	assertFilesExist(basicDir, [
		"src/block-metadata.ts",
		"src/manifest-document.ts",
		"src/manifest-defaults-document.ts",
	]);
	installGeneratedProject(basicDir, tarballs);
	typecheckGeneratedProject(basicDir);

	const compoundDir = path.join(projectDir, "demo-compound");
	runWpTypiaCli(projectDir, cliPath, [
		"create",
		"demo-compound",
		"--template",
		"compound",
		"--package-manager",
		"npm",
		"--namespace",
		"smoke-space",
		"--text-domain",
		"smoke-space",
		"--yes",
		"--no-install",
	]);
	assertScaffoldDependencyRanges(compoundDir, expectedRanges);
	installGeneratedProject(compoundDir, tarballs);
	run(npmCommand, ["exec", "--", "tsx", "scripts/add-compound-child.ts", "--slug", "faq-item", "--title", "FAQ Item"], {
		cwd: compoundDir,
	});
	assertFilesExist(compoundDir, [
		"src/blocks/demo-compound/block-metadata.ts",
		"src/blocks/demo-compound/manifest-document.ts",
		"src/blocks/demo-compound/manifest-defaults-document.ts",
		"src/blocks/demo-compound-faq-item/block-metadata.ts",
		"src/blocks/demo-compound-faq-item/manifest-document.ts",
		"src/blocks/demo-compound-faq-item/manifest-defaults-document.ts",
	]);
	typecheckGeneratedProject(compoundDir);

	process.stdout.write(
		`Verified published-install smoke for wp-typia ${parsed.data.version}, bundled Bunli metadata, runtime wrapper exports, block-runtime metadata sync, project-tools runtime paths, and generated basic/compound scaffold installs.\n`,
	);
});
