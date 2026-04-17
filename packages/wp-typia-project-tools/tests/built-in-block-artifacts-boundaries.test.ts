import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runtimeRoot = resolve(import.meta.dir, "..", "src", "runtime");

test("built-in block artifacts delegate type source emission to the focused helper module", () => {
	const artifactSource = readFileSync(
		resolve(runtimeRoot, "built-in-block-artifacts.ts"),
		"utf8",
	);
	const typeEmitterSource = readFileSync(
		resolve(runtimeRoot, "built-in-block-artifact-types.ts"),
		"utf8",
	);

	expect(artifactSource).toContain('from "./built-in-block-artifact-types.js"');
	expect(artifactSource).not.toContain("function emitTypesModule(");
	expect(artifactSource).not.toContain("function buildBasicTypesSource(");
	expect(artifactSource).not.toContain("function buildCompoundChildTypesSource(");
	expect(typeEmitterSource).toMatch(/function\s+emitTypesModule\s*\(/);
	expect(typeEmitterSource).toMatch(
		/export\s+function\s+buildBasicTypesSource\s*\(/,
	);
	expect(typeEmitterSource).toMatch(
		/export\s+function\s+buildCompoundChildTypesSource\s*\(/,
	);
});
