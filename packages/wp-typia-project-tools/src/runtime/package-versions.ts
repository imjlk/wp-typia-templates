import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { PROJECT_TOOLS_PACKAGE_ROOT } from "./template-registry.js";

interface PackageManifest {
	dependencies?: Record<string, string>;
	version?: string;
}

export interface PackageVersions {
	apiClientPackageVersion: string;
	blockRuntimePackageVersion: string;
	blockTypesPackageVersion: string;
	projectToolsPackageVersion: string;
	restPackageVersion: string;
	wpTypiaPackageExactVersion: string;
	wpTypiaPackageVersion: string;
}

interface PackageManifestLocation {
	cacheKey: string;
	packageJsonPath: string | null;
	source: string | null;
}

const require = createRequire(import.meta.url);
const DEFAULT_VERSION_RANGE = "^0.0.0";
const DEFAULT_EXACT_VERSION = "0.0.0";

let cachedPackageVersions:
	| {
			cacheKey: string;
			versions: PackageVersions;
	  }
	| null = null;

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

function normalizeExactVersion(value: string | undefined): string {
	const trimmed = value?.trim();
	if (!trimmed) {
		return DEFAULT_EXACT_VERSION;
	}
	if (trimmed.startsWith("workspace:")) {
		return DEFAULT_EXACT_VERSION;
	}
	return trimmed.replace(/^[~^<>=]+/, "");
}

function createContentFingerprint(source: string): string {
	let hash = 2166136261;
	for (let index = 0; index < source.length; index += 1) {
		hash ^= source.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return (hash >>> 0).toString(16);
}

function resolvePackageManifestLocation(packageJsonPath: string): PackageManifestLocation {
	try {
		const stats = fs.statSync(packageJsonPath);
		const source = fs.readFileSync(packageJsonPath, "utf8");
		return {
			cacheKey: `file:${packageJsonPath}:${stats.ino}:${stats.mtimeMs}:${stats.ctimeMs}:${stats.size}:${createContentFingerprint(source)}`,
			packageJsonPath,
			source,
		};
	} catch (error) {
		if (getErrorCode(error) === "ENOENT") {
			return {
				cacheKey: `missing-file:${packageJsonPath}`,
				packageJsonPath: null,
				source: null,
			};
		}
		throw error;
	}
}

function readPackageManifest(location: PackageManifestLocation): PackageManifest | null {
	if (!location.packageJsonPath || location.source === null) {
		return null;
	}

	return JSON.parse(location.source) as PackageManifest;
}

function resolveInstalledPackageManifestLocation(packageName: string): PackageManifestLocation {
	try {
		return resolvePackageManifestLocation(require.resolve(`${packageName}/package.json`));
	} catch (error) {
		if (getErrorCode(error) === "MODULE_NOT_FOUND") {
			return {
				cacheKey: `missing-module:${packageName}`,
				packageJsonPath: null,
				source: null,
			};
		}
		throw error;
	}
}

function composePackageVersionsCacheKey(
	locations: readonly PackageManifestLocation[],
): string {
	return locations.map((location) => location.cacheKey).join("|");
}

/**
 * Clears the in-memory cache used by `getPackageVersions()`.
 *
 * Long-lived processes can call this after regenerating or updating package
 * manifests when they want the next lookup to recompute version metadata
 * synchronously from disk.
 */
export function clearPackageVersionsCache(): void {
	cachedPackageVersions = null;
}

/**
 * Backwards-compatible alias for integrations that adopted the original
 * internal invalidation name before the public cache policy was documented.
 */
export function invalidatePackageVersionsCache(): void {
	clearPackageVersionsCache();
}

/**
 * Resolve package versions used in generated manifests and onboarding text.
 *
 * The lookup keeps a process-local cached result while recomputing manifest
 * fingerprints on each call. When the relevant package metadata changes on
 * disk, the cache key changes and the returned version object is refreshed.
 */
export function getPackageVersions(): PackageVersions {
	const createManifestLocation = resolvePackageManifestLocation(
		path.join(PROJECT_TOOLS_PACKAGE_ROOT, "package.json"),
	);
	const blockRuntimeManifestLocation = resolvePackageManifestLocation(
		path.join(PROJECT_TOOLS_PACKAGE_ROOT, "..", "wp-typia-block-runtime", "package.json"),
	);
	const wpTypiaManifestLocation = resolvePackageManifestLocation(
		path.join(PROJECT_TOOLS_PACKAGE_ROOT, "..", "wp-typia", "package.json"),
	);
	const installedProjectToolsManifestLocation =
		resolveInstalledPackageManifestLocation("@wp-typia/project-tools");
	const installedApiClientManifestLocation =
		resolveInstalledPackageManifestLocation("@wp-typia/api-client");
	const installedBlockRuntimeManifestLocation =
		resolveInstalledPackageManifestLocation("@wp-typia/block-runtime");
	const installedBlockTypesManifestLocation =
		resolveInstalledPackageManifestLocation("@wp-typia/block-types");
	const installedRestManifestLocation =
		resolveInstalledPackageManifestLocation("@wp-typia/rest");
	const installedWpTypiaManifestLocation =
		resolveInstalledPackageManifestLocation("wp-typia");
	const cacheKey = composePackageVersionsCacheKey([
		createManifestLocation,
		blockRuntimeManifestLocation,
		wpTypiaManifestLocation,
		installedProjectToolsManifestLocation,
		installedApiClientManifestLocation,
		installedBlockRuntimeManifestLocation,
		installedBlockTypesManifestLocation,
		installedRestManifestLocation,
		installedWpTypiaManifestLocation,
	]);

	if (cachedPackageVersions?.cacheKey === cacheKey) {
		return cachedPackageVersions.versions;
	}

	const createManifest =
		readPackageManifest(createManifestLocation) ??
		readPackageManifest(installedProjectToolsManifestLocation) ??
		{};
	const blockRuntimeManifest =
		readPackageManifest(blockRuntimeManifestLocation) ??
		readPackageManifest(installedBlockRuntimeManifestLocation) ??
		{};
	const wpTypiaManifest =
		readPackageManifest(wpTypiaManifestLocation) ??
		readPackageManifest(installedWpTypiaManifestLocation) ??
		{};
	const blockRuntimeDependencyVersion = normalizeVersionRange(
		createManifest.dependencies?.["@wp-typia/block-runtime"],
	);
	const versions = {
		apiClientPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/api-client"] ??
				readPackageManifest(installedApiClientManifestLocation)?.version,
		),
		blockRuntimePackageVersion:
			blockRuntimeDependencyVersion !== DEFAULT_VERSION_RANGE
				? blockRuntimeDependencyVersion
				: normalizeVersionRange(blockRuntimeManifest.version),
		blockTypesPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/block-types"] ??
				readPackageManifest(installedBlockTypesManifestLocation)?.version,
		),
		projectToolsPackageVersion: normalizeVersionRange(createManifest.version),
		restPackageVersion: normalizeVersionRange(
			createManifest.dependencies?.["@wp-typia/rest"] ??
				readPackageManifest(installedRestManifestLocation)?.version,
		),
		wpTypiaPackageExactVersion: normalizeExactVersion(wpTypiaManifest.version),
		wpTypiaPackageVersion: normalizeVersionRange(wpTypiaManifest.version),
	};

	cachedPackageVersions = {
		cacheKey,
		versions,
	};

	return versions;
}
