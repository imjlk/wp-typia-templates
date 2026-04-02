[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/schema-core

# Module: packages/create/src/runtime/schema-core

## Table of contents

### Interfaces

- [JsonSchemaObject](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)
- [JsonSchemaDocument](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md)
- [OpenApiInfo](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md)
- [OpenApiSchemaReference](../interfaces/packages_create_src_runtime_schema_core.OpenApiSchemaReference.md)
- [OpenApiParameter](../interfaces/packages_create_src_runtime_schema_core.OpenApiParameter.md)
- [OpenApiMediaType](../interfaces/packages_create_src_runtime_schema_core.OpenApiMediaType.md)
- [OpenApiRequestBody](../interfaces/packages_create_src_runtime_schema_core.OpenApiRequestBody.md)
- [OpenApiResponse](../interfaces/packages_create_src_runtime_schema_core.OpenApiResponse.md)
- [OpenApiSecurityScheme](../interfaces/packages_create_src_runtime_schema_core.OpenApiSecurityScheme.md)
- [OpenApiOperation](../interfaces/packages_create_src_runtime_schema_core.OpenApiOperation.md)
- [OpenApiTag](../interfaces/packages_create_src_runtime_schema_core.OpenApiTag.md)
- [OpenApiComponents](../interfaces/packages_create_src_runtime_schema_core.OpenApiComponents.md)
- [OpenApiDocument](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)
- [EndpointOpenApiContractDocument](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiContractDocument.md)
- [EndpointOpenApiEndpointDefinition](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md)
- [EndpointOpenApiDocumentOptions](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md)
- [JsonSchemaProjectionOptions](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaProjectionOptions.md)

### Type Aliases

- [OpenApiPathItem](packages_create_src_runtime_schema_core.md#openapipathitem)
- [EndpointOpenApiAuthMode](packages_create_src_runtime_schema_core.md#endpointopenapiauthmode)
- [EndpointOpenApiMethod](packages_create_src_runtime_schema_core.md#endpointopenapimethod)
- [JsonSchemaProjectionProfile](packages_create_src_runtime_schema_core.md#jsonschemaprojectionprofile)

### Functions

- [manifestAttributeToJsonSchema](packages_create_src_runtime_schema_core.md#manifestattributetojsonschema)
- [manifestToJsonSchema](packages_create_src_runtime_schema_core.md#manifesttojsonschema)
- [projectJsonSchemaDocument](packages_create_src_runtime_schema_core.md#projectjsonschemadocument)
- [manifestToOpenApi](packages_create_src_runtime_schema_core.md#manifesttoopenapi)
- [buildEndpointOpenApiDocument](packages_create_src_runtime_schema_core.md#buildendpointopenapidocument)

## Type Aliases

### OpenApiPathItem

Ƭ **OpenApiPathItem**: [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md) & `Partial`\<`Record`\<`Lowercase`\<[`EndpointOpenApiMethod`](packages_create_src_runtime_schema_core.md#endpointopenapimethod)\>, [`OpenApiOperation`](../interfaces/packages_create_src_runtime_schema_core.OpenApiOperation.md)\>\>

Path item containing one or more generated REST operations.

#### Defined in

[packages/create/src/runtime/schema-core.ts:106](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L106)

___

### EndpointOpenApiAuthMode

Ƭ **EndpointOpenApiAuthMode**: ``"authenticated-rest-nonce"`` \| ``"public-read"`` \| ``"public-signed-token"``

Authentication mode metadata for generated REST OpenAPI endpoints.

#### Defined in

[packages/create/src/runtime/schema-core.ts:142](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L142)

___

### EndpointOpenApiMethod

Ƭ **EndpointOpenApiMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

Supported HTTP methods for generated REST OpenAPI endpoints.

#### Defined in

[packages/create/src/runtime/schema-core.ts:150](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L150)

___

### JsonSchemaProjectionProfile

Ƭ **JsonSchemaProjectionProfile**: ``"ai-structured-output"`` \| ``"rest"``

Supported schema projection profiles derived from one canonical wp-typia JSON Schema document.

#### Defined in

[packages/create/src/runtime/schema-core.ts:201](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L201)

## Functions

### manifestAttributeToJsonSchema

▸ **manifestAttributeToJsonSchema**(`attribute`): [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

Converts one manifest attribute definition into a JSON Schema fragment.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) | Manifest-derived attribute metadata. |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md)

A JSON-compatible schema fragment for the attribute.

#### Defined in

[packages/create/src/runtime/schema-core.ts:533](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L533)

___

### manifestToJsonSchema

▸ **manifestToJsonSchema**(`doc`): [`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md)

Builds a full JSON Schema document from a Typia manifest document.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) | Manifest-derived attribute document. |

#### Returns

[`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md)

A draft 2020-12 JSON Schema document for the manifest root object.

#### Defined in

[packages/create/src/runtime/schema-core.ts:606](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L606)

___

### projectJsonSchemaDocument

▸ **projectJsonSchemaDocument**\<`Schema`\>(`schema`, `options`): `Schema`

Projects one generated wp-typia JSON Schema document into a consumer-facing profile.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends [`JsonSchemaObject`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaObject.md) \| [`JsonSchemaDocument`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaDocument.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `Schema` | Existing generated JSON Schema document. |
| `options` | [`JsonSchemaProjectionOptions`](../interfaces/packages_create_src_runtime_schema_core.JsonSchemaProjectionOptions.md) | Projection profile options. |

#### Returns

`Schema`

A cloned schema document adjusted for the requested profile.

#### Defined in

[packages/create/src/runtime/schema-core.ts:632](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L632)

___

### manifestToOpenApi

▸ **manifestToOpenApi**(`doc`, `info?`): [`OpenApiDocument`](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)

Wraps a manifest-derived JSON Schema document in a minimal OpenAPI 3.1 shell.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) | Manifest-derived attribute document. |
| `info` | [`OpenApiInfo`](../interfaces/packages_create_src_runtime_schema_core.OpenApiInfo.md) | Optional OpenAPI document metadata. |

#### Returns

[`OpenApiDocument`](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)

An OpenAPI document containing the schema as a single component.

#### Defined in

[packages/create/src/runtime/schema-core.ts:657](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L657)

___

### buildEndpointOpenApiDocument

▸ **buildEndpointOpenApiDocument**(`options`): [`OpenApiDocument`](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)

Build a complete OpenAPI 3.1 document from contract manifests and route metadata.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`EndpointOpenApiDocumentOptions`](../interfaces/packages_create_src_runtime_schema_core.EndpointOpenApiDocumentOptions.md) | Aggregate contract and endpoint definitions for the REST surface. |

#### Returns

[`OpenApiDocument`](../interfaces/packages_create_src_runtime_schema_core.OpenApiDocument.md)

A JSON-compatible OpenAPI document with paths, components, and auth metadata.

#### Defined in

[packages/create/src/runtime/schema-core.ts:802](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L802)
