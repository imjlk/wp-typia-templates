#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(packageRoot, "package.json");
const backupPath = path.join(packageRoot, ".package.json.publish-backup");
const packagesRoot = path.resolve(packageRoot, "..");
const DEPENDENCY_FIELDS = [
	"dependencies",
	"devDependencies",
	"optionalDependencies",
	"peerDependencies",
];

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getWorkspacePackageVersions() {
	const versions = new Map();

	for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
		if (!entry.isDirectory()) {
			continue;
		}

		const manifestPath = path.join(packagesRoot, entry.name, "package.json");
		if (!fs.existsSync(manifestPath)) {
			continue;
		}

		const manifest = readJson(manifestPath);
		if (typeof manifest.name === "string" && typeof manifest.version === "string") {
			versions.set(manifest.name, manifest.version);
		}
	}

	return versions;
}

function normalizeWorkspaceSpec(packageName, spec, versions) {
	if (!spec.startsWith("workspace:")) {
		return spec;
	}

	const workspaceVersion = versions.get(packageName);
	if (!workspaceVersion) {
		throw new Error(`Unable to resolve workspace version for ${packageName}.`);
	}

	const protocolValue = spec.slice("workspace:".length).trim();
	if (protocolValue === "" || protocolValue === "*" || protocolValue === "^") {
		return `^${workspaceVersion}`;
	}
	if (protocolValue === "~") {
		return `~${workspaceVersion}`;
	}

	return protocolValue;
}

function prepareManifest() {
	const currentSource = fs.readFileSync(packageJsonPath, "utf8");
	const manifest = JSON.parse(currentSource);
	const versions = getWorkspacePackageVersions();

	if (!fs.existsSync(backupPath)) {
		fs.writeFileSync(backupPath, currentSource, "utf8");
	}

	for (const field of DEPENDENCY_FIELDS) {
		const section = manifest[field];
		if (!section || typeof section !== "object") {
			continue;
		}

		for (const [packageName, spec] of Object.entries(section)) {
			if (typeof spec !== "string" || !spec.startsWith("workspace:")) {
				continue;
			}

			section[packageName] = normalizeWorkspaceSpec(packageName, spec, versions);
		}
	}

	fs.writeFileSync(packageJsonPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function restoreManifest() {
	if (!fs.existsSync(backupPath)) {
		return;
	}

	fs.copyFileSync(backupPath, packageJsonPath);
	fs.rmSync(backupPath, { force: true });
}

const mode = process.argv[2];

if (mode === "prepare") {
	prepareManifest();
	process.exit(0);
}

if (mode === "restore") {
	restoreManifest();
	process.exit(0);
}

throw new Error(`Unknown publish-manifest mode: ${mode ?? "(missing)"}`);
