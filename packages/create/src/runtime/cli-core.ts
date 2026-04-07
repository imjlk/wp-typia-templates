/**
 * Public CLI runtime barrel for add, doctor, help, scaffold, and template helpers.
 *
 * Import `formatAddHelpText`, `runAddBlockCommand`,
 * `createAddPlaceholderMessage`, and `seedWorkspaceMigrationProject` for
 * explicit `wp-typia add` flows,
 * `getDoctorChecks`, `runDoctor`, and `DoctorCheck` for diagnostics,
 * `formatHelpText` for top-level CLI usage output, scaffold helpers such as
 * `createReadlinePrompt`, `getNextSteps`, `getOptionalOnboarding`,
 * `runScaffoldFlow`, and `ReadlinePrompt` for interactive project creation,
 * and template helpers such as `formatTemplateDetails`,
 * `formatTemplateFeatures`, `formatTemplateSummary`, `getTemplateById`,
 * `getTemplateSelectOptions`, `listTemplates`, and `isBuiltInTemplateId` for
 * template inspection flows.
 */
export { getDoctorChecks, runDoctor, type DoctorCheck } from "./cli-doctor.js";
export { createAddPlaceholderMessage, formatAddHelpText, runAddBlockCommand, seedWorkspaceMigrationProject } from "./cli-add.js";
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
