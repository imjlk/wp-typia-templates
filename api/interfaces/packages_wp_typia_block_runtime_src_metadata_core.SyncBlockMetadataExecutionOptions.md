[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncBlockMetadataExecutionOptions

# Interface: SyncBlockMetadataExecutionOptions

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncBlockMetadataExecutionOptions

Optional execution flags that control how warnings affect the final report status.

## Hierarchy

- [`ArtifactSyncExecutionOptions`](packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md)

  ↳ **`SyncBlockMetadataExecutionOptions`**

## Table of contents

### Properties

- [check](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#check)
- [failOnLossy](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#failonlossy)
- [failOnPhpWarnings](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#failonphpwarnings)
- [strict](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#strict)

## Properties

### check

• `Optional` **check**: `boolean`

Verify that generated artifacts are already current without rewriting them.

#### Inherited from

[ArtifactSyncExecutionOptions](packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md).[check](packages_wp_typia_block_runtime_src_metadata_core.ArtifactSyncExecutionOptions.md#check)

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L51)

___

### failOnLossy

• `Optional` **failOnLossy**: `boolean`

Promote lossy WordPress projection warnings to `error` status.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L100)

___

### failOnPhpWarnings

• `Optional` **failOnPhpWarnings**: `boolean`

Promote PHP validator coverage warnings to `error` status.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:102](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L102)

___

### strict

• `Optional` **strict**: `boolean`

Promote all warnings to `error` status.

When `true`, this behaves like setting both `failOnLossy` and
`failOnPhpWarnings` to `true`.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:109](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L109)
