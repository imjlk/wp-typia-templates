[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/metadata-core

# Module: packages/create/src/runtime/metadata-core

## Table of contents

### Interfaces

- [SyncBlockMetadataOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataOptions.md)
- [SyncBlockMetadataResult](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)
- [SyncBlockMetadataFailure](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md)
- [SyncBlockMetadataExecutionOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataExecutionOptions.md)
- [SyncBlockMetadataReport](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md)
- [SyncTypeSchemaOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaOptions.md)
- [SyncTypeSchemaResult](../interfaces/packages_create_src_runtime_metadata_core.SyncTypeSchemaResult.md)
- [EndpointManifestContractDefinition](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)
- [EndpointManifestDefinition](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)
- [RestOpenApiContractDefinition](../interfaces/packages_create_src_runtime_metadata_core.RestOpenApiContractDefinition.md)
- [SyncRestOpenApiManifestOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md)
- [SyncRestOpenApiContractsOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md)
- [SyncRestOpenApiResult](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)
- [SyncEndpointClientOptions](../interfaces/packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md)
- [SyncEndpointClientResult](../interfaces/packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md)

### Type Aliases

- [SyncBlockMetadataStatus](packages_create_src_runtime_metadata_core.md#syncblockmetadatastatus)
- [SyncBlockMetadataFailureCode](packages_create_src_runtime_metadata_core.md#syncblockmetadatafailurecode)
- [EndpointManifestEndpointDefinition](packages_create_src_runtime_metadata_core.md#endpointmanifestendpointdefinition)
- [RestOpenApiEndpointDefinition](packages_create_src_runtime_metadata_core.md#restopenapiendpointdefinition)
- [SyncRestOpenApiOptions](packages_create_src_runtime_metadata_core.md#syncrestopenapioptions)

### Functions

- [defineEndpointManifest](packages_create_src_runtime_metadata_core.md#defineendpointmanifest)
- [syncBlockMetadata](packages_create_src_runtime_metadata_core.md#syncblockmetadata)
- [runSyncBlockMetadata](packages_create_src_runtime_metadata_core.md#runsyncblockmetadata)
- [syncTypeSchemas](packages_create_src_runtime_metadata_core.md#synctypeschemas)
- [syncRestOpenApi](packages_create_src_runtime_metadata_core.md#syncrestopenapi)
- [syncEndpointClient](packages_create_src_runtime_metadata_core.md#syncendpointclient)

## Type Aliases

### SyncBlockMetadataStatus

Ƭ **SyncBlockMetadataStatus**: ``"success"`` \| ``"warning"`` \| ``"error"``

High-level outcome for one `runSyncBlockMetadata()` execution.

- `success`: metadata sync completed without warnings.
- `warning`: metadata sync completed, but warn-only findings were recorded.
- `error`: metadata sync failed, or warnings were promoted to errors by flags.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:53](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L53)

___

### SyncBlockMetadataFailureCode

Ƭ **SyncBlockMetadataFailureCode**: ``"unsupported-type-node"`` \| ``"unsupported-type-pattern"`` \| ``"recursive-type"`` \| ``"invalid-source-type"`` \| ``"typescript-diagnostic"`` \| ``"unknown-internal-error"``

Stable failure bucket for structured `sync-types` error reporting.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:58](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L58)

___

### EndpointManifestEndpointDefinition

Ƭ **EndpointManifestEndpointDefinition**: [`EndpointOpenApiEndpointDefinition`](packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)

Portable route metadata stored in one endpoint manifest entry.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:161](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L161)

___

### RestOpenApiEndpointDefinition

Ƭ **RestOpenApiEndpointDefinition**: [`EndpointManifestEndpointDefinition`](packages_create_src_runtime_metadata_core.md#endpointmanifestendpointdefinition)

Backward-compatible route metadata consumed by `syncRestOpenApi()`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:206](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L206)

___

### SyncRestOpenApiOptions

Ƭ **SyncRestOpenApiOptions**: [`SyncRestOpenApiManifestOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiManifestOptions.md) \| [`SyncRestOpenApiContractsOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiContractsOptions.md)

Options for writing a canonical endpoint-aware REST OpenAPI document.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:251](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L251)

## Functions

### defineEndpointManifest

▸ **defineEndpointManifest**\<`Contracts`, `Endpoints`\>(`manifest`): [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

Preserve literal TypeScript inference for backend-neutral endpoint manifests.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Contracts` | extends `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestContractDefinition.md)\>\> |
| `Endpoints` | extends readonly [`EndpointOpenApiEndpointDefinition`](packages_create_src_runtime_schema_core.md#endpointopenapiendpointdefinition)[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\> | Canonical REST surface metadata authored in TypeScript. |

#### Returns

[`EndpointManifestDefinition`](../interfaces/packages_create_src_runtime_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

The same manifest object with literal contract and endpoint metadata preserved.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:187](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L187)

___

### syncBlockMetadata

▸ **syncBlockMetadata**(`options`): `Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)\>

Synchronizes block metadata artifacts from a source TypeScript contract.

This updates `block.json` attributes/examples and emits the related JSON
Schema, manifest, OpenAPI, and optional PHP validator artifacts derived from
the same source type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncBlockMetadataOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataOptions.md) | Configuration for locating the project root, source types file/type name, and output artifact paths. |

#### Returns

`Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataResult.md)\>

The generated artifact paths plus any lossy WordPress projection or
PHP validator coverage warnings discovered during synchronization.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:363](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L363)

___

### runSyncBlockMetadata

▸ **runSyncBlockMetadata**(`options`, `executionOptions?`): `Promise`\<[`SyncBlockMetadataReport`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md)\>

Execute `syncBlockMetadata()` and return a structured status report.

This wrapper preserves the existing artifact-generation behavior while adding
stable status, warning, and failure metadata for scripts and CI integrations.
Hard analysis failures are normalized into `failure`, and warning promotion is
controlled by `strict`, `failOnLossy`, and `failOnPhpWarnings`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncBlockMetadataOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataOptions.md) | Artifact generation inputs shared with `syncBlockMetadata()`. |
| `executionOptions` | [`SyncBlockMetadataExecutionOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataExecutionOptions.md) | Optional warning-promotion flags for CI/reporting flows. |

#### Returns

`Promise`\<[`SyncBlockMetadataReport`](../interfaces/packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md)\>

A structured execution report describing generated paths, warnings, and failures.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:455](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L455)

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

[packages/create/src/runtime/metadata-core.ts:506](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L506)

___

### syncRestOpenApi

▸ **syncRestOpenApi**(`options`): `Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)\>

Generate and write a canonical OpenAPI document for scaffolded REST contracts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncRestOpenApiOptions`](packages_create_src_runtime_metadata_core.md#syncrestopenapioptions) | Contracts, endpoint metadata, source file, and output file settings. |

#### Returns

`Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncRestOpenApiResult.md)\>

Information about the generated OpenAPI document and included schema components.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:559](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L559)

___

### syncEndpointClient

▸ **syncEndpointClient**(`options`): `Promise`\<[`SyncEndpointClientResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md)\>

Generate and write a manifest-first portable endpoint client module.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncEndpointClientOptions`](../interfaces/packages_create_src_runtime_metadata_core.SyncEndpointClientOptions.md) | Manifest, source file, validator file, and output path settings. |

#### Returns

`Promise`\<[`SyncEndpointClientResult`](../interfaces/packages_create_src_runtime_metadata_core.SyncEndpointClientResult.md)\>

Information about the generated client file and emitted operation ids.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:627](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L627)
