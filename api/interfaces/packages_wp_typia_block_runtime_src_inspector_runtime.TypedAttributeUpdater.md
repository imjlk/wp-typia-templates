[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md) / TypedAttributeUpdater

# Interface: TypedAttributeUpdater\<T\>

[packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md).TypedAttributeUpdater

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

## Table of contents

### Properties

- [updateAttribute](packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md#updateattribute)
- [updateField](packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md#updatefield)
- [updatePath](packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md#updatepath)

## Properties

### updateAttribute

• **updateAttribute**: \<K\>(`key`: `K`, `value`: `T`[`K`]) => `boolean`

#### Type declaration

▸ \<`K`\>(`key`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends `string` \| `number` \| `symbol` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `key` | `K` |
| `value` | `T`[`K`] |

##### Returns

`boolean`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:126](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L126)

___

### updateField

• **updateField**: \<K\>(`path`: `string` \| `K`, `value`: `unknown`) => `boolean`

#### Type declaration

▸ \<`K`\>(`path`, `value`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `K` | extends `string` \| `number` \| `symbol` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` \| `K` |
| `value` | `unknown` |

##### Returns

`boolean`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:127](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L127)

___

### updatePath

• **updatePath**: (`path`: `string`, `value`: `unknown`) => `boolean`

#### Type declaration

▸ (`path`, `value`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `unknown` |

##### Returns

`boolean`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:128](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L128)
