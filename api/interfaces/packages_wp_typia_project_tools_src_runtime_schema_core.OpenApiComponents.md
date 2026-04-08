[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md) / OpenApiComponents

# Interface: OpenApiComponents

[packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md).OpenApiComponents

OpenAPI component registry for generated schemas and security schemes.

## Hierarchy

- [`JsonSchemaObject`](packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaObject.md)

  ↳ **`OpenApiComponents`**

## Table of contents

### Properties

- [schemas](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiComponents.md#schemas)
- [securitySchemes](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiComponents.md#securityschemes)

## Properties

### schemas

• **schemas**: `Record`\<`string`, [`JsonSchemaDocument`](packages_wp_typia_project_tools_src_runtime_schema_core.JsonSchemaDocument.md)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:121](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L121)

___

### securitySchemes

• `Optional` **securitySchemes**: `Record`\<`string`, [`OpenApiSecurityScheme`](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiSecurityScheme.md)\>

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L122)
