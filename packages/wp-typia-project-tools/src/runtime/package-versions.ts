import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { PROJECT_TOOLS_PACKAGE_ROOT } from "./template-registry.js";

interface PackageManifest {
	dependencies?: Record<string, string>;
	version?: string;
}

interface PackageVersions {
	apiClientPackageVersion: string;
	blockRuntimePackageVersion: string;
	blockTypesPackageVersion: string;
	projectToolsPackageVersion: string;
	restPackageVersion: string;
	wpTypiaPackageVersion: string;
}

const require = createRequire(import.meta.url);
const DEFAULT_VERSION_RANGE = "^0.0.0";

let cachedPackageVersions: PackageVersions | null = null;

function getErrorCode(error: unknown): string | undefined {
	return typeof error === "object" && error !== null && "code" in error
		? String((error as { code: unknown }).code)
		: undefined;
}

function normalizeVersionRange(value: string | undefined): string {
	const trimmed = value?.trim();
	if (!trimmed) {
		return DEFAULT_VERSION_RANGE;
	}
	if (trimmed.startsWith("workspace:")) {
		return DEFAULT_VERSION_RANGE;
	}

	return /^[~^<>=]/.test(trimmed) ? trimmed : `^${trimmed}`;
}

function readPackageManifest(packageJsonPath: string): PackageManifest | null {
	try {
		return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageManifest;
	} catch (error) {
		if (getErrorCode(error) === "ENOENT") {
			return null;
		}
		throw error;
	}
}

function resolveInstalledPackageManifest(packageName: string): PackageManifest | null {
	try {
		return readPackageManifest(require.resolve(`${packageName}/package.json`));
	} catch (error) {
		if (getErrorCode(error) === "MODULE_NOT_FOUND") {
			return null;
		}
		throw error;
	}
}

export function getPackageVersions(): PackageVersions {
	if (cachedPackageVersions) {
		return cachedPackageVersions;
	}

	const createManifest =
		readPackageManifest(path.join(PROJECT_TOOLS_PACKAGE_ROOT, "package.json")) ??
		resolveInstalledPackageManifest("@wp-typia/project-tools") ??
		{};
	const blockRuntimeManifest =
		readPackageManifest(
			path.join(PROJECT_TOOLS_PACKAGE_ROOT, "..", "wp-typia-block-runtime", "package.json"),
		) ??
		resolveInstalledPackageManifest("@wp-typia/block-runtime") ??
		{};
	const wpTypiaManifest =
		readPackageManifest(path.join(PROJECT_TOOLS_PACKAGE_ROOT, "..", "wp-typia", "package.json")) ??
		resolveInstalledPackageManifest("wp-typia") ??
		{};
	const blockRuntimeDependencyVersion = normalizeVersionRange(
		createManifest.dependencies?.["@wp-typia/block-runtime"],
	);

	cachedPackageVersions = {
		apiClientPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/api-client"] ??
				resolveInstalledPackageManifest("@wp-typia/api-client")?.version,
		),
		blockRuntimePackageVersion:
			blockRuntimeDependencyVersion !== DEFAULT_VERSION_RANGE
				? blockRuntimeDependencyVersion
				: normalizeVersionRange(blockRuntimeManifest.version),
		blockTypesPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/block-types"] ??
				resolveInstalledPackageManifest("@wp-typia/block-types")?.version,
		),
		projectToolsPackageVersion: normalizeVersionRange(createManifest.version),
		restPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/rest"] ??
				resolveInstalledPackageManifest("@wp-typia/rest")?.version,
		),
		wpTypiaPackageVersion: normalizeVersionRange(wpTypiaManifest.version),
	};

	return cachedPackageVersions;
}
