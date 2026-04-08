#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
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

			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			return packageJson.private !== true && typeof packageJson.name === "string";
		})
		.sort();
}

function readPackageJson(packageDir) {
	const packageJsonPath = path.join(repoRoot, packageDir, "package.json");
	return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
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

	return packageDirs.sort();
}

function diff(left, right) {
	const rightSet = new Set(right);
	return left.filter((value) => !rightSet.has(value));
}

function isSeedPublished(packageName) {
	try {
		const output = execFileSync("npm", ["view", packageName, "version", "--json"], {
			cwd: repoRoot,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
		return output.length > 0;
	} catch (error) {
		const stderr =
			error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string"
				? error.stderr
				: "";
		if (stderr.includes("E404") || stderr.includes("Not Found")) {
			return false;
		}
		throw error;
	}
}

const expectedPackageDirs = findPublishablePackageDirs();
const configuredPackageDirs = parsePublishScriptPackageDirs();

const missingFromPublishScript = diff(expectedPackageDirs, configuredPackageDirs);
const extraInPublishScript = diff(configuredPackageDirs, expectedPackageDirs);
const packagesMissingSeedPublish = expectedPackageDirs
	.map((packageDir) => ({
		packageDir,
		packageName: readPackageJson(packageDir).name,
	}))
	.filter(({ packageName }) => !isSeedPublished(packageName));

if (
	missingFromPublishScript.length === 0 &&
	extraInPublishScript.length === 0 &&
	packagesMissingSeedPublish.length === 0
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

if (packagesMissingSeedPublish.length > 0) {
	console.error("Missing initial npm publishes:");
	for (const { packageDir, packageName } of packagesMissingSeedPublish) {
		console.error(`- ${packageDir} (${packageName})`);
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
