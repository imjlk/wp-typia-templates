[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime

# Module: packages/wp-typia-project-tools/src/runtime

## Table of contents

### References

- [scaffoldProject](packages_wp_typia_project_tools_src_runtime.md#scaffoldproject)
- [collectScaffoldAnswers](packages_wp_typia_project_tools_src_runtime.md#collectscaffoldanswers)
- [getDefaultAnswers](packages_wp_typia_project_tools_src_runtime.md#getdefaultanswers)
- [getTemplateVariables](packages_wp_typia_project_tools_src_runtime.md#gettemplatevariables)
- [resolvePackageManagerId](packages_wp_typia_project_tools_src_runtime.md#resolvepackagemanagerid)
- [resolveTemplateId](packages_wp_typia_project_tools_src_runtime.md#resolvetemplateid)
- [formatMigrationHelpText](packages_wp_typia_project_tools_src_runtime.md#formatmigrationhelptext)
- [parseMigrationArgs](packages_wp_typia_project_tools_src_runtime.md#parsemigrationargs)
- [runMigrationCommand](packages_wp_typia_project_tools_src_runtime.md#runmigrationcommand)
- [parseWorkspacePackageManagerId](packages_wp_typia_project_tools_src_runtime.md#parseworkspacepackagemanagerid)
- [resolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime.md#resolveworkspaceproject)
- [tryResolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime.md#tryresolveworkspaceproject)
- [manifestAttributeToJsonSchema](packages_wp_typia_project_tools_src_runtime.md#manifestattributetojsonschema)
- [projectJsonSchemaDocument](packages_wp_typia_project_tools_src_runtime.md#projectjsonschemadocument)
- [manifestToJsonSchema](packages_wp_typia_project_tools_src_runtime.md#manifesttojsonschema)
- [manifestToOpenApi](packages_wp_typia_project_tools_src_runtime.md#manifesttoopenapi)
- [normalizeEndpointAuthDefinition](packages_wp_typia_project_tools_src_runtime.md#normalizeendpointauthdefinition)
- [buildCompoundChildStarterManifestDocument](packages_wp_typia_project_tools_src_runtime.md#buildcompoundchildstartermanifestdocument)
- [getStarterManifestFiles](packages_wp_typia_project_tools_src_runtime.md#getstartermanifestfiles)
- [stringifyStarterManifest](packages_wp_typia_project_tools_src_runtime.md#stringifystartermanifest)
- [EndpointAuthIntent](packages_wp_typia_project_tools_src_runtime.md#endpointauthintent)
- [EndpointOpenApiAuthMode](packages_wp_typia_project_tools_src_runtime.md#endpointopenapiauthmode)
- [EndpointOpenApiContractDocument](packages_wp_typia_project_tools_src_runtime.md#endpointopenapicontractdocument)
- [EndpointOpenApiDocumentOptions](packages_wp_typia_project_tools_src_runtime.md#endpointopenapidocumentoptions)
- [EndpointOpenApiEndpointDefinition](packages_wp_typia_project_tools_src_runtime.md#endpointopenapiendpointdefinition)
- [EndpointOpenApiMethod](packages_wp_typia_project_tools_src_runtime.md#endpointopenapimethod)
- [EndpointWordPressAuthDefinition](packages_wp_typia_project_tools_src_runtime.md#endpointwordpressauthdefinition)
- [EndpointWordPressAuthMechanism](packages_wp_typia_project_tools_src_runtime.md#endpointwordpressauthmechanism)
- [JsonSchemaDocument](packages_wp_typia_project_tools_src_runtime.md#jsonschemadocument)
- [JsonSchemaProjectionProfile](packages_wp_typia_project_tools_src_runtime.md#jsonschemaprojectionprofile)
- [JsonSchemaObject](packages_wp_typia_project_tools_src_runtime.md#jsonschemaobject)
- [NormalizedEndpointAuthDefinition](packages_wp_typia_project_tools_src_runtime.md#normalizedendpointauthdefinition)
- [OpenApiDocument](packages_wp_typia_project_tools_src_runtime.md#openapidocument)
- [OpenApiInfo](packages_wp_typia_project_tools_src_runtime.md#openapiinfo)
- [OpenApiOperation](packages_wp_typia_project_tools_src_runtime.md#openapioperation)
- [OpenApiParameter](packages_wp_typia_project_tools_src_runtime.md#openapiparameter)
- [OpenApiPathItem](packages_wp_typia_project_tools_src_runtime.md#openapipathitem)
- [OpenApiSecurityScheme](packages_wp_typia_project_tools_src_runtime.md#openapisecurityscheme)
- [PACKAGE\_MANAGER\_IDS](packages_wp_typia_project_tools_src_runtime.md#package_manager_ids)
- [PACKAGE\_MANAGERS](packages_wp_typia_project_tools_src_runtime.md#package_managers)
- [formatPackageExecCommand](packages_wp_typia_project_tools_src_runtime.md#formatpackageexeccommand)
- [formatInstallCommand](packages_wp_typia_project_tools_src_runtime.md#formatinstallcommand)
- [formatRunScript](packages_wp_typia_project_tools_src_runtime.md#formatrunscript)
- [getPackageManager](packages_wp_typia_project_tools_src_runtime.md#getpackagemanager)
- [getPackageManagerSelectOptions](packages_wp_typia_project_tools_src_runtime.md#getpackagemanagerselectoptions)
- [transformPackageManagerText](packages_wp_typia_project_tools_src_runtime.md#transformpackagemanagertext)
- [TEMPLATE\_IDS](packages_wp_typia_project_tools_src_runtime.md#template_ids)
- [TEMPLATE\_REGISTRY](packages_wp_typia_project_tools_src_runtime.md#template_registry)
- [getTemplateById](packages_wp_typia_project_tools_src_runtime.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_wp_typia_project_tools_src_runtime.md#gettemplateselectoptions)
- [listTemplates](packages_wp_typia_project_tools_src_runtime.md#listtemplates)
- [createReadlinePrompt](packages_wp_typia_project_tools_src_runtime.md#createreadlineprompt)
- [formatAddHelpText](packages_wp_typia_project_tools_src_runtime.md#formataddhelptext)
- [formatHelpText](packages_wp_typia_project_tools_src_runtime.md#formathelptext)
- [formatTemplateDetails](packages_wp_typia_project_tools_src_runtime.md#formattemplatedetails)
- [formatTemplateFeatures](packages_wp_typia_project_tools_src_runtime.md#formattemplatefeatures)
- [formatTemplateSummary](packages_wp_typia_project_tools_src_runtime.md#formattemplatesummary)
- [getDoctorChecks](packages_wp_typia_project_tools_src_runtime.md#getdoctorchecks)
- [getNextSteps](packages_wp_typia_project_tools_src_runtime.md#getnextsteps)
- [getOptionalOnboarding](packages_wp_typia_project_tools_src_runtime.md#getoptionalonboarding)
- [getWorkspaceBlockSelectOptions](packages_wp_typia_project_tools_src_runtime.md#getworkspaceblockselectoptions)
- [HOOKED\_BLOCK\_POSITION\_IDS](packages_wp_typia_project_tools_src_runtime.md#hooked_block_position_ids)
- [runAddBindingSourceCommand](packages_wp_typia_project_tools_src_runtime.md#runaddbindingsourcecommand)
- [runAddBlockCommand](packages_wp_typia_project_tools_src_runtime.md#runaddblockcommand)
- [runAddHookedBlockCommand](packages_wp_typia_project_tools_src_runtime.md#runaddhookedblockcommand)
- [runAddPatternCommand](packages_wp_typia_project_tools_src_runtime.md#runaddpatterncommand)
- [runDoctor](packages_wp_typia_project_tools_src_runtime.md#rundoctor)
- [runAddVariationCommand](packages_wp_typia_project_tools_src_runtime.md#runaddvariationcommand)
- [runScaffoldFlow](packages_wp_typia_project_tools_src_runtime.md#runscaffoldflow)
- [DoctorCheck](packages_wp_typia_project_tools_src_runtime.md#doctorcheck)
- [HookedBlockPositionId](packages_wp_typia_project_tools_src_runtime.md#hookedblockpositionid)
- [ReadlinePrompt](packages_wp_typia_project_tools_src_runtime.md#readlineprompt)

## References

### scaffoldProject

Re-exports [scaffoldProject](packages_wp_typia_project_tools_src_runtime_scaffold.md#scaffoldproject)

___

### collectScaffoldAnswers

Re-exports [collectScaffoldAnswers](packages_wp_typia_project_tools_src_runtime_scaffold.md#collectscaffoldanswers)

___

### getDefaultAnswers

Re-exports [getDefaultAnswers](packages_wp_typia_project_tools_src_runtime_scaffold.md#getdefaultanswers)

___

### getTemplateVariables

Re-exports [getTemplateVariables](packages_wp_typia_project_tools_src_runtime_scaffold.md#gettemplatevariables)

___

### resolvePackageManagerId

Re-exports [resolvePackageManagerId](packages_wp_typia_project_tools_src_runtime_scaffold.md#resolvepackagemanagerid)

___

### resolveTemplateId

Re-exports [resolveTemplateId](packages_wp_typia_project_tools_src_runtime_scaffold.md#resolvetemplateid)

___

### formatMigrationHelpText

Re-exports [formatMigrationHelpText](packages_wp_typia_project_tools_src_runtime_migrations.md#formatmigrationhelptext)

___

### parseMigrationArgs

Re-exports [parseMigrationArgs](packages_wp_typia_project_tools_src_runtime_migrations.md#parsemigrationargs)

___

### runMigrationCommand

Re-exports [runMigrationCommand](packages_wp_typia_project_tools_src_runtime_migrations.md#runmigrationcommand)

___

### parseWorkspacePackageManagerId

Re-exports [parseWorkspacePackageManagerId](packages_wp_typia_project_tools_src_runtime_workspace_project.md#parseworkspacepackagemanagerid)

___

### resolveWorkspaceProject

Re-exports [resolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#resolveworkspaceproject)

___

### tryResolveWorkspaceProject

Re-exports [tryResolveWorkspaceProject](packages_wp_typia_project_tools_src_runtime_workspace_project.md#tryresolveworkspaceproject)

___

### manifestAttributeToJsonSchema

Re-exports [manifestAttributeToJsonSchema](packages_wp_typia_project_tools_src_runtime_schema_core.md#manifestattributetojsonschema)

___

### projectJsonSchemaDocument

Re-exports [projectJsonSchemaDocument](packages_wp_typia_project_tools_src_runtime_schema_core.md#projectjsonschemadocument)

___

### manifestToJsonSchema

Re-exports [manifestToJsonSchema](packages_wp_typia_project_tools_src_runtime_schema_core.md#manifesttojsonschema)

___

### manifestToOpenApi

Re-exports [manifestToOpenApi](packages_wp_typia_project_tools_src_runtime_schema_core.md#manifesttoopenapi)

___

### normalizeEndpointAuthDefinition

Re-exports [normalizeEndpointAuthDefinition](packages_wp_typia_project_tools_src_runtime_schema_core.md#normalizeendpointauthdefinition)

___

### buildCompoundChildStarterManifestDocument

Re-exports [buildCompoundChildStarterManifestDocument](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#buildcompoundchildstartermanifestdocument)

___

### getStarterManifestFiles

Re-exports [getStarterManifestFiles](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#getstartermanifestfiles)

___

### stringifyStarterManifest

Re-exports [stringifyStarterManifest](packages_wp_typia_project_tools_src_runtime_starter_manifests.md#stringifystartermanifest)

___

### EndpointAuthIntent

Re-exports [EndpointAuthIntent](packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointauthintent)

___

### EndpointOpenApiAuthMode

Re-exports [EndpointOpenApiAuthMode](packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointopenapiauthmode)

___

### EndpointOpenApiContractDocument

Re-exports [EndpointOpenApiContractDocument](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiContractDocument.md)

___

### EndpointOpenApiDocumentOptions

Re-exports [EndpointOpenApiDocumentOptions](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md)

___

### EndpointOpenApiEndpointDefinition

Re-exports [EndpointOpenApiEndpointDefinition](packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointopenapiendpointdefinition)

___

### EndpointOpenApiMethod

Re-exports [EndpointOpenApiMethod](packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointopenapimethod)

___

### EndpointWordPressAuthDefinition

Re-exports [EndpointWordPressAuthDefinition](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.EndpointWordPressAuthDefinition.md)

___

### EndpointWordPressAuthMechanism

Re-exports [EndpointWordPressAuthMechanism](packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointwordpressauthmechanism)

___

### JsonSchemaDocument

Re-exports [JsonSchemaDocument](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaDocument.md)

___

### JsonSchemaProjectionProfile

Re-exports [JsonSchemaProjectionProfile](packages_wp_typia_project_tools_src_runtime_schema_core.md#jsonschemaprojectionprofile)

___

### JsonSchemaObject

Re-exports [JsonSchemaObject](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaObject.md)

___

### NormalizedEndpointAuthDefinition

Re-exports [NormalizedEndpointAuthDefinition](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.NormalizedEndpointAuthDefinition.md)

___

### OpenApiDocument

Re-exports [OpenApiDocument](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md)

___

### OpenApiInfo

Re-exports [OpenApiInfo](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiInfo.md)

___

### OpenApiOperation

Re-exports [OpenApiOperation](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiOperation.md)

___

### OpenApiParameter

Re-exports [OpenApiParameter](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiParameter.md)

___

### OpenApiPathItem

Re-exports [OpenApiPathItem](packages_wp_typia_project_tools_src_runtime_schema_core.md#openapipathitem)

___

### OpenApiSecurityScheme

Re-exports [OpenApiSecurityScheme](../interfaces/packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiSecurityScheme.md)

___

### PACKAGE\_MANAGER\_IDS

Re-exports [PACKAGE_MANAGER_IDS](packages_wp_typia_project_tools_src_runtime_package_managers.md#package_manager_ids)

___

### PACKAGE\_MANAGERS

Re-exports [PACKAGE_MANAGERS](packages_wp_typia_project_tools_src_runtime_package_managers.md#package_managers)

___

### formatPackageExecCommand

Re-exports [formatPackageExecCommand](packages_wp_typia_project_tools_src_runtime_package_managers.md#formatpackageexeccommand)

___

### formatInstallCommand

Re-exports [formatInstallCommand](packages_wp_typia_project_tools_src_runtime_package_managers.md#formatinstallcommand)

___

### formatRunScript

Re-exports [formatRunScript](packages_wp_typia_project_tools_src_runtime_package_managers.md#formatrunscript)

___

### getPackageManager

Re-exports [getPackageManager](packages_wp_typia_project_tools_src_runtime_package_managers.md#getpackagemanager)

___

### getPackageManagerSelectOptions

Re-exports [getPackageManagerSelectOptions](packages_wp_typia_project_tools_src_runtime_package_managers.md#getpackagemanagerselectoptions)

___

### transformPackageManagerText

Re-exports [transformPackageManagerText](packages_wp_typia_project_tools_src_runtime_package_managers.md#transformpackagemanagertext)

___

### TEMPLATE\_IDS

Re-exports [TEMPLATE_IDS](packages_wp_typia_project_tools_src_runtime_template_registry.md#template_ids)

___

### TEMPLATE\_REGISTRY

Re-exports [TEMPLATE_REGISTRY](packages_wp_typia_project_tools_src_runtime_template_registry.md#template_registry)

___

### getTemplateById

Re-exports [getTemplateById](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplatebyid)

___

### getTemplateSelectOptions

Re-exports [getTemplateSelectOptions](packages_wp_typia_project_tools_src_runtime_template_registry.md#gettemplateselectoptions)

___

### listTemplates

Re-exports [listTemplates](packages_wp_typia_project_tools_src_runtime_template_registry.md#listtemplates)

___

### createReadlinePrompt

Re-exports [createReadlinePrompt](packages_wp_typia_project_tools_src_runtime_cli_prompt.md#createreadlineprompt)

___

### formatAddHelpText

Re-exports [formatAddHelpText](packages_wp_typia_project_tools_src_runtime_cli_add.md#formataddhelptext)

___

### formatHelpText

Re-exports [formatHelpText](packages_wp_typia_project_tools_src_runtime_cli_help.md#formathelptext)

___

### formatTemplateDetails

Re-exports [formatTemplateDetails](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatedetails)

___

### formatTemplateFeatures

Re-exports [formatTemplateFeatures](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatefeatures)

___

### formatTemplateSummary

Re-exports [formatTemplateSummary](packages_wp_typia_project_tools_src_runtime_cli_templates.md#formattemplatesummary)

___

### getDoctorChecks

Re-exports [getDoctorChecks](packages_wp_typia_project_tools_src_runtime_cli_doctor.md#getdoctorchecks)

___

### getNextSteps

Re-exports [getNextSteps](packages_wp_typia_project_tools_src_runtime_cli_scaffold.md#getnextsteps)

___

### getOptionalOnboarding

Re-exports [getOptionalOnboarding](packages_wp_typia_project_tools_src_runtime_cli_scaffold.md#getoptionalonboarding)

___

### getWorkspaceBlockSelectOptions

Re-exports [getWorkspaceBlockSelectOptions](packages_wp_typia_project_tools_src_runtime_workspace_inventory.md#getworkspaceblockselectoptions)

___

### HOOKED\_BLOCK\_POSITION\_IDS

Re-exports [HOOKED_BLOCK_POSITION_IDS](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hooked_block_position_ids)

___

### runAddBindingSourceCommand

Re-exports [runAddBindingSourceCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddbindingsourcecommand)

___

### runAddBlockCommand

Re-exports [runAddBlockCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddblockcommand)

___

### runAddHookedBlockCommand

Re-exports [runAddHookedBlockCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddhookedblockcommand)

___

### runAddPatternCommand

Re-exports [runAddPatternCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddpatterncommand)

___

### runDoctor

Re-exports [runDoctor](packages_wp_typia_project_tools_src_runtime_cli_doctor.md#rundoctor)

___

### runAddVariationCommand

Re-exports [runAddVariationCommand](packages_wp_typia_project_tools_src_runtime_cli_add.md#runaddvariationcommand)

___

### runScaffoldFlow

Re-exports [runScaffoldFlow](packages_wp_typia_project_tools_src_runtime_cli_scaffold.md#runscaffoldflow)

___

### DoctorCheck

Re-exports [DoctorCheck](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_doctor.DoctorCheck.md)

___

### HookedBlockPositionId

Re-exports [HookedBlockPositionId](packages_wp_typia_project_tools_src_runtime_hooked_blocks.md#hookedblockpositionid)

___

### ReadlinePrompt

Re-exports [ReadlinePrompt](../interfaces/packages_wp_typia_project_tools_src_runtime_cli_prompt.ReadlinePrompt.md)
