[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/metadata-model](../modules/packages_create_src_runtime_metadata_model.md) / AttributeNode

# Interface: AttributeNode

[packages/create/src/runtime/metadata-model](../modules/packages_create_src_runtime_metadata_model.md).AttributeNode

## Table of contents

### Properties

- [constraints](packages_create_src_runtime_metadata_model.AttributeNode.md#constraints)
- [defaultValue](packages_create_src_runtime_metadata_model.AttributeNode.md#defaultvalue)
- [enumValues](packages_create_src_runtime_metadata_model.AttributeNode.md#enumvalues)
- [items](packages_create_src_runtime_metadata_model.AttributeNode.md#items)
- [kind](packages_create_src_runtime_metadata_model.AttributeNode.md#kind)
- [path](packages_create_src_runtime_metadata_model.AttributeNode.md#path)
- [properties](packages_create_src_runtime_metadata_model.AttributeNode.md#properties)
- [required](packages_create_src_runtime_metadata_model.AttributeNode.md#required)
- [union](packages_create_src_runtime_metadata_model.AttributeNode.md#union)
- [wp](packages_create_src_runtime_metadata_model.AttributeNode.md#wp)

## Properties

### constraints

• **constraints**: [`AttributeConstraints`](packages_create_src_runtime_metadata_model.AttributeConstraints.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L37)

___

### defaultValue

• `Optional` **defaultValue**: [`JsonValue`](../modules/packages_create_src_runtime_metadata_model.md#jsonvalue)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L38)

___

### enumValues

• **enumValues**: ``null`` \| (`string` \| `number` \| `boolean`)[]

#### Defined in

[packages/create/src/runtime/metadata-model.ts:39](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L39)

___

### items

• `Optional` **items**: [`AttributeNode`](packages_create_src_runtime_metadata_model.AttributeNode.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:40](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L40)

___

### kind

• **kind**: [`AttributeKind`](../modules/packages_create_src_runtime_metadata_model.md#attributekind)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:41](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L41)

___

### path

• **path**: `string`

#### Defined in

[packages/create/src/runtime/metadata-model.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L42)

___

### properties

• `Optional` **properties**: `Record`\<`string`, [`AttributeNode`](packages_create_src_runtime_metadata_model.AttributeNode.md)\>

#### Defined in

[packages/create/src/runtime/metadata-model.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L43)

___

### required

• **required**: `boolean`

#### Defined in

[packages/create/src/runtime/metadata-model.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L44)

___

### union

• `Optional` **union**: ``null`` \| [`AttributeUnion`](packages_create_src_runtime_metadata_model.AttributeUnion.md)

#### Defined in

[packages/create/src/runtime/metadata-model.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L45)

___

### wp

• **wp**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `selector` | ``null`` \| `string` |
| `source` | ``null`` \| [`WordPressAttributeSource`](../modules/packages_create_src_runtime_metadata_model.md#wordpressattributesource) |

#### Defined in

[packages/create/src/runtime/metadata-model.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-model.ts#L46)
