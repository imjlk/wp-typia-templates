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

[packages/create/src/runtime/metadata-core.ts:303](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L303)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:305](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L305)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:307](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L307)

___

### contracts

• **contracts**: `Readonly`\<`Record`\<`string`, [`RestOpenApiContractDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md)\>\>

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:329](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L329)

___

### endpoints

• **endpoints**: readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)[]

Endpoint registry describing the REST paths, methods, and auth policies to document.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:331](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L331)

___

### openApiInfo

• `Optional` **openApiInfo**: [`OpenApiInfo`](packages_create_src_runtime_schema_core.OpenApiInfo.md)

Optional OpenAPI document metadata.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:333](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L333)

___

### manifest

• `Optional` **manifest**: `undefined`

Not accepted when `contracts` and `endpoints` are provided directly.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:335](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L335)
