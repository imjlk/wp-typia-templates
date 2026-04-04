[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md) / TypedAttributeUpdater

# Interface: TypedAttributeUpdater\<T\>

[packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md).TypedAttributeUpdater

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

## Table of contents

### Properties

- [updateAttribute](packages_create_src_runtime_inspector.TypedAttributeUpdater.md#updateattribute)
- [updateField](packages_create_src_runtime_inspector.TypedAttributeUpdater.md#updatefield)
- [updatePath](packages_create_src_runtime_inspector.TypedAttributeUpdater.md#updatepath)

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

[packages/create/src/runtime/inspector.tsx:125](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L125)

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

[packages/create/src/runtime/inspector.tsx:126](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L126)

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

[packages/create/src/runtime/inspector.tsx:127](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L127)
