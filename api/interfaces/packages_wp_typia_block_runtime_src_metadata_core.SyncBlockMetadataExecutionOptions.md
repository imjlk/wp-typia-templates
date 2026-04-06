[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncBlockMetadataExecutionOptions

# Interface: SyncBlockMetadataExecutionOptions

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncBlockMetadataExecutionOptions

Optional execution flags that control how warnings affect the final report status.

## Table of contents

### Properties

- [failOnLossy](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#failonlossy)
- [failOnPhpWarnings](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#failonphpwarnings)
- [strict](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataExecutionOptions.md#strict)

## Properties

### failOnLossy

• `Optional` **failOnLossy**: `boolean`

Promote lossy WordPress projection warnings to `error` status.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:89](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L89)

___

### failOnPhpWarnings

• `Optional` **failOnPhpWarnings**: `boolean`

Promote PHP validator coverage warnings to `error` status.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L91)

___

### strict

• `Optional` **strict**: `boolean`

Promote all warnings to `error` status.

When `true`, this behaves like setting both `failOnLossy` and
`failOnPhpWarnings` to `true`.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:98](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L98)
