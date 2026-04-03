[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / [packages/wp-typia-block-types/src/blocks/supports](../modules/packages_wp_typia_block_types_src_blocks_supports.md) / BlockSupports

# Interface: BlockSupports

[packages/wp-typia-block-types/src/blocks/supports](../modules/packages_wp_typia_block_types_src_blocks_supports.md).BlockSupports

Practical WP 6.9+ block support surface for block.json metadata and
registration helpers.

This intentionally models the common public subtrees instead of mirroring
every Gutenberg-internal experimental flag.

## Table of contents

### Properties

- [align](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#align)
- [alignWide](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#alignwide)
- [anchor](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#anchor)
- [ariaLabel](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#arialabel)
- [border](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#border)
- [className](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#classname)
- [color](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#color)
- [customClassName](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#customclassname)
- [dimensions](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#dimensions)
- [filter](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#filter)
- [html](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#html)
- [inserter](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#inserter)
- [interactivity](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#interactivity)
- [layout](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#layout)
- [lightbox](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#lightbox)
- [lock](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#lock)
- [multiple](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#multiple)
- [position](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#position)
- [renaming](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#renaming)
- [reusable](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#reusable)
- [shadow](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#shadow)
- [spacing](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#spacing)
- [typography](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#typography)

## Properties

### align

• `Optional` `Readonly` **align**: `boolean` \| readonly [`BlockAlignment`](../modules/packages_wp_typia_block_types_src_block_editor_alignment.md#blockalignment)[]

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:231](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L231)

___

### alignWide

• `Optional` `Readonly` **alignWide**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:232](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L232)

___

### anchor

• `Optional` `Readonly` **anchor**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:233](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L233)

___

### ariaLabel

• `Optional` `Readonly` **ariaLabel**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:234](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L234)

___

### border

• `Optional` `Readonly` **border**: `boolean` \| [`BlockBorderSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockBorderSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:235](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L235)

___

### className

• `Optional` `Readonly` **className**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:236](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L236)

___

### color

• `Optional` `Readonly` **color**: `boolean` \| [`BlockColorSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockColorSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:237](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L237)

___

### customClassName

• `Optional` `Readonly` **customClassName**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:238](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L238)

___

### dimensions

• `Optional` `Readonly` **dimensions**: `boolean` \| [`BlockDimensionsSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockDimensionsSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:239](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L239)

___

### filter

• `Optional` `Readonly` **filter**: `boolean` \| [`BlockFilterSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockFilterSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:240](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L240)

___

### html

• `Optional` `Readonly` **html**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:241](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L241)

___

### inserter

• `Optional` `Readonly` **inserter**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:242](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L242)

___

### interactivity

• `Optional` `Readonly` **interactivity**: `boolean` \| [`BlockInteractivitySupport`](packages_wp_typia_block_types_src_blocks_supports.BlockInteractivitySupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:243](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L243)

___

### layout

• `Optional` `Readonly` **layout**: `boolean` \| [`BlockLayoutSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockLayoutSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:244](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L244)

___

### lightbox

• `Optional` `Readonly` **lightbox**: `boolean` \| [`BlockLightboxSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockLightboxSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:245](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L245)

___

### lock

• `Optional` `Readonly` **lock**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:246](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L246)

___

### multiple

• `Optional` `Readonly` **multiple**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:247](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L247)

___

### position

• `Optional` `Readonly` **position**: `boolean` \| [`BlockPositionSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockPositionSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:248](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L248)

___

### renaming

• `Optional` `Readonly` **renaming**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:249](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L249)

___

### reusable

• `Optional` `Readonly` **reusable**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:250](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L250)

___

### shadow

• `Optional` `Readonly` **shadow**: `boolean` \| [`BlockShadowSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockShadowSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:251](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L251)

___

### spacing

• `Optional` `Readonly` **spacing**: `boolean` \| [`BlockSpacingSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockSpacingSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:252](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L252)

___

### typography

• `Optional` `Readonly` **typography**: `boolean` \| [`BlockTypographySupport`](packages_wp_typia_block_types_src_blocks_supports.BlockTypographySupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:253](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L253)
