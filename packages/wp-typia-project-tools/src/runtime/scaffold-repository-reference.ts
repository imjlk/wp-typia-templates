import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { PROJECT_TOOLS_PACKAGE_ROOT } from "./template-registry.js";

interface RepositoryPackageManifest {
	repository?:
		| string
		| {
				type?: string;
				url?: string;
		  };
}

const require = createRequire(import.meta.url);

/**
 * Default scaffold repository reference used when no GitHub repository metadata
 * can be resolved from the current runtime package manifests.
 */
export const DEFAULT_SCAFFOLD_REPOSITORY_REFERENCE = "imjlk/wp-typia";

function getErrorCode(error: unknown): string | undefined {
	return typeof error === "object" && error !== null && "code" in error
		? String((error as { code: unknown }).code)
		: undefined;
}

function readRepositoryPackageManifest(
	packageJsonPath: string,
): RepositoryPackageManifest | null {
	try {
		return JSON.parse(
			fs.readFileSync(packageJsonPath, "utf8"),
		) as RepositoryPackageManifest;
	} catch (error) {
		if (getErrorCode(error) === "ENOENT") {
			return null;
		}

		throw error;
	}
}

function resolveInstalledPackageManifestPath(
	packageName: string,
): string | null {
	try {
		return require.resolve(`${packageName}/package.json`);
	} catch (error) {
		if (getErrorCode(error) === "MODULE_NOT_FOUND") {
			return null;
		}

		throw error;
	}
}

function getRepositoryFieldValue(
	manifest: RepositoryPackageManifest | null,
): string | undefined {
	if (!manifest?.repository) {
		return undefined;
	}

	return typeof manifest.repository === "string"
		? manifest.repository
		: manifest.repository.url;
}

function parseRepositoryReference(
	value: string | undefined,
): string | null {
	const trimmed = value?.trim();
	if (!trimmed) {
		return null;
	}

	if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(trimmed)) {
		return trimmed;
	}

	const normalizedValue = trimmed
		.replace(/^git\+/u, "")
		.replace(/\.git$/u, "");
	const githubMatch = normalizedValue.match(
		/github\.com(?:[:/])([^/\s#]+)\/([^/\s#]+?)(?:\.git)?(?:[/?#]|$)/iu,
	);

	if (!githubMatch) {
		return null;
	}

	return `${githubMatch[1]}/${githubMatch[2]}`;
}

function getDefaultRepositoryManifestPaths(): string[] {
	const candidatePaths = [
		path.resolve(PROJECT_TOOLS_PACKAGE_ROOT, "..", "..", "package.json"),
		path.resolve(PROJECT_TOOLS_PACKAGE_ROOT, "..", "wp-typia", "package.json"),
		path.join(PROJECT_TOOLS_PACKAGE_ROOT, "package.json"),
		resolveInstalledPackageManifestPath("wp-typia"),
		resolveInstalledPackageManifestPath("@wp-typia/project-tools"),
	].filter((candidatePath): candidatePath is string => Boolean(candidatePath));

	return candidatePaths.filter(
		(candidatePath, index, allPaths) =>
			allPaths.indexOf(candidatePath) === index,
	);
}

/**
 * Resolves the canonical scaffold repository reference in `owner/repo` format.
 *
 * The resolver checks candidate package manifests in priority order, extracts
 * their `repository` field, and returns the first GitHub slug it can parse.
 * When no candidate yields a GitHub repository reference, the fallback value
 * is returned instead.
 */
export function resolveScaffoldRepositoryReference({
	fallback = DEFAULT_SCAFFOLD_REPOSITORY_REFERENCE,
	manifestPaths = getDefaultRepositoryManifestPaths(),
}: {
	fallback?: string;
	manifestPaths?: readonly string[];
} = {}): string {
	for (const manifestPath of manifestPaths) {
		const repositoryReference = parseRepositoryReference(
			getRepositoryFieldValue(readRepositoryPackageManifest(manifestPath)),
		);

		if (repositoryReference) {
			return repositoryReference;
		}
	}

	return fallback;
}

/**
 * Replaces legacy scaffold repository placeholders with a concrete
 * `owner/repo` reference.
 */
export function replaceRepositoryReferencePlaceholders(
	source: string,
	repositoryReference: string,
): string {
	return source
		.replace(/yourusername\/wp-typia-boilerplate/g, repositoryReference)
		.replace(/yourusername\/wp-typia/g, repositoryReference);
}
