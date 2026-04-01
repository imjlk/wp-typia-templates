[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncRestOpenApiOptions

# Interface: SyncRestOpenApiOptions

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncRestOpenApiOptions

Options for writing a canonical endpoint-aware REST OpenAPI document.

## Table of contents

### Properties

- [contracts](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#contracts)
- [endpoints](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#endpoints)
- [openApiFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#openapifile)
- [openApiInfo](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#openapiinfo)
- [projectRoot](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#projectroot)
- [typesFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md#typesfile)

## Properties

### contracts

• **contracts**: `Record`\<`string`, [`RestOpenApiContractDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md)\>

Contract registry keyed by logical route contract ids.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:145](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L145)

___

### endpoints

• **endpoints**: [`RestOpenApiEndpointDefinition`](packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md)[]

Endpoint registry describing the REST paths, methods, and auth policies to document.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:147](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L147)

___

### openApiFile

• **openApiFile**: `string`

Output path for the aggregate OpenAPI document.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:149](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L149)

___

### openApiInfo

• `Optional` **openApiInfo**: [`OpenApiInfo`](packages_create_src_runtime_schema_core.OpenApiInfo.md)

Optional OpenAPI document metadata.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:151](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L151)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:153](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L153)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:155](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L155)
