import type { ScaffoldCompatibilityPolicy } from "./scaffold-compatibility.js";
import type { WorkspaceProject } from "./workspace-project.js";

export const ABILITY_SERVER_GLOB = "/inc/abilities/*.php";
export const ABILITY_EDITOR_SCRIPT = "build/abilities/index.js";
export const ABILITY_EDITOR_ASSET = "build/abilities/index.asset.php";
export const ABILITY_REGISTRY_END_MARKER = "// wp-typia add ability entries end";
export const ABILITY_REGISTRY_START_MARKER = "// wp-typia add ability entries start";
export const WP_ABILITIES_SCRIPT_MODULE_ID = "@wordpress/abilities";
export const WP_CORE_ABILITIES_SCRIPT_MODULE_ID = "@wordpress/core-abilities";

export interface ScaffoldAbilityWorkspaceOptions {
	abilitySlug: string;
	compatibilityPolicy: ScaffoldCompatibilityPolicy;
	workspace: WorkspaceProject;
}
