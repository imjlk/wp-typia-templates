[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-project-tools/src/runtime/scaffold-onboarding

# Module: packages/wp-typia-project-tools/src/runtime/scaffold-onboarding

## Table of contents

### Functions

- [getOptionalSyncScriptNames](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#getoptionalsyncscriptnames)
- [getOptionalOnboardingSteps](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#getoptionalonboardingsteps)
- [getOptionalOnboardingNote](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#getoptionalonboardingnote)
- [getTemplateSourceOfTruthNote](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#gettemplatesourceoftruthnote)
- [getCompoundExtensionWorkflowSection](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#getcompoundextensionworkflowsection)
- [getPhpRestExtensionPointsSection](packages_wp_typia_project_tools_src_runtime_scaffold_onboarding.md#getphprestextensionpointssection)

## Functions

### getOptionalSyncScriptNames

▸ **getOptionalSyncScriptNames**(`templateId`, `options?`): `string`[]

Returns the optional sync script names to suggest for a template.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `options` | `SyncOnboardingOptions` |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L31)

___

### getOptionalOnboardingSteps

▸ **getOptionalOnboardingSteps**(`packageManager`, `templateId`, `options?`): `string`[]

Formats optional onboarding sync commands for the selected package manager.

#### Parameters

| Name | Type |
| :------ | :------ |
| `packageManager` | [`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid) |
| `templateId` | `string` |
| `options` | `SyncOnboardingOptions` |

#### Returns

`string`[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L43)

___

### getOptionalOnboardingNote

▸ **getOptionalOnboardingNote**(`packageManager`, `templateId?`): `string`

Returns the onboarding note explaining when manual sync is optional.

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `packageManager` | [`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid) | `undefined` |
| `templateId` | `string` | `"basic"` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:56](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L56)

___

### getTemplateSourceOfTruthNote

▸ **getTemplateSourceOfTruthNote**(`templateId`, `«destructured»?`): `string`

Returns source-of-truth guidance for generated artifacts by template mode.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `«destructured»` | `SyncOnboardingOptions` |

#### Returns

`string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:84](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L84)

___

### getCompoundExtensionWorkflowSection

▸ **getCompoundExtensionWorkflowSection**(`packageManager`, `templateId`): `string` \| ``null``

Returns the generated-project extension workflow for compound child blocks.

#### Parameters

| Name | Type |
| :------ | :------ |
| `packageManager` | [`PackageManagerId`](packages_wp_typia_project_tools_src_runtime_package_managers.md#packagemanagerid) |
| `templateId` | `string` |

#### Returns

`string` \| ``null``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L109)

___

### getPhpRestExtensionPointsSection

▸ **getPhpRestExtensionPointsSection**(`templateId`, `«destructured»`): `string` \| ``null``

Returns scaffold-local guidance for the main PHP REST customization points.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |
| `«destructured»` | `PhpRestExtensionOptions` |

#### Returns

`string` \| ``null``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts:162](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold-onboarding.ts#L162)
