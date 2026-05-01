import fs from "node:fs";
import path from "node:path";

import type { DoctorCheck } from "./cli-doctor.js";

export const WORKSPACE_BINDING_SERVER_GLOB = "/src/bindings/*/server.php";
export const WORKSPACE_BINDING_EDITOR_SCRIPT = "build/bindings/index.js";
export const WORKSPACE_BINDING_EDITOR_ASSET = "build/bindings/index.asset.php";
export const WORKSPACE_REST_RESOURCE_GLOB = "/inc/rest/*.php";
export const WORKSPACE_ABILITY_GLOB = "/inc/abilities/*.php";
export const WORKSPACE_ABILITY_EDITOR_SCRIPT = "build/abilities/index.js";
export const WORKSPACE_ABILITY_EDITOR_ASSET = "build/abilities/index.asset.php";
export const WORKSPACE_AI_FEATURE_GLOB = "/inc/ai-features/*.php";
export const WORKSPACE_ADMIN_VIEW_GLOB = "/inc/admin-views/*.php";
export const WORKSPACE_ADMIN_VIEW_SCRIPT = "build/admin-views/index.js";
export const WORKSPACE_ADMIN_VIEW_ASSET = "build/admin-views/index.asset.php";
export const WORKSPACE_ADMIN_VIEW_STYLE = "build/admin-views/style-index.css";
export const WORKSPACE_EDITOR_PLUGIN_EDITOR_SCRIPT = "build/editor-plugins/index.js";
export const WORKSPACE_EDITOR_PLUGIN_EDITOR_ASSET = "build/editor-plugins/index.asset.php";
export const WORKSPACE_EDITOR_PLUGIN_EDITOR_STYLE = "build/editor-plugins/style-index.css";
export const WORKSPACE_GENERATED_BLOCK_ARTIFACTS = [
	"block.json",
	"typia.manifest.json",
	"typia.schema.json",
	"typia-validator.php",
	"typia.openapi.json",
] as const;
export const WORKSPACE_FULL_BLOCK_NAME_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/u;

export function createDoctorCheck(
	label: string,
	status: DoctorCheck["status"],
	detail: string,
	code?: string,
): DoctorCheck {
	return code ? { code, detail, label, status } : { detail, label, status };
}

export function createDoctorScopeCheck(
	status: DoctorCheck["status"],
	detail: string,
): DoctorCheck {
	return createDoctorCheck("Doctor scope", status, detail);
}

export function getWorkspaceBootstrapRelativePath(packageName: string): string {
	return `${packageName.split("/").pop() ?? packageName}.php`;
}

export function checkExistingFiles(
	projectDir: string,
	label: string,
	filePaths: Array<string | undefined>,
): DoctorCheck {
	const missing = filePaths
		.filter((filePath): filePath is string => typeof filePath === "string")
		.filter((filePath) => !fs.existsSync(path.join(projectDir, filePath)));
	return createDoctorCheck(
		label,
		missing.length === 0 ? "pass" : "fail",
		missing.length === 0 ? "All referenced files exist" : `Missing: ${missing.join(", ")}`,
	);
}
