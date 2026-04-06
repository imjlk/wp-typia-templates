[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md) / InspectorFromManifestProps

# Interface: InspectorFromManifestProps\<T\>

[packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md).InspectorFromManifestProps

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `UnknownRecord` |

## Table of contents

### Properties

- [attributes](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#attributes)
- [children](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#children)
- [components](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#components)
- [fieldLookup](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#fieldlookup)
- [fieldOverrides](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#fieldoverrides)
- [initialOpen](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#initialopen)
- [onChange](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#onchange)
- [paths](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#paths)
- [title](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md#title)

## Properties

### attributes

• **attributes**: `T`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:171](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L171)

___

### children

• `Optional` **children**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:172](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L172)

___

### components

• `Optional` **components**: [`InspectorComponentMap`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorComponentMap.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:173](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L173)

___

### fieldLookup

• **fieldLookup**: [`UseEditorFieldsResult`](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:174](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L174)

___

### fieldOverrides

• `Optional` **fieldOverrides**: `Record`\<`string`, [`InspectorFieldOverride`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md)\>

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:175](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L175)

___

### initialOpen

• `Optional` **initialOpen**: `boolean`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:176](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L176)

___

### onChange

• **onChange**: (`path`: `string`, `value`: `unknown`) => `void`

#### Type declaration

▸ (`path`, `value`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `value` | `unknown` |

##### Returns

`void`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:177](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L177)

___

### paths

• **paths**: readonly `string`[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:178](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L178)

___

### title

• `Optional` **title**: `ReactNode`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:179](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L179)
