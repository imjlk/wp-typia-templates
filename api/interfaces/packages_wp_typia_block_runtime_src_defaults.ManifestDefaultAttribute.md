[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/defaults](../modules/packages_wp_typia_block_runtime_src_defaults.md) / ManifestDefaultAttribute

# Interface: ManifestDefaultAttribute

[packages/wp-typia-block-runtime/src/defaults](../modules/packages_wp_typia_block_runtime_src_defaults.md).ManifestDefaultAttribute

## Table of contents

### Properties

- [typia](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultAttribute.md#typia)
- [ts](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultAttribute.md#ts)

## Properties

### typia

• **typia**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `defaultValue` | `JsonValue` |
| `hasDefault` | `boolean` |

#### Defined in

[packages/wp-typia-block-runtime/src/defaults.ts:7](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/defaults.ts#L7)

___

### ts

• **ts**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `items` | ``null`` \| [`ManifestDefaultAttribute`](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultAttribute.md) |
| `kind` | ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"object"`` \| ``"array"`` \| ``"union"`` |
| `properties` | ``null`` \| `Record`\<`string`, [`ManifestDefaultAttribute`](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultAttribute.md)\> |
| `required` | `boolean` |
| `union` | ``null`` \| \{ `branches`: `Record`\<`string`, [`ManifestDefaultAttribute`](packages_wp_typia_block_runtime_src_defaults.ManifestDefaultAttribute.md)\> ; `discriminator`: `string`  } |

#### Defined in

[packages/wp-typia-block-runtime/src/defaults.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/defaults.ts#L11)
