#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHANGESET_DIR = path.join(".sampo", "changesets");
const WORKSPACE_ROOTS = ["packages", "examples"];

/**
 * Returns the canonical Sampo package ids for publishable workspace packages.
 */
export function findPublishablePackageIds(repoRoot) {
	const ids = new Set();

	for (const rootDir of WORKSPACE_ROOTS) {
		const absoluteRoot = path.join(repoRoot, rootDir);
		if (!fs.existsSync(absoluteRoot)) {
			continue;
		}

		for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
			if (!entry.isDirectory()) {
				continue;
			}

			const packageJsonPath = path.join(absoluteRoot, entry.name, "package.json");
			if (!fs.existsSync(packageJsonPath)) {
				continue;
			}

			const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			if (pkg.private || typeof pkg.name !== "string" || pkg.name.length === 0) {
				continue;
			}

			ids.add(`npm/${pkg.name}`);
		}
	}

	return [...ids].sort();
}

/**
 * Parses the package-id frontmatter block from one Sampo changeset file.
 */
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

function getChangesetFiles(repoRoot) {
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

/**
 * Validates pending Sampo changesets against canonical package ids.
 */
export function validateSampoChangesets(repoRoot) {
	const allowedPackageIds = new Set(findPublishablePackageIds(repoRoot));
	const files = getChangesetFiles(repoRoot);
	const errors = [];

	for (const filePath of files) {
		const relativePath = path.relative(repoRoot, filePath);
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
		files: files.map((filePath) => path.relative(repoRoot, filePath)),
		valid: errors.length === 0,
	};
}

function formatSuccessMessage(result) {
	if (result.files.length === 0) {
		return "No pending Sampo changesets to validate.";
	}

	return `Validated ${result.files.length} pending Sampo changeset${result.files.length === 1 ? "" : "s"} against ${result.allowedPackageIds.length} publishable package ids.`;
}

export function runCli({ cwd = process.cwd(), stdout = process.stdout, stderr = process.stderr } = {}) {
	const result = validateSampoChangesets(cwd);

	if (!result.valid) {
		stderr.write("Invalid Sampo changesets detected:\n");
		for (const error of result.errors) {
			stderr.write(`- ${error}\n`);
		}
		return 1;
	}

	stdout.write(`${formatSuccessMessage(result)}\n`);
	return 0;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
	process.exitCode = runCli();
}
