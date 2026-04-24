/**
 * Public runtime helper barrel consumed by the canonical `wp-typia` package.
 *
 * These exports do not make `@wp-typia/project-tools` the CLI owner again. Command
 * taxonomy, help text ownership, and published bin responsibility stay in
 * `packages/wp-typia`.
 *
 * Import `formatAddHelpText`, `runAddBlockCommand`,
 * `runAddVariationCommand`, `runAddPatternCommand`,
 * `runAddBindingSourceCommand`, `runAddHookedBlockCommand`,
 * and `HOOKED_BLOCK_POSITION_IDS`,
 * `getWorkspaceBlockSelectOptions`, and `seedWorkspaceMigrationProject` for
 * explicit `wp-typia add` flows,
 * `runAddAiFeatureCommand` for server-owned WordPress AI feature scaffolds,
 * `runAddRestResourceCommand` for plugin-level REST resource scaffolds,
 * `getDoctorChecks`, `runDoctor`, and `DoctorCheck` for diagnostics,
 * `createCliCommandError` and `formatCliDiagnosticError` for shared
 * non-interactive failure rendering,
 * `formatHelpText` for top-level CLI usage output, scaffold helpers such as
 * `createReadlinePrompt`, `getNextSteps`, `getOptionalOnboarding`,
 * `runScaffoldFlow`, and `ReadlinePrompt` for interactive project creation,
 * and template helpers such as `formatTemplateDetails`,
 * `formatTemplateFeatures`, `formatTemplateSummary`, `getTemplateById`,
 * `getTemplateSelectOptions`, `listTemplates`, and `isBuiltInTemplateId` for
 * template inspection flows.
 */
export { getDoctorChecks, runDoctor, type DoctorCheck } from "./cli-doctor.js";
export {
	createCliCommandError,
	CliDiagnosticError,
	formatCliDiagnosticError,
	formatDoctorCheckLine,
	formatDoctorSummaryLine,
	getDoctorFailureDetailLines,
	getFailingDoctorChecks,
	isCliDiagnosticError,
} from "./cli-diagnostics.js";
export type { CliDiagnosticMessage } from "./cli-diagnostics.js";
export {
	EDITOR_PLUGIN_SLOT_IDS,
	formatAddHelpText,
	getWorkspaceBlockSelectOptions,
	runAddBindingSourceCommand,
	runAddAiFeatureCommand,
	runAddBlockCommand,
	runAddEditorPluginCommand,
	runAddHookedBlockCommand,
	runAddPatternCommand,
	runAddRestResourceCommand,
	runAddVariationCommand,
	seedWorkspaceMigrationProject,
} from "./cli-add.js";
export {
	COMPOUND_INNER_BLOCKS_PRESET_IDS,
	getCompoundInnerBlocksPresetDefinition,
} from "./compound-inner-blocks.js";
export type { CompoundInnerBlocksPresetId } from "./compound-inner-blocks.js";
export { HOOKED_BLOCK_POSITION_IDS } from "./hooked-blocks.js";
export type { EditorPluginSlotId } from "./cli-add.js";
export type { HookedBlockPositionId } from "./hooked-blocks.js";
export { formatHelpText } from "./cli-help.js";
export {
	getNextSteps,
	getOptionalOnboarding,
	runScaffoldFlow,
} from "./cli-scaffold.js";
export { createReadlinePrompt, type ReadlinePrompt } from "./cli-prompt.js";
export {
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	getTemplateSelectOptions,
	isBuiltInTemplateId,
	listTemplates,
} from "./cli-templates.js";
