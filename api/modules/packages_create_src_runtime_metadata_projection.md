[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/metadata-projection

# Module: packages/create/src/runtime/metadata-projection

## Table of contents

### Functions

- [createBlockJsonAttribute](packages_create_src_runtime_metadata_projection.md#createblockjsonattribute)
- [createManifestAttribute](packages_create_src_runtime_metadata_projection.md#createmanifestattribute)
- [createManifestDocument](packages_create_src_runtime_metadata_projection.md#createmanifestdocument)
- [validateWordPressExtractionAttributes](packages_create_src_runtime_metadata_projection.md#validatewordpressextractionattributes)
- [validateWordPressExtractionAttribute](packages_create_src_runtime_metadata_projection.md#validatewordpressextractionattribute)
- [createExampleValue](packages_create_src_runtime_metadata_projection.md#createexamplevalue)

## Functions

### createBlockJsonAttribute

▸ **createBlockJsonAttribute**(`node`, `warnings`): [`BlockJsonAttribute`](../interfaces/packages_create_src_runtime_metadata_model.BlockJsonAttribute.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) |
| `warnings` | `string`[] |

#### Returns

[`BlockJsonAttribute`](../interfaces/packages_create_src_runtime_metadata_model.BlockJsonAttribute.md)

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L11)

___

### createManifestAttribute

▸ **createManifestAttribute**(`node`): [`ManifestAttribute`](../interfaces/packages_create_src_runtime_metadata_model.ManifestAttribute.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) |

#### Returns

[`ManifestAttribute`](../interfaces/packages_create_src_runtime_metadata_model.ManifestAttribute.md)

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L59)

___

### createManifestDocument

▸ **createManifestDocument**(`sourceTypeName`, `attributes`): [`ManifestDocument`](../interfaces/packages_create_src_runtime_metadata_model.ManifestDocument.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `sourceTypeName` | `string` |
| `attributes` | `Record`\<`string`, [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)\> |

#### Returns

[`ManifestDocument`](../interfaces/packages_create_src_runtime_metadata_model.ManifestDocument.md)

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:103](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L103)

___

### validateWordPressExtractionAttributes

▸ **validateWordPressExtractionAttributes**(`attributes`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `Record`\<`string`, [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)\> |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:119](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L119)

___

### validateWordPressExtractionAttribute

▸ **validateWordPressExtractionAttribute**(`node`, `isTopLevel?`): `void`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) | `undefined` |
| `isTopLevel` | `boolean` | `false` |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:127](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L127)

___

### createExampleValue

▸ **createExampleValue**(`node`, `key`): [`JsonValue`](packages_create_src_runtime_metadata_model.md#jsonvalue)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) |
| `key` | `string` |

#### Returns

[`JsonValue`](packages_create_src_runtime_metadata_model.md#jsonvalue)

#### Defined in

[packages/create/src/runtime/metadata-projection.ts:167](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-projection.ts#L167)
