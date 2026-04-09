[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncBlockMetadataFailure

# Interface: SyncBlockMetadataFailure

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncBlockMetadataFailure

Structured failure payload returned when `runSyncBlockMetadata()` does not complete.

## Table of contents

### Properties

- [code](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md#code)
- [message](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md#message)
- [name](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md#name)

## Properties

### code

• **code**: [`SyncBlockMetadataFailureCode`](../modules/packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatafailurecode)

Stable failure bucket suitable for branching in scripts or CI.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L87)

___

### message

• **message**: `string`

Human-readable error message captured from the original failure.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L89)

___

### name

• **name**: `string`

Original thrown error name when available.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L91)
