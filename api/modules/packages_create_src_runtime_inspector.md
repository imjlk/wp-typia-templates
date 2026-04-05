[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/inspector

# Module: packages/create/src/runtime/inspector

## Table of contents

### References

- [EditorFieldDescriptor](packages_create_src_runtime_inspector.md#editorfielddescriptor)
- [EditorFieldOption](packages_create_src_runtime_inspector.md#editorfieldoption)
- [EditorModelOptions](packages_create_src_runtime_inspector.md#editormodeloptions)
- [ManifestAttribute](packages_create_src_runtime_inspector.md#manifestattribute)
- [ManifestDocument](packages_create_src_runtime_inspector.md#manifestdocument)
- [ValidationResult](packages_create_src_runtime_inspector.md#validationresult)

### Interfaces

- [InspectorSelectOption](../interfaces/packages_create_src_runtime_inspector.InspectorSelectOption.md)
- [PanelBodyLikeProps](../interfaces/packages_create_src_runtime_inspector.PanelBodyLikeProps.md)
- [ToggleControlLikeProps](../interfaces/packages_create_src_runtime_inspector.ToggleControlLikeProps.md)
- [SelectControlLikeProps](../interfaces/packages_create_src_runtime_inspector.SelectControlLikeProps.md)
- [RangeControlLikeProps](../interfaces/packages_create_src_runtime_inspector.RangeControlLikeProps.md)
- [TextControlLikeProps](../interfaces/packages_create_src_runtime_inspector.TextControlLikeProps.md)
- [TextareaControlLikeProps](../interfaces/packages_create_src_runtime_inspector.TextareaControlLikeProps.md)
- [InspectorComponentMap](../interfaces/packages_create_src_runtime_inspector.InspectorComponentMap.md)
- [UseEditorFieldsResult](../interfaces/packages_create_src_runtime_inspector.UseEditorFieldsResult.md)
- [TypedAttributeUpdater](../interfaces/packages_create_src_runtime_inspector.TypedAttributeUpdater.md)
- [FieldControlRenderContext](../interfaces/packages_create_src_runtime_inspector.FieldControlRenderContext.md)
- [FieldControlProps](../interfaces/packages_create_src_runtime_inspector.FieldControlProps.md)
- [InspectorFieldOverride](../interfaces/packages_create_src_runtime_inspector.InspectorFieldOverride.md)
- [InspectorFromManifestProps](../interfaces/packages_create_src_runtime_inspector.InspectorFromManifestProps.md)

### Functions

- [useEditorFields](packages_create_src_runtime_inspector.md#useeditorfields)
- [useTypedAttributeUpdater](packages_create_src_runtime_inspector.md#usetypedattributeupdater)
- [FieldControl](packages_create_src_runtime_inspector.md#fieldcontrol)
- [InspectorFromManifest](packages_create_src_runtime_inspector.md#inspectorfrommanifest)

## References

### EditorFieldDescriptor

Re-exports [EditorFieldDescriptor](../interfaces/packages_create_src_runtime_editor.EditorFieldDescriptor.md)

___

### EditorFieldOption

Re-exports [EditorFieldOption](../interfaces/packages_create_src_runtime_editor.EditorFieldOption.md)

___

### EditorModelOptions

Re-exports [EditorModelOptions](../interfaces/packages_create_src_runtime_editor.EditorModelOptions.md)

___

### ManifestAttribute

Re-exports [ManifestAttribute](../interfaces/packages_create_src_runtime_migration_types.ManifestAttribute.md)

___

### ManifestDocument

Re-exports [ManifestDocument](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md)

___

### ValidationResult

Re-exports [ValidationResult](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)

## Functions

### useEditorFields

▸ **useEditorFields**(`manifest`, `options?`): [`UseEditorFieldsResult`](../interfaces/packages_create_src_runtime_inspector.UseEditorFieldsResult.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_migration_types.ManifestDocument.md) |
| `options` | [`EditorModelOptions`](../interfaces/packages_create_src_runtime_editor.EditorModelOptions.md) |

#### Returns

[`UseEditorFieldsResult`](../interfaces/packages_create_src_runtime_inspector.UseEditorFieldsResult.md)

#### Defined in

[packages/create/src/runtime/inspector.tsx:419](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L419)

___

### useTypedAttributeUpdater

▸ **useTypedAttributeUpdater**\<`T`\>(`attributes`, `setAttributes`, `validate?`): [`TypedAttributeUpdater`](../interfaces/packages_create_src_runtime_inspector.TypedAttributeUpdater.md)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `attributes` | `T` |
| `setAttributes` | (`attrs`: `Partial`\<`T`\>) => `void` |
| `validate?` | (`value`: `T`) => [`ValidationResult`](../interfaces/packages_create_src_runtime_validation.ValidationResult.md)\<`T`\> |

#### Returns

[`TypedAttributeUpdater`](../interfaces/packages_create_src_runtime_inspector.TypedAttributeUpdater.md)\<`T`\>

#### Defined in

[packages/create/src/runtime/inspector.tsx:496](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L496)

___

### FieldControl

▸ **FieldControl**(`«destructured»`): ``null`` \| `Element`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`FieldControlProps`](../interfaces/packages_create_src_runtime_inspector.FieldControlProps.md) |

#### Returns

``null`` \| `Element`

#### Defined in

[packages/create/src/runtime/inspector.tsx:533](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L533)

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
| `«destructured»` | [`InspectorFromManifestProps`](../interfaces/packages_create_src_runtime_inspector.InspectorFromManifestProps.md)\<`T`\> |

#### Returns

`Element`

#### Defined in

[packages/create/src/runtime/inspector.tsx:686](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/inspector.tsx#L686)
