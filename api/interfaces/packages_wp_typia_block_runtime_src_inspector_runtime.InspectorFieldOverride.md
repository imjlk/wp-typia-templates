[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md) / InspectorFieldOverride

# Interface: InspectorFieldOverride

[packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md).InspectorFieldOverride

## Table of contents

### Properties

- [help](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#help)
- [label](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#label)
- [max](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#max)
- [min](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#min)
- [options](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#options)
- [render](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#render)
- [renderUnsupported](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#renderunsupported)
- [step](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md#step)

## Properties

### help

• `Optional` **help**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:160](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L160)

___

### label

• `Optional` **label**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:161](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L161)

___

### max

• `Optional` **max**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:162](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L162)

___

### min

• `Optional` **min**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:163](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L163)

___

### options

• `Optional` **options**: readonly [`InspectorSelectOption`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:164](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L164)

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

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:165](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L165)

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

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:166](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L166)

___

### step

• `Optional` **step**: `number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:167](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L167)
