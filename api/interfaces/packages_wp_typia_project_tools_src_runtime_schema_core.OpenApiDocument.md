[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md) / OpenApiDocument

# Interface: OpenApiDocument

[packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md).OpenApiDocument

Complete OpenAPI 3.1 document emitted for endpoint-aware REST contracts.

## Hierarchy

- [`JsonSchemaObject`](packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaObject.md)

  ↳ **`OpenApiDocument`**

## Table of contents

### Properties

- [components](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md#components)
- [info](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md#info)
- [openapi](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md#openapi)
- [paths](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md#paths)
- [tags](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiDocument.md#tags)

## Properties

### components

• **components**: [`OpenApiComponents`](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiComponents.md)

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:130](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L130)

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

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:131](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L131)

___

### openapi

• **openapi**: ``"3.1.0"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:136](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L136)

___

### paths

• **paths**: `Record`\<`string`, [`OpenApiPathItem`](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md#openapipathitem)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:137](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L137)

___

### tags

• `Optional` **tags**: [`OpenApiTag`](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiTag.md)[]

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:138](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L138)
