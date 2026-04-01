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

[packages/create/src/runtime/scaffold.ts:44](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L44)

___

### dataStorageMode

• `Optional` **dataStorageMode**: ``"post-meta"`` \| ``"custom-table"``

#### Defined in

[packages/create/src/runtime/scaffold.ts:45](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L45)

___

### description

• **description**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:46](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L46)

___

### namespace

• **namespace**: `string`

Block namespace used in generated block names such as `namespace/slug`.

#### Defined in

[packages/create/src/runtime/scaffold.ts:48](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L48)

___

### persistencePolicy

• `Optional` **persistencePolicy**: ``"authenticated"`` \| ``"public"``

#### Defined in

[packages/create/src/runtime/scaffold.ts:49](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L49)

___

### phpPrefix

• `Optional` **phpPrefix**: `string`

Snake_case PHP symbol prefix used for generated functions, constants, and keys.

#### Defined in

[packages/create/src/runtime/scaffold.ts:51](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L51)

___

### slug

• **slug**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L52)

___

### textDomain

• `Optional` **textDomain**: `string`

Kebab-case WordPress text domain used in block metadata and i18n strings.

#### Defined in

[packages/create/src/runtime/scaffold.ts:54](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L54)

___

### title

• **title**: `string`

#### Defined in

[packages/create/src/runtime/scaffold.ts:55](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/scaffold.ts#L55)
