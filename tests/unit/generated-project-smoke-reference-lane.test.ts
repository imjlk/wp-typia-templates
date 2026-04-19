import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");

test("generated project smoke script supports a reference example lane", () => {
	const smokeScript = readFileSync(
		join(repoRoot, "scripts", "run-generated-project-smoke.mjs"),
		"utf8",
	);
	const exampleHelper = readFileSync(
		join(repoRoot, "scripts", "lib", "generated-project-smoke-example.mjs"),
		"utf8",
	);
	const assertionHelper = readFileSync(
		join(repoRoot, "scripts", "lib", "generated-project-smoke-assertions.mjs"),
		"utf8",
	);
	const coreHelper = readFileSync(
		join(repoRoot, "scripts", "lib", "generated-project-smoke-core.mjs"),
		"utf8",
	);

	expect(smokeScript).toContain("exampleProject");
	expect(smokeScript).toContain("--example-project");
	expect(smokeScript).toContain('./lib/generated-project-smoke-example.mjs');
	expect(smokeScript).toContain('./lib/generated-project-smoke-assertions.mjs');
	expect(smokeScript).toContain("runExampleProjectSmoke");
	expect(smokeScript).toContain("assertGeneratedProjectScaffold");
	expect(exampleHelper).toContain("ensureCopiedExampleSupportDependencies");
	expect(exampleHelper).toContain("runExampleProjectSmoke");
	expect(exampleHelper).toContain("shouldRunMigrationSmoke");
	expect(exampleHelper).toContain('devDependencies["bun-types"]');
	expect(exampleHelper).toContain('devDependencies["@types/node"]');
	expect(assertionHelper).toContain("assertExampleProjectScaffold");
	expect(assertionHelper).toContain("collectProjectFilePaths");
	expect(assertionHelper).toContain("PHP lint failed for");
	expect(assertionHelper).toContain('exampleProject === "my-typia-block"');
	expect(assertionHelper).toContain('path.join(projectDir, "build", "blocks", blockSlug)');
	expect(coreHelper).toContain(
		'Expected ${configPath} to declare currentMigrationVersion in a supported format'
	);
	expect(coreHelper).toContain("cleanupTemporaryProjectRoot");
	expect(exampleHelper).toContain('Missing "typecheck" script in');
	expect(exampleHelper).toContain('path.resolve(repoRoot, "examples", exampleProject)');
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
	expect(ciWorkflow).toContain(
		"Generated Project Smoke (${{ matrix.project_name || matrix.example_project }})",
	);
	expect(ciWorkflow).toContain('if [ -n "${{ matrix.template || \'\' }}" ]; then');
	expect(ciWorkflow).toContain('args+=(--template "${{ matrix.template }}")');
	expect(ciWorkflow).toContain('--example-project "${{ matrix.example_project }}"');
});
