import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	formatPatternCatalogDiagnostics,
	resolvePatternCatalogContentFile,
	validatePatternCatalog,
} from "../src/runtime/pattern-catalog.js";

describe("pattern catalog validation", () => {
	test("accepts a typed full and section pattern catalog", () => {
		const projectDir = fs.mkdtempSync(
			path.join(os.tmpdir(), "wp-typia-pattern-catalog-"),
		);
		try {
			fs.mkdirSync(path.join(projectDir, "src", "patterns", "full"), {
				recursive: true,
			});
			fs.mkdirSync(path.join(projectDir, "src", "patterns", "sections"), {
				recursive: true,
			});
			fs.writeFileSync(
				path.join(projectDir, "src", "patterns", "full", "landing.php"),
				"<?php\n",
				"utf8",
			);
			fs.writeFileSync(
				path.join(projectDir, "src", "patterns", "sections", "hero.php"),
				"<?php\n",
				"utf8",
			);

			const result = validatePatternCatalog(
				[
					{
						contentFile: "src/patterns/full/landing.php",
						scope: "full",
						slug: "landing",
						tags: ["landing", "classic"],
						thumbnailUrl: "./thumbnails/landing.png",
						title: "Landing",
					},
					{
						contentFile: "src/patterns/sections/hero.php",
						scope: "section",
						sectionRole: "hero",
						slug: "hero",
						tags: ["hero"],
						thumbnailUrl: "https://example.com/hero.png",
						title: "Hero",
					},
				],
				{ projectDir },
			);

			expect(result.diagnostics).toEqual([]);
		} finally {
			fs.rmSync(projectDir, { force: true, recursive: true });
		}
	});

	test("reports duplicate slugs, missing files, and invalid metadata", () => {
		const result = validatePatternCatalog(
			[
				{
					contentFile: "src/patterns/full/hero.php",
					scope: "full",
					slug: "hero",
					tags: ["hero"],
				},
				{
					contentFile: "../outside.php",
					scope: "section",
					slug: "hero",
					tags: ["Hero"],
					thumbnailUrl: "ftp://example.com/hero.png",
				},
				{
					scope: "detail",
					sectionRole: "1detail",
					slug: "bad_scope",
				},
			],
			{ projectDir: process.cwd() },
		);

		expect(result.errors.map((diagnostic) => diagnostic.code)).toEqual([
			"missing-pattern-content-file",
			"duplicate-pattern-slug",
			"missing-pattern-section-role",
			"invalid-pattern-tag",
			"invalid-pattern-thumbnail-url",
			"invalid-pattern-content-file",
			"invalid-pattern-slug",
			"invalid-pattern-scope",
			"invalid-pattern-section-role",
			"missing-pattern-content-file",
		]);
		expect(formatPatternCatalogDiagnostics(result.errors)).toContain(
			"[duplicate-pattern-slug] hero",
		);
		expect(resolvePatternCatalogContentFile({ file: "legacy.php" })).toBe(
			"legacy.php",
		);
	});
});
