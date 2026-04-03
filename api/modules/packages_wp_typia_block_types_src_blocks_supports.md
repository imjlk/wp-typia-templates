[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-types/src/blocks/supports

# Module: packages/wp-typia-block-types/src/blocks/supports

## Table of contents

### Interfaces

- [BlockBorderSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockBorderSupport.md)
- [BlockColorSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockColorSupport.md)
- [BlockDimensionsSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockDimensionsSupport.md)
- [BlockFilterSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockFilterSupport.md)
- [BlockInteractivitySupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockInteractivitySupport.md)
- [BlockLayoutDefault](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockLayoutDefault.md)
- [BlockLayoutSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockLayoutSupport.md)
- [BlockLightboxSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockLightboxSupport.md)
- [BlockPositionSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockPositionSupport.md)
- [BlockShadowSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockShadowSupport.md)
- [BlockSpacingSupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockSpacingSupport.md)
- [BlockTypographySupport](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockTypographySupport.md)
- [BlockSupports](../interfaces/packages_wp_typia_block_types_src_blocks_supports.BlockSupports.md)

### Type Aliases

- [BlockSupportFeature](packages_wp_typia_block_types_src_blocks_supports.md#blocksupportfeature)
- [TypographySupportKey](packages_wp_typia_block_types_src_blocks_supports.md#typographysupportkey)
- [SpacingSupportKey](packages_wp_typia_block_types_src_blocks_supports.md#spacingsupportkey)

### Variables

- [BLOCK\_SUPPORT\_FEATURES](packages_wp_typia_block_types_src_blocks_supports.md#block_support_features)
- [TYPOGRAPHY\_SUPPORT\_KEYS](packages_wp_typia_block_types_src_blocks_supports.md#typography_support_keys)
- [SPACING\_SUPPORT\_KEYS](packages_wp_typia_block_types_src_blocks_supports.md#spacing_support_keys)

## Type Aliases

### BlockSupportFeature

Ƭ **BlockSupportFeature**: ``"align"`` \| ``"alignWide"`` \| ``"anchor"`` \| ``"ariaLabel"`` \| ``"border"`` \| ``"className"`` \| ``"color"`` \| ``"customClassName"`` \| ``"dimensions"`` \| ``"filter"`` \| ``"html"`` \| ``"inserter"`` \| ``"interactivity"`` \| ``"layout"`` \| ``"lightbox"`` \| ``"lock"`` \| ``"multiple"`` \| ``"position"`` \| ``"renaming"`` \| ``"reusable"`` \| ``"shadow"`` \| ``"spacing"`` \| ``"typography"``

Derived from Gutenberg block support keys and commonly used block.json
support sections.

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L17)

___

### TypographySupportKey

Ƭ **TypographySupportKey**: ``"fontFamily"`` \| ``"fontSize"`` \| ``"fontStyle"`` \| ``"fontWeight"`` \| ``"letterSpacing"`` \| ``"lineHeight"`` \| ``"textAlign"`` \| ``"textColumns"`` \| ``"textDecoration"`` \| ``"textTransform"`` \| ``"writingMode"``

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:68](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L68)

___

### SpacingSupportKey

Ƭ **SpacingSupportKey**: ``"blockGap"`` \| ``"margin"`` \| ``"padding"``

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:95](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L95)

## Variables

### BLOCK\_SUPPORT\_FEATURES

• `Const` **BLOCK\_SUPPORT\_FEATURES**: readonly [``"align"``, ``"alignWide"``, ``"anchor"``, ``"ariaLabel"``, ``"border"``, ``"className"``, ``"color"``, ``"customClassName"``, ``"dimensions"``, ``"filter"``, ``"html"``, ``"inserter"``, ``"interactivity"``, ``"layout"``, ``"lightbox"``, ``"lock"``, ``"multiple"``, ``"position"``, ``"renaming"``, ``"reusable"``, ``"shadow"``, ``"spacing"``, ``"typography"``]

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:42](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L42)

___

### TYPOGRAPHY\_SUPPORT\_KEYS

• `Const` **TYPOGRAPHY\_SUPPORT\_KEYS**: readonly [``"fontFamily"``, ``"fontSize"``, ``"fontStyle"``, ``"fontWeight"``, ``"letterSpacing"``, ``"lineHeight"``, ``"textAlign"``, ``"textColumns"``, ``"textDecoration"``, ``"textTransform"``, ``"writingMode"``]

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:81](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L81)

___

### SPACING\_SUPPORT\_KEYS

• `Const` **SPACING\_SUPPORT\_KEYS**: readonly [``"blockGap"``, ``"margin"``, ``"padding"``]

#### Defined in

[packages/wp-typia-block-types/src/blocks/supports.ts:97](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/blocks/supports.ts#L97)
