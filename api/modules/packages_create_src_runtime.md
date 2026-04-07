[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime

# Module: packages/create/src/runtime

## Table of contents

### References

- [scaffoldProject](packages_create_src_runtime.md#scaffoldproject)
- [collectScaffoldAnswers](packages_create_src_runtime.md#collectscaffoldanswers)
- [getDefaultAnswers](packages_create_src_runtime.md#getdefaultanswers)
- [getTemplateVariables](packages_create_src_runtime.md#gettemplatevariables)
- [resolvePackageManagerId](packages_create_src_runtime.md#resolvepackagemanagerid)
- [resolveTemplateId](packages_create_src_runtime.md#resolvetemplateid)
- [formatMigrationHelpText](packages_create_src_runtime.md#formatmigrationhelptext)
- [parseMigrationArgs](packages_create_src_runtime.md#parsemigrationargs)
- [runMigrationCommand](packages_create_src_runtime.md#runmigrationcommand)
- [applyTemplateDefaultsFromManifest](packages_create_src_runtime.md#applytemplatedefaultsfrommanifest)
- [createEditorModel](packages_create_src_runtime.md#createeditormodel)
- [describeEditorField](packages_create_src_runtime.md#describeeditorfield)
- [formatEditorFieldLabel](packages_create_src_runtime.md#formateditorfieldlabel)
- [buildScaffoldBlockRegistration](packages_create_src_runtime.md#buildscaffoldblockregistration)
- [createTypiaWebpackConfig](packages_create_src_runtime.md#createtypiawebpackconfig)
- [BuildScaffoldBlockRegistrationResult](packages_create_src_runtime.md#buildscaffoldblockregistrationresult)
- [ScaffoldBlockMetadata](packages_create_src_runtime.md#scaffoldblockmetadata)
- [ScaffoldBlockRegistrationSettings](packages_create_src_runtime.md#scaffoldblockregistrationsettings)
- [ScaffoldBlockSupports](packages_create_src_runtime.md#scaffoldblocksupports)
- [manifestAttributeToJsonSchema](packages_create_src_runtime.md#manifestattributetojsonschema)
- [projectJsonSchemaDocument](packages_create_src_runtime.md#projectjsonschemadocument)
- [manifestToJsonSchema](packages_create_src_runtime.md#manifesttojsonschema)
- [manifestToOpenApi](packages_create_src_runtime.md#manifesttoopenapi)
- [normalizeEndpointAuthDefinition](packages_create_src_runtime.md#normalizeendpointauthdefinition)
- [buildCompoundChildStarterManifestDocument](packages_create_src_runtime.md#buildcompoundchildstartermanifestdocument)
- [getStarterManifestFiles](packages_create_src_runtime.md#getstartermanifestfiles)
- [stringifyStarterManifest](packages_create_src_runtime.md#stringifystartermanifest)
- [EndpointAuthIntent](packages_create_src_runtime.md#endpointauthintent)
- [EndpointOpenApiAuthMode](packages_create_src_runtime.md#endpointopenapiauthmode)
- [EndpointOpenApiContractDocument](packages_create_src_runtime.md#endpointopenapicontractdocument)
- [EndpointOpenApiDocumentOptions](packages_create_src_runtime.md#endpointopenapidocumentoptions)
- [EndpointOpenApiEndpointDefinition](packages_create_src_runtime.md#endpointopenapiendpointdefinition)
- [EndpointOpenApiMethod](packages_create_src_runtime.md#endpointopenapimethod)
- [EndpointWordPressAuthDefinition](packages_create_src_runtime.md#endpointwordpressauthdefinition)
- [EndpointWordPressAuthMechanism](packages_create_src_runtime.md#endpointwordpressauthmechanism)
- [JsonSchemaDocument](packages_create_src_runtime.md#jsonschemadocument)
- [JsonSchemaProjectionProfile](packages_create_src_runtime.md#jsonschemaprojectionprofile)
- [JsonSchemaObject](packages_create_src_runtime.md#jsonschemaobject)
- [NormalizedEndpointAuthDefinition](packages_create_src_runtime.md#normalizedendpointauthdefinition)
- [OpenApiDocument](packages_create_src_runtime.md#openapidocument)
- [OpenApiInfo](packages_create_src_runtime.md#openapiinfo)
- [OpenApiOperation](packages_create_src_runtime.md#openapioperation)
- [OpenApiParameter](packages_create_src_runtime.md#openapiparameter)
- [OpenApiPathItem](packages_create_src_runtime.md#openapipathitem)
- [OpenApiSecurityScheme](packages_create_src_runtime.md#openapisecurityscheme)
- [EditorControlKind](packages_create_src_runtime.md#editorcontrolkind)
- [EditorFieldDescriptor](packages_create_src_runtime.md#editorfielddescriptor)
- [EditorFieldOption](packages_create_src_runtime.md#editorfieldoption)
- [EditorModelOptions](packages_create_src_runtime.md#editormodeloptions)
- [ManifestAttribute](packages_create_src_runtime.md#manifestattribute)
- [ManifestConstraints](packages_create_src_runtime.md#manifestconstraints)
- [ManifestDocument](packages_create_src_runtime.md#manifestdocument)
- [ManifestTsKind](packages_create_src_runtime.md#manifesttskind)
- [JsonValue](packages_create_src_runtime.md#jsonvalue)
- [createAttributeUpdater](packages_create_src_runtime.md#createattributeupdater)
- [createScaffoldValidatorToolkit](packages_create_src_runtime.md#createscaffoldvalidatortoolkit)
- [createUseTypiaValidationHook](packages_create_src_runtime.md#createusetypiavalidationhook)
- [createNestedAttributeUpdater](packages_create_src_runtime.md#createnestedattributeupdater)
- [formatValidationError](packages_create_src_runtime.md#formatvalidationerror)
- [formatValidationErrors](packages_create_src_runtime.md#formatvalidationerrors)
- [mergeNestedAttributeUpdate](packages_create_src_runtime.md#mergenestedattributeupdate)
- [normalizeValidationError](packages_create_src_runtime.md#normalizevalidationerror)
- [toAttributePatch](packages_create_src_runtime.md#toattributepatch)
- [toNestedAttributePatch](packages_create_src_runtime.md#tonestedattributepatch)
- [toValidationResult](packages_create_src_runtime.md#tovalidationresult)
- [toValidationState](packages_create_src_runtime.md#tovalidationstate)
- [TypiaValidationError](packages_create_src_runtime.md#typiavalidationerror)
- [ValidationResult](packages_create_src_runtime.md#validationresult)
- [ValidationState](packages_create_src_runtime.md#validationstate)
- [PACKAGE\_MANAGER\_IDS](packages_create_src_runtime.md#package_manager_ids)
- [PACKAGE\_MANAGERS](packages_create_src_runtime.md#package_managers)
- [formatInstallCommand](packages_create_src_runtime.md#formatinstallcommand)
- [formatRunScript](packages_create_src_runtime.md#formatrunscript)
- [getPackageManager](packages_create_src_runtime.md#getpackagemanager)
- [getPackageManagerSelectOptions](packages_create_src_runtime.md#getpackagemanagerselectoptions)
- [transformPackageManagerText](packages_create_src_runtime.md#transformpackagemanagertext)
- [TEMPLATE\_IDS](packages_create_src_runtime.md#template_ids)
- [TEMPLATE\_REGISTRY](packages_create_src_runtime.md#template_registry)
- [getTemplateById](packages_create_src_runtime.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_create_src_runtime.md#gettemplateselectoptions)
- [listTemplates](packages_create_src_runtime.md#listtemplates)
- [SyncBlockMetadataOptions](packages_create_src_runtime.md#syncblockmetadataoptions)
- [SyncBlockMetadataResult](packages_create_src_runtime.md#syncblockmetadataresult)
- [SyncBlockMetadataStatus](packages_create_src_runtime.md#syncblockmetadatastatus)
- [SyncBlockMetadataFailureCode](packages_create_src_runtime.md#syncblockmetadatafailurecode)
- [SyncBlockMetadataFailure](packages_create_src_runtime.md#syncblockmetadatafailure)
- [SyncBlockMetadataExecutionOptions](packages_create_src_runtime.md#syncblockmetadataexecutionoptions)
- [SyncBlockMetadataReport](packages_create_src_runtime.md#syncblockmetadatareport)
- [SyncTypeSchemaOptions](packages_create_src_runtime.md#synctypeschemaoptions)
- [SyncTypeSchemaResult](packages_create_src_runtime.md#synctypeschemaresult)
- [EndpointManifestContractDefinition](packages_create_src_runtime.md#endpointmanifestcontractdefinition)
- [EndpointManifestEndpointDefinition](packages_create_src_runtime.md#endpointmanifestendpointdefinition)
- [EndpointManifestDefinition](packages_create_src_runtime.md#endpointmanifestdefinition)
- [defineEndpointManifest](packages_create_src_runtime.md#defineendpointmanifest)
- [RestOpenApiContractDefinition](packages_create_src_runtime.md#restopenapicontractdefinition)
- [RestOpenApiEndpointDefinition](packages_create_src_runtime.md#restopenapiendpointdefinition)
- [SyncRestOpenApiManifestOptions](packages_create_src_runtime.md#syncrestopenapimanifestoptions)
- [SyncRestOpenApiContractsOptions](packages_create_src_runtime.md#syncrestopenapicontractsoptions)
- [SyncRestOpenApiOptions](packages_create_src_runtime.md#syncrestopenapioptions)
- [SyncRestOpenApiResult](packages_create_src_runtime.md#syncrestopenapiresult)
- [SyncEndpointClientOptions](packages_create_src_runtime.md#syncendpointclientoptions)
- [SyncEndpointClientResult](packages_create_src_runtime.md#syncendpointclientresult)
- [syncBlockMetadata](packages_create_src_runtime.md#syncblockmetadata)
- [runSyncBlockMetadata](packages_create_src_runtime.md#runsyncblockmetadata)
- [syncTypeSchemas](packages_create_src_runtime.md#synctypeschemas)
- [syncRestOpenApi](packages_create_src_runtime.md#syncrestopenapi)
- [syncEndpointClient](packages_create_src_runtime.md#syncendpointclient)

## References

### scaffoldProject

Re-exports [scaffoldProject](packages_create_src_runtime_scaffold.md#scaffoldproject)

___

### collectScaffoldAnswers

Re-exports [collectScaffoldAnswers](packages_create_src_runtime_scaffold.md#collectscaffoldanswers)

___

### getDefaultAnswers

Re-exports [getDefaultAnswers](packages_create_src_runtime_scaffold.md#getdefaultanswers)

___

### getTemplateVariables

Re-exports [getTemplateVariables](packages_create_src_runtime_scaffold.md#gettemplatevariables)

___

### resolvePackageManagerId

Re-exports [resolvePackageManagerId](packages_create_src_runtime_scaffold.md#resolvepackagemanagerid)

___

### resolveTemplateId

Re-exports [resolveTemplateId](packages_create_src_runtime_scaffold.md#resolvetemplateid)

___

### formatMigrationHelpText

Re-exports [formatMigrationHelpText](packages_create_src_runtime_migrations.md#formatmigrationhelptext)

___

### parseMigrationArgs

Re-exports [parseMigrationArgs](packages_create_src_runtime_migrations.md#parsemigrationargs)

___

### runMigrationCommand

Re-exports [runMigrationCommand](packages_create_src_runtime_migrations.md#runmigrationcommand)

___

### applyTemplateDefaultsFromManifest

Re-exports [applyTemplateDefaultsFromManifest](packages_wp_typia_block_runtime_src_defaults.md#applytemplatedefaultsfrommanifest)

___

### createEditorModel

Re-exports [createEditorModel](packages_wp_typia_block_runtime_src_editor.md#createeditormodel)

___

### describeEditorField

Re-exports [describeEditorField](packages_wp_typia_block_runtime_src_editor.md#describeeditorfield)

___

### formatEditorFieldLabel

Re-exports [formatEditorFieldLabel](packages_wp_typia_block_runtime_src_editor.md#formateditorfieldlabel)

___

### buildScaffoldBlockRegistration

Re-exports [buildScaffoldBlockRegistration](packages_wp_typia_block_runtime_src_blocks.md#buildscaffoldblockregistration)

___

### createTypiaWebpackConfig

Re-exports [createTypiaWebpackConfig](packages_wp_typia_block_runtime_src_blocks.md#createtypiawebpackconfig)

___

### BuildScaffoldBlockRegistrationResult

Re-exports [BuildScaffoldBlockRegistrationResult](../interfaces/packages_wp_typia_block_runtime_src_blocks.BuildScaffoldBlockRegistrationResult.md)

___

### ScaffoldBlockMetadata

Re-exports [ScaffoldBlockMetadata](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockMetadata.md)

___

### ScaffoldBlockRegistrationSettings

Re-exports [ScaffoldBlockRegistrationSettings](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockRegistrationSettings.md)

___

### ScaffoldBlockSupports

Re-exports [ScaffoldBlockSupports](packages_wp_typia_block_runtime_src_blocks.md#scaffoldblocksupports)

___

### manifestAttributeToJsonSchema

Re-exports [manifestAttributeToJsonSchema](packages_create_src_runtime_schema_core.md#manifestattributetojsonschema)

___

### projectJsonSchemaDocument

Re-exports [projectJsonSchemaDocument](packages_create_src_runtime_schema_core.md#projectjsonschemadocument)

___

### manifestToJsonSchema

Re-exports [manifestToJsonSchema](packages_create_src_runtime_schema_core.md#manifesttojsonschema)

___

### manifestToOpenApi

Re-exports [manifestToOpenApi](packages_create_src_runtime_schema_core.md#manifesttoopenapi)

___

### normalizeEndpointAuthDefinition

Re-exports [normalizeEndpointAuthDefinition](packages_create_src_runtime_schema_core.md#normalizeendpointauthdefinition)

___

### buildCompoundChildStarterManifestDocument

Re-exports [buildCompoundChildStarterManifestDocument](packages_create_src_runtime_starter_manifests.md#buildcompoundchildstartermanifestdocument)

___

### getStarterManifestFiles

Re-exports [getStarterManifestFiles](packages_create_src_runtime_starter_manifests.md#getstartermanifestfiles)

___

### stringifyStarterManifest

Re-exports [stringifyStarterManifest](packages_create_src_runtime_starter_manifests.md#stringifystartermanifest)

___

### EndpointAuthIntent

Re-exports [EndpointAuthIntent](packages_create_src_runtime_schema_core.md#endpointauthintent)

___

### EndpointOpenApiAuthMode

Re-exports [EndpointOpenApiAuthMode](packages_create_src_runtime_schema_core.md#endpointopenapiauthmode)

___

### EndpointOpenApiContractDocument

Re-exports [EndpointOpenApiContractDocument](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiContractDocument.md)

___

### EndpointOpenApiDocumentOptions

Re-exports [EndpointOpenApiDocumentOptions](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md)

___

### EndpointOpenApiEndpointDefinition

Re-exports [EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)

___

### EndpointOpenApiMethod

Re-exports [EndpointOpenApiMethod](packages_create_src_runtime_schema_core.md#endpointopenapimethod)

___

### EndpointWordPressAuthDefinition

Re-exports [EndpointWordPressAuthDefinition](../interfaces/packages_create_src_runtime_schema_core.EndpointWordPressAuthDefinition.md)

___

### EndpointWordPressAuthMechanism

Re-exports [EndpointWordPressAuthMechanism](packages_create_src_runtime_schema_core.md#endpointwordpressauthmechanism)

___

### JsonSchemaDocument

Re-exports [JsonSchemaDocument](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md)

___

### JsonSchemaProjectionProfile

Re-exports [JsonSchemaProjectionProfile](packages_create_src_runtime_schema_core.md#jsonschemaprojectionprofile)

___

### JsonSchemaObject

Re-exports [JsonSchemaObject](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

___

### NormalizedEndpointAuthDefinition

Re-exports [NormalizedEndpointAuthDefinition](../interfaces/packages_create_src_runtime_schema_core.NormalizedEndpointAuthDefinition.md)

___

### OpenApiDocument

Re-exports [OpenApiDocument](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)

___

### OpenApiInfo

Re-exports [OpenApiInfo](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md)

___

### OpenApiOperation

Re-exports [OpenApiOperation](../interfaces/packages_create_src_runtime_schema_core.OpenApiOperation.md)

___

### OpenApiParameter

Re-exports [OpenApiParameter](../interfaces/packages_create_src_runtime_schema_core.OpenApiParameter.md)

___

### OpenApiPathItem

Re-exports [OpenApiPathItem](packages_create_src_runtime_schema_core.md#openapipathitem)

___

### OpenApiSecurityScheme

Re-exports [OpenApiSecurityScheme](../interfaces/packages_create_src_runtime_schema_core.OpenApiSecurityScheme.md)

___

### EditorControlKind

Re-exports [EditorControlKind](packages_wp_typia_block_runtime_src_editor.md#editorcontrolkind)

___

### EditorFieldDescriptor

Re-exports [EditorFieldDescriptor](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

___

### EditorFieldOption

Re-exports [EditorFieldOption](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldOption.md)

___

### EditorModelOptions

Re-exports [EditorModelOptions](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md)

___

### ManifestAttribute

Re-exports [ManifestAttribute](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md)

___

### ManifestConstraints

Re-exports [ManifestConstraints](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestConstraints.md)

___

### ManifestDocument

Re-exports [ManifestDocument](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md)

___

### ManifestTsKind

Re-exports [ManifestTsKind](packages_wp_typia_block_runtime_src_migration_types.md#manifesttskind)

___

### JsonValue

Re-exports [JsonValue](packages_wp_typia_block_runtime_src_migration_types.md#jsonvalue)

___

### createAttributeUpdater

Re-exports [createAttributeUpdater](packages_wp_typia_block_runtime_src_validation.md#createattributeupdater)

___

### createScaffoldValidatorToolkit

Re-exports [createScaffoldValidatorToolkit](packages_wp_typia_block_runtime_src_validation.md#createscaffoldvalidatortoolkit)

___

### createUseTypiaValidationHook

Re-exports [createUseTypiaValidationHook](packages_wp_typia_block_runtime_src_validation.md#createusetypiavalidationhook)

___

### createNestedAttributeUpdater

Re-exports [createNestedAttributeUpdater](packages_wp_typia_block_runtime_src_validation.md#createnestedattributeupdater)

___

### formatValidationError

Re-exports [formatValidationError](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerror)

___

### formatValidationErrors

Re-exports [formatValidationErrors](packages_wp_typia_block_runtime_src_validation.md#formatvalidationerrors)

___

### mergeNestedAttributeUpdate

Re-exports [mergeNestedAttributeUpdate](packages_wp_typia_block_runtime_src_validation.md#mergenestedattributeupdate)

___

### normalizeValidationError

Re-exports [normalizeValidationError](packages_wp_typia_block_runtime_src_validation.md#normalizevalidationerror)

___

### toAttributePatch

Re-exports [toAttributePatch](packages_wp_typia_block_runtime_src_validation.md#toattributepatch)

___

### toNestedAttributePatch

Re-exports [toNestedAttributePatch](packages_wp_typia_block_runtime_src_validation.md#tonestedattributepatch)

___

### toValidationResult

Re-exports [toValidationResult](packages_wp_typia_block_runtime_src_validation.md#tovalidationresult)

___

### toValidationState

Re-exports [toValidationState](packages_wp_typia_block_runtime_src_validation.md#tovalidationstate)

___

### TypiaValidationError

Re-exports [TypiaValidationError](../interfaces/packages_wp_typia_block_runtime_src_validation.TypiaValidationError.md)

___

### ValidationResult

Re-exports [ValidationResult](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)

___

### ValidationState

Re-exports [ValidationState](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationState.md)

___

### PACKAGE\_MANAGER\_IDS

Re-exports [PACKAGE_MANAGER_IDS](packages_create_src_runtime_package_managers.md#package_manager_ids)

___

### PACKAGE\_MANAGERS

Re-exports [PACKAGE_MANAGERS](packages_create_src_runtime_package_managers.md#package_managers)

___

### formatInstallCommand

Re-exports [formatInstallCommand](packages_create_src_runtime_package_managers.md#formatinstallcommand)

___

### formatRunScript

Re-exports [formatRunScript](packages_create_src_runtime_package_managers.md#formatrunscript)

___

### getPackageManager

Re-exports [getPackageManager](packages_create_src_runtime_package_managers.md#getpackagemanager)

___

### getPackageManagerSelectOptions

Re-exports [getPackageManagerSelectOptions](packages_create_src_runtime_package_managers.md#getpackagemanagerselectoptions)

___

### transformPackageManagerText

Re-exports [transformPackageManagerText](packages_create_src_runtime_package_managers.md#transformpackagemanagertext)

___

### TEMPLATE\_IDS

Re-exports [TEMPLATE_IDS](packages_create_src_runtime_template_registry.md#template_ids)

___

### TEMPLATE\_REGISTRY

Re-exports [TEMPLATE_REGISTRY](packages_create_src_runtime_template_registry.md#template_registry)

___

### getTemplateById

Re-exports [getTemplateById](packages_create_src_runtime_template_registry.md#gettemplatebyid)

___

### getTemplateSelectOptions

Re-exports [getTemplateSelectOptions](packages_create_src_runtime_template_registry.md#gettemplateselectoptions)

___

### listTemplates

Re-exports [listTemplates](packages_create_src_runtime_template_registry.md#listtemplates)

___

### SyncBlockMetadataOptions

Re-exports [SyncBlockMetadataOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataOptions.md)

___

### SyncBlockMetadataResult

Re-exports [SyncBlockMetadataResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataResult.md)

___

### SyncBlockMetadataStatus

Re-exports [SyncBlockMetadataStatus](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatastatus)

___

### SyncBlockMetadataFailureCode

Re-exports [SyncBlockMetadataFailureCode](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatafailurecode)

___

### SyncBlockMetadataFailure

Re-exports [SyncBlockMetadataFailure](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md)

___

### SyncBlockMetadataExecutionOptions

Re-exports [SyncBlockMetadataExecutionOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md)

___

### SyncBlockMetadataReport

Re-exports [SyncBlockMetadataReport](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md)

___

### SyncTypeSchemaOptions

Re-exports [SyncTypeSchemaOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaOptions.md)

___

### SyncTypeSchemaResult

Re-exports [SyncTypeSchemaResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaResult.md)

___

### EndpointManifestContractDefinition

Re-exports [EndpointManifestContractDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)

___

### EndpointManifestEndpointDefinition

Re-exports [EndpointManifestEndpointDefinition](packages_wp_typia_block_runtime_src_metadata_core.md#endpointmanifestendpointdefinition)

___

### EndpointManifestDefinition

Re-exports [EndpointManifestDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)

___

### defineEndpointManifest

Re-exports [defineEndpointManifest](packages_wp_typia_block_runtime_src_metadata_core.md#defineendpointmanifest)

___

### RestOpenApiContractDefinition

Re-exports [RestOpenApiContractDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.RestOpenApiContractDefinition.md)

___

### RestOpenApiEndpointDefinition

Re-exports [RestOpenApiEndpointDefinition](packages_wp_typia_block_runtime_src_metadata_core.md#restopenapiendpointdefinition)

___

### SyncRestOpenApiManifestOptions

Re-exports [SyncRestOpenApiManifestOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md)

___

### SyncRestOpenApiContractsOptions

Re-exports [SyncRestOpenApiContractsOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md)

___

### SyncRestOpenApiOptions

Re-exports [SyncRestOpenApiOptions](packages_wp_typia_block_runtime_src_metadata_core.md#syncrestopenapioptions)

___

### SyncRestOpenApiResult

Re-exports [SyncRestOpenApiResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiResult.md)

___

### SyncEndpointClientOptions

Re-exports [SyncEndpointClientOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md)

___

### SyncEndpointClientResult

Re-exports [SyncEndpointClientResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientResult.md)

___

### syncBlockMetadata

Re-exports [syncBlockMetadata](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadata)

___

### runSyncBlockMetadata

Re-exports [runSyncBlockMetadata](packages_wp_typia_block_runtime_src_metadata_core.md#runsyncblockmetadata)

___

### syncTypeSchemas

Re-exports [syncTypeSchemas](packages_wp_typia_block_runtime_src_metadata_core.md#synctypeschemas)

___

### syncRestOpenApi

Re-exports [syncRestOpenApi](packages_wp_typia_block_runtime_src_metadata_core.md#syncrestopenapi)

___

### syncEndpointClient

Re-exports [syncEndpointClient](packages_wp_typia_block_runtime_src_metadata_core.md#syncendpointclient)
