[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/local-dev-presets

# Module: packages/create/src/runtime/local-dev-presets

## Table of contents

### Functions

- [applyLocalDevPresetFiles](packages_create_src_runtime_local_dev_presets.md#applylocaldevpresetfiles)
- [applyGeneratedProjectDxPackageJson](packages_create_src_runtime_local_dev_presets.md#applygeneratedprojectdxpackagejson)
- [getPrimaryDevelopmentScript](packages_create_src_runtime_local_dev_presets.md#getprimarydevelopmentscript)

## Functions

### applyLocalDevPresetFiles

▸ **applyLocalDevPresetFiles**(`«destructured»`): `Promise`\<`void`\>

Copies opt-in local development preset files into a generated project.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Pick`\<`LocalDevPresetOptions`, ``"projectDir"`` \| ``"variables"`` \| ``"withTestPreset"`` \| ``"withWpEnv"``\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/local-dev-presets.ts:124](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/local-dev-presets.ts#L124)

___

### applyGeneratedProjectDxPackageJson

▸ **applyGeneratedProjectDxPackageJson**(`«destructured»`): `Promise`\<`void`\>

Adds generated-project watch scripts and preset-specific dependencies to
`package.json`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Omit`\<`LocalDevPresetOptions`, ``"variables"``\> |

#### Returns

`Promise`\<`void`\>

#### Defined in

[packages/create/src/runtime/local-dev-presets.ts:152](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/local-dev-presets.ts#L152)

___

### getPrimaryDevelopmentScript

▸ **getPrimaryDevelopmentScript**(`templateId`): ``"dev"`` \| ``"start"``

Returns the recommended first-run development command for the given
scaffolded template.

#### Parameters

| Name | Type |
| :------ | :------ |
| `templateId` | `string` |

#### Returns

``"dev"`` \| ``"start"``

#### Defined in

[packages/create/src/runtime/local-dev-presets.ts:216](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/local-dev-presets.ts#L216)
