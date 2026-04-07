[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncRestOpenApiManifestOptions

# Interface: SyncRestOpenApiManifestOptions

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncRestOpenApiManifestOptions

Manifest-first options for writing a canonical endpoint-aware REST OpenAPI document.

## Hierarchy

- `SyncRestOpenApiBaseOptions`

  ↳ **`SyncRestOpenApiManifestOptions`**

## Table of contents

### Properties

- [openApiFile](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#openapifile)
- [projectRoot](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#projectroot)
- [typesFile](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#typesfile)
- [manifest](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#manifest)
- [contracts](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#contracts)
- [endpoints](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#endpoints)
- [openApiInfo](packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md#openapiinfo)

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

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:235](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L235)

___

### contracts

• `Optional` **contracts**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:237](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L237)

___

### endpoints

• `Optional` **endpoints**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:239](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L239)

___

### openApiInfo

• `Optional` **openApiInfo**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:241](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L241)
