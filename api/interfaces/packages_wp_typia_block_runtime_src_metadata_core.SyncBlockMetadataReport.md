[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md) / SyncBlockMetadataReport

# Interface: SyncBlockMetadataReport

[packages/wp-typia-block-runtime/src/metadata-core](../modules/packages_wp_typia_block_runtime_src_metadata_core.md).SyncBlockMetadataReport

Structured result returned by `runSyncBlockMetadata()`.

## Table of contents

### Properties

- [attributeNames](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#attributenames)
- [blockJsonPath](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#blockjsonpath)
- [jsonSchemaPath](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#jsonschemapath)
- [lossyProjectionWarnings](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#lossyprojectionwarnings)
- [manifestPath](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#manifestpath)
- [openApiPath](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#openapipath)
- [phpGenerationWarnings](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#phpgenerationwarnings)
- [phpValidatorPath](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#phpvalidatorpath)
- [failure](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#failure)
- [failOnLossy](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#failonlossy)
- [failOnPhpWarnings](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#failonphpwarnings)
- [status](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#status)
- [strict](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataReport.md#strict)

## Properties

### attributeNames

• **attributeNames**: `string`[]

Attribute keys discovered from the source type. Empty when analysis fails early.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:116](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L116)

___

### blockJsonPath

• **blockJsonPath**: ``null`` \| `string`

Absolute path to the generated or target `block.json`.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:118](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L118)

___

### jsonSchemaPath

• **jsonSchemaPath**: ``null`` \| `string`

Absolute path to the generated JSON Schema file when schema output is enabled.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:120](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L120)

___

### lossyProjectionWarnings

• **lossyProjectionWarnings**: `string`[]

Warn-only notices for Typia constraints that cannot round-trip into `block.json`.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:122](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L122)

___

### manifestPath

• **manifestPath**: ``null`` \| `string`

Absolute path to the generated or target manifest file.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:124](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L124)

___

### openApiPath

• **openApiPath**: ``null`` \| `string`

Absolute path to the generated aggregate OpenAPI file when enabled.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:126](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L126)

___

### phpGenerationWarnings

• **phpGenerationWarnings**: `string`[]

Warn-only notices for Typia constraints not yet enforced by PHP validation.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:128](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L128)

___

### phpValidatorPath

• **phpValidatorPath**: ``null`` \| `string`

Absolute path to the generated or target PHP validator file.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:130](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L130)

___

### failure

• **failure**: ``null`` \| [`SyncBlockMetadataFailure`](packages_wp_typia_block_runtime_src_metadata_core.SyncBlockMetadataFailure.md)

Structured failure payload when analysis or generation throws.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:132](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L132)

___

### failOnLossy

• **failOnLossy**: `boolean`

Effective lossy-warning failure flag after `strict` has been applied.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:134](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L134)

___

### failOnPhpWarnings

• **failOnPhpWarnings**: `boolean`

Effective PHP-warning failure flag after `strict` has been applied.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:136](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L136)

___

### status

• **status**: [`SyncBlockMetadataStatus`](../modules/packages_wp_typia_block_runtime_src_metadata_core.md#syncblockmetadatastatus)

Final execution status after warnings and failure handling are applied.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:138](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L138)

___

### strict

• **strict**: `boolean`

Whether the report was computed in strict mode.

#### Defined in

[packages/wp-typia-block-runtime/src/metadata-core.ts:140](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/metadata-core.ts#L140)
