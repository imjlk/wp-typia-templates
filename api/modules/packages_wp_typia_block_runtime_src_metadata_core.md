[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/metadata-core

# Module: packages/wp-typia-block-runtime/src/metadata-core

## Table of contents

### Interfaces

- [SyncBlockMetadataOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataOptions.md)
- [SyncBlockMetadataResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataResult.md)
- [ArtifactSyncExecutionOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md)
- [SyncBlockMetadataFailure](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md)
- [SyncBlockMetadataExecutionOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md)
- [SyncBlockMetadataReport](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md)
- [SyncTypeSchemaOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaOptions.md)
- [SyncTypeSchemaResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaResult.md)
- [EndpointManifestContractDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)
- [EndpointManifestDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)
- [RestOpenApiContractDefinition](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.RestOpenApiContractDefinition.md)
- [SyncRestOpenApiManifestOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md)
- [SyncRestOpenApiContractsOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md)
- [SyncRestOpenApiResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiResult.md)
- [SyncEndpointClientOptions](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md)
- [SyncEndpointClientResult](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientResult.md)

### Type Aliases

- [SyncBlockMetadataStatus](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatastatus)
- [SyncBlockMetadataFailureCode](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatafailurecode)
- [EndpointManifestEndpointDefinition](packages_wp_typia_block_runtime_src_metadata_core.md#endpointmanifestendpointdefinition)
- [RestOpenApiEndpointDefinition](packages_wp_typia_block_runtime_src_metadata_core.md#restopenapiendpointdefinition)
- [SyncRestOpenApiOptions](packages_wp_typia_block_runtime_src_metadata_core.md#syncrestopenapioptions)

### Functions

- [defineEndpointManifest](packages_wp_typia_block_runtime_src_metadata_core.md#defineendpointmanifest)
- [syncBlockMetadata](packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadata)
- [runSyncBlockMetadata](packages_wp_typia_block_runtime_src_metadata_core.md#runsyncblockmetadata)
- [syncTypeSchemas](packages_wp_typia_block_runtime_src_metadata_core.md#synctypeschemas)
- [syncRestOpenApi](packages_wp_typia_block_runtime_src_metadata_core.md#syncrestopenapi)
- [syncEndpointClient](packages_wp_typia_block_runtime_src_metadata_core.md#syncendpointclient)

## Type Aliases

### SyncBlockMetadataStatus

Ƭ **SyncBlockMetadataStatus**: ``"success"`` \| ``"warning"`` \| ``"error"``

High-level outcome for one `runSyncBlockMetadata()` execution.

- `success`: metadata sync completed without warnings.
- `warning`: metadata sync completed, but warn-only findings were recorded.
- `error`: metadata sync failed, or warnings were promoted to errors by flags.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:61](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L61)

___

### SyncBlockMetadataFailureCode

Ƭ **SyncBlockMetadataFailureCode**: ``"stale-generated-artifact"`` \| ``"unsupported-type-node"`` \| ``"unsupported-type-pattern"`` \| ``"recursive-type"`` \| ``"invalid-source-type"`` \| ``"typescript-diagnostic"`` \| ``"unknown-internal-error"``

Stable failure bucket for structured `sync-types` error reporting.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:66](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L66)

___

### EndpointManifestEndpointDefinition

Ƭ **EndpointManifestEndpointDefinition**: [`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)

Portable route metadata stored in one endpoint manifest entry.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:172](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L172)

___

### RestOpenApiEndpointDefinition

Ƭ **RestOpenApiEndpointDefinition**: [`EndpointManifestEndpointDefinition`](packages_wp_typia_block_runtime_src_metadata_core.md#endpointmanifestendpointdefinition)

Backward-compatible route metadata consumed by `syncRestOpenApi()`.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:217](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L217)

___

### SyncRestOpenApiOptions

Ƭ **SyncRestOpenApiOptions**: [`SyncRestOpenApiManifestOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiManifestOptions.md) \| [`SyncRestOpenApiContractsOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiContractsOptions.md)

Options for writing a canonical endpoint-aware REST OpenAPI document.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:262](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L262)

## Functions

### defineEndpointManifest

▸ **defineEndpointManifest**\<`Contracts`, `Endpoints`\>(`manifest`): [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

Preserve literal TypeScript inference for backend-neutral endpoint manifests.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Contracts` | extends `Readonly`\<`Record`\<`string`, [`EndpointManifestContractDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestContractDefinition.md)\>\> |
| `Endpoints` | extends readonly [`EndpointOpenApiEndpointDefinition`](packages_wp_typia_block_runtime_src_schema_core.md#endpointopenapiendpointdefinition)[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `manifest` | [`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\> | Canonical REST surface metadata authored in TypeScript. |

#### Returns

[`EndpointManifestDefinition`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.EndpointManifestDefinition.md)\<`Contracts`, `Endpoints`\>

The same manifest object with literal contract and endpoint metadata preserved.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:198](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L198)

___

### syncBlockMetadata

▸ **syncBlockMetadata**(`options`, `executionOptions?`): `Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataResult.md)\>

Synchronizes block metadata artifacts from a source TypeScript contract.

This updates `block.json` attributes/examples and emits the related JSON
Schema, manifest, OpenAPI, and optional PHP validator artifacts derived from
the same source type.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncBlockMetadataOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataOptions.md) | Configuration for locating the project root, source types file/type name, and output artifact paths. |
| `executionOptions` | [`ArtifactSyncExecutionOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md) | - |

#### Returns

`Promise`\<[`SyncBlockMetadataResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataResult.md)\>

The generated artifact paths plus any lossy WordPress projection or
PHP validator coverage warnings discovered during synchronization.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:444](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L444)

___

### runSyncBlockMetadata

▸ **runSyncBlockMetadata**(`options`, `executionOptions?`): `Promise`\<[`SyncBlockMetadataReport`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md)\>

Execute `syncBlockMetadata()` and return a structured status report.

This wrapper preserves the existing artifact-generation behavior while adding
stable status, warning, and failure metadata for scripts and CI integrations.
Hard analysis failures are normalized into `failure`, and warning promotion is
controlled by `strict`, `failOnLossy`, and `failOnPhpWarnings`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncBlockMetadataOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataOptions.md) | Artifact generation inputs shared with `syncBlockMetadata()`. |
| `executionOptions` | [`SyncBlockMetadataExecutionOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md) | Optional warning-promotion flags for CI/reporting flows. |

#### Returns

`Promise`\<[`SyncBlockMetadataReport`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md)\>

A structured execution report describing generated paths, warnings, and failures.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:577](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L577)

___

### syncTypeSchemas

▸ **syncTypeSchemas**(`options`, `executionOptions?`): `Promise`\<[`SyncTypeSchemaResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaResult.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | [`SyncTypeSchemaOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaOptions.md) |
| `executionOptions` | [`ArtifactSyncExecutionOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md) |

#### Returns

`Promise`\<[`SyncTypeSchemaResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncTypeSchemaResult.md)\>

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:630](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L630)

___

### syncRestOpenApi

▸ **syncRestOpenApi**(`options`, `executionOptions?`): `Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiResult.md)\>

Generate and write a canonical OpenAPI document for scaffolded REST contracts.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncRestOpenApiOptions`](packages_wp_typia_block_runtime_src_metadata_core.md#syncrestopenapioptions) | Contracts, endpoint metadata, source file, and output file settings. |
| `executionOptions` | [`ArtifactSyncExecutionOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md) | - |

#### Returns

`Promise`\<[`SyncRestOpenApiResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncRestOpenApiResult.md)\>

Information about the generated OpenAPI document and included schema components.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:694](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L694)

___

### syncEndpointClient

▸ **syncEndpointClient**(`options`, `executionOptions?`): `Promise`\<[`SyncEndpointClientResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientResult.md)\>

Generate and write a manifest-first portable endpoint client module.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`SyncEndpointClientOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientOptions.md) | Manifest, source file, validator file, and output path settings. |
| `executionOptions` | [`ArtifactSyncExecutionOptions`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md) | - |

#### Returns

`Promise`\<[`SyncEndpointClientResult`](../interfaces/packages_wp_typia_block_runtime_src_metadata_core.SyncEndpointClientResult.md)\>

Information about the generated client file and emitted operation ids.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:767](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L767)
