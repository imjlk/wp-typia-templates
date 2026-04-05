#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
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

function parsePublishScriptPackageDirs() {
	const scriptSource = fs.readFileSync(publishScriptPath, "utf8");
	const match = scriptSource.match(/PACKAGES=\(\s*([\s\S]*?)\s*\)/u);

	if (!match) {
		throw new Error(`Unable to locate PACKAGES=(...) in ${path.relative(repoRoot, publishScriptPath)}.`);
	}

	return match[1]
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.match(/^"([^"]+)"$/u)?.[1] ?? null)
		.filter((value) => value !== null)
		.sort();
}

function diff(left, right) {
	const rightSet = new Set(right);
	return left.filter((value) => !rightSet.has(value));
}

const expectedPackageDirs = findPublishablePackageDirs();
const configuredPackageDirs = parsePublishScriptPackageDirs();

const missingFromPublishScript = diff(expectedPackageDirs, configuredPackageDirs);
const extraInPublishScript = diff(configuredPackageDirs, expectedPackageDirs);

if (missingFromPublishScript.length === 0 && extraInPublishScript.length === 0) {
	console.log(
		`Validated publish-oidc package coverage for ${expectedPackageDirs.length} publishable workspace packages.`,
	);
	process.exit(0);
}

console.error("publish-oidc package coverage is out of sync.");

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

console.error(
	[
		"",
		"For a brand-new publishable package, add it to scripts/publish-oidc.sh",
		"and seed the first npm version (for example 0.1.0) before relying on",
		"release PR automation to publish later versions.",
	].join("\n"),
);

process.exit(1);
