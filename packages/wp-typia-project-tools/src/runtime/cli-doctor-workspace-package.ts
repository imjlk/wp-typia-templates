import fs from "node:fs";
import path from "node:path";

import {
	createDoctorCheck,
	getWorkspaceBootstrapRelativePath,
} from "./cli-doctor-workspace-shared.js";
import { WORKSPACE_TEMPLATE_PACKAGE } from "./workspace-project.js";

import type { DoctorCheck } from "./cli-doctor.js";
import type { WorkspacePackageJson, WorkspaceProject } from "./workspace-project.js";

/**
 * Validate the package metadata that makes a project an official workspace.
 *
 * @param workspace Resolved workspace metadata and filesystem paths.
 * @param packageJson Parsed workspace package manifest.
 * @returns A `DoctorCheck` describing whether package metadata matches the workspace contract.
 */
export function getWorkspacePackageMetadataCheck(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck {
	const issues: string[] = [];
	const packageName = packageJson.name;
	const bootstrapRelativePath = getWorkspaceBootstrapRelativePath(
		typeof packageName === "string" && packageName.length > 0 ? packageName : workspace.packageName,
	);
	const wpTypia = packageJson.wpTypia;

	if (typeof packageName !== "string" || packageName.length === 0) {
		issues.push("package.json must define a string name for workspace bootstrap resolution");
	}
	if (wpTypia?.projectType !== "workspace") {
		issues.push('wpTypia.projectType must be "workspace"');
	}
	if (wpTypia?.templatePackage !== WORKSPACE_TEMPLATE_PACKAGE) {
		issues.push(`wpTypia.templatePackage must be "${WORKSPACE_TEMPLATE_PACKAGE}"`);
	}
	if (wpTypia?.namespace !== workspace.workspace.namespace) {
		issues.push(`wpTypia.namespace must equal "${workspace.workspace.namespace}"`);
	}
	if (wpTypia?.textDomain !== workspace.workspace.textDomain) {
		issues.push(`wpTypia.textDomain must equal "${workspace.workspace.textDomain}"`);
	}
	if (wpTypia?.phpPrefix !== workspace.workspace.phpPrefix) {
		issues.push(`wpTypia.phpPrefix must equal "${workspace.workspace.phpPrefix}"`);
	}
	if (!fs.existsSync(path.join(workspace.projectDir, bootstrapRelativePath))) {
		issues.push(`Missing bootstrap file ${bootstrapRelativePath}`);
	}

	return createDoctorCheck(
		"Workspace package metadata",
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `package.json metadata aligns with ${workspace.packageName} and ${bootstrapRelativePath}`
			: issues.join("; "),
	);
}

/**
 * Report whether a workspace configured for migrations exposes the expected doctor inputs.
 *
 * @param workspace Resolved workspace metadata and filesystem paths.
 * @param packageJson Parsed workspace package manifest.
 * @returns A migration hint row when the workspace uses migrations, otherwise `null`.
 */
export function getMigrationWorkspaceHintCheck(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck | null {
	const hasMigrationScript = typeof packageJson.scripts?.["migration:doctor"] === "string";
	const migrationConfigRelativePath = path.join("src", "migrations", "config.ts");
	const hasMigrationConfig = fs.existsSync(
		path.join(workspace.projectDir, migrationConfigRelativePath),
	);

	if (!hasMigrationScript && !hasMigrationConfig) {
		return null;
	}

	return createDoctorCheck(
		"Migration workspace",
		hasMigrationConfig ? "pass" : "fail",
		hasMigrationConfig
			? "Run `wp-typia migrate doctor --all` for migration target, snapshot, fixture, and generated artifact checks"
			: `Missing ${migrationConfigRelativePath} for the configured migration workspace`,
	);
}
