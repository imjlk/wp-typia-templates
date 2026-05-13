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
	const workspaceBlockAddonsSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-block-addons.ts"),
		"utf8",
	);
	const workspaceBlockIframeSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-block-iframe.ts"),
		"utf8",
	);
	const workspaceBlockMetadataSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-block-metadata.ts"),
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
	const workspaceFeatureAbilitiesSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-abilities.ts"),
		"utf8",
	);
	const workspaceFeatureAdminViewsSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-admin-views.ts"),
		"utf8",
	);
	const workspaceFeatureAiSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-ai.ts"),
		"utf8",
	);
	const workspaceFeatureEditorPluginsSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-editor-plugins.ts"),
		"utf8",
	);
	const workspaceFeaturePostMetaSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-post-meta.ts"),
		"utf8",
	);
	const workspaceFeatureRestSource = readFileSync(
		resolve(sourceRoot, "cli-doctor-workspace-features-rest.ts"),
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
	expect(environmentSource).toContain('from "./cli-doctor-workspace-shared.js"');
	expect(environmentSource).not.toContain("function createDoctorCheck(");
	expect(workspaceSource).toContain("export async function getWorkspaceDoctorChecks(");
	expect(workspaceSource).toContain("readWorkspaceInventoryAsync(");
	expect(workspaceSource).toContain("prepareWorkspacePackageDoctorSnapshot(");
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
	expect(workspaceSource).toContain("getWorkspaceBlockDoctorChecks(workspace, inventory)");
	expect(workspaceSource).toContain(
		"getWorkspaceBindingDoctorChecks(workspace, inventory)",
	);
	expect(workspaceSource).toContain(
		"getWorkspaceFeatureDoctorChecks(workspace, inventory)",
	);
	expect(workspaceBlocksSource).toContain("export function getWorkspaceBlockDoctorChecks(");
	expect(workspaceBlocksSource).toContain("getWorkspaceBlockCoreDoctorChecks(");
	expect(workspaceBlocksSource).toContain("getWorkspaceBlockIframeCompatibilityChecks(");
	expect(workspaceBlocksSource).toContain("getWorkspaceBlockAddonDoctorChecks(");
	expect(workspaceBlocksSource).not.toContain("function checkWorkspaceBlockMetadata(");
	expect(workspaceBlocksSource).not.toContain("function checkWorkspaceBlockIframeCompatibility(");
	expect(workspaceBlocksSource).not.toContain("function checkVariationEntrypoint(");
	expect(workspaceBlockMetadataSource).toContain(
		"export function getWorkspaceBlockCoreDoctorChecks(",
	);
	expect(workspaceBlockIframeSource).toContain(
		"export function getWorkspaceBlockIframeCompatibilityChecks(",
	);
	expect(workspaceBlockAddonsSource).toContain(
		"export function getWorkspaceBlockAddonDoctorChecks(",
	);
	expect(workspaceBindingsSource).toContain("export function getWorkspaceBindingDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("export function getWorkspaceFeatureDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspaceRestResourceDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspacePostMetaDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspaceAbilityDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspaceAiFeatureDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspaceEditorPluginDoctorChecks(");
	expect(workspaceFeaturesSource).toContain("getWorkspaceAdminViewDoctorChecks(");
	expect(workspaceFeaturesSource).not.toContain("function checkWorkspaceRestResourceConfig(");
	expect(workspaceFeaturesSource).not.toContain("function checkWorkspaceAbilityBootstrap(");
	expect(workspaceFeaturesSource).not.toContain("function checkWorkspaceAdminViewConfig(");
	expect(workspaceFeatureRestSource).toContain(
		"export function getWorkspaceRestResourceDoctorChecks(",
	);
	expect(workspaceFeaturePostMetaSource).toContain(
		"export function getWorkspacePostMetaDoctorChecks(",
	);
	expect(workspaceFeatureAbilitiesSource).toContain(
		"export function getWorkspaceAbilityDoctorChecks(",
	);
	expect(workspaceFeatureAiSource).toContain(
		"export function getWorkspaceAiFeatureDoctorChecks(",
	);
	expect(workspaceFeatureEditorPluginsSource).toContain(
		"export function getWorkspaceEditorPluginDoctorChecks(",
	);
	expect(workspaceFeatureAdminViewsSource).toContain(
		"export function getWorkspaceAdminViewDoctorChecks(",
	);
	expect(workspacePackageSource).toContain(
		"export async function prepareWorkspacePackageDoctorSnapshot(",
	);
	expect(workspacePackageSource).toContain('from "./fs-async.js"');
	expect(workspacePackageSource).toContain("Promise.all([");
	expect(workspacePackageSource).not.toMatch(
		/\bfs\.(?:existsSync|readFileSync|readdirSync)\b/u,
	);
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
