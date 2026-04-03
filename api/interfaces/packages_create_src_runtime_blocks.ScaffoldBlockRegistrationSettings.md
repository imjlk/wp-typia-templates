[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md) / ScaffoldBlockRegistrationSettings

# Interface: ScaffoldBlockRegistrationSettings

[packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md).ScaffoldBlockRegistrationSettings

Registration settings copied from scaffold block metadata and merged into the
final `registerBlockType` call.

## Hierarchy

- **`ScaffoldBlockRegistrationSettings`**

  ↳ [`ScaffoldBlockMetadata`](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md)

## Table of contents

### Properties

- [ancestor](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#ancestor)
- [attributes](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#attributes)
- [category](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#category)
- [description](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#description)
- [example](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#example)
- [icon](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#icon)
- [parent](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#parent)
- [supports](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#supports)
- [title](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#title)

## Properties

### ancestor

• `Optional` **ancestor**: readonly `string`[]

Limits insertion to descendants of the listed ancestor block names.

#### Defined in

[packages/create/src/runtime/blocks.ts:264](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L264)

___

### attributes

• `Optional` **attributes**: `Record`\<`string`, `unknown`\>

Raw block attribute definitions from `block.json`.

#### Defined in

[packages/create/src/runtime/blocks.ts:266](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L266)

___

### category

• `Optional` **category**: `unknown`

WordPress block category passed through to registration.

#### Defined in

[packages/create/src/runtime/blocks.ts:268](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L268)

___

### description

• `Optional` **description**: `unknown`

Human-readable block description from metadata.

#### Defined in

[packages/create/src/runtime/blocks.ts:270](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L270)

___

### example

• `Optional` **example**: `unknown`

Example payload used by inserter previews and fixture generation.

#### Defined in

[packages/create/src/runtime/blocks.ts:272](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L272)

___

### icon

• `Optional` **icon**: `unknown`

Dashicon slug, SVG, or icon object accepted by WordPress.

#### Defined in

[packages/create/src/runtime/blocks.ts:274](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L274)

___

### parent

• `Optional` **parent**: readonly `string`[]

Limits insertion to children of the listed parent block names.

#### Defined in

[packages/create/src/runtime/blocks.ts:276](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L276)

___

### supports

• `Optional` **supports**: [`ScaffoldBlockSupports`](../modules/packages_create_src_runtime_blocks.md#scaffoldblocksupports)

Typed block support configuration for scaffolded registrations.

#### Defined in

[packages/create/src/runtime/blocks.ts:278](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L278)

___

### title

• `Optional` **title**: `unknown`

Human-readable block title shown in the inserter.

#### Defined in

[packages/create/src/runtime/blocks.ts:280](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L280)
