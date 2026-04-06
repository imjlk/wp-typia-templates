[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/blocks

# Module: packages/wp-typia-block-runtime/src/blocks

## Table of contents

### Interfaces

- [TypiaWebpackArtifactEntry](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackArtifactEntry.md)
- [TypiaWebpackConfigOptions](../interfaces/packages_wp_typia_block_runtime_src_blocks.TypiaWebpackConfigOptions.md)
- [ScaffoldBlockRegistrationSettings](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockRegistrationSettings.md)
- [ScaffoldBlockMetadata](../interfaces/packages_wp_typia_block_runtime_src_blocks.ScaffoldBlockMetadata.md)
- [BuildScaffoldBlockRegistrationResult](../interfaces/packages_wp_typia_block_runtime_src_blocks.BuildScaffoldBlockRegistrationResult.md)

### Type Aliases

- [ScaffoldBlockSupports](packages_wp_typia_block_runtime_src_blocks.md#scaffoldblocksupports)

### Functions

- [buildScaffoldBlockRegistration](packages_wp_typia_block_runtime_src_blocks.md#buildscaffoldblockregistration)
- [createTypiaWebpackConfig](packages_wp_typia_block_runtime_src_blocks.md#createtypiawebpackconfig)

## Type Aliases

### ScaffoldBlockSupports

Ƭ **ScaffoldBlockSupports**: `OverrideProperties`\<`WordPressBlockSupports`, `ScaffoldBlockSupportsOverride`\>

#### Defined in

[packages/wp-typia-block-runtime/src/blocks.ts:197](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L197)

## Functions

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

[packages/wp-typia-block-runtime/src/blocks.ts:285](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L285)

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

[packages/wp-typia-block-runtime/src/blocks.ts:306](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/blocks.ts#L306)
