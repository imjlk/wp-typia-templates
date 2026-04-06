[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/editor

# Module: packages/wp-typia-block-runtime/src/editor

## Table of contents

### References

- [JsonValue](packages_wp_typia_block_runtime_src_editor.md#jsonvalue)
- [ManifestAttribute](packages_wp_typia_block_runtime_src_editor.md#manifestattribute)
- [ManifestConstraints](packages_wp_typia_block_runtime_src_editor.md#manifestconstraints)
- [ManifestDocument](packages_wp_typia_block_runtime_src_editor.md#manifestdocument)
- [ManifestTsKind](packages_wp_typia_block_runtime_src_editor.md#manifesttskind)

### Interfaces

- [EditorFieldOption](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldOption.md)
- [EditorFieldDescriptor](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)
- [EditorModelOptions](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md)

### Type Aliases

- [EditorControlKind](packages_wp_typia_block_runtime_src_editor.md#editorcontrolkind)

### Functions

- [formatEditorFieldLabel](packages_wp_typia_block_runtime_src_editor.md#formateditorfieldlabel)
- [describeEditorField](packages_wp_typia_block_runtime_src_editor.md#describeeditorfield)
- [createEditorModel](packages_wp_typia_block_runtime_src_editor.md#createeditormodel)

## References

### JsonValue

Re-exports [JsonValue](packages_wp_typia_block_runtime_src_migration_types.md#jsonvalue)

___

### ManifestAttribute

Re-exports [ManifestAttribute](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md)

___

### ManifestConstraints

Re-exports [ManifestConstraints](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestConstraints.md)

___

### ManifestDocument

Re-exports [ManifestDocument](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md)

___

### ManifestTsKind

Re-exports [ManifestTsKind](packages_wp_typia_block_runtime_src_migration_types.md#manifesttskind)

## Type Aliases

### EditorControlKind

Ƭ **EditorControlKind**: ``"toggle"`` \| ``"select"`` \| ``"range"`` \| ``"number"`` \| ``"text"`` \| ``"textarea"`` \| ``"unsupported"``

#### Defined in

[packages/wp-typia-block-runtime/src/editor.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/editor.ts#L19)

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

[packages/wp-typia-block-runtime/src/editor.ts:190](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/editor.ts#L190)

___

### describeEditorField

▸ **describeEditorField**(`path`, `attribute`, `options?`): [`EditorFieldDescriptor`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md) |

#### Returns

[`EditorFieldDescriptor`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

#### Defined in

[packages/wp-typia-block-runtime/src/editor.ts:205](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/editor.ts#L205)

___

### createEditorModel

▸ **createEditorModel**(`manifest`, `options?`): [`EditorFieldDescriptor`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md) |

#### Returns

[`EditorFieldDescriptor`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)[]

#### Defined in

[packages/wp-typia-block-runtime/src/editor.ts:265](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/editor.ts#L265)
