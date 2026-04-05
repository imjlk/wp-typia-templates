[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md) / FieldControlProps

# Interface: FieldControlProps

[packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md).FieldControlProps

## Table of contents

### Properties

- [components](packages_create_src_runtime_inspector.FieldControlProps.md#components)
- [field](packages_create_src_runtime_inspector.FieldControlProps.md#field)
- [help](packages_create_src_runtime_inspector.FieldControlProps.md#help)
- [label](packages_create_src_runtime_inspector.FieldControlProps.md#label)
- [max](packages_create_src_runtime_inspector.FieldControlProps.md#max)
- [min](packages_create_src_runtime_inspector.FieldControlProps.md#min)
- [onChange](packages_create_src_runtime_inspector.FieldControlProps.md#onchange)
- [options](packages_create_src_runtime_inspector.FieldControlProps.md#options)
- [render](packages_create_src_runtime_inspector.FieldControlProps.md#render)
- [renderUnsupported](packages_create_src_runtime_inspector.FieldControlProps.md#renderunsupported)
- [step](packages_create_src_runtime_inspector.FieldControlProps.md#step)
- [value](packages_create_src_runtime_inspector.FieldControlProps.md#value)

## Properties

### components

• `Optional` **components**: [`InspectorComponentMap`](packages_create_src_runtime_inspector.InspectorComponentMap.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:145](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L145)

___

### field

• **field**: [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:146](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L146)

___

### help

• `Optional` **help**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:147](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L147)

___

### label

• `Optional` **label**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:148](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L148)

___

### max

• `Optional` **max**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:149](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L149)

___

### min

• `Optional` **min**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:150](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L150)

___

### onChange

• **onChange**: (`value`: `unknown`) => `void`

#### Type declaration

▸ (`value`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `unknown` |

##### Returns

`void`

#### Defined in

[packages/create/src/runtime/inspector.tsx:151](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L151)

___

### options

• `Optional` **options**: readonly [`InspectorSelectOption`](packages_create_src_runtime_inspector.InspectorSelectOption.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:152](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L152)

___

### render

• `Optional` **render**: (`context`: [`FieldControlRenderContext`](packages_create_src_runtime_inspector.FieldControlRenderContext.md)) => `ReactNode`

#### Type declaration

▸ (`context`): `ReactNode`

##### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`FieldControlRenderContext`](packages_create_src_runtime_inspector.FieldControlRenderContext.md) |

##### Returns

`ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:153](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L153)

___

### renderUnsupported

• `Optional` **renderUnsupported**: (`context`: [`FieldControlRenderContext`](packages_create_src_runtime_inspector.FieldControlRenderContext.md)) => `ReactNode`

#### Type declaration

▸ (`context`): `ReactNode`

##### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`FieldControlRenderContext`](packages_create_src_runtime_inspector.FieldControlRenderContext.md) |

##### Returns

`ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:154](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L154)

___

### step

• `Optional` **step**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:155](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L155)

___

### value

• **value**: `unknown`

#### Defined in

[packages/create/src/runtime/inspector.tsx:156](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L156)
