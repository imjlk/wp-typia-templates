[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/scaffold](../modules/packages_create_src_runtime_scaffold.md) / ScaffoldAnswers

# Interface: ScaffoldAnswers

[packages/create/src/runtime/scaffold](../modules/packages_create_src_runtime_scaffold.md).ScaffoldAnswers

User-facing scaffold answers before template rendering.

`namespace`, `textDomain`, and `phpPrefix` are normalized before use so
callers can pass human-entered values while generated output stays
predictable.

## Table of contents

### Properties

- [author](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#author)
- [dataStorageMode](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#datastoragemode)
- [description](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#description)
- [namespace](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#namespace)
- [persistencePolicy](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#persistencepolicy)
- [phpPrefix](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#phpprefix)
- [slug](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#slug)
- [textDomain](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#textdomain)
- [title](packages_create_src_runtime_scaffold.ScaffoldAnswers.md#title)

## Properties

### author

• **author**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:65](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L65)

___

### dataStorageMode

• `Optional` **dataStorageMode**: ``"post-meta"`` \| ``"custom-table"``

#### Defined in

[packages/create/src/runtime/scaffold.ts:66](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L66)

___

### description

• **description**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:67](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L67)

___

### namespace

• **namespace**: `string`

Block namespace used in generated block names such as `namespace/slug`.

#### Defined in

[packages/create/src/runtime/scaffold.ts:69](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L69)

___

### persistencePolicy

• `Optional` **persistencePolicy**: ``"authenticated"`` \| ``"public"``

#### Defined in

[packages/create/src/runtime/scaffold.ts:70](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L70)

___

### phpPrefix

• `Optional` **phpPrefix**: `string`

Snake_case PHP symbol prefix used for generated functions, constants, and keys.

#### Defined in

[packages/create/src/runtime/scaffold.ts:72](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L72)

___

### slug

• **slug**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:73](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L73)

___

### textDomain

• `Optional` **textDomain**: `string`

Kebab-case WordPress text domain used in block metadata and i18n strings.

#### Defined in

[packages/create/src/runtime/scaffold.ts:75](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L75)

___

### title

• **title**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:76](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L76)
