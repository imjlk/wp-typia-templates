import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const runtimeRoot = path.join(import.meta.dir, "..", "src", "runtime");

test("built-in non-ts artifacts delegate family emitters and render helpers to focused modules", () => {
	const facadeSource = fs.readFileSync(
		path.join(runtimeRoot, "built-in-block-non-ts-artifacts.ts"),
		"utf8",
	);
	const familySource = fs.readFileSync(
		path.join(runtimeRoot, "built-in-block-non-ts-family-artifacts.ts"),
		"utf8",
	);
	const renderUtilsSource = fs.readFileSync(
		path.join(runtimeRoot, "built-in-block-non-ts-render-utils.ts"),
		"utf8",
	);

	expect(facadeSource).toContain(
		'from "./built-in-block-non-ts-family-artifacts.js"',
	);
	expect(facadeSource).toContain("buildBasicArtifacts");
	expect(facadeSource).not.toContain("const BASIC_STYLE_TEMPLATE =");
	expect(facadeSource).not.toContain("function renderArtifact(");
	expect(familySource).toContain("const BASIC_STYLE_TEMPLATE =");
	expect(familySource).toContain("export function buildPersistenceArtifacts(");
	expect(familySource).toContain("export function buildCompoundArtifacts(");
	expect(familySource).toContain(
		'from "./built-in-block-non-ts-render-utils.js"',
	);
	expect(renderUtilsSource).toContain("export function renderArtifact(");
	expect(renderUtilsSource).toContain(
		"export function buildAlternateRenderEntryArtifact(",
	);
	expect(renderUtilsSource).toContain("export function toPhpSingleQuotedString(");
});
