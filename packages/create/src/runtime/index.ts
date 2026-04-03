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
export { applyTemplateDefaultsFromManifest } from "./defaults.js";
export * from "./metadata-core.js";
export {
	createEditorModel,
	describeEditorField,
	formatEditorFieldLabel,
} from "./editor.js";
export {
	buildScaffoldBlockRegistration,
	createTypiaWebpackConfig,
} from "./blocks.js";
export {
	manifestAttributeToJsonSchema,
	projectJsonSchemaDocument,
	manifestToJsonSchema,
	manifestToOpenApi,
} from "./schema-core.js";
export {
	buildCompoundChildStarterManifestDocument,
	getStarterManifestFiles,
	stringifyStarterManifest,
} from "./starter-manifests.js";
export type {
	EndpointOpenApiAuthMode,
	EndpointOpenApiContractDocument,
	EndpointOpenApiDocumentOptions,
	EndpointOpenApiEndpointDefinition,
	EndpointOpenApiMethod,
	JsonSchemaDocument,
	JsonSchemaProjectionProfile,
	JsonSchemaObject,
	OpenApiDocument,
	OpenApiInfo,
	OpenApiOperation,
	OpenApiParameter,
	OpenApiPathItem,
	OpenApiSecurityScheme,
} from "./schema-core.js";
export type {
	EditorControlKind,
	EditorFieldDescriptor,
	EditorFieldOption,
	EditorModelOptions,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
	ManifestTsKind,
	JsonValue,
} from "./editor.js";
export {
	createAttributeUpdater,
	createScaffoldValidatorToolkit,
	createUseTypiaValidationHook,
	createNestedAttributeUpdater,
	formatValidationError,
	formatValidationErrors,
	mergeNestedAttributeUpdate,
	normalizeValidationError,
	toAttributePatch,
	toNestedAttributePatch,
	toValidationResult,
	toValidationState,
} from "./validation.js";
export type {
	TypiaValidationError,
	ValidationResult,
	ValidationState,
} from "./validation.js";
export {
	PACKAGE_MANAGER_IDS,
	PACKAGE_MANAGERS,
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
