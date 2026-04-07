[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncRestOpenApiContractsOptions

# Interface: SyncRestOpenApiContractsOptions

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncRestOpenApiContractsOptions

Backward-compatible options for writing a canonical endpoint-aware REST OpenAPI document.

## Hierarchy

- `SyncRestOpenApiBaseOptions`

  ↳ **`SyncRestOpenApiContractsOptions`**

## Table of contents

### Properties

- [openApiFile](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#openapifile)
- [projectRoot](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#projectroot)
- [typesFile](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#typesfile)
- [contracts](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#contracts)
- [endpoints](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#endpoints)
- [openApiInfo](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#openapiinfo)
- [manifest](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md#manifest)

## Properties

### openApiFile

• **openApiFile**: `string`

Output path for the aggregate OpenAPI document.

#### Inherited from

SyncRestOpenApiBaseOptions.openApiFile

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:223](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L223)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:225](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L225)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:227](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L227)

___

### contracts

• **contracts**: `Readonly`\<`Record`\<`string`, [`RestOpenApiContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.RestOpenApiContractDefinition.md)\>\>

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:249](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L249)

___

### endpoints

• **endpoints**: readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]

Endpoint registry describing the REST paths, methods, and auth policies to document.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:251](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L251)

___

### openApiInfo

• `Optional` **openApiInfo**: [`OpenApiInfo`](packages_wp_typia_block_runtime_src_schema_core.OpenApiInfo.md)

Optional OpenAPI document metadata.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:253](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L253)

___

### manifest

• `Optional` **manifest**: `undefined`

Not accepted when `contracts` and `endpoints` are provided directly.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:255](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L255)
