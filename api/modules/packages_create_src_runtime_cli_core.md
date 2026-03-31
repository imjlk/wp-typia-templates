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

[packages/create/src/runtime/cli-core.ts:86](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L86)

___

### formatHelpText

▸ **formatHelpText**(): `string`

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/cli-core.ts:141](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L141)

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

[packages/create/src/runtime/cli-core.ts:155](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L155)

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

[packages/create/src/runtime/cli-core.ts:159](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L159)

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

[packages/create/src/runtime/cli-core.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L163)

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

[packages/create/src/runtime/cli-core.ts:217](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L217)

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

[packages/create/src/runtime/cli-core.ts:275](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L275)

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

[packages/create/src/runtime/cli-core.ts:292](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L292)

___

### runScaffoldFlow

▸ **runScaffoldFlow**(`«destructured»`): `Promise`\<\{ `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `RunScaffoldFlowOptions` |

#### Returns

`Promise`\<\{ `projectDir`: `string` ; `projectInput`: `string` ; `packageManager`: [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) = resolvedPackageManager; `result`: [`ScaffoldProjectResult`](../interfaces/packages_create_src_runtime_scaffold.ScaffoldProjectResult.md) ; `nextSteps`: `string`[]  }\>

#### Defined in

[packages/create/src/runtime/cli-core.ts:308](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/cli-core.ts#L308)
