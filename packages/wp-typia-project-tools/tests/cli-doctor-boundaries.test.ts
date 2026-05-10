import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { resolveWorkspaceBootstrapPath } from "../src/runtime/cli-doctor-workspace-shared.js";

const sourceRoot = resolve(import.meta.dir, "..", "src", "runtime");

test("cli-doctor keeps environment and workspace checks in dedicated modules", () => {
	const cliDoctorSource = readFileSync(resolve(sourceRoot, "cli-doctor.ts"), "utf8");
	const environmentSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-environment.ts"),
		"utf8",
	);
	const workspaceSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace.ts"),
		"utf8",
	);
	const workspaceBlocksSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-blocks.ts"),
		"utf8",
	);
	const workspaceBindingsSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-bindings.ts"),
		"utf8",
	);
	const workspaceFeaturesSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features.ts"),
		"utf8",
	);
	const workspacePackageSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-package.ts"),
		"utf8",
	);
	const workspaceSharedSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-shared.ts"),
		"utf8",
	);
	const migrationDoctorSource = readFileSync(
		resolve(sourceRoot, "migration-maintenance-verify.ts"),
		"utf8",
	);

	expect(cliDoctorSource).toContain('from "./cli-doctor-environment.js"');
	expect(cliDoctorSource).toContain('from "./cli-doctor-workspace.js"');
	expect(cliDoctorSource).toContain("...(await getWorkspaceDoctorChecks(cwd)),");
	expect(cliDoctorSource).not.toContain("function readCommandVersion(");
	expect(cliDoctorSource).not.toContain("function checkWorkspacePackageMetadata(");
	expect(cliDoctorSource).not.toContain("function checkWorkspaceBindingBootstrap(");
	expect(environmentSource).toContain("export async function getEnvironmentDoctorChecks(");
	expect(workspaceSource).toContain("export async function getWorkspaceDoctorChecks(");
	expect(workspaceSource).toContain("readWorkspaceInventoryAsync(");
	expect(workspaceSource).toContain('from "./cli-doctor-workspace-bindings.js"');
	expect(workspaceSource).toContain('from "./cli-doctor-workspace-blocks.js"');
	expect(workspaceSource).toContain('from "./cli-doctor-workspace-features.js"');
	expect(workspaceSource).toContain('from "./cli-doctor-workspace-package.js"');
	expect(workspaceSource).toContain("intentionally stay synchronous");
	expect(workspaceSharedSource).toContain("category collectors remain synchronous");
	expect(migrationDoctorSource).toContain("synchronous maintenance command");
	expect(workspaceSource).not.toContain("function checkWorkspaceBlockMetadata(");
	expect(workspaceSource).not.toContain("function checkWorkspaceBindingBootstrap(");
	expect(workspaceSource).not.toContain("function checkWorkspaceAbilityBootstrap(");
	expect(workspaceBlocksSource).toContain("export function getWorkspaceBlockDoctorChecks(");
	expect(workspaceBindingsSource).toContain("export function getWorkspaceBindingDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("export function getWorkspaceFeatureDoctorChecks(");
	expect(workspacePackageSource).toContain("export function getWorkspacePackageMetadataCheck(");
});

test("cli-doctor resolves workspace bootstrap paths for scoped and unscoped packages", () => {
	const projectDir = resolve("/tmp", "wp-typia-doctor-demo");

	expect(resolveWorkspaceBootstrapPath(projectDir, "@example/demo-plugin")).toBe(
		join(projectDir, "demo-plugin.php"),
	);
	expect(resolveWorkspaceBootstrapPath(projectDir, "demo-plugin")).toBe(
		join(projectDir, "demo-plugin.php"),
	);
});
