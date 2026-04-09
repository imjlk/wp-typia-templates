#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
	findWorkspaceProtocolLeaks,
	packWorkspacePackage,
	readPackedPackageManifest,
	readJson,
	repoRoot,
} from "./publish-package-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagesRoot = path.join(repoRoot, "packages");
const publishScriptPath = path.join(repoRoot, "scripts", "publish-oidc.sh");

function findPublishablePackageDirs() {
	if (!fs.existsSync(packagesRoot)) {
		return [];
	}

	return fs
		.readdirSync(packagesRoot, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => `packages/${entry.name}`)
		.filter((packageDir) => {
			const packageJsonPath = path.join(repoRoot, packageDir, "package.json");
			if (!fs.existsSync(packageJsonPath)) {
				return false;
			}

			const packageJson = readJson(packageJsonPath);
			return packageJson.private !== true && typeof packageJson.name === "string";
		})
		.sort();
}

function readPackageJson(packageDir) {
	return readJson(path.join(repoRoot, packageDir, "package.json"));
}

function parsePublishScriptPackageDirs() {
	const scriptSource = fs.readFileSync(publishScriptPath, "utf8");
	const match = scriptSource.match(/PACKAGES=\(\s*([\s\S]*?)\s*\)/u);

	if (!match) {
		throw new Error(`Unable to locate PACKAGES=(...) in ${path.relative(repoRoot, publishScriptPath)}.`);
	}

	const rawLines = match[1]
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const packageDirs = rawLines.map((line, index) => {
		const parsed = line.match(/^"([^"]+)"$/u)?.[1];
		if (!parsed) {
			throw new Error(
				`Invalid PACKAGES entry at line ${index + 1}: ${line}`,
			);
		}
		return parsed;
	});

	const duplicatePackageDirs = [...new Set(
		packageDirs.filter((value, index) => packageDirs.indexOf(value) !== index),
	)];

	if (duplicatePackageDirs.length > 0) {
		throw new Error(
			`Duplicate PACKAGES entries in ${path.relative(repoRoot, publishScriptPath)}: ${duplicatePackageDirs.join(", ")}`,
		);
	}

	return packageDirs;
}

function diff(left, right) {
	const rightSet = new Set(right);
	return left.filter((value) => !rightSet.has(value));
}

function checkSeedPublish(packageName) {
	try {
		const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
		const output = execFileSync(
			npmCommand,
			[
				"view",
				packageName,
				"version",
				"--json",
				"--registry",
				"https://registry.npmjs.org/",
			],
			{
				cwd: repoRoot,
				encoding: "utf8",
				stdio: ["ignore", "pipe", "pipe"],
			},
		).trim();
		return {
			error: null,
			published: output.length > 0,
		};
	} catch (error) {
		const stderr =
			error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string"
				? error.stderr
				: "";
		if (stderr.includes("E404") || stderr.includes("Not Found")) {
			return {
				error: null,
				published: false,
			};
		}
		const message = stderr.trim() || (error instanceof Error ? error.message : String(error));
		return {
			error: `Unable to query npm for ${packageName}: ${message}`,
			published: false,
		};
	}
}

function findPublishOrderViolations(configuredPackageDirs) {
	const packageNamesByDir = new Map(
		configuredPackageDirs.map((packageDir) => [packageDir, readPackageJson(packageDir).name]),
	);
	const orderIndexByName = new Map(
		configuredPackageDirs.map((packageDir, index) => [packageNamesByDir.get(packageDir), index]),
	);
	const violations = [];

	for (const packageDir of configuredPackageDirs) {
		const packageJson = readPackageJson(packageDir);
		const packageName = packageNamesByDir.get(packageDir);
		const packageIndex = orderIndexByName.get(packageName);
		const dependencies = packageJson.dependencies ?? {};

		for (const dependencyName of Object.keys(dependencies)) {
			const dependencyIndex = orderIndexByName.get(dependencyName);
			if (
				typeof dependencyIndex === "number" &&
				typeof packageIndex === "number" &&
				dependencyIndex > packageIndex
			) {
				violations.push(
					`${packageDir} (${packageName}) publishes before ${dependencyName}, but depends on it`,
				);
			}
		}
	}

	return violations;
}

