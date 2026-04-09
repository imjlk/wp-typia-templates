[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md) / OpenApiResponse

# Interface: OpenApiResponse

[packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md).OpenApiResponse

Successful JSON response entry in the generated OpenAPI document.

## Hierarchy

- [`JsonSchemaObject`](packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)

  ↳ **`OpenApiResponse`**

## Table of contents

### Properties

- [content](packages_wp_typia_block_runtime_src_schema_core.OpenApiResponse.md#content)
- [description](packages_wp_typia_block_runtime_src_schema_core.OpenApiResponse.md#description)
- [headers](packages_wp_typia_block_runtime_src_schema_core.OpenApiResponse.md#headers)

## Properties

### content

• **content**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `application/json` | [`OpenApiMediaType`](packages_wp_typia_block_runtime_src_schema_core.OpenApiMediaType.md) |

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:72](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L72)

___

### description

• **description**: `string`

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:75](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L75)

___

### headers

• `Optional` **headers**: `Record`\<`string`, [`JsonSchemaObject`](packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)\>

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:76](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L76)
