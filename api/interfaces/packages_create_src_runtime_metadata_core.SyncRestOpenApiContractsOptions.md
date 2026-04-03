[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncRestOpenApiContractsOptions

# Interface: SyncRestOpenApiContractsOptions

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncRestOpenApiContractsOptions

Backward-compatible options for writing a canonical endpoint-aware REST OpenAPI document.

## Hierarchy

- `SyncRestOpenApiBaseOptions`

  ↳ **`SyncRestOpenApiContractsOptions`**

## Table of contents

### Properties

- [openApiFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#openapifile)
- [projectRoot](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#projectroot)
- [typesFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#typesfile)
- [contracts](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#contracts)
- [endpoints](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#endpoints)
- [openApiInfo](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#openapiinfo)
- [manifest](packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md#manifest)

## Properties

### openApiFile

• **openApiFile**: `string`

Output path for the aggregate OpenAPI document.

#### Inherited from

SyncRestOpenApiBaseOptions.openApiFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:288](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L288)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:290](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L290)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:292](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L292)

___

### contracts

• **contracts**: `Readonly`\<`Record`\<`string`, [`RestOpenApiContractDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md)\>\>

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:314](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L314)

___

### endpoints

• **endpoints**: readonly [`RestOpenApiEndpointDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md)[]

Endpoint registry describing the REST paths, methods, and auth policies to document.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:316](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L316)

___

### openApiInfo

• `Optional` **openApiInfo**: [`OpenApiInfo`](packages_create_src_runtime_schema_core.OpenApiInfo.md)

Optional OpenAPI document metadata.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:318](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L318)

___

### manifest

• `Optional` **manifest**: `undefined`

Not accepted when `contracts` and `endpoints` are provided directly.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:320](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L320)
