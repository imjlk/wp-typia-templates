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

	process.stdout.write(`Verified published-install smoke for wp-typia ${parsed.data.version}.\n`);
});
