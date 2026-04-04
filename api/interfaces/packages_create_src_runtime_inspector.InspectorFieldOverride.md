[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md) / InspectorFieldOverride

# Interface: InspectorFieldOverride

[packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md).InspectorFieldOverride

## Table of contents

### Properties

- [help](packages_create_src_runtime_inspector.InspectorFieldOverride.md#help)
- [label](packages_create_src_runtime_inspector.InspectorFieldOverride.md#label)
- [max](packages_create_src_runtime_inspector.InspectorFieldOverride.md#max)
- [min](packages_create_src_runtime_inspector.InspectorFieldOverride.md#min)
- [options](packages_create_src_runtime_inspector.InspectorFieldOverride.md#options)
- [render](packages_create_src_runtime_inspector.InspectorFieldOverride.md#render)
- [renderUnsupported](packages_create_src_runtime_inspector.InspectorFieldOverride.md#renderunsupported)
- [step](packages_create_src_runtime_inspector.InspectorFieldOverride.md#step)

## Properties

### help

• `Optional` **help**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:159](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L159)

___

### label

• `Optional` **label**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:160](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L160)

___

### max

• `Optional` **max**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:161](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L161)

___

### min

• `Optional` **min**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:162](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L162)

___

### options

• `Optional` **options**: readonly [`InspectorSelectOption`](packages_create_src_runtime_inspector.InspectorSelectOption.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:163](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L163)

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

[packages/create/src/runtime/inspector.tsx:164](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L164)

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

[packages/create/src/runtime/inspector.tsx:165](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L165)

___

### step

• `Optional` **step**: `number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:166](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L166)
