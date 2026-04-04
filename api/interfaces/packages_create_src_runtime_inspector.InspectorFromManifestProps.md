[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md) / InspectorFromManifestProps

# Interface: InspectorFromManifestProps\<T\>

[packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md).InspectorFromManifestProps

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `UnknownRecord` |

## Table of contents

### Properties

- [attributes](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#attributes)
- [children](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#children)
- [components](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#components)
- [fieldLookup](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#fieldlookup)
- [fieldOverrides](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#fieldoverrides)
- [initialOpen](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#initialopen)
- [onChange](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#onchange)
- [paths](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#paths)
- [title](packages_create_src_runtime_inspector.InspectorFromManifestProps.md#title)

## Properties

### attributes

• **attributes**: `T`

#### Defined in

[packages/create/src/runtime/inspector.tsx:170](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L170)

___

### children

• `Optional` **children**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:171](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L171)

___

### components

• `Optional` **components**: [`InspectorComponentMap`](packages_create_src_runtime_inspector.InspectorComponentMap.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:172](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L172)

___

### fieldLookup

• **fieldLookup**: [`UseEditorFieldsResult`](packages_create_src_runtime_inspector.UseEditorFieldsResult.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:173](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L173)

___

### fieldOverrides

• `Optional` **fieldOverrides**: `Record`\<`string`, [`InspectorFieldOverride`](packages_create_src_runtime_inspector.InspectorFieldOverride.md)\>

#### Defined in

[packages/create/src/runtime/inspector.tsx:174](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L174)

___

### initialOpen

• `Optional` **initialOpen**: `boolean`

#### Defined in

[packages/create/src/runtime/inspector.tsx:175](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L175)

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

[packages/create/src/runtime/inspector.tsx:176](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L176)

___

### paths

• **paths**: readonly `string`[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:177](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L177)

___

### title

• `Optional` **title**: `ReactNode`

#### Defined in

[packages/create/src/runtime/inspector.tsx:178](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L178)
