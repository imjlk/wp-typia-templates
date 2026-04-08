export {
	scaffoldProject,
	collectScaffoldAnswers,
	getDefaultAnswers,
	getTemplateVariables,
	resolvePackageManagerId,
	resolveTemplateId,
} from "./scaffold.js";
export {
	formatMigrationHelpText,
	parseMigrationArgs,
	runMigrationCommand,
} from "./migrations.js";
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
	formatAddHelpText,
	formatHelpText,
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getDoctorChecks,
	getNextSteps,
	getOptionalOnboarding,
	getWorkspaceBlockSelectOptions,
	runAddBlockCommand,
	runAddPatternCommand,
	runDoctor,
	runAddVariationCommand,
	runScaffoldFlow,
} from "./cli-core.js";
export type { DoctorCheck, ReadlinePrompt } from "./cli-core.js";
