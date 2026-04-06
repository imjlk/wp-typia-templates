[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-runtime/src/inspector-runtime

# Module: packages/wp-typia-block-runtime/src/inspector-runtime

## Table of contents

### References

- [EditorFieldDescriptor](packages_wp_typia_block_runtime_src_inspector_runtime.md#editorfielddescriptor)
- [EditorFieldOption](packages_wp_typia_block_runtime_src_inspector_runtime.md#editorfieldoption)
- [EditorModelOptions](packages_wp_typia_block_runtime_src_inspector_runtime.md#editormodeloptions)
- [ManifestAttribute](packages_wp_typia_block_runtime_src_inspector_runtime.md#manifestattribute)
- [ManifestDocument](packages_wp_typia_block_runtime_src_inspector_runtime.md#manifestdocument)
- [ValidationResult](packages_wp_typia_block_runtime_src_inspector_runtime.md#validationresult)

### Interfaces

- [InspectorSelectOption](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.InspectorSelectOption.md)
- [PanelBodyLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.PanelBodyLikeProps.md)
- [ToggleControlLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.ToggleControlLikeProps.md)
- [SelectControlLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.SelectControlLikeProps.md)
- [RangeControlLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.RangeControlLikeProps.md)
- [TextControlLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.TextControlLikeProps.md)
- [TextareaControlLikeProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.TextareaControlLikeProps.md)
- [InspectorComponentMap](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.InspectorComponentMap.md)
- [UseEditorFieldsResult](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md)
- [TypedAttributeUpdater](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md)
- [FieldControlRenderContext](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlRenderContext.md)
- [FieldControlProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md)
- [InspectorFieldOverride](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFieldOverride.md)
- [InspectorFromManifestProps](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md)

### Functions

- [useEditorFields](packages_wp_typia_block_runtime_src_inspector_runtime.md#useeditorfields)
- [useTypedAttributeUpdater](packages_wp_typia_block_runtime_src_inspector_runtime.md#usetypedattributeupdater)
- [FieldControl](packages_wp_typia_block_runtime_src_inspector_runtime.md#fieldcontrol)
- [InspectorFromManifest](packages_wp_typia_block_runtime_src_inspector_runtime.md#inspectorfrommanifest)

## References

### EditorFieldDescriptor

Re-exports [EditorFieldDescriptor](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldDescriptor.md)

___

### EditorFieldOption

Re-exports [EditorFieldOption](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorFieldOption.md)

___

### EditorModelOptions

Re-exports [EditorModelOptions](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md)

___

### ManifestAttribute

Re-exports [ManifestAttribute](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestAttribute.md)

___

### ManifestDocument

Re-exports [ManifestDocument](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md)

___

### ValidationResult

Re-exports [ValidationResult](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)

## Functions

### useEditorFields

▸ **useEditorFields**(`manifest`, `options?`): [`UseEditorFieldsResult`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_wp_typia_block_runtime_src_migration_types.ManifestDocument.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_wp_typia_block_runtime_src_editor.EditorModelOptions.md) |

#### Returns

[`UseEditorFieldsResult`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.UseEditorFieldsResult.md)

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:411](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L411)

___

### useTypedAttributeUpdater

▸ **useTypedAttributeUpdater**\<`T`\>(`attributes`, `setAttributes`, `validate?`): [`TypedAttributeUpdater`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `T` |
| `setAttributes` | (`attrs`: `Partial`\<`T`\>) => `void` |
| `validate?` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_wp_typia_block_runtime_src_validation.ValidationResult.md)\<`T`\> |

#### Returns

[`TypedAttributeUpdater`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.TypedAttributeUpdater.md)\<`T`\>

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:488](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L488)

___

### FieldControl

▸ **FieldControl**(`«destructured»`): ``null`` \| `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`FieldControlProps`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.FieldControlProps.md) |

#### Returns

``null`` \| `Element`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:525](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L525)

___

### InspectorFromManifest

▸ **InspectorFromManifest**\<`T`\>(`«destructured»`): `Element`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `UnknownRecord` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`InspectorFromManifestProps`](../interfaces/packages_wp_typia_block_runtime_src_inspector_runtime.InspectorFromManifestProps.md)\<`T`\> |

#### Returns

`Element`

#### Defined in

[packages/wp-typia-block-runtime/src/inspector-runtime.tsx:678](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-runtime/src/inspector-runtime.tsx#L678)
