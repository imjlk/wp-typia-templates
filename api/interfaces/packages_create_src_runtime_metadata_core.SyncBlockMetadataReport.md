[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md) / SyncBlockMetadataReport

# Interface: SyncBlockMetadataReport

[packages/create/src/runtime/metadata-core](../modules/packages_create_src_runtime_metadata_core.md).SyncBlockMetadataReport

Structured result returned by `runSyncBlockMetadata()`.

## Table of contents

### Properties

- [attributeNames](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#attributenames)
- [blockJsonPath](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#blockjsonpath)
- [jsonSchemaPath](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#jsonschemapath)
- [lossyProjectionWarnings](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#lossyprojectionwarnings)
- [manifestPath](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#manifestpath)
- [openApiPath](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#openapipath)
- [phpGenerationWarnings](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#phpgenerationwarnings)
- [phpValidatorPath](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#phpvalidatorpath)
- [failure](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#failure)
- [failOnLossy](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#failonlossy)
- [failOnPhpWarnings](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#failonphpwarnings)
- [status](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#status)
- [strict](packages_create_src_runtime_metadata_core.SyncBlockMetadataReport.md#strict)

## Properties

### attributeNames

• **attributeNames**: `string`[]

Attribute keys discovered from the source type. Empty when analysis fails early.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:181](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L181)

___

### blockJsonPath

• **blockJsonPath**: ``null`` \| `string`

Absolute path to the generated or target `block.json`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:183](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L183)

___

### jsonSchemaPath

• **jsonSchemaPath**: ``null`` \| `string`

Absolute path to the generated JSON Schema file when schema output is enabled.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:185](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L185)

___

### lossyProjectionWarnings

• **lossyProjectionWarnings**: `string`[]

Warn-only notices for Typia constraints that cannot round-trip into `block.json`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:187](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L187)

___

### manifestPath

• **manifestPath**: ``null`` \| `string`

Absolute path to the generated or target manifest file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:189](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L189)

___

### openApiPath

• **openApiPath**: ``null`` \| `string`

Absolute path to the generated aggregate OpenAPI file when enabled.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:191](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L191)

___

### phpGenerationWarnings

• **phpGenerationWarnings**: `string`[]

Warn-only notices for Typia constraints not yet enforced by PHP validation.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:193](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L193)

___

### phpValidatorPath

• **phpValidatorPath**: ``null`` \| `string`

Absolute path to the generated or target PHP validator file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:195](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L195)

___

### failure

• **failure**: ``null`` \| [`SyncBlockMetadataFailure`](packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md)

Structured failure payload when analysis or generation throws.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:197](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L197)

___

### failOnLossy

• **failOnLossy**: `boolean`

Effective lossy-warning failure flag after `strict` has been applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:199](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L199)

___

### failOnPhpWarnings

• **failOnPhpWarnings**: `boolean`

Effective PHP-warning failure flag after `strict` has been applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:201](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L201)

___

### status

• **status**: [`SyncBlockMetadataStatus`](../modules/packages_create_src_runtime_metadata_core.md#syncblockmetadatastatus)

Final execution status after warnings and failure handling are applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:203](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L203)

___

### strict

• **strict**: `boolean`

Whether the report was computed in strict mode.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:205](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L205)
