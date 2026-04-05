[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncBlockMetadataExecutionOptions

# Interface: SyncBlockMetadataExecutionOptions

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncBlockMetadataExecutionOptions

Optional execution flags that control how warnings affect the final report status.

## Table of contents

### Properties

- [failOnLossy](packages_create_src_runtime_metadata_core.SyncBlockMetadataExecutionOptions.md#failonlossy)
- [failOnPhpWarnings](packages_create_src_runtime_metadata_core.SyncBlockMetadataExecutionOptions.md#failonphpwarnings)
- [strict](packages_create_src_runtime_metadata_core.SyncBlockMetadataExecutionOptions.md#strict)

## Properties

### failOnLossy

• `Optional` **failOnLossy**: `boolean`

Promote lossy WordPress projection warnings to `error` status.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:179](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L179)

___

### failOnPhpWarnings

• `Optional` **failOnPhpWarnings**: `boolean`

Promote PHP validator coverage warnings to `error` status.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:181](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L181)

___

### strict

• `Optional` **strict**: `boolean`

Promote all warnings to `error` status.

When `true`, this behaves like setting both `failOnLossy` and
`failOnPhpWarnings` to `true`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:188](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L188)
