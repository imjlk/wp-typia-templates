[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncBlockMetadataFailure

# Interface: SyncBlockMetadataFailure

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncBlockMetadataFailure

Structured failure payload returned when `runSyncBlockMetadata()` does not complete.

## Table of contents

### Properties

- [code](packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md#code)
- [message](packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md#message)
- [name](packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md#name)

## Properties

### code

• **code**: [`SyncBlockMetadataFailureCode`](../modules/packages_create_src_runtime_metadata_core.md#syncblockmetadatafailurecode)

Stable failure bucket suitable for branching in scripts or CI.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:166](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L166)

___

### message

• **message**: `string`

Human-readable error message captured from the original failure.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:168](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L168)

___

### name

• **name**: `string`

Original thrown error name when available.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:170](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L170)
