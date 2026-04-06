[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md) / OpenApiDocument

# Interface: OpenApiDocument

[packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md).OpenApiDocument

Complete OpenAPI 3.1 document emitted for endpoint-aware REST contracts.

## Hierarchy

- [`JsonSchemaObject`](packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)

  ↳ **`OpenApiDocument`**

## Table of contents

### Properties

- [components](packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md#components)
- [info](packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md#info)
- [openapi](packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md#openapi)
- [paths](packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md#paths)
- [tags](packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md#tags)

## Properties

### components

• **components**: [`OpenApiComponents`](packages_wp_typia_block_runtime_src_schema_core.OpenApiComponents.md)

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:129](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L129)

___

### info

• **info**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `description?` | `string` |
| `title` | `string` |
| `version` | `string` |

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:130](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L130)

___

### openapi

• **openapi**: ``"3.1.0"``

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:135](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L135)

___

### paths

• **paths**: `Record`\<`string`, [`OpenApiPathItem`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#openapipathitem)\>

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:136](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L136)

___

### tags

• `Optional` **tags**: [`OpenApiTag`](packages_wp_typia_block_runtime_src_schema_core.OpenApiTag.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:137](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L137)
