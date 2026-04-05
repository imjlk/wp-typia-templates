[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/defaults](../modules/packages_create_src_runtime_defaults.md) / ManifestDefaultAttribute

# Interface: ManifestDefaultAttribute

[packages/create/src/runtime/defaults](../modules/packages_create_src_runtime_defaults.md).ManifestDefaultAttribute

## Table of contents

### Properties

- [typia](packages_create_src_runtime_defaults.ManifestDefaultAttribute.md#typia)
- [ts](packages_create_src_runtime_defaults.ManifestDefaultAttribute.md#ts)

## Properties

### typia

• **typia**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `defaultValue` | `JsonValue` |
| `hasDefault` | `boolean` |

#### Defined in

[packages/create/src/runtime/defaults.ts:7](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/defaults.ts#L7)

___

### ts

• **ts**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `items` | ``null`` \| [`ManifestDefaultAttribute`](packages_create_src_runtime_defaults.ManifestDefaultAttribute.md) |
| `kind` | ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"object"`` \| ``"array"`` \| ``"union"`` |
| `properties` | ``null`` \| `Record`\<`string`, [`ManifestDefaultAttribute`](packages_create_src_runtime_defaults.ManifestDefaultAttribute.md)\> |
| `required` | `boolean` |
| `union` | ``null`` \| \{ `branches`: `Record`\<`string`, [`ManifestDefaultAttribute`](packages_create_src_runtime_defaults.ManifestDefaultAttribute.md)\> ; `discriminator`: `string`  } |

#### Defined in

[packages/create/src/runtime/defaults.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/defaults.ts#L11)
