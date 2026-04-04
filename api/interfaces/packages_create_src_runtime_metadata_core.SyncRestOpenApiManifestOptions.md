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

[packages/create/src/runtime/metadata-core.ts:300](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L300)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:302](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L302)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:304](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L304)

___

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointManifestEndpointDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:312](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L312)

___

### contracts

• `Optional` **contracts**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:314](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L314)

___

### endpoints

• `Optional` **endpoints**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:316](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L316)

___

### openApiInfo

• `Optional` **openApiInfo**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:318](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L318)
