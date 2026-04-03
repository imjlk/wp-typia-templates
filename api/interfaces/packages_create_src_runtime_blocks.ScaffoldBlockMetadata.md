[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md) / ScaffoldBlockMetadata

# Interface: ScaffoldBlockMetadata

[packages/create/src/runtime/blocks](../modules/packages_create_src_runtime_blocks.md).ScaffoldBlockMetadata

Scaffold block metadata consumed by registration helpers.

This extends the registration settings with the required block name.

## Hierarchy

- [`ScaffoldBlockRegistrationSettings`](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md)

  ↳ **`ScaffoldBlockMetadata`**

## Table of contents

### Properties

- [ancestor](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#ancestor)
- [attributes](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#attributes)
- [category](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#category)
- [description](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#description)
- [example](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#example)
- [icon](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#icon)
- [parent](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#parent)
- [supports](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#supports)
- [title](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#title)
- [name](packages_create_src_runtime_blocks.ScaffoldBlockMetadata.md#name)

## Properties

### ancestor

• `Optional` **ancestor**: readonly `string`[]

Limits insertion to descendants of the listed ancestor block names.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[ancestor](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#ancestor)

#### Defined in

[packages/create/src/runtime/blocks.ts:264](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L264)

___

### attributes

• `Optional` **attributes**: `Record`\<`string`, `unknown`\>

Raw block attribute definitions from `block.json`.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[attributes](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#attributes)

#### Defined in

[packages/create/src/runtime/blocks.ts:266](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L266)

___

### category

• `Optional` **category**: `unknown`

WordPress block category passed through to registration.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[category](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#category)

#### Defined in

[packages/create/src/runtime/blocks.ts:268](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L268)

___

### description

• `Optional` **description**: `unknown`

Human-readable block description from metadata.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[description](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#description)

#### Defined in

[packages/create/src/runtime/blocks.ts:270](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L270)

___

### example

• `Optional` **example**: `unknown`

Example payload used by inserter previews and fixture generation.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[example](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#example)

#### Defined in

[packages/create/src/runtime/blocks.ts:272](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L272)

___

### icon

• `Optional` **icon**: `unknown`

Dashicon slug, SVG, or icon object accepted by WordPress.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[icon](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#icon)

#### Defined in

[packages/create/src/runtime/blocks.ts:274](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L274)

___

### parent

• `Optional` **parent**: readonly `string`[]

Limits insertion to children of the listed parent block names.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[parent](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#parent)

#### Defined in

[packages/create/src/runtime/blocks.ts:276](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L276)

___

### supports

• `Optional` **supports**: [`ScaffoldBlockSupports`](../modules/packages_create_src_runtime_blocks.md#scaffoldblocksupports)

Typed block support configuration for scaffolded registrations.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[supports](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#supports)

#### Defined in

[packages/create/src/runtime/blocks.ts:278](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L278)

___

### title

• `Optional` **title**: `unknown`

Human-readable block title shown in the inserter.

#### Inherited from

[ScaffoldBlockRegistrationSettings](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md).[title](packages_create_src_runtime_blocks.ScaffoldBlockRegistrationSettings.md#title)

#### Defined in

[packages/create/src/runtime/blocks.ts:280](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L280)

___

### name

• **name**: `string`

#### Defined in

[packages/create/src/runtime/blocks.ts:289](https://github.com/imjlk/wp-typia/blob/main/packages/create/src/runtime/blocks.ts#L289)
