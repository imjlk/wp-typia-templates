[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md) / OpenApiOperation

# Interface: OpenApiOperation

[packages/wp-typia-block-runtime/src/schema-core](../modules/packages_wp_typia_block_runtime_src_schema_core.md).OpenApiOperation

One generated OpenAPI operation for a scaffolded REST endpoint.

## Hierarchy

- [`JsonSchemaObject`](packages_wp_typia_block_runtime_src_schema_core.JsonSchemaObject.md)

  ↳ **`OpenApiOperation`**

## Table of contents

### Properties

- [operationId](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#operationid)
- [parameters](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#parameters)
- [requestBody](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#requestbody)
- [responses](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#responses)
- [security](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#security)
- [summary](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#summary)
- [tags](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#tags)
- [x-typia-authIntent](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#x-typia-authintent)
- [x-wp-typia-authPolicy](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#x-wp-typia-authpolicy)
- [x-wp-typia-publicTokenField](packages_wp_typia_block_runtime_src_schema_core.OpenApiOperation.md#x-wp-typia-publictokenfield)

## Properties

### operationId

• **operationId**: `string`

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:92](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L92)

___

### parameters

• `Optional` **parameters**: [`OpenApiParameter`](packages_wp_typia_block_runtime_src_schema_core.OpenApiParameter.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:93](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L93)

___

### requestBody

• `Optional` **requestBody**: [`OpenApiRequestBody`](packages_wp_typia_block_runtime_src_schema_core.OpenApiRequestBody.md)

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:94](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L94)

___

### responses

• **responses**: `Record`\<`string`, [`OpenApiResponse`](packages_wp_typia_block_runtime_src_schema_core.OpenApiResponse.md)\>

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L95)

___

### security

• `Optional` **security**: `Record`\<`string`, `string`[]\>[]

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:96](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L96)

___

### summary

• `Optional` **summary**: `string`

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L97)

___

### tags

• **tags**: `string`[]

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:98](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L98)

___

### x-typia-authIntent

• **x-typia-authIntent**: [`EndpointAuthIntent`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#endpointauthintent)

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:99](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L99)

___

### x-wp-typia-authPolicy

• `Optional` **x-wp-typia-authPolicy**: [`EndpointOpenApiAuthMode`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiauthmode)

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L100)

___

### x-wp-typia-publicTokenField

• `Optional` **x-wp-typia-publicTokenField**: `string`

#### Defined in

[packages/wp-typia-block-runtime/src/schema-core.ts:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/schema-core.ts#L101)
