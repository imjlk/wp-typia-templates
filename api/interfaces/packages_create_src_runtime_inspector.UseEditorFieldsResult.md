[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md) / UseEditorFieldsResult

# Interface: UseEditorFieldsResult

[packages/create/src/runtime/inspector](../modules/packages_create_src_runtime_inspector.md).UseEditorFieldsResult

## Table of contents

### Properties

- [fields](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#fields)
- [fieldMap](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#fieldmap)
- [getBooleanValue](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#getbooleanvalue)
- [getField](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#getfield)
- [getNumberValue](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#getnumbervalue)
- [getSelectOptions](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#getselectoptions)
- [getStringValue](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#getstringvalue)
- [manualFields](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#manualfields)
- [supportedFields](packages_create_src_runtime_inspector.UseEditorFieldsResult.md#supportedfields)

## Properties

### fields

• **fields**: [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:99](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L99)

___

### fieldMap

• **fieldMap**: `Map`\<`string`, [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)\>

#### Defined in

[packages/create/src/runtime/inspector.tsx:100](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L100)

___

### getBooleanValue

• **getBooleanValue**: (`source`: `UnknownRecord`, `path`: `string`, `fallback`: `boolean`) => `boolean`

#### Type declaration

▸ (`source`, `path`, `fallback`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `UnknownRecord` |
| `path` | `string` |
| `fallback` | `boolean` |

##### Returns

`boolean`

#### Defined in

[packages/create/src/runtime/inspector.tsx:101](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L101)

___

### getField

• **getField**: (`path`: `string`) => `undefined` \| [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)

#### Type declaration

▸ (`path`): `undefined` \| [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

##### Returns

`undefined` \| [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:106](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L106)

___

### getNumberValue

• **getNumberValue**: (`source`: `UnknownRecord`, `path`: `string`, `fallback`: `number`) => `number`

#### Type declaration

▸ (`source`, `path`, `fallback`): `number`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `UnknownRecord` |
| `path` | `string` |
| `fallback` | `number` |

##### Returns

`number`

#### Defined in

[packages/create/src/runtime/inspector.tsx:107](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L107)

___

### getSelectOptions

• **getSelectOptions**: (`path`: `string`, `labelMap?`: `Record`\<`string`, `string`\>) => [`InspectorSelectOption`](packages_create_src_runtime_inspector.InspectorSelectOption.md)[]

#### Type declaration

▸ (`path`, `labelMap?`): [`InspectorSelectOption`](packages_create_src_runtime_inspector.InspectorSelectOption.md)[]

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `labelMap?` | `Record`\<`string`, `string`\> |

##### Returns

[`InspectorSelectOption`](packages_create_src_runtime_inspector.InspectorSelectOption.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:112](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L112)

___

### getStringValue

• **getStringValue**: (`source`: `UnknownRecord`, `path`: `string`, `fallback`: `string`) => `string`

#### Type declaration

▸ (`source`, `path`, `fallback`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `UnknownRecord` |
| `path` | `string` |
| `fallback` | `string` |

##### Returns

`string`

#### Defined in

[packages/create/src/runtime/inspector.tsx:116](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L116)

___

### manualFields

• **manualFields**: [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:121](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L121)

___

### supportedFields

• **supportedFields**: [`EditorFieldDescriptor`](packages_create_src_runtime_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/inspector.tsx:122](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L122)
