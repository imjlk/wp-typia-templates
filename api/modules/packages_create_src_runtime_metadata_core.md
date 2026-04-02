[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/metadata-core

# Module: packages/create/src/runtime/metadata-core

## Table of contents

### Interfaces

- [SyncBlockMetadataOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataOptions.md)
- [SyncBlockMetadataResult](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)
- [SyncTypeSchemaOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaOptions.md)
- [SyncTypeSchemaResult](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaResult.md)
- [EndpointManifestContractDefinition](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)
- [EndpointManifestEndpointDefinition](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)
- [EndpointManifestDefinition](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)
- [RestOpenApiContractDefinition](../interfaces/packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md)
- [RestOpenApiEndpointDefinition](../interfaces/packages_create_src_runtime_metadata_core.RestOpenApiEndpointDefinition.md)
- [SyncRestOpenApiOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md)
- [SyncRestOpenApiResult](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)

### Functions

- [defineEndpointManifest](packages_create_src_runtime_metadata_core.md#defineendpointmanifest)
- [syncBlockMetadata](packages_create_src_runtime_metadata_core.md#syncblockmetadata)
- [syncTypeSchemas](packages_create_src_runtime_metadata_core.md#synctypeschemas)
- [syncRestOpenApi](packages_create_src_runtime_metadata_core.md#syncrestopenapi)

## Functions

### defineEndpointManifest

▸ **defineEndpointManifest**\<`Contracts`, `Endpoints`\>(`manifest`): [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

Preserve literal TypeScript inference for backend-neutral endpoint manifests.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Contracts` | extends `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\> |
| `Endpoints` | extends readonly [`EndpointManifestEndpointDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestEndpointDefinition.md)[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\> | Canonical REST surface metadata authored in TypeScript. |

#### Returns

[`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

The same manifest object with literal contract and endpoint metadata preserved.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L163)

___

### syncBlockMetadata

▸ **syncBlockMetadata**(`options`): `Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`SyncBlockMetadataOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataOptions.md) |

#### Returns

`Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)\>

#### Defined in

[packages/create/src/runtime/metadata-core.ts:250](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L250)

___

### syncTypeSchemas

▸ **syncTypeSchemas**(`options`): `Promise`\<[`SyncTypeSchemaResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`SyncTypeSchemaOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaOptions.md) |

#### Returns

`Promise`\<[`SyncTypeSchemaResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaResult.md)\>

#### Defined in

[packages/create/src/runtime/metadata-core.ts:340](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L340)

___

### syncRestOpenApi

▸ **syncRestOpenApi**(`options`): `Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)\>

Generate and write a canonical OpenAPI document for scaffolded REST contracts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncRestOpenApiOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiOptions.md) | Contracts, endpoint metadata, source file, and output file settings. |

#### Returns

`Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)\>

Information about the generated OpenAPI document and included schema components.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:393](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L393)
