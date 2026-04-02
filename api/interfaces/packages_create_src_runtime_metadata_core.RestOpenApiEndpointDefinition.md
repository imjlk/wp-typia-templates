[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / RestOpenApiEndpointDefinition

# Interface: RestOpenApiEndpointDefinition

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).RestOpenApiEndpointDefinition

Public wrapper for the route metadata consumed by `syncRestOpenApi()`.

## Hierarchy

- [`EndpointOpenApiEndpointDefinition`](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md)

  ↳ **`RestOpenApiEndpointDefinition`**

## Table of contents

### Properties

- [authMode](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#authmode)
- [bodyContract](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#bodycontract)
- [method](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#method)
- [operationId](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#operationid)
- [path](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#path)
- [queryContract](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#querycontract)
- [responseContract](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#responsecontract)
- [summary](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#summary)
- [tags](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md#tags)

## Properties

### authMode

• **authMode**: [`EndpointOpenApiAuthMode`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapiauthmode)

Authentication policy surfaced in OpenAPI metadata.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[authMode](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#authmode)

#### Defined in

[packages/create/src/runtime/schema-core.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L167)

___

### bodyContract

• `Optional` **bodyContract**: `string`

Contract key for a JSON request body, when the endpoint accepts one.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[bodyContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#bodycontract)

#### Defined in

[packages/create/src/runtime/schema-core.ts:169](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L169)

___

### method

• **method**: [`EndpointOpenApiMethod`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapimethod)

HTTP method exposed by the route.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[method](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#method)

#### Defined in

[packages/create/src/runtime/schema-core.ts:171](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L171)

___

### operationId

• **operationId**: `string`

Stable OpenAPI operation id for this route.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[operationId](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#operationid)

#### Defined in

[packages/create/src/runtime/schema-core.ts:173](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L173)

___

### path

• **path**: `string`

Absolute REST path including namespace and version.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[path](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#path)

#### Defined in

[packages/create/src/runtime/schema-core.ts:175](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L175)

___

### queryContract

• `Optional` **queryContract**: `string`

Contract key for query parameters, when the endpoint reads from the query string.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[queryContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#querycontract)

#### Defined in

[packages/create/src/runtime/schema-core.ts:177](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L177)

___

### responseContract

• **responseContract**: `string`

Contract key for the successful JSON response body.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[responseContract](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#responsecontract)

#### Defined in

[packages/create/src/runtime/schema-core.ts:179](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L179)

___

### summary

• `Optional` **summary**: `string`

Optional short endpoint summary shown in generated docs.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[summary](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#summary)

#### Defined in

[packages/create/src/runtime/schema-core.ts:181](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L181)

___

### tags

• **tags**: `string`[]

OpenAPI tag names applied to this endpoint.

#### Inherited from

[EndpointOpenApiEndpointDefinition](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md).[tags](packages_create_src_runtime_schema_core.EndpointOpenApiEndpointDefinition.md#tags)

#### Defined in

[packages/create/src/runtime/schema-core.ts:183](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/schema-core.ts#L183)
