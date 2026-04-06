[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/metadata-php-render

# Module: packages/create/src/runtime/metadata-php-render

## Table of contents

### Functions

- [renderPhpValidator](packages_create_src_runtime_metadata_php_render.md#renderphpvalidator)
- [collectPhpGenerationWarnings](packages_create_src_runtime_metadata_php_render.md#collectphpgenerationwarnings)
- [renderPhpValue](packages_create_src_runtime_metadata_php_render.md#renderphpvalue)

## Functions

### renderPhpValidator

▸ **renderPhpValidator**(`manifest`): `Object`

Render a PHP validator class from one manifest document.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `manifest` | [`ManifestDocument`](../interfaces/packages_create_src_runtime_metadata_model.ManifestDocument.md) | Manifest document describing the block attribute schema and Typia metadata to enforce in PHP. |

#### Returns

`Object`

Generated PHP source plus any warn-only coverage gaps discovered
while traversing the manifest.

| Name | Type |
| :------ | :------ |
| `source` | `string` |
| `warnings` | `string`[] |

#### Defined in

[packages/create/src/runtime/metadata-php-render.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-php-render.ts#L32)

___

### collectPhpGenerationWarnings

▸ **collectPhpGenerationWarnings**(`attribute`, `pathLabel`, `warnings`): `void`

Collect warn-only PHP validator generation gaps for one manifest branch.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `attribute` | [`ManifestAttribute`](../interfaces/packages_create_src_runtime_metadata_model.ManifestAttribute.md) | Manifest attribute metadata to inspect. |
| `pathLabel` | `string` | Human-readable path used in emitted warning messages. |
| `warnings` | `string`[] | Mutable accumulator that receives any discovered warnings. |

#### Returns

`void`

#### Defined in

[packages/create/src/runtime/metadata-php-render.ts:510](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-php-render.ts#L510)

___

### renderPhpValue

▸ **renderPhpValue**(`value`, `indentLevel`): `string`

Render one JavaScript value into a PHP literal string.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `unknown` | JSON-like value to encode for the generated validator manifest. |
| `indentLevel` | `number` | Current indentation depth, expressed in tab levels. |

#### Returns

`string`

PHP source code representing the provided value.

#### Defined in

[packages/create/src/runtime/metadata-php-render.ts:553](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/metadata-php-render.ts#L553)
