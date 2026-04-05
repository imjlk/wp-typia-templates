[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/metadata-model

# Module: packages/create/src/runtime/metadata-model

## Table of contents

### Interfaces

- [AttributeConstraints](../interfaces/packages_create_src_runtime_metadata_model.AttributeConstraints.md)
- [AttributeNode](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)
- [AttributeUnion](../interfaces/packages_create_src_runtime_metadata_model.AttributeUnion.md)
- [BlockJsonAttribute](../interfaces/packages_create_src_runtime_metadata_model.BlockJsonAttribute.md)
- [ManifestAttribute](../interfaces/packages_create_src_runtime_metadata_model.ManifestAttribute.md)
- [ManifestUnion](../interfaces/packages_create_src_runtime_metadata_model.ManifestUnion.md)
- [ManifestDocument](../interfaces/packages_create_src_runtime_metadata_model.ManifestDocument.md)

### Type Aliases

- [JsonPrimitive](packages_create_src_runtime_metadata_model.md#jsonprimitive)
- [JsonValue](packages_create_src_runtime_metadata_model.md#jsonvalue)
- [AttributeKind](packages_create_src_runtime_metadata_model.md#attributekind)
- [WordPressAttributeKind](packages_create_src_runtime_metadata_model.md#wordpressattributekind)
- [WordPressAttributeSource](packages_create_src_runtime_metadata_model.md#wordpressattributesource)

### Functions

- [defaultAttributeConstraints](packages_create_src_runtime_metadata_model.md#defaultattributeconstraints)
- [getWordPressKind](packages_create_src_runtime_metadata_model.md#getwordpresskind)
- [baseNode](packages_create_src_runtime_metadata_model.md#basenode)
- [withRequired](packages_create_src_runtime_metadata_model.md#withrequired)
- [cloneUnion](packages_create_src_runtime_metadata_model.md#cloneunion)
- [cloneProperties](packages_create_src_runtime_metadata_model.md#cloneproperties)

## Type Aliases

### JsonPrimitive

Ƭ **JsonPrimitive**: `string` \| `number` \| `boolean` \| ``null``

#### Defined in

[packages/create/src/runtime/metadata-model.ts:1](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L1)

___

### JsonValue

Ƭ **JsonValue**: [`JsonPrimitive`](packages_create_src_runtime_metadata_model.md#jsonprimitive) \| [`JsonValue`](packages_create_src_runtime_metadata_model.md#jsonvalue)[] \| \{ `[key: string]`: [`JsonValue`](packages_create_src_runtime_metadata_model.md#jsonvalue);  }

#### Defined in

[packages/create/src/runtime/metadata-model.ts:2](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L2)

___

### AttributeKind

Ƭ **AttributeKind**: ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"array"`` \| ``"object"`` \| ``"union"``

#### Defined in

[packages/create/src/runtime/metadata-model.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L4)

___

### WordPressAttributeKind

Ƭ **WordPressAttributeKind**: ``"string"`` \| ``"number"`` \| ``"boolean"`` \| ``"array"`` \| ``"object"``

#### Defined in

[packages/create/src/runtime/metadata-model.ts:12](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L12)

___

### WordPressAttributeSource

Ƭ **WordPressAttributeSource**: ``"html"`` \| ``"text"`` \| ``"rich-text"``

#### Defined in

[packages/create/src/runtime/metadata-model.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L19)

## Functions

### defaultAttributeConstraints

▸ **defaultAttributeConstraints**(): [`AttributeConstraints`](../interfaces/packages_create_src_runtime_metadata_model.AttributeConstraints.md)

#### Returns

[`AttributeConstraints`](../interfaces/packages_create_src_runtime_metadata_model.AttributeConstraints.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:99](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L99)

___

### getWordPressKind

▸ **getWordPressKind**(`node`): [`WordPressAttributeKind`](packages_create_src_runtime_metadata_model.md#wordpressattributekind)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) |

#### Returns

[`WordPressAttributeKind`](packages_create_src_runtime_metadata_model.md#wordpressattributekind)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:116](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L116)

___

### baseNode

▸ **baseNode**(`kind`, `pathLabel`): [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `kind` | [`AttributeKind`](packages_create_src_runtime_metadata_model.md#attributekind) |
| `pathLabel` | `string` |

#### Returns

[`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:120](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L120)

___

### withRequired

▸ **withRequired**(`node`, `required`): [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md) |
| `required` | `boolean` |

#### Returns

[`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:135](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L135)

___

### cloneUnion

▸ **cloneUnion**(`union`): [`AttributeUnion`](../interfaces/packages_create_src_runtime_metadata_model.AttributeUnion.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `union` | [`AttributeUnion`](../interfaces/packages_create_src_runtime_metadata_model.AttributeUnion.md) |

#### Returns

[`AttributeUnion`](../interfaces/packages_create_src_runtime_metadata_model.AttributeUnion.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:150](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L150)

___

### cloneProperties

▸ **cloneProperties**(`properties`): `Record`\<`string`, [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `properties` | `Record`\<`string`, [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)\> |

#### Returns

`Record`\<`string`, [`AttributeNode`](../interfaces/packages_create_src_runtime_metadata_model.AttributeNode.md)\>

#### Defined in

[packages/create/src/runtime/metadata-model.ts:162](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L162)
