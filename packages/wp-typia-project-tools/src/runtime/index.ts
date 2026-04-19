/**
 * Public runtime surface for wp-typia project tools.
 *
 * This barrel exposes the stable orchestration APIs that power the `wp-typia`
 * CLI while keeping reusable project logic out of the CLI package itself.
 * Consumers should prefer these exports for scaffold, add, migrate, doctor,
 * and workspace-aware helpers such as `getWorkspaceBlockSelectOptions`,
 * `runAddBlockCommand`, `runAddVariationCommand`, `runAddPatternCommand`,
 * `runAddBindingSourceCommand`, `runAddEditorPluginCommand`,
 * `runAddHookedBlockCommand`,
 * `HOOKED_BLOCK_POSITION_IDS`, and `runDoctor`.
 */
export {
	scaffoldProject,
	collectScaffoldAnswers,
	getDefaultAnswers,
	getTemplateVariables,
	resolvePackageManagerId,
	resolveTemplateId,
} from "./scaffold.js";
export { BlockGeneratorService } from "./block-generator-service.js";
export type {
	ApplyBlockInput,
	BlockGenerationTarget,
	BlockSpec,
	PlanBlockInput,
	PlanBlockResult,
	RenderBlockInput,
	RenderBlockResult,
	ValidateBlockInput,
	ValidateBlockResult,
} from "./block-generator-service.js";
export {
	BLOCK_GENERATION_TOOL_CONTRACT_VERSION,
	inspectBlockGeneration,
} from "./block-generator-tool-contract.js";
export type {
	BlockGenerationEmittedFilePreview,
	BlockGenerationRenderPreview,
	BlockGenerationStarterManifestPreview,
	BlockGenerationTemplateCopyPreview,
	BlockGenerationToolStage,
	InspectBlockGenerationInput,
	InspectBlockGenerationPlanResult,
	InspectBlockGenerationRenderResult,
	InspectBlockGenerationResult,
	InspectBlockGenerationValidateResult,
} from "./block-generator-tool-contract.js";
export {
	formatMigrationHelpText,
	parseMigrationArgs,
	runMigrationCommand,
} from "./migrations.js";
export {
	parseWorkspacePackageManagerId,
	resolveWorkspaceProject,
	tryResolveWorkspaceProject,
} from "./workspace-project.js";
export {
	manifestAttributeToJsonSchema,
	projectJsonSchemaDocument,
	manifestToJsonSchema,
	manifestToOpenApi,
	normalizeEndpointAuthDefinition,
} from "./schema-core.js";
export {
	buildCompoundChildStarterManifestDocument,
	getStarterManifestFiles,
	stringifyStarterManifest,
} from "./starter-manifests.js";
export type {
	EndpointAuthIntent,
	EndpointOpenApiAuthMode,
	EndpointOpenApiContractDocument,
	EndpointOpenApiDocumentOptions,
	EndpointOpenApiEndpointDefinition,
	EndpointOpenApiMethod,
	EndpointWordPressAuthDefinition,
	EndpointWordPressAuthMechanism,
	JsonSchemaDocument,
	JsonSchemaProjectionProfile,
	JsonSchemaObject,
	NormalizedEndpointAuthDefinition,
	OpenApiDocument,
	OpenApiInfo,
	OpenApiOperation,
	OpenApiParameter,
	OpenApiPathItem,
	OpenApiSecurityScheme,
} from "./schema-core.js";
export {
	PACKAGE_MANAGER_IDS,
	PACKAGE_MANAGERS,
	formatPackageExecCommand,
	formatInstallCommand,
	formatRunScript,
	getPackageManager,
	getPackageManagerSelectOptions,
	transformPackageManagerText,
} from "./package-managers.js";
export {
	TEMPLATE_IDS,
	TEMPLATE_REGISTRY,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
} from "./template-registry.js";
export {
	createReadlinePrompt,
	createCliCommandError,
	CliDiagnosticError,
	formatCliDiagnosticError,
	formatAddHelpText,
	formatDoctorCheckLine,
	formatDoctorSummaryLine,
	formatHelpText,
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getDoctorChecks,
	getDoctorFailureDetailLines,
	getFailingDoctorChecks,
	getNextSteps,
	getOptionalOnboarding,
	getWorkspaceBlockSelectOptions,
	HOOKED_BLOCK_POSITION_IDS,
	EDITOR_PLUGIN_SLOT_IDS,
	isCliDiagnosticError,
	runAddBindingSourceCommand,
	runAddBlockCommand,
	runAddEditorPluginCommand,
	runAddHookedBlockCommand,
	runAddPatternCommand,
	runDoctor,
	runAddVariationCommand,
	runScaffoldFlow,
} from "./cli-core.js";
export type {
	CliDiagnosticMessage,
	DoctorCheck,
	EditorPluginSlotId,
	HookedBlockPositionId,
	ReadlinePrompt,
} from "./cli-core.js";
