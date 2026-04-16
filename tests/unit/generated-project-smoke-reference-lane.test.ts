import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");

test("generated project smoke script supports a reference example lane", () => {
	const smokeScript = readFileSync(
		join(repoRoot, "scripts", "run-generated-project-smoke.mjs"),
		"utf8",
	);

	expect(smokeScript).toContain("exampleProject");
	expect(smokeScript).toContain("--example-project");
	expect(smokeScript).toContain("runExampleProjectSmoke");
	expect(smokeScript).toContain("assertExampleProjectScaffold");
	expect(smokeScript).toContain("ensureCopiedExampleSupportDependencies");
	expect(smokeScript).toContain('devDependencies["bun-types"]');
	expect(smokeScript).toContain('devDependencies["@types/node"]');
	expect(smokeScript).toContain('path.resolve(__dirname, "..", "examples", exampleProject)');
});

test("CI generated smoke matrix includes the reference app lane", () => {
	const ciWorkflow = readFileSync(
		join(repoRoot, ".github", "workflows", "ci.yml"),
		"utf8",
	);

	expect(ciWorkflow).toContain("example_project: my-typia-block");
	expect(ciWorkflow).toContain("smoke-reference-my-typia-block-bun");
	expect(ciWorkflow).toContain('--example-project "${{ matrix.example_project }}"');
});
