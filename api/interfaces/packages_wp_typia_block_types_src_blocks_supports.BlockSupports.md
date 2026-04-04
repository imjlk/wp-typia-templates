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
- [background](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#background)
- [border](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#border)
- [className](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#classname)
- [color](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#color)
- [customClassName](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#customclassname)
- [dimensions](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#dimensions)
- [filter](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#filter)
- [html](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#html)
- [inserter](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#inserter)
- [interactivity](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#interactivity)
- [js](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#js)
- [layout](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#layout)
- [lightbox](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#lightbox)
- [lock](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#lock)
- [locking](packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md#locking)
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

[packages/wp-typia-block-types/src/blocks/supports.ts:268](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L268)

___

### alignWide

• `Optional` `Readonly` **alignWide**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:269](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L269)

___

### anchor

• `Optional` `Readonly` **anchor**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:270](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L270)

___

### ariaLabel

• `Optional` `Readonly` **ariaLabel**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:271](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L271)

___

### background

• `Optional` `Readonly` **background**: `boolean` \| [`BlockBackgroundSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockBackgroundSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:272](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L272)

___

### border

• `Optional` `Readonly` **border**: `boolean` \| [`BlockBorderSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockBorderSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:273](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L273)

___

### className

• `Optional` `Readonly` **className**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:274](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L274)

___

### color

• `Optional` `Readonly` **color**: `boolean` \| [`BlockColorSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockColorSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:275](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L275)

___

### customClassName

• `Optional` `Readonly` **customClassName**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:276](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L276)

___

### dimensions

• `Optional` `Readonly` **dimensions**: `boolean` \| [`BlockDimensionsSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockDimensionsSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:277](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L277)

___

### filter

• `Optional` `Readonly` **filter**: `boolean` \| [`BlockFilterSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockFilterSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:278](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L278)

___

### html

• `Optional` `Readonly` **html**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:279](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L279)

___

### inserter

• `Optional` `Readonly` **inserter**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:280](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L280)

___

### interactivity

• `Optional` `Readonly` **interactivity**: `boolean` \| [`BlockInteractivitySupport`](packages_wp_typia_block_types_src_blocks_supports.BlockInteractivitySupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:281](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L281)

___

### js

• `Optional` `Readonly` **js**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:282](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L282)

___

### layout

• `Optional` `Readonly` **layout**: `boolean` \| [`BlockLayoutSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockLayoutSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:283](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L283)

___

### lightbox

• `Optional` `Readonly` **lightbox**: `boolean` \| [`BlockLightboxSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockLightboxSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:284](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L284)

___

### lock

• `Optional` `Readonly` **lock**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:285](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L285)

___

### locking

• `Optional` `Readonly` **locking**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:286](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L286)

___

### multiple

• `Optional` `Readonly` **multiple**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:287](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L287)

___

### position

• `Optional` `Readonly` **position**: `boolean` \| [`BlockPositionSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockPositionSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:288](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L288)

___

### renaming

• `Optional` `Readonly` **renaming**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:289](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L289)

___

### reusable

• `Optional` `Readonly` **reusable**: `boolean`

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:290](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L290)

___

### shadow

• `Optional` `Readonly` **shadow**: `boolean` \| [`BlockShadowSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockShadowSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:291](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L291)

___

### spacing

• `Optional` `Readonly` **spacing**: `boolean` \| [`BlockSpacingSupport`](packages_wp_typia_block_types_src_blocks_supports.BlockSpacingSupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:292](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L292)

___

### typography

• `Optional` `Readonly` **typography**: `boolean` \| [`BlockTypographySupport`](packages_wp_typia_block_types_src_blocks_supports.BlockTypographySupport.md)

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:293](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L293)
