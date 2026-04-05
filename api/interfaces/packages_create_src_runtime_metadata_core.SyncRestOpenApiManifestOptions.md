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

[packages/create/src/runtime/metadata-core.ts:213](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L213)

___

### projectRoot

• `Optional` **projectRoot**: `string`

Optional project root used to resolve file paths.

#### Inherited from

SyncRestOpenApiBaseOptions.projectRoot

#### Defined in

[packages/create/src/runtime/metadata-core.ts:215](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L215)

___

### typesFile

• **typesFile**: `string`

Source file that exports the REST contract types.

#### Inherited from

SyncRestOpenApiBaseOptions.typesFile

#### Defined in

[packages/create/src/runtime/metadata-core.ts:217](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L217)

___

### manifest

• **manifest**: [`EndpointManifestDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\>, readonly [`EndpointOpenApiEndpointDefinition`](../modules/packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)[]\>

Canonical endpoint manifest describing the REST surface.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:225](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L225)

___

### contracts

• `Optional` **contracts**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:227](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L227)

___

### endpoints

• `Optional` **endpoints**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:229](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L229)

___

### openApiInfo

• `Optional` **openApiInfo**: `undefined`

Not accepted when `manifest` is provided.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:231](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L231)
