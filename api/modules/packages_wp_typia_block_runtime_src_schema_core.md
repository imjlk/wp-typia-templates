[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/schema-core

# Module: packages/wp-typia-block-runtime/src/schema-core

## Table of contents

### Interfaces

- [JsonSchemaObject](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)
- [JsonSchemaDocument](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaDocument.md)
- [OpenApiInfo](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiInfo.md)
- [OpenApiSchemaReference](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiSchemaReference.md)
- [OpenApiParameter](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiParameter.md)
- [OpenApiMediaType](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiMediaType.md)
- [OpenApiRequestBody](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiRequestBody.md)
- [OpenApiResponse](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiResponse.md)
- [OpenApiSecurityScheme](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiSecurityScheme.md)
- [OpenApiOperation](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md)
- [OpenApiTag](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiTag.md)
- [OpenApiComponents](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiComponents.md)
- [OpenApiDocument](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md)
- [EndpointWordPressAuthDefinition](../interfaces/packages_wp_typia_block_runtime_src_schema_core.EndpointWordPressAuthDefinition.md)
- [EndpointOpenApiContractDocument](../interfaces/packages_wp_typia_block_runtime_src_schema_core.EndpointOpenApiContractDocument.md)
- [NormalizedEndpointAuthDefinition](../interfaces/packages_wp_typia_block_runtime_src_schema_core.NormalizedEndpointAuthDefinition.md)
- [EndpointOpenApiDocumentOptions](../interfaces/packages_wp_typia_block_runtime_src_schema_core.EndpointOpenApiDocumentOptions.md)
- [JsonSchemaProjectionOptions](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaProjectionOptions.md)

### Type Aliases

- [OpenApiPathItem](packages_wp_typia_block_runtime_src_schema_core.md#openapipathitem)
- [EndpointAuthIntent](packages_wp_typia_block_runtime_src_schema_core.md#endpointauthintent)
- [EndpointWordPressAuthMechanism](packages_wp_typia_block_runtime_src_schema_core.md#endpointwordpressauthmechanism)
- [EndpointOpenApiAuthMode](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiauthmode)
- [EndpointOpenApiMethod](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapimethod)
- [EndpointOpenApiEndpointDefinition](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)
- [JsonSchemaProjectionProfile](packages_wp_typia_block_runtime_src_schema_core.md#jsonschemaprojectionprofile)

### Functions

- [manifestAttributeToJsonSchema](packages_wp_typia_block_runtime_src_schema_core.md#manifestattributetojsonschema)
- [manifestToJsonSchema](packages_wp_typia_block_runtime_src_schema_core.md#manifesttojsonschema)
- [projectJsonSchemaDocument](packages_wp_typia_block_runtime_src_schema_core.md#projectjsonschemadocument)
- [manifestToOpenApi](packages_wp_typia_block_runtime_src_schema_core.md#manifesttoopenapi)
- [normalizeEndpointAuthDefinition](packages_wp_typia_block_runtime_src_schema_core.md#normalizeendpointauthdefinition)
- [buildEndpointOpenApiDocument](packages_wp_typia_block_runtime_src_schema_core.md#buildendpointopenapidocument)

## Type Aliases

### OpenApiPathItem

Ƭ **OpenApiPathItem**: [`JsonSchemaObject`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md) & `Partial`\<`Record`\<`Lowercase`\<[`EndpointOpenApiMethod`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapimethod)\>, [`OpenApiOperation`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md)\>\>

Path item containing one or more generated REST operations.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:107](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L107)

___

### EndpointAuthIntent

Ƭ **EndpointAuthIntent**: ``"authenticated"`` \| ``"public"`` \| ``"public-write-protected"``

Backend-neutral auth intent for one manifest-defined endpoint.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:143](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L143)

___

### EndpointWordPressAuthMechanism

Ƭ **EndpointWordPressAuthMechanism**: ``"public-signed-token"`` \| ``"rest-nonce"``

WordPress-specific authentication mechanisms that can implement neutral auth intent.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:151](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L151)

___

### EndpointOpenApiAuthMode

Ƭ **EndpointOpenApiAuthMode**: ``"authenticated-rest-nonce"`` \| ``"public-read"`` \| ``"public-signed-token"``

Legacy WordPress auth-mode literals kept for backward compatibility.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:166](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L166)

___

### EndpointOpenApiMethod

Ƭ **EndpointOpenApiMethod**: ``"DELETE"`` \| ``"GET"`` \| ``"PATCH"`` \| ``"POST"`` \| ``"PUT"``

Supported HTTP methods for generated REST OpenAPI endpoints.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:174](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L174)

___

### EndpointOpenApiEndpointDefinition

Ƭ **EndpointOpenApiEndpointDefinition**: `EndpointOpenApiEndpointBaseDefinition` & \{ `auth`: [`EndpointAuthIntent`](packages_wp_typia_block_runtime_src_schema_core.md#endpointauthintent)  } \| `EndpointOpenApiEndpointBaseDefinition` & \{ `authMode`: [`EndpointOpenApiAuthMode`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiauthmode)  }

Route metadata for one REST endpoint in the aggregate OpenAPI document.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:214](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L214)

___

### JsonSchemaProjectionProfile

Ƭ **JsonSchemaProjectionProfile**: ``"ai-structured-output"`` \| ``"rest"``

Supported schema projection profiles derived from one canonical wp-typia JSON Schema document.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:244](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L244)

## Functions

### manifestAttributeToJsonSchema

▸ **manifestAttributeToJsonSchema**(`attribute`): [`JsonSchemaObject`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)

Converts one manifest attribute definition into a JSON Schema fragment.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md) | Manifest-derived attribute metadata. |

#### Returns

[`JsonSchemaObject`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)

A JSON-compatible schema fragment for the attribute.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:579](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L579)

___

### manifestToJsonSchema

▸ **manifestToJsonSchema**(`doc`): [`JsonSchemaDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaDocument.md)

Builds a full JSON Schema document from a Typia manifest document.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md) | Manifest-derived attribute document. |

#### Returns

[`JsonSchemaDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaDocument.md)

A draft 2020-12 JSON Schema document for the manifest root object.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:652](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L652)

___

### projectJsonSchemaDocument

▸ **projectJsonSchemaDocument**\<`Schema`\>(`schema`, `options`): `Schema`

Projects one generated wp-typia JSON Schema document into a consumer-facing profile.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends [`JsonSchemaObject`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md) \| [`JsonSchemaDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaDocument.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `Schema` | Existing generated JSON Schema document. |
| `options` | [`JsonSchemaProjectionOptions`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.JsonSchemaProjectionOptions.md) | Projection profile options. |

#### Returns

`Schema`

A cloned schema document adjusted for the requested profile.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:678](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L678)

___

### manifestToOpenApi

▸ **manifestToOpenApi**(`doc`, `info?`): [`OpenApiDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md)

Wraps a manifest-derived JSON Schema document in a minimal OpenAPI 3.1 shell.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `doc` | [`ManifestDocument`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md) | Manifest-derived attribute document. |
| `info` | [`OpenApiInfo`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiInfo.md) | Optional OpenAPI document metadata. |

#### Returns

[`OpenApiDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md)

An OpenAPI document containing the schema as a single component.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:703](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L703)

___

### normalizeEndpointAuthDefinition

▸ **normalizeEndpointAuthDefinition**(`endpoint`): [`NormalizedEndpointAuthDefinition`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.NormalizedEndpointAuthDefinition.md)

Normalizes endpoint auth metadata into backend-neutral intent plus optional
WordPress adapter details.

This public runtime helper accepts either the authored `auth` and optional
`wordpressAuth` shape or the deprecated `authMode` field. It validates that
the provided fields are compatible, resolves the legacy compatibility mode,
and returns a normalized definition without mutating the input endpoint.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `endpoint` | `Pick`\<[`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition), ``"auth"`` \| ``"path"`` \| ``"operationId"`` \| ``"authMode"`` \| ``"wordpressAuth"`` \| ``"method"``\> | Endpoint auth fields to normalize, including `auth`, `authMode`, `wordpressAuth`, and optional identity fields used in error messages (`operationId`, `path`, and `method`). |

#### Returns

[`NormalizedEndpointAuthDefinition`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.NormalizedEndpointAuthDefinition.md)

The normalized auth definition for the endpoint.

**`Throws`**

When `auth` and deprecated `authMode` conflict.

**`Throws`**

When `wordpressAuth` is attached to the `public` auth intent.

**`Throws`**

When the selected `wordpressAuth` mechanism is incompatible with the
chosen auth intent.

**`Throws`**

When neither `auth` nor deprecated `authMode` is defined.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:816](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L816)

___

### buildEndpointOpenApiDocument

▸ **buildEndpointOpenApiDocument**(`options`): [`OpenApiDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md)

Build a complete OpenAPI 3.1 document from contract manifests and route metadata.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`EndpointOpenApiDocumentOptions`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.EndpointOpenApiDocumentOptions.md) | Aggregate contract and endpoint definitions for the REST surface. |

#### Returns

[`OpenApiDocument`](../interfaces/packages_wp_typia_block_runtime_src_schema_core.OpenApiDocument.md)

A JSON-compatible OpenAPI document with paths, components, and auth metadata.

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:1048](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L1048)
