[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/json-utils

# Module: packages/wp-typia-block-runtime/src/json-utils

## Table of contents

### Functions

- [cloneJsonValue](packages_wp_typia_block_runtime_src_json_utils.md#clonejsonvalue)

## Functions

### cloneJsonValue

▸ **cloneJsonValue**\<`T`\>(`value`): `T`

Create a deep clone of a JSON-serializable value.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `T` | JSON-compatible data to clone. |

#### Returns

`T`

A deep-cloned copy created with `JSON.parse(JSON.stringify(...))`.

Values that are not JSON-serializable, such as functions, `undefined`,
`BigInt`, class instances, and `Date` objects, are not preserved faithfully.

#### Defined in

[packages/wp-typia-block-runtime/src/json-utils.ts:10](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/json-utils.ts#L10)
