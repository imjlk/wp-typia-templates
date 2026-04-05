/**
 * Public CLI runtime barrel for doctor, help, scaffold, and template helpers.
 *
 * Import `getDoctorChecks`, `runDoctor`, and `DoctorCheck` for diagnostics,
 * `formatHelpText` for CLI usage output, scaffold helpers such as `createReadlinePrompt`,
 * `getNextSteps`, `getOptionalOnboarding`, `runScaffoldFlow`, and
 * `ReadlinePrompt` for interactive project creation, and template helpers such
 * as `formatTemplateDetails`, `formatTemplateFeatures`,
 * `formatTemplateSummary`, `getTemplateById`, `getTemplateSelectOptions`,
 * `listTemplates`, and `isBuiltInTemplateId` for template inspection flows.
 */
export { getDoctorChecks, runDoctor, type DoctorCheck } from "./cli-doctor.js";
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
