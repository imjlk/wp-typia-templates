[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md) / UseEditorFieldsResult

# Interface: UseEditorFieldsResult

[packages/wp-typia-block-runtime/src/inspector-runtime](../modules/packages_wp_typia_block_runtime_src_inspector_runtime.md).UseEditorFieldsResult

## Table of contents

### Properties

- [fields](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#fields)
- [fieldMap](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#fieldmap)
- [getBooleanValue](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#getbooleanvalue)
- [getField](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#getfield)
- [getNumberValue](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#getnumbervalue)
- [getSelectOptions](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#getselectoptions)
- [getStringValue](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#getstringvalue)
- [manualFields](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#manualfields)
- [supportedFields](packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md#supportedfields)

## Properties

### fields

• **fields**: [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:99](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L99)

___

### fieldMap

• **fieldMap**: `Map`\<`string`, [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)\>

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:100](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L100)

___

### getBooleanValue

• **getBooleanValue**: (`source`: `object`, `path`: `string`, `fallback`: `boolean`) => `boolean`

#### Type declaration

▸ (`source`, `path`, `fallback`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `object` |
| `path` | `string` |
| `fallback` | `boolean` |

##### Returns

`boolean`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:101](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L101)

___

### getField

• **getField**: (`path`: `string`) => `undefined` \| [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

#### Type declaration

▸ (`path`): `undefined` \| [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

##### Returns

`undefined` \| [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:106](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L106)

___

### getNumberValue

• **getNumberValue**: (`source`: `object`, `path`: `string`, `fallback`: `number`) => `number`

#### Type declaration

▸ (`source`, `path`, `fallback`): `number`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `object` |
| `path` | `string` |
| `fallback` | `number` |

##### Returns

`number`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:107](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L107)

___

### getSelectOptions

• **getSelectOptions**: (`path`: `string`, `labelMap?`: `Record`\<`string`, `string`\>) => [`InspectorSelectOption`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)[]

#### Type declaration

▸ (`path`, `labelMap?`): [`InspectorSelectOption`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)[]

##### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `labelMap?` | `Record`\<`string`, `string`\> |

##### Returns

[`InspectorSelectOption`](packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:112](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L112)

___

### getStringValue

• **getStringValue**: (`source`: `object`, `path`: `string`, `fallback`: `string`) => `string`

#### Type declaration

▸ (`source`, `path`, `fallback`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `source` | `object` |
| `path` | `string` |
| `fallback` | `string` |

##### Returns

`string`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:116](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L116)

___

### manualFields

• **manualFields**: [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:121](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L121)

___

### supportedFields

• **supportedFields**: [`EditorFieldDescriptor`](packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:122](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L122)
