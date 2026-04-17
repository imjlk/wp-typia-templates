import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtimeRoot = resolve(import.meta.dir, "..", "src", "runtime");

test("built-in block artifacts delegate type and document helpers to focused modules", () => {
	const artifactSource = readFileSync(
		resolve(runtimeRoot, "built-in-block-artifacts.ts"),
		"utf8",
	);
	const typeEmitterSource = readFileSync(
		resolve(runtimeRoot, "built-in-block-artifact-types.ts"),
		"utf8",
	);
	const documentSource = readFileSync(
		resolve(runtimeRoot, "built-in-block-artifact-documents.ts"),
		"utf8",
	);

	expect(artifactSource).toContain('from "./built-in-block-artifact-types.js"');
	expect(artifactSource).toContain('from "./built-in-block-artifact-documents.js"');
	expect(artifactSource).not.toContain("function emitTypesModule(");
	expect(artifactSource).not.toContain("function buildBasicTypesSource(");
	expect(artifactSource).not.toContain("function buildCompoundChildTypesSource(");
	expect(artifactSource).not.toContain("function createManifestAttribute(");
	expect(artifactSource).not.toContain("function buildAttributesFromSpecs(");
	expect(artifactSource).not.toContain("function buildBasicAttributes(");
	expect(typeEmitterSource).toMatch(/function\s+emitTypesModule\s*\(/);
	expect(typeEmitterSource).toMatch(
		/export\s+function\s+buildBasicTypesSource\s*\(/,
	);
	expect(typeEmitterSource).toMatch(
		/export\s+function\s+buildCompoundChildTypesSource\s*\(/,
	);
	expect(documentSource).toMatch(
		/export\s+function\s+buildManifestDocument\s*\(/,
	);
	expect(documentSource).toMatch(
		/export\s+function\s+buildBasicAttributes\s*\(/,
	);
	expect(documentSource).toMatch(
		/export\s+function\s+buildCompoundChildAttributes\s*\(/,
	);
});
