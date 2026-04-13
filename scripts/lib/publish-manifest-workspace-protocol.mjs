import fs from "node:fs";
import path from "node:path";

import { DEPENDENCY_FIELDS, readJson } from "../publish-package-utils.mjs";

function getWorkspacePackageVersions(packagesRoot) {
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

function hasWorkspaceProtocolDependency(manifest) {
	return DEPENDENCY_FIELDS.some((field) => {
		const section = manifest[field];
		if (!section || typeof section !== "object") {
			return false;
		}

		return Object.values(section).some(
			(spec) => typeof spec === "string" && spec.startsWith("workspace:"),
		);
	});
}

function getManifestPaths(packageRoot) {
	return {
		backupPath: path.join(packageRoot, ".package.json.publish-backup"),
		packageJsonPath: path.join(packageRoot, "package.json"),
		packagesRoot: path.resolve(packageRoot, ".."),
	};
}

export function preparePublishManifest(packageRoot) {
	const { backupPath, packageJsonPath, packagesRoot } = getManifestPaths(packageRoot);
	const currentSource = fs.readFileSync(packageJsonPath, "utf8");
	const manifest = JSON.parse(currentSource);
	const versions = getWorkspacePackageVersions(packagesRoot);

	if (!fs.existsSync(backupPath) || hasWorkspaceProtocolDependency(manifest)) {
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

export function restorePublishManifest(packageRoot) {
	const { backupPath, packageJsonPath } = getManifestPaths(packageRoot);

	if (process.env.WP_TYPIA_SKIP_POSTPACK_RESTORE === "1") {
		return;
	}

	if (!fs.existsSync(backupPath)) {
		return;
	}

	fs.copyFileSync(backupPath, packageJsonPath);
	fs.rmSync(backupPath, { force: true });
}

export function runPublishManifestCli({
	argv = process.argv,
	packageRoot,
} = {}) {
	const mode = argv[2];

	if (mode === "prepare") {
		preparePublishManifest(packageRoot);
		return 0;
	}

	if (mode === "restore") {
		restorePublishManifest(packageRoot);
		return 0;
	}

	throw new Error(`Unknown publish-manifest mode: ${mode ?? "(missing)"}`);
}