function validatePackedRestManifest() {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-rest-pack-validate-"));
	try {
		const tarballPath = packWorkspacePackage("packages/wp-typia-rest", tempDir);
		const packedManifest = readPackedPackageManifest(tarballPath);
		return findWorkspaceProtocolLeaks(packedManifest);
	} finally {
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
}

const expectedPackageDirs = findPublishablePackageDirs();
const configuredPackageDirs = parsePublishScriptPackageDirs();

const missingFromPublishScript = diff(expectedPackageDirs, configuredPackageDirs);
const extraInPublishScript = diff(configuredPackageDirs, expectedPackageDirs);
const publishOrderViolations =
	missingFromPublishScript.length === 0 && extraInPublishScript.length === 0
		? findPublishOrderViolations(configuredPackageDirs)
		: [];
const publishablePackages = expectedPackageDirs.map((packageDir) => {
	const packageName = readPackageJson(packageDir).name;
	return {
		packageDir,
		packageName,
		seedPublishStatus: checkSeedPublish(packageName),
	};
});
const packagesMissingSeedPublish = publishablePackages.filter(
	({ seedPublishStatus }) => seedPublishStatus.published === false && seedPublishStatus.error === null,
);
const seedPublishValidationErrors = publishablePackages.filter(
	({ seedPublishStatus }) => seedPublishStatus.error !== null,
);
const packedRestManifestLeaks = validatePackedRestManifest();

if (
	missingFromPublishScript.length === 0 &&
	extraInPublishScript.length === 0 &&
	publishOrderViolations.length === 0 &&
	packagesMissingSeedPublish.length === 0 &&
	seedPublishValidationErrors.length === 0 &&
	packedRestManifestLeaks.length === 0
) {
	console.log(
		`Validated publish-oidc package coverage and npm seed publishes for ${expectedPackageDirs.length} publishable workspace packages.`,
	);
	process.exit(0);
}

console.error("publish-oidc package readiness is out of sync.");

if (missingFromPublishScript.length > 0) {
	console.error("Missing from scripts/publish-oidc.sh:");
	for (const packageDir of missingFromPublishScript) {
		console.error(`- ${packageDir}`);
	}
}

if (extraInPublishScript.length > 0) {
	console.error("Unexpected entries in scripts/publish-oidc.sh:");
	for (const packageDir of extraInPublishScript) {
		console.error(`- ${packageDir}`);
	}
}

if (publishOrderViolations.length > 0) {
	console.error("Publish order violates internal dependency order:");
	for (const violation of publishOrderViolations) {
		console.error(`- ${violation}`);
	}
}

if (packagesMissingSeedPublish.length > 0) {
	console.error("Missing initial npm publishes:");
	for (const { packageDir, packageName } of packagesMissingSeedPublish) {
		console.error(`- ${packageDir} (${packageName})`);
	}
}

if (seedPublishValidationErrors.length > 0) {
	console.error("Unable to verify npm seed publishes:");
	for (const { packageDir, seedPublishStatus } of seedPublishValidationErrors) {
		console.error(`- ${packageDir}: ${seedPublishStatus.error}`);
	}
}

if (packedRestManifestLeaks.length > 0) {
	console.error("Packed @wp-typia/rest manifest still contains workspace protocol dependencies:");
	for (const leak of packedRestManifestLeaks) {
		console.error(`- ${leak}`);
	}
}

console.error(
	[
		"",
		"For a brand-new publishable package, add it to scripts/publish-oidc.sh,",
		"seed the first npm version (for example 0.1.0), and wait until",
		"`npm view <package-name> version` succeeds before relying on release PR",
		"automation to publish later versions.",
	].join("\n"),
);

process.exit(1);
