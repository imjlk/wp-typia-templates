/**
 * Public `wp-typia add` facade.
 *
 * The canonical CLI surface stays stable here while the implementation lives
 * in focused internal modules:
 * - `cli-add-shared` as a compatibility barrel around focused add helpers
 * - `cli-add-block` for built-in block scaffolding
 * - `cli-add-workspace` for workspace mutation commands
 */
export {
	ADD_BLOCK_TEMPLATE_IDS,
	ADD_KIND_IDS,
	EDITOR_PLUGIN_SLOT_IDS,
	formatAddHelpText,
	isAddBlockTemplateId,
	suggestAddBlockTemplateId,
} from "./cli-add-shared.js";
export type {
	AddBlockTemplateId,
	AddKindId,
	EditorPluginSlotId,
} from "./cli-add-shared.js";
export {
	runAddBlockCommand,
	seedWorkspaceMigrationProject,
} from "./cli-add-block.js";
export {
	runAddAdminViewCommand,
	runAddAbilityCommand,
	runAddAiFeatureCommand,
	runAddBindingSourceCommand,
	runAddBlockStyleCommand,
	runAddBlockTransformCommand,
	runAddContractCommand,
	runAddEditorPluginCommand,
	runAddHookedBlockCommand,
	runAddIntegrationEnvCommand,
	runAddPatternCommand,
	runAddPostMetaCommand,
	runAddRestResourceCommand,
	runAddVariationCommand,
} from "./cli-add-workspace.js";
export {
	getWorkspaceBlockSelectOptions,
	getWorkspaceBlockSelectOptionsAsync,
} from "./workspace-inventory.js";
export type { WorkspaceBlockSelectOption } from "./workspace-inventory.js";
