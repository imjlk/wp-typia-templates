import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const runtimeRoot = path.join(import.meta.dir, "..", "src", "runtime");

test("scaffold runtime delegates identifier and document helpers to focused modules", () => {
	const scaffoldSource = fs.readFileSync(
		path.join(runtimeRoot, "scaffold.ts"),
		"utf8",
	);
	const identifiersSource = fs.readFileSync(
		path.join(runtimeRoot, "scaffold-identifiers.ts"),
		"utf8",
	);
	const applyUtilsSource = fs.readFileSync(
		path.join(runtimeRoot, "scaffold-apply-utils.ts"),
		"utf8",
	);

	expect(scaffoldSource).toContain('from "./scaffold-identifiers.js"');
	expect(scaffoldSource).toContain('from "./scaffold-apply-utils.js"');
	expect(scaffoldSource).toContain(
		'export { buildBlockCssClassName } from "./scaffold-identifiers.js";',
	);
	expect(scaffoldSource).not.toContain("function validateBlockSlug(");
	expect(scaffoldSource).not.toContain("function validateNamespace(");
	expect(scaffoldSource).not.toContain("function validatePhpPrefix(");
	expect(scaffoldSource).not.toContain("function buildReadme(");
	expect(scaffoldSource).not.toContain("function buildGitignore(");
	expect(scaffoldSource).not.toContain("function mergeTextLines(");
	expect(identifiersSource).toContain("export function validateBlockSlug(");
	expect(identifiersSource).toContain(
		"export function resolveScaffoldIdentifiers(",
	);
	expect(applyUtilsSource).toContain("export function buildReadme(");
	expect(applyUtilsSource).toContain("export function buildGitignore(");
	expect(applyUtilsSource).toContain("export function mergeTextLines(");
});
