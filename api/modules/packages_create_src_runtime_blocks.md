[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/blocks

# Module: packages/create/src/runtime/blocks

## Table of contents

### Interfaces

- [TypiaWebpackArtifactEntry](../interfaces/packages_create_src_runtime_blocks.TypiaWebpackArtifactEntry.md)
- [TypiaWebpackConfigOptions](../interfaces/packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md)

### Functions

- [buildScaffoldBlockRegistration](packages_create_src_runtime_blocks.md#buildscaffoldblockregistration)
- [createTypiaWebpackConfig](packages_create_src_runtime_blocks.md#createtypiawebpackconfig)

## Functions

### buildScaffoldBlockRegistration

▸ **buildScaffoldBlockRegistration**\<`TSettings`\>(`metadata`, `overrides`): `BuildScaffoldBlockRegistrationResult`\<`TSettings`\>

Builds a generated block registration payload while centralizing scaffold
metadata casting and override merging.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TSettings` | extends `object` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `metadata` | `Record`\<`string`, `unknown`\> | Raw block metadata loaded from `block.json`. |
| `overrides` | `Partial`\<`TSettings`\> & `Record`\<`string`, `unknown`\> | Generated edit/save/example overrides to merge on top. |

#### Returns

`BuildScaffoldBlockRegistrationResult`\<`TSettings`\>

The block name and merged registration settings.

#### Defined in

[packages/create/src/runtime/blocks.ts:120](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L120)

___

### createTypiaWebpackConfig

▸ **createTypiaWebpackConfig**(`options`): `Promise`\<\{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  } \| \{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  }[]\>

Creates a webpack config that shares Typia artifact copying and script-module
normalization across generated scaffold templates.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`TypiaWebpackConfigOptions`](../interfaces/packages_create_src_runtime_blocks.TypiaWebpackConfigOptions.md) | Webpack config inputs plus template-specific discovery callbacks. |

#### Returns

`Promise`\<\{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  } \| \{ `entry`: () => `Promise`\<`Record`\<`string`, `unknown`\>\> ; `plugins`: `unknown`[]  }[]\>

A webpack config or config array that matches the default config shape.

#### Defined in

[packages/create/src/runtime/blocks.ts:162](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L162)
