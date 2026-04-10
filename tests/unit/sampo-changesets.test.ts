import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	findPublishablePackageIds,
	parseChangesetFrontmatter,
	toPosixRelativePath,
	validateSampoChangesets,
} from "../../scripts/validate-sampo-changesets.mjs";

let tempDirs: string[] = [];

afterEach(() => {
	for (const tempDir of tempDirs) {
		fs.rmSync(tempDir, { force: true, recursive: true });
	}
	tempDirs = [];
});

function createTempRepo() {
	const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-sampo-test-"));
	tempDirs.push(repoRoot);
	fs.mkdirSync(path.join(repoRoot, ".sampo", "changesets"), { recursive: true });
	fs.mkdirSync(path.join(repoRoot, "packages", "create"), { recursive: true });
	fs.mkdirSync(path.join(repoRoot, "packages", "rest"), { recursive: true });
	fs.mkdirSync(path.join(repoRoot, "examples", "compound-patterns"), { recursive: true });
	fs.mkdirSync(path.join(repoRoot, "examples", "private-example"), { recursive: true });

	fs.writeFileSync(
		path.join(repoRoot, "packages", "create", "package.json"),
		JSON.stringify({ name: "@wp-typia/project-tools", version: "0.1.0" }, null, 2),
	);
	fs.writeFileSync(
		path.join(repoRoot, "packages", "rest", "package.json"),
		JSON.stringify({ name: "@wp-typia/rest", version: "0.1.0" }, null, 2),
	);
	fs.writeFileSync(
		path.join(repoRoot, "examples", "compound-patterns", "package.json"),
		JSON.stringify({ name: "compound-patterns", version: "0.1.0" }, null, 2),
	);
	fs.writeFileSync(
		path.join(repoRoot, "examples", "private-example", "package.json"),
		JSON.stringify({ name: "private-example", private: true, version: "0.1.0" }, null, 2),
	);

	return repoRoot;
}

describe("validate-sampo-changesets", () => {
	test("findPublishablePackageIds returns canonical npm ids for non-private workspaces", () => {
		const repoRoot = createTempRepo();

		expect(findPublishablePackageIds(repoRoot)).toEqual([
			"npm/@wp-typia/project-tools",
			"npm/@wp-typia/rest",
			"npm/compound-patterns",
		]);
	});

	test("parseChangesetFrontmatter rejects duplicate package ids", () => {
		expect(() =>
			parseChangesetFrontmatter(
				["---", "npm/@wp-typia/project-tools: patch", "npm/@wp-typia/project-tools: minor", "---"].join("\n"),
				"duplicate.md",
			),
		).toThrow('duplicate.md: duplicate package id "npm/@wp-typia/project-tools" in frontmatter');
	});

	test("parseChangesetFrontmatter rejects inherited object keys as release types", () => {
		expect(() =>
			parseChangesetFrontmatter(
				["---", "npm/@wp-typia/project-tools: toString", "---"].join("\n"),
				"invalid-release-type.md",
			),
		).toThrow(
			'invalid-release-type.md: unsupported release type "toString" for "npm/@wp-typia/project-tools"',
		);
	});

	test("toPosixRelativePath normalizes separators for validator output", () => {
		expect(toPosixRelativePath("/repo", "/repo/.sampo/changesets/valid.md")).toBe(
			".sampo/changesets/valid.md",
		);
		expect(toPosixRelativePath("C:\\repo", "C:\\repo\\.sampo\\changesets\\valid.md")).toBe(
			".sampo/changesets/valid.md",
		);
	});

	test("validateSampoChangesets passes for canonical package ids", () => {
		const repoRoot = createTempRepo();

		fs.writeFileSync(
			path.join(repoRoot, ".sampo", "changesets", "valid.md"),
			["---", "npm/@wp-typia/project-tools: patch", "npm/compound-patterns: patch", "---", "", "Valid."].join(
				"\n",
			),
		);

		const result = validateSampoChangesets(repoRoot);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	test("validateSampoChangesets fails when the npm prefix is missing", () => {
		const repoRoot = createTempRepo();

		fs.writeFileSync(
			path.join(repoRoot, ".sampo", "changesets", "missing-prefix.md"),
			["---", "@wp-typia/project-tools: patch", "---", "", "Invalid."].join("\n"),
		);

		const result = validateSampoChangesets(repoRoot);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'.sampo/changesets/missing-prefix.md: "@wp-typia/project-tools" must use the canonical npm/<package-name> format',
		);
	});

	test("validateSampoChangesets fails for unknown package ids", () => {
		const repoRoot = createTempRepo();

		fs.writeFileSync(
			path.join(repoRoot, ".sampo", "changesets", "unknown.md"),
			["---", "npm/@wp-typia/unknown: patch", "---", "", "Invalid."].join("\n"),
		);

		const result = validateSampoChangesets(repoRoot);

		expect(result.valid).toBe(false);
		expect(result.errors).toContain(
			'.sampo/changesets/unknown.md: "npm/@wp-typia/unknown" does not match a publishable workspace package',
		);
	});

	test("validateSampoChangesets passes when there are no pending changesets", () => {
		const repoRoot = createTempRepo();
		fs.rmSync(path.join(repoRoot, ".sampo", "changesets"), { force: true, recursive: true });

		const result = validateSampoChangesets(repoRoot);

		expect(result.valid).toBe(true);
		expect(result.files).toEqual([]);
		expect(result.errors).toEqual([]);
	});
});
