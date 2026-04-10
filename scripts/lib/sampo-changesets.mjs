#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

export const CHANGESET_DIR = path.join(".sampo", "changesets");
export const WORKSPACE_ROOTS = ["packages", "examples"];
export const RELEASE_TYPE_PRIORITY = {
	patch: 0,
	minor: 1,
	major: 2,
};

export function toPosixRelativePath(repoRoot, targetPath) {
	const pathApi =
		repoRoot.includes("\\") || targetPath.includes("\\") ? path.win32 : path;
	return pathApi.relative(repoRoot, targetPath).split(pathApi.sep).join("/");
}

export function findPublishablePackages(repoRoot) {
	const packages = [];

	for (const rootDir of WORKSPACE_ROOTS) {
		const absoluteRoot = path.join(repoRoot, rootDir);
		if (!fs.existsSync(absoluteRoot)) {
			continue;
		}

		for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
			if (!entry.isDirectory()) {
				continue;
			}

			const packageDir = path.join(rootDir, entry.name);
			const packageJsonPath = path.join(repoRoot, packageDir, "package.json");
			if (!fs.existsSync(packageJsonPath)) {
				continue;
			}

			const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			if (pkg.private || typeof pkg.name !== "string" || pkg.name.length === 0) {
				continue;
			}

			packages.push({
				packageDir,
				packageId: `npm/${pkg.name}`,
				packageJsonPath,
				packageName: pkg.name,
				version: pkg.version,
			});
		}
	}

	return packages.sort((left, right) => left.packageId.localeCompare(right.packageId));
}

export function findPublishablePackageIds(repoRoot) {
	return findPublishablePackages(repoRoot).map(({ packageId }) => packageId);
}

export function parseChangesetFrontmatter(source, filePath = "<changeset>") {
	const lines = source.split(/\r?\n/u);

	if (lines[0] !== "---") {
		throw new Error(`${filePath}: expected frontmatter to start with ---`);
	}

	const entries = [];
	const seen = new Set();
	let closingIndex = -1;

	for (let index = 1; index < lines.length; index += 1) {
		const rawLine = lines[index];
		const line = rawLine.trim();

		if (line === "---") {
			closingIndex = index;
			break;
		}

		if (line === "" || line.startsWith("#")) {
			continue;
		}

		const separatorIndex = rawLine.indexOf(":");
		if (separatorIndex <= 0) {
			throw new Error(`${filePath}: malformed frontmatter line "${rawLine}"`);
		}

		const packageId = rawLine.slice(0, separatorIndex).trim();
		const releaseType = rawLine.slice(separatorIndex + 1).trim();

		if (packageId.length === 0 || releaseType.length === 0) {
			throw new Error(`${filePath}: malformed frontmatter line "${rawLine}"`);
		}

		if (!Object.hasOwn(RELEASE_TYPE_PRIORITY, releaseType)) {
			throw new Error(`${filePath}: unsupported release type "${releaseType}" for "${packageId}"`);
		}

		if (seen.has(packageId)) {
			throw new Error(`${filePath}: duplicate package id "${packageId}" in frontmatter`);
		}

		seen.add(packageId);
		entries.push({ packageId, releaseType });
	}

	if (closingIndex === -1) {
		throw new Error(`${filePath}: missing closing --- for frontmatter`);
	}

	if (entries.length === 0) {
		throw new Error(`${filePath}: frontmatter must declare at least one package id`);
	}

	return entries;
}

export function getChangesetFiles(repoRoot) {
	const absoluteChangesetDir = path.join(repoRoot, CHANGESET_DIR);
	if (!fs.existsSync(absoluteChangesetDir)) {
		return [];
	}

	return fs
		.readdirSync(absoluteChangesetDir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
		.map((entry) => path.join(absoluteChangesetDir, entry.name))
		.sort();
}

export function readPendingChangesets(repoRoot) {
	return getChangesetFiles(repoRoot).map((filePath) => {
		const relativePath = toPosixRelativePath(repoRoot, filePath);
		return {
			entries: parseChangesetFrontmatter(fs.readFileSync(filePath, "utf8"), relativePath),
			filePath,
			relativePath,
		};
	});
}

export function collectPendingReleaseTypes(repoRoot) {
	const releaseTypes = new Map();

	for (const { entries } of readPendingChangesets(repoRoot)) {
		for (const { packageId, releaseType } of entries) {
			const current = releaseTypes.get(packageId);
			if (
				current === undefined ||
				RELEASE_TYPE_PRIORITY[releaseType] > RELEASE_TYPE_PRIORITY[current]
			) {
				releaseTypes.set(packageId, releaseType);
			}
		}
	}

	return releaseTypes;
}

export function validateSampoChangesets(repoRoot) {
	const allowedPackageIds = new Set(findPublishablePackageIds(repoRoot));
	const files = getChangesetFiles(repoRoot);
	const errors = [];

	for (const filePath of files) {
		const relativePath = toPosixRelativePath(repoRoot, filePath);
		const source = fs.readFileSync(filePath, "utf8");

		try {
			const entries = parseChangesetFrontmatter(source, relativePath);
			for (const { packageId } of entries) {
				if (!packageId.startsWith("npm/")) {
					errors.push(
						`${relativePath}: "${packageId}" must use the canonical npm/<package-name> format`,
					);
					continue;
				}

				if (!allowedPackageIds.has(packageId)) {
					errors.push(
						`${relativePath}: "${packageId}" does not match a publishable workspace package`,
					);
				}
			}
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
		}
	}

	return {
		allowedPackageIds: [...allowedPackageIds].sort(),
		errors,
		files: files.map((filePath) => toPosixRelativePath(repoRoot, filePath)),
		valid: errors.length === 0,
	};
}

export function formatChangesetValidationSuccessMessage(result) {
	if (result.files.length === 0) {
		return "No pending Sampo changesets to validate.";
	}

	return `Validated ${result.files.length} pending Sampo changeset${result.files.length === 1 ? "" : "s"} against ${result.allowedPackageIds.length} publishable package ids.`;
}
