[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/cli-core

# Module: packages/create/src/runtime/cli-core

## Table of contents

### References

- [getTemplateById](packages_create_src_runtime_cli_core.md#gettemplatebyid)
- [getTemplateSelectOptions](packages_create_src_runtime_cli_core.md#gettemplateselectoptions)
- [listTemplates](packages_create_src_runtime_cli_core.md#listtemplates)

### Functions

- [createReadlinePrompt](packages_create_src_runtime_cli_core.md#createreadlineprompt)
- [formatHelpText](packages_create_src_runtime_cli_core.md#formathelptext)
- [formatTemplateSummary](packages_create_src_runtime_cli_core.md#formattemplatesummary)
- [formatTemplateFeatures](packages_create_src_runtime_cli_core.md#formattemplatefeatures)
- [formatTemplateDetails](packages_create_src_runtime_cli_core.md#formattemplatedetails)
- [getDoctorChecks](packages_create_src_runtime_cli_core.md#getdoctorchecks)
- [runDoctor](packages_create_src_runtime_cli_core.md#rundoctor)
- [getNextSteps](packages_create_src_runtime_cli_core.md#getnextsteps)
- [getOptionalOnboarding](packages_create_src_runtime_cli_core.md#getoptionalonboarding)
- [runScaffoldFlow](packages_create_src_runtime_cli_core.md#runscaffoldflow)

## References

### getTemplateById

Re-exports [getTemplateById](packages_create_src_runtime_template_registry.md#gettemplatebyid)

___

### getTemplateSelectOptions

Re-exports [getTemplateSelectOptions](packages_create_src_runtime_template_registry.md#gettemplateselectoptions)

___

### listTemplates

Re-exports [listTemplates](packages_create_src_runtime_template_registry.md#listtemplates)

## Functions

### createReadlinePrompt

▸ **createReadlinePrompt**(): `ReadlinePrompt`

#### Returns

`ReadlinePrompt`

#### Defined in

[packages/create/src/runtime/cli-core.ts:131](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L131)

___

### formatHelpText

▸ **formatHelpText**(): `string`

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-core.ts:186](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L186)

___

### formatTemplateSummary

▸ **formatTemplateSummary**(`template`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-core.ts:202](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L202)

___

### formatTemplateFeatures

▸ **formatTemplateFeatures**(`template`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-core.ts:206](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L206)

___

### formatTemplateDetails

▸ **formatTemplateDetails**(`template`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `template` | [`TemplateDefinition`](../interfaces/packages_create_src_runtime_template_registry.TemplateDefinition.md) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-core.ts:210](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L210)

___

### getDoctorChecks

▸ **getDoctorChecks**(`cwd`): `Promise`\<`DoctorCheck`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |

#### Returns

`Promise`\<`DoctorCheck`[]\>

#### Defined in

[packages/create/src/runtime/cli-core.ts:276](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L276)

___

### runDoctor

▸ **runDoctor**(`cwd`, `«destructured»?`): `Promise`\<`DoctorCheck`[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `cwd` | `string` |
| `«destructured»` | `RunDoctorOptions` |

#### Returns

`Promise`\<`DoctorCheck`[]\>

#### Defined in

[packages/create/src/runtime/cli-core.ts:348](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L348)

___

### getNextSteps

▸ **getNextSteps**(`«destructured»`): `string`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `GetNextStepsOptions` |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/cli-core.ts:365](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L365)

___

### getOptionalOnboarding

▸ **getOptionalOnboarding**(`«destructured»`): `OptionalOnboardingGuidance`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `GetOptionalOnboardingOptions` |

#### Returns

`OptionalOnboardingGuidance`

#### Defined in

[packages/create/src/runtime/cli-core.ts:382](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L382)

___

### runScaffoldFlow

▸ **runScaffoldFlow**(`«destructured»`): `Promise`\<\{ `optionalOnboarding`: `OptionalOnboardingGuidance` ; `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RunScaffoldFlowOptions` |

#### Returns

`Promise`\<\{ `optionalOnboarding`: `OptionalOnboardingGuidance` ; `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

#### Defined in

[packages/create/src/runtime/cli-core.ts:395](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L395)
