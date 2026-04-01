[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md) / EndpointOpenApiEndpointDefinition

# Interface: EndpointOpenApiEndpointDefinition

[packages/create/src/runtime/schema-core](../modules/packages_create_src_runtime_schema_core.md).EndpointOpenApiEndpointDefinition

Route metadata for one REST endpoint in the aggregate OpenAPI document.

## Hierarchy

- **`EndpointOpenApiEndpointDefinition`**

  ↳ [`RestOpenApiEndpointDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md)

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

[packages/create/src/runtime/schema-core.ts:47](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L47)

___

### bodyContract

• `Optional` **bodyContract**: `string`

Contract key for a JSON request body, when the endpoint accepts one.

#### Defined in

[packages/create/src/runtime/schema-core.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L49)

___

### method

• **method**: [`EndpointOpenApiMethod`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapimethod)

HTTP method exposed by the route.

#### Defined in

[packages/create/src/runtime/schema-core.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L51)

___

### operationId

• **operationId**: `string`

Stable OpenAPI operation id for this route.

#### Defined in

[packages/create/src/runtime/schema-core.ts:53](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L53)

___

### path

• **path**: `string`

Absolute REST path including namespace and version.

#### Defined in

[packages/create/src/runtime/schema-core.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L55)

___

### queryContract

• `Optional` **queryContract**: `string`

Contract key for query parameters, when the endpoint reads from the query string.

#### Defined in

[packages/create/src/runtime/schema-core.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L57)

___

### responseContract

• **responseContract**: `string`

Contract key for the successful JSON response body.

#### Defined in

[packages/create/src/runtime/schema-core.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L59)

___

### summary

• `Optional` **summary**: `string`

Optional short endpoint summary shown in generated docs.

#### Defined in

[packages/create/src/runtime/schema-core.ts:61](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L61)

___

### tags

• **tags**: `string`[]

OpenAPI tag names applied to this endpoint.

#### Defined in

[packages/create/src/runtime/schema-core.ts:63](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L63)
