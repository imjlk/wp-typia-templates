[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md) / FieldControlProps

# Interface: FieldControlProps

[packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md).FieldControlProps

## Table of contents

### Properties

- [components](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#components)
- [field](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#field)
- [help](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#help)
- [label](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#label)
- [max](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#max)
- [min](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#min)
- [onChange](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#onchange)
- [options](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#options)
- [render](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#render)
- [renderUnsupported](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#renderunsupported)
- [step](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#step)
- [value](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md#value)

## Properties

### components

• `Optional` **components**: [`InspectorComponentMap`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorComponentMap.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:145](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L145)

___

### field

• **field**: [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:146](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L146)

___

### help

• `Optional` **help**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:147](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L147)

___

### label

• `Optional` **label**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:148](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L148)

___

### max

• `Optional` **max**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:149](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L149)

___

### min

• `Optional` **min**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:150](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L150)

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

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:151](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L151)

___

### options

• `Optional` **options**: readonly [`InspectorSelectOption`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:152](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L152)

___

### render

• `Optional` **render**: (`context`: [`FieldControlRenderContext`](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlRenderContext.md)) => `ReactNode`

#### Type declaration

▸ (`context`): `ReactNode`

##### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`FieldControlRenderContext`](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlRenderContext.md) |

##### Returns

`ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:153](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L153)

___

### renderUnsupported

• `Optional` **renderUnsupported**: (`context`: [`FieldControlRenderContext`](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlRenderContext.md)) => `ReactNode`

#### Type declaration

▸ (`context`): `ReactNode`

##### Parameters

| Name | Type |
| :------ | :------ |
| `context` | [`FieldControlRenderContext`](packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlRenderContext.md) |

##### Returns

`ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:154](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L154)

___

### step

• `Optional` **step**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:155](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L155)

___

### value

• **value**: `unknown`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:156](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L156)
