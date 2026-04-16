import { expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const runtimeRoot = path.join(import.meta.dir, "..", "src", "runtime");

test("migration runtime source keeps planning and generated-artifact helpers in dedicated modules", () => {
	const migrationsSource = fs.readFileSync(
		path.join(runtimeRoot, "migrations.ts"),
		"utf8",
	);
	const planningSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-planning.ts"),
		"utf8",
	);
	const generatedArtifactsSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-generated-artifacts.ts"),
		"utf8",
	);

	expect(migrationsSource).toContain('from "./migration-planning.js"');
	expect(migrationsSource).toContain(
		'from "./migration-generated-artifacts.js"',
	);
	expect(migrationsSource).not.toContain("function hasSnapshotForVersion(");
	expect(migrationsSource).not.toContain("function resolveLegacyVersions(");
	expect(migrationsSource).not.toContain(
		"function collectGeneratedMigrationEntries(",
	);
	expect(migrationsSource).not.toContain(
		"function regenerateGeneratedArtifacts(",
	);
	expect(planningSource).toContain("export function resolveLegacyVersions(");
	expect(planningSource).toContain("export function createMigrationPlanNextSteps(");
	expect(generatedArtifactsSource).toContain(
		"export function collectGeneratedMigrationEntries(",
	);
	expect(generatedArtifactsSource).toContain(
		"export function regenerateGeneratedArtifacts(",
	);
});

test("migration project source keeps config parsing helpers in a dedicated module", () => {
	const projectSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-project.ts"),
		"utf8",
	);
	const configSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-project-config-source.ts"),
		"utf8",
	);

	expect(projectSource).toContain('from "./migration-project-config-source.js"');
	expect(projectSource).toContain(
		'export { parseMigrationConfig } from "./migration-project-config-source.js";',
	);
	expect(projectSource).not.toContain("function stripCommentsAndStrings(");
	expect(projectSource).not.toContain("function findMigrationConfigBodyRange(");
	expect(projectSource).not.toContain("function createTopLevelConfigView(");
	expect(projectSource).not.toContain(
		"function findTopLevelConfigPropertyValueStart(",
	);
	expect(configSource).toContain("export function parseMigrationConfig(");
	expect(configSource).toContain("function stripCommentsAndStrings(");
	expect(configSource).toContain("export function hasLegacyConfigKeys(");
});

test("migration render barrel delegates renderer families to focused modules", () => {
	const renderBarrelSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-render.ts"),
		"utf8",
	);
	const diffRuleSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-render-diff-rule.ts"),
		"utf8",
	);
	const generatedSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-render-generated.ts"),
		"utf8",
	);
	const executionSource = fs.readFileSync(
		path.join(runtimeRoot, "migration-render-execution.ts"),
		"utf8",
	);

	expect(renderBarrelSource).toContain(
		'from "./migration-render-diff-rule.js"',
	);
	expect(renderBarrelSource).toContain(
		'from "./migration-render-generated.js"',
	);
	expect(renderBarrelSource).toContain(
		'from "./migration-render-execution.js"',
	);
	expect(renderBarrelSource).not.toContain("export function renderMigrationRegistryFile(");
	expect(renderBarrelSource).not.toContain("export function renderVerifyFile(");
	expect(diffRuleSource).toContain("export function formatDiffReport(");
	expect(diffRuleSource).toContain("export function renderMigrationRuleFile(");
	expect(generatedSource).toContain("export function renderMigrationRegistryFile(");
	expect(generatedSource).toContain("export function renderPhpMigrationRegistryFile(");
	expect(executionSource).toContain("export function renderVerifyFile(");
	expect(executionSource).toContain("export function renderFuzzFile(");
});
