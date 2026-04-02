[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncRestOpenApiManifestOptions

# Interface: SyncRestOpenApiManifestOptions

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncRestOpenApiManifestOptions

Manifest-first options for writing a canonical endpoint-aware REST OpenAPI document.

## Hierarchy

- `SyncRestOpenApiBaseOptions`

  ↳ **`SyncRestOpenApiManifestOptions`**

## Table of contents

### Properties

- [openApiFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#openapifile)
- [projectRoot](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#projectroot)
- [typesFile](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#typesfile)
- [manifest](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#manifest)
- [contracts](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#contracts)
- [endpoints](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#endpoints)
- [openApiInfo](packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md#openapiinfo)

## Properties

### openApiFile

• **openApiFile**: `string`

Output path for the aggregate OpenAPI document.

#### Inherited from

SyncRestOpenApiBaseOptions.openApiFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:185](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L185)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:187](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L187)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:189](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L189)

___

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointManifestEndpointDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:197](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L197)

___

### contracts

• `Optional` **contracts**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:199](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L199)

___

### endpoints

• `Optional` **endpoints**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:201](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L201)

___

### openApiInfo

• `Optional` **openApiInfo**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:203](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L203)
