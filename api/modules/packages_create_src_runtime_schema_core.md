[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/schema-core

# Module: packages/create/src/runtime/schema-core

## Table of contents

### Interfaces

- [JsonSchemaObject](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)
- [OpenApiInfo](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md)
- [EndpointOpenApiContractDocument](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiContractDocument.md)
- [EndpointOpenApiEndpointDefinition](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md)
- [EndpointOpenApiDocumentOptions](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md)

### Type Aliases

- [EndpointOpenApiAuthMode](packages_create_src_runtime_schema_core.md#endpointopenapiauthmode)
- [EndpointOpenApiMethod](packages_create_src_runtime_schema_core.md#endpointopenapimethod)

### Functions

- [manifestAttributeToJsonSchema](packages_create_src_runtime_schema_core.md#manifestattributetojsonschema)
- [manifestToJsonSchema](packages_create_src_runtime_schema_core.md#manifesttojsonschema)
- [manifestToOpenApi](packages_create_src_runtime_schema_core.md#manifesttoopenapi)
- [buildEndpointOpenApiDocument](packages_create_src_runtime_schema_core.md#buildendpointopenapidocument)

## Type Aliases

### EndpointOpenApiAuthMode

Ƭ **EndpointOpenApiAuthMode**: ``"authenticated-rest-nonce"`` \| ``"public-read"`` \| ``"public-signed-token"``

Authentication mode metadata for generated REST OpenAPI endpoints.

#### Defined in

[packages/create/src/runtime/schema-core.ts:22](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L22)

___

### EndpointOpenApiMethod

Ƭ **EndpointOpenApiMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

Supported HTTP methods for generated REST OpenAPI endpoints.

#### Defined in

[packages/create/src/runtime/schema-core.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L30)

## Functions

### manifestAttributeToJsonSchema

▸ **manifestAttributeToJsonSchema**(`attribute`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:166](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L166)

___

### manifestToJsonSchema

▸ **manifestToJsonSchema**(`doc`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:233](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L233)

___

### manifestToOpenApi

▸ **manifestToOpenApi**(`doc`, `info?`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |
| `info` | [`OpenApiInfo`](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md) |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

#### Defined in

[packages/create/src/runtime/schema-core.ts:252](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L252)

___

### buildEndpointOpenApiDocument

▸ **buildEndpointOpenApiDocument**(`options`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

Build a complete OpenAPI 3.1 document from contract manifests and route metadata.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`EndpointOpenApiDocumentOptions`](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md) | Aggregate contract and endpoint definitions for the REST surface. |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

A JSON-compatible OpenAPI document with paths, components, and auth metadata.

#### Defined in

[packages/create/src/runtime/schema-core.ts:368](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L368)
