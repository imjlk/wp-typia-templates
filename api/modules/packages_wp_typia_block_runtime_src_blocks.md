[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/blocks

# Module: packages/wp-typia-block-runtime/src/blocks

## Table of contents

### Interfaces

- [TypiaWebpackArtifactEntry](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackArtifactEntry.md)
- [TypiaWebpackConfigOptions](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md)
- [TypiaWebpackPluginLoaderOptions](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackPluginLoaderOptions.md)
- [ScaffoldBlockRegistrationSettings](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockRegistrationSettings.md)
- [ScaffoldBlockMetadata](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockMetadata.md)
- [BuildScaffoldBlockRegistrationResult](../interfaces/packages_wp_typia_block_runtime_src_blocks.BuildScaffoldBlockRegistrationResult.md)

### Type Aliases

- [ScaffoldBlockSupports](packages_wp_typia_block_runtime_src_blocks.md#scaffoldblocksupports)

### Functions

- [assertTypiaWebpackCompatibility](packages_wp_typia_block_runtime_src_blocks.md#asserttypiawebpackcompatibility)
- [loadCompatibleTypiaWebpackPlugin](packages_wp_typia_block_runtime_src_blocks.md#loadcompatibletypiawebpackplugin)
- [buildScaffoldBlockRegistration](packages_wp_typia_block_runtime_src_blocks.md#buildscaffoldblockregistration)
- [createTypiaWebpackConfig](packages_wp_typia_block_runtime_src_blocks.md#createtypiawebpackconfig)

## Type Aliases

### ScaffoldBlockSupports

Ƭ **ScaffoldBlockSupports**: `OverrideProperties`\<`WordPressBlockSupports`, `ScaffoldBlockSupportsOverride`\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:218](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L218)

## Functions

### assertTypiaWebpackCompatibility

▸ **assertTypiaWebpackCompatibility**(`«destructured»?`): `Promise`\<`TypiaWebpackVersionMatrix`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `projectRoot?` | `string` |

#### Returns

`Promise`\<`TypiaWebpackVersionMatrix`\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:407](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L407)

___

### loadCompatibleTypiaWebpackPlugin

▸ **loadCompatibleTypiaWebpackPlugin**(`«destructured»`): `Promise`\<() => `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TypiaWebpackPluginLoaderOptions`](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackPluginLoaderOptions.md) |

#### Returns

`Promise`\<() => `unknown`\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:433](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L433)

___

### buildScaffoldBlockRegistration

▸ **buildScaffoldBlockRegistration**\<`TSettings`\>(`metadata`, `overrides`): [`BuildScaffoldBlockRegistrationResult`](../interfaces/packages_wp_typia_block_runtime_src_blocks.BuildScaffoldBlockRegistrationResult.md)\<`TSettings`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TSettings` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `metadata` | [`ScaffoldBlockMetadata`](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockMetadata.md) |
| `overrides` | `Partial`\<`TSettings`\> & `Record`\<`string`, `unknown`\> |

#### Returns

[`BuildScaffoldBlockRegistrationResult`](../interfaces/packages_wp_typia_block_runtime_src_blocks.BuildScaffoldBlockRegistrationResult.md)\<`TSettings`\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:459](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L459)

___

### createTypiaWebpackConfig

▸ **createTypiaWebpackConfig**(`«destructured»`): `Promise`\<\{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  } \| \{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  }[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`TypiaWebpackConfigOptions`](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md) |

#### Returns

`Promise`\<\{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  } \| \{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  }[]\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:480](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L480)
