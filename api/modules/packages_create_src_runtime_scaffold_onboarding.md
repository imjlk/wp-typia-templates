[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/scaffold-onboarding

# Module: packages/create/src/runtime/scaffold-onboarding

## Table of contents

### Functions

- [getOptionalSyncScriptNames](packages_create_src_runtime_scaffold_onboarding.md#getoptionalsyncscriptnames)
- [getOptionalOnboardingSteps](packages_create_src_runtime_scaffold_onboarding.md#getoptionalonboardingsteps)
- [getOptionalOnboardingNote](packages_create_src_runtime_scaffold_onboarding.md#getoptionalonboardingnote)
- [getTemplateSourceOfTruthNote](packages_create_src_runtime_scaffold_onboarding.md#gettemplatesourceoftruthnote)
- [getPhpRestExtensionPointsSection](packages_create_src_runtime_scaffold_onboarding.md#getphprestextensionpointssection)

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

[packages/create/src/runtime/scaffold-onboarding.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold-onboarding.ts#L22)

___

### getOptionalOnboardingSteps

▸ **getOptionalOnboardingSteps**(`packageManager`, `templateId`, `options?`): `string`[]

Formats optional onboarding sync commands for the selected package manager.

#### Parameters

| Name | Type |
| :------ | :------ |
| `packageManager` | [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) |
| `templateId` | `string` |
| `options` | `SyncOnboardingOptions` |

#### Returns

`string`[]

#### Defined in

[packages/create/src/runtime/scaffold-onboarding.ts:34](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold-onboarding.ts#L34)

___

### getOptionalOnboardingNote

▸ **getOptionalOnboardingNote**(`packageManager`): `string`

Returns the onboarding note explaining when manual sync is optional.

#### Parameters

| Name | Type |
| :------ | :------ |
| `packageManager` | [`PackageManagerId`](packages_create_src_runtime_package_managers.md#packagemanagerid) |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/scaffold-onboarding.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold-onboarding.ts#L47)

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

[packages/create/src/runtime/scaffold-onboarding.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold-onboarding.ts#L54)

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

[packages/create/src/runtime/scaffold-onboarding.ts:79](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold-onboarding.ts#L79)
