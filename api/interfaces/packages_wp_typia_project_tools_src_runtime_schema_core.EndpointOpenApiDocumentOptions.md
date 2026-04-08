[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md) / EndpointOpenApiDocumentOptions

# Interface: EndpointOpenApiDocumentOptions

[packages/wp-typia-project-tools/src/runtime/schema-core](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md).EndpointOpenApiDocumentOptions

Options for building an aggregate endpoint-aware OpenAPI document.

## Table of contents

### Properties

- [contracts](packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#contracts)
- [endpoints](packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#endpoints)
- [info](packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#info)

## Properties

### contracts

• **contracts**: `Readonly`\<`Record`\<`string`, [`EndpointOpenApiContractDocument`](packages_wp_typia_project_tools_src_runtime_schema_core.EndpointOpenApiContractDocument.md)\>\>

Named contract documents keyed by the endpoint registry identifiers.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:234](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L234)

___

### endpoints

• **endpoints**: readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_wp_typia_project_tools_src_runtime_schema_core.md#endpointopenapiendpointdefinition)[]

Route definitions that should appear in the generated OpenAPI file.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:236](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L236)

___

### info

• `Optional` **info**: [`OpenApiInfo`](packages_wp_typia_project_tools_src_runtime_schema_core.OpenApiInfo.md)

Optional document-level OpenAPI info metadata.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/schema-core.ts:238](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/schema-core.ts#L238)
