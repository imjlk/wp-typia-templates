[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md) / EndpointOpenApiEndpointDefinition

# Interface: EndpointOpenApiEndpointDefinition

[packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md).EndpointOpenApiEndpointDefinition

Route metadata for one REST endpoint in the aggregate OpenAPI document.

## Hierarchy

- **`EndpointOpenApiEndpointDefinition`**

  ↳ [`EndpointManifestEndpointDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)

## Table of contents

### Properties

- [authMode](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#authmode)
- [bodyContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#bodycontract)
- [method](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#method)
- [operationId](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#operationid)
- [path](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#path)
- [queryContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#querycontract)
- [responseContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#responsecontract)
- [summary](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#summary)
- [tags](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#tags)

## Properties

### authMode

• **authMode**: [`EndpointOpenApiAuthMode`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapiauthmode)

Authentication policy surfaced in OpenAPI metadata.

#### Defined in

[packages/create/src/runtime/schema-core.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L167)

___

### bodyContract

• `Optional` **bodyContract**: `string`

Contract key for a JSON request body, when the endpoint accepts one.

#### Defined in

[packages/create/src/runtime/schema-core.ts:169](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L169)

___

### method

• **method**: [`EndpointOpenApiMethod`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapimethod)

HTTP method exposed by the route.

#### Defined in

[packages/create/src/runtime/schema-core.ts:171](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L171)

___

### operationId

• **operationId**: `string`

Stable OpenAPI operation id for this route.

#### Defined in

[packages/create/src/runtime/schema-core.ts:173](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L173)

___

### path

• **path**: `string`

Absolute REST path including namespace and version.

#### Defined in

[packages/create/src/runtime/schema-core.ts:175](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L175)

___

### queryContract

• `Optional` **queryContract**: `string`

Contract key for query parameters, when the endpoint reads from the query string.

#### Defined in

[packages/create/src/runtime/schema-core.ts:177](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L177)

___

### responseContract

• **responseContract**: `string`

Contract key for the successful JSON response body.

#### Defined in

[packages/create/src/runtime/schema-core.ts:179](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L179)

___

### summary

• `Optional` **summary**: `string`

Optional short endpoint summary shown in generated docs.

#### Defined in

[packages/create/src/runtime/schema-core.ts:181](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L181)

___

### tags

• **tags**: readonly `string`[]

OpenAPI tag names applied to this endpoint.

#### Defined in

[packages/create/src/runtime/schema-core.ts:183](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L183)
