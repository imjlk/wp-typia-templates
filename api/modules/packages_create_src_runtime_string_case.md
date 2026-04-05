[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/create/src/runtime/string-case

# Module: packages/create/src/runtime/string-case

## Table of contents

### Functions

- [toKebabCase](packages_create_src_runtime_string_case.md#tokebabcase)
- [toSnakeCase](packages_create_src_runtime_string_case.md#tosnakecase)
- [toPascalCase](packages_create_src_runtime_string_case.md#topascalcase)
- [toSegmentPascalCase](packages_create_src_runtime_string_case.md#tosegmentpascalcase)
- [toTitleCase](packages_create_src_runtime_string_case.md#totitlecase)

## Functions

### toKebabCase

▸ **toKebabCase**(`input`): `string`

Normalize arbitrary text into a kebab-case identifier.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | Raw text that may contain spaces, punctuation, or camelCase. |

#### Returns

`string`

A lowercase kebab-case string with collapsed separators.

#### Defined in

[packages/create/src/runtime/string-case.ts:11](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/string-case.ts#L11)

___

### toSnakeCase

▸ **toSnakeCase**(`input`): `string`

Normalize arbitrary text into a snake_case identifier.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | Raw text that may contain spaces, punctuation, or camelCase. |

#### Returns

`string`

A lowercase snake_case string derived from the kebab-case form.

#### Defined in

[packages/create/src/runtime/string-case.ts:27](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/string-case.ts#L27)

___

### toPascalCase

▸ **toPascalCase**(`input`): `string`

Normalize arbitrary text into a PascalCase identifier.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | Raw text that may contain spaces, punctuation, or camelCase. |

#### Returns

`string`

A PascalCase string derived from the normalized kebab-case form.

#### Defined in

[packages/create/src/runtime/string-case.ts:37](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/string-case.ts#L37)

___

### toSegmentPascalCase

▸ **toSegmentPascalCase**(`input`): `string`

Convert delimited text to PascalCase while preserving each segment's
existing internal casing.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | Raw text split on non-alphanumeric boundaries. |

#### Returns

`string`

A PascalCase string that preserves acronyms inside segments.

#### Defined in

[packages/create/src/runtime/string-case.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/string-case.ts#L52)

___

### toTitleCase

▸ **toTitleCase**(`input`): `string`

Normalize arbitrary text into a human-readable title.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `input` | `string` | Raw text that may contain spaces, punctuation, or camelCase. |

#### Returns

`string`

A title-cased string derived from the normalized kebab-case form.

#### Defined in

[packages/create/src/runtime/string-case.ts:68](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/string-case.ts#L68)
