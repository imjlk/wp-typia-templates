#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
	findWorkspaceProtocolLeaks,
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

function run(command, args, options = {}) {
	return execFileSync(command, args, {
		cwd: repoRoot,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		...options,
	});
}

function runNodeScript(projectDir, fileName, source, args = []) {
	const scriptPath = path.join(projectDir, fileName);
	fs.writeFileSync(scriptPath, source, "utf8");
	return run("node", [scriptPath, ...args], { cwd: projectDir });
}

execFileSync("bun", ["run", "packages:build"], {
	cwd: repoRoot,
	stdio: "inherit",
});

withTempDir("wp-typia-publish-install-smoke-", (tempRoot) => {
	const tarballDir = path.join(tempRoot, "tarballs");
	const projectDir = path.join(tempRoot, "project");
	const tarballs = new Map();

	for (const [packageDir, packageName] of PACKAGE_CHAIN) {
		const tarballPath = packWorkspacePackage(packageDir, tarballDir);
		tarballs.set(packageName, tarballPath);

		if (packageName === "@wp-typia/rest") {
			const packedManifest = readPackedPackageManifest(tarballPath);
			const leaks = findWorkspaceProtocolLeaks(packedManifest);
			if (leaks.length > 0) {
				throw new Error(
					`Packed ${packageName} manifest still contains workspace protocol dependencies: ${leaks.join(", ")}`,
				);
			}
		}
	}

	fs.mkdirSync(projectDir, { recursive: true });
	fs.writeFileSync(
		path.join(projectDir, "package.json"),
		`${JSON.stringify({
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
		}, null, 2)}\n`,
		"utf8",
	);

	run("bun", ["install"], { cwd: projectDir });

	const installedManifest = JSON.parse(
		fs.readFileSync(path.join(projectDir, "node_modules", "wp-typia", "package.json"), "utf8"),
	);
	const binEntry =
		typeof installedManifest.bin === "string"
			? installedManifest.bin
			: installedManifest.bin?.["wp-typia"] ??
				Object.values(installedManifest.bin ?? {})[0];
	if (typeof binEntry !== "string" || binEntry.length === 0) {
		throw new Error("Unable to resolve wp-typia CLI entry from the installed package manifest.");
	}

	const versionOutput = run(
		"node",
		[path.join(projectDir, "node_modules", "wp-typia", binEntry), "--version"],
		{ cwd: projectDir },
	).trim();
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
	runNodeScript(
		projectDir,
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
			'if (report.status === "error") {',
			'\tthrow new Error(`block-runtime smoke failed: ${report.failure?.message ?? "unknown error"}`);',
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
	runNodeScript(
		projectDir,
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

	process.stdout.write(
		`Verified published-install smoke for wp-typia ${parsed.data.version}, block-runtime metadata sync, and project-tools workspace inventory runtime paths.\n`,
	);
});
