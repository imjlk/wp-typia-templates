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
	expect(smokeScript).toContain("collectProjectFilePaths");
	expect(smokeScript).toContain("shouldRunMigrationSmoke");
	expect(smokeScript).toContain('exampleProject === "my-typia-block"');
	expect(smokeScript).toContain('path.join(projectDir, "build", "blocks", blockSlug)');
	expect(smokeScript).toContain('devDependencies["bun-types"]');
	expect(smokeScript).toContain('devDependencies["@types/node"]');
	expect(smokeScript).toContain(
		'Expected ${configPath} to declare currentMigrationVersion in a supported format'
	);
	expect(smokeScript).toContain('Missing "typecheck" script in');
	expect(smokeScript).toContain('path.resolve(__dirname, "..", "examples", exampleProject)');
});

test("CI generated smoke matrix includes the checked-in example lanes", () => {
	const ciWorkflow = readFileSync(
		join(repoRoot, ".github", "workflows", "ci.yml"),
		"utf8",
	);

	expect(ciWorkflow).toContain("example_project: my-typia-block");
	expect(ciWorkflow).toContain("example_project: compound-patterns");
	expect(ciWorkflow).toContain("example_project: persistence-examples");
	expect(ciWorkflow).toContain("smoke-reference-my-typia-block-bun");
	expect(ciWorkflow).toContain("smoke-example-compound-patterns-bun");
	expect(ciWorkflow).toContain("smoke-example-persistence-examples-bun");
	expect(ciWorkflow).toContain('if [ -n "${{ matrix.template || \'\' }}" ]; then');
	expect(ciWorkflow).toContain('args+=(--template "${{ matrix.template }}")');
	expect(ciWorkflow).toContain('--example-project "${{ matrix.example_project }}"');
});
