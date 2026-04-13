/**
 * Public `wp-typia add` facade.
 *
 * The canonical CLI surface stays stable here while the implementation lives
 * in focused internal modules:
 * - `cli-add-shared` for shared validation/help/rollback helpers
 * - `cli-add-block` for built-in block scaffolding
 * - `cli-add-workspace` for workspace mutation commands
 */
export {
	ADD_BLOCK_TEMPLATE_IDS,
	ADD_KIND_IDS,
	formatAddHelpText,
} from "./cli-add-shared.js";
export type {
	AddBlockTemplateId,
	AddKindId,
} from "./cli-add-shared.js";
export {
	runAddBlockCommand,
	seedWorkspaceMigrationProject,
} from "./cli-add-block.js";
export {
	runAddBindingSourceCommand,
	runAddHookedBlockCommand,
	runAddPatternCommand,
	runAddVariationCommand,
} from "./cli-add-workspace.js";
export { getWorkspaceBlockSelectOptions } from "./workspace-inventory.js";
