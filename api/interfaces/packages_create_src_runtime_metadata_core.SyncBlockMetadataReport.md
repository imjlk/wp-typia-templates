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

[packages/create/src/runtime/metadata-core.ts:194](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L194)

___

### blockJsonPath

• **blockJsonPath**: ``null`` \| `string`

Absolute path to the generated or target `block.json`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:196](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L196)

___

### jsonSchemaPath

• **jsonSchemaPath**: ``null`` \| `string`

Absolute path to the generated JSON Schema file when schema output is enabled.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:198](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L198)

___

### lossyProjectionWarnings

• **lossyProjectionWarnings**: `string`[]

Warn-only notices for Typia constraints that cannot round-trip into `block.json`.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:200](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L200)

___

### manifestPath

• **manifestPath**: ``null`` \| `string`

Absolute path to the generated or target manifest file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:202](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L202)

___

### openApiPath

• **openApiPath**: ``null`` \| `string`

Absolute path to the generated aggregate OpenAPI file when enabled.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:204](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L204)

___

### phpGenerationWarnings

• **phpGenerationWarnings**: `string`[]

Warn-only notices for Typia constraints not yet enforced by PHP validation.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:206](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L206)

___

### phpValidatorPath

• **phpValidatorPath**: ``null`` \| `string`

Absolute path to the generated or target PHP validator file.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:208](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L208)

___

### failure

• **failure**: ``null`` \| [`SyncBlockMetadataFailure`](packages_create_src_runtime_metadata_core.SyncBlockMetadataFailure.md)

Structured failure payload when analysis or generation throws.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:210](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L210)

___

### failOnLossy

• **failOnLossy**: `boolean`

Effective lossy-warning failure flag after `strict` has been applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:212](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L212)

___

### failOnPhpWarnings

• **failOnPhpWarnings**: `boolean`

Effective PHP-warning failure flag after `strict` has been applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:214](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L214)

___

### status

• **status**: [`SyncBlockMetadataStatus`](../modules/packages_create_src_runtime_metadata_core.md#syncblockmetadatastatus)

Final execution status after warnings and failure handling are applied.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:216](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L216)

___

### strict

• **strict**: `boolean`

Whether the report was computed in strict mode.

#### Defined in

[packages/create/src/runtime/metadata-core.ts:218](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-core.ts#L218)
