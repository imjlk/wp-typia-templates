[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-project-tools/src/runtime/scaffold](../modules/packages_wp_typia_project_tools_src_runtime_scaffold.md) / ScaffoldAnswers

# Interface: ScaffoldAnswers

[packages/wp-typia-project-tools/src/runtime/scaffold](../modules/packages_wp_typia_project_tools_src_runtime_scaffold.md).ScaffoldAnswers

User-facing scaffold answers before template rendering.

`namespace`, `textDomain`, and `phpPrefix` are normalized before use so
callers can pass human-entered values while generated output stays
predictable.

## Table of contents

### Properties

- [author](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#author)
- [dataStorageMode](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#datastoragemode)
- [description](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#description)
- [namespace](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#namespace)
- [persistencePolicy](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#persistencepolicy)
- [phpPrefix](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#phpprefix)
- [slug](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#slug)
- [textDomain](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#textdomain)
- [title](packages_wp_typia_project_tools_src_runtime_scaffold.ScaffoldAnswers.md#title)

## Properties

### author

• **author**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:80](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L80)

___

### dataStorageMode

• `Optional` **dataStorageMode**: ``"post-meta"`` \| ``"custom-table"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L81)

___

### description

• **description**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:82](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L82)

___

### namespace

• **namespace**: `string`

Block namespace used in generated block names such as `namespace/slug`.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:84](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L84)

___

### persistencePolicy

• `Optional` **persistencePolicy**: ``"public"`` \| ``"authenticated"``

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:85](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L85)

___

### phpPrefix

• `Optional` **phpPrefix**: `string`

Snake_case PHP symbol prefix used for generated functions, constants, and keys.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:87](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L87)

___

### slug

• **slug**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:88](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L88)

___

### textDomain

• `Optional` **textDomain**: `string`

Kebab-case WordPress text domain used in block metadata and i18n strings.

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:90](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L90)

___

### title

• **title**: `string`

#### Defined in

[packages/wp-typia-project-tools/src/runtime/scaffold.ts:91](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-project-tools/src/runtime/scaffold.ts#L91)
