[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md) / EndpointOpenApiDocumentOptions

# Interface: EndpointOpenApiDocumentOptions

[packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md).EndpointOpenApiDocumentOptions

Options for building an aggregate endpoint-aware OpenAPI document.

## Table of contents

### Properties

- [contracts](packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#contracts)
- [endpoints](packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#endpoints)
- [info](packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md#info)

## Properties

### contracts

• **contracts**: `Record`\<`string`, [`EndpointOpenApiContractDocument`](packages_create_src_runtime_schema_core.EndpointOpenApiContractDocument.md)\>

Named contract documents keyed by the endpoint registry identifiers.

#### Defined in

[packages/create/src/runtime/schema-core.ts:191](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L191)

___

### endpoints

• **endpoints**: [`EndpointOpenApiEndpointDefinition`](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md)[]

Route definitions that should appear in the generated OpenAPI file.

#### Defined in

[packages/create/src/runtime/schema-core.ts:193](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L193)

___

### info

• `Optional` **info**: [`OpenApiInfo`](packages_create_src_runtime_schema_core.OpenApiInfo.md)

Optional document-level OpenAPI info metadata.

#### Defined in

[packages/create/src/runtime/schema-core.ts:195](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L195)
