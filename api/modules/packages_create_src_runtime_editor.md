[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/editor

# Module: packages/create/src/runtime/editor

## Table of contents

### References

- [JsonValue](packages_create_src_runtime_editor.md#jsonvalue)
- [ManifestAttribute](packages_create_src_runtime_editor.md#manifestattribute)
- [ManifestConstraints](packages_create_src_runtime_editor.md#manifestconstraints)
- [ManifestDocument](packages_create_src_runtime_editor.md#manifestdocument)
- [ManifestTsKind](packages_create_src_runtime_editor.md#manifesttskind)

### Interfaces

- [EditorFieldOption](../interfaces/packages_create_src_runtime_editor.EditorFieldOption.md)
- [EditorFieldDescriptor](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)
- [EditorModelOptions](../interfaces/packages_create_src_runtime_editor.EditorModelOptions.md)

### Type Aliases

- [EditorControlKind](packages_create_src_runtime_editor.md#editorcontrolkind)

### Functions

- [formatEditorFieldLabel](packages_create_src_runtime_editor.md#formateditorfieldlabel)
- [describeEditorField](packages_create_src_runtime_editor.md#describeeditorfield)
- [createEditorModel](packages_create_src_runtime_editor.md#createeditormodel)

## References

### JsonValue

Re-exports [JsonValue](packages_create_src_runtime_migration_types.md#jsonvalue)

___

### ManifestAttribute

Re-exports [ManifestAttribute](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md)

___

### ManifestConstraints

Re-exports [ManifestConstraints](../interfaces/packages_create_src_runtime_migration_types.ManifestConstraints.md)

___

### ManifestDocument

Re-exports [ManifestDocument](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md)

___

### ManifestTsKind

Re-exports [ManifestTsKind](packages_create_src_runtime_migration_types.md#manifesttskind)

## Type Aliases

### EditorControlKind

Ƭ **EditorControlKind**: ``"toggle"`` \| ``"select"`` \| ``"range"`` \| ``"number"`` \| ``"text"`` \| ``"textarea"`` \| ``"unsupported"``

#### Defined in

[packages/create/src/runtime/editor.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/editor.ts#L17)

## Functions

### formatEditorFieldLabel

▸ **formatEditorFieldLabel**(`path`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`string`

#### Defined in

[packages/create/src/runtime/editor.ts:188](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/editor.ts#L188)

___

### describeEditorField

▸ **describeEditorField**(`path`, `attribute`, `options?`): [`EditorFieldDescriptor`](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_create_src_runtime_editor.EditorModelOptions.md) |

#### Returns

[`EditorFieldDescriptor`](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/create/src/runtime/editor.ts:203](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/editor.ts#L203)

___

### createEditorModel

▸ **createEditorModel**(`manifest`, `options?`): [`EditorFieldDescriptor`](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_create_src_runtime_editor.EditorModelOptions.md) |

#### Returns

[`EditorFieldDescriptor`](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/create/src/runtime/editor.ts:261](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/editor.ts#L261)
