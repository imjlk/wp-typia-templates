[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-types/src/block-editor/style-attributes

# Module: packages/wp-typia-block-types/src/block-editor/style-attributes

## Table of contents

### Interfaces

- [BlockLinkColorAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockLinkColorAttributes.md)
- [BlockElementsStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockElementsStyleAttributes.md)
- [BlockColorStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockColorStyleAttributes.md)
- [BlockBorderStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockBorderStyleAttributes.md)
- [BlockDimensionsStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockDimensionsStyleAttributes.md)
- [BlockSpacingStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockSpacingStyleAttributes.md)
- [BlockTypographyStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockTypographyStyleAttributes.md)
- [BlockPositionStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockPositionStyleAttributes.md)
- [BlockStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockStyleAttributes.md)
- [BlockColorSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockColorSupportAttributes.md)
- [BlockTypographySupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockTypographySupportAttributes.md)
- [BlockSpacingSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockSpacingSupportAttributes.md)
- [BlockDimensionsSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockDimensionsSupportAttributes.md)
- [BlockBorderSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockBorderSupportAttributes.md)
- [BlockStyleSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockStyleSupportAttributes.md)

### Type Aliases

- [PresetColorReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetcolorreference)
- [PresetGradientReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetgradientreference)
- [PresetFontFamilyReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontfamilyreference)
- [PresetFontSizeReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontsizereference)
- [BlockColorSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockcolorslug)
- [BlockGradientSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockgradientslug)
- [BlockFontFamilySlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockfontfamilyslug)
- [BlockFontSizeSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockfontsizeslug)
- [BlockStyleColorValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylecolorvalue)
- [BlockStyleGradientValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylegradientvalue)
- [BlockStyleFontSizeValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylefontsizevalue)
- [BlockStyleFontFamilyValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylefontfamilyvalue)
- [BlockStyleSpacingValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylespacingvalue)
- [BlockStyleBorderWidthValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstyleborderwidthvalue)
- [BlockStyleBorderRadiusValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstyleborderradiusvalue)

## Type Aliases

### PresetColorReference

Ƭ **PresetColorReference**: \`var:preset\|color\|$\{string}\`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L16)

___

### PresetGradientReference

Ƭ **PresetGradientReference**: \`var:preset\|gradient\|$\{string}\`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:17](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L17)

___

### PresetFontFamilyReference

Ƭ **PresetFontFamilyReference**: \`var:preset\|font-family\|$\{string}\`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:18](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L18)

___

### PresetFontSizeReference

Ƭ **PresetFontSizeReference**: \`var:preset\|font-size\|$\{string}\`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:19](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L19)

___

### BlockColorSlug

Ƭ **BlockColorSlug**: `string`

Slug-like attributes that WordPress stores outside the `style` object when a
support value maps to a named preset instead of a literal CSS value.

These stay intentionally broad and pipeline-compatible so generated metadata
can still flow through Typia's current source analysis. They currently carry
semantic intent without narrowing beyond `string`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:29](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L29)

___

### BlockGradientSlug

Ƭ **BlockGradientSlug**: `string`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:30](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L30)

___

### BlockFontFamilySlug

Ƭ **BlockFontFamilySlug**: `string`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:31](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L31)

___

### BlockFontSizeSlug

Ƭ **BlockFontSizeSlug**: `string`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L32)

___

### BlockStyleColorValue

Ƭ **BlockStyleColorValue**: [`CssColorValue`](packages_wp_typia_block_types_src_block_editor_color.md#csscolorvalue) \| [`PresetColorReference`](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetcolorreference)

Rich style-level color values that mirror the strings Gutenberg stores inside
the `style` attribute when a block uses color support.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:38](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L38)

___

### BlockStyleGradientValue

Ƭ **BlockStyleGradientValue**: \`linear-gradient($\{string})\` \| \`radial-gradient($\{string})\` \| \`conic-gradient($\{string})\` \| [`PresetGradientReference`](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetgradientreference)

Practical gradient vocabulary for block support `style.color.gradient`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:43](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L43)

___

### BlockStyleFontSizeValue

Ƭ **BlockStyleFontSizeValue**: `string` \| [`PresetFontSizeReference`](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontsizereference)

Typography values stored under `style.typography.*`.

These are DX-oriented string surfaces. When the values must round-trip
through Typia metadata generation, prefer explicit `string` constraints in
project-authored `types.ts`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:56](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L56)

___

### BlockStyleFontFamilyValue

Ƭ **BlockStyleFontFamilyValue**: `string` \| [`PresetFontFamilyReference`](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontfamilyreference)

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:57](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L57)

___

### BlockStyleSpacingValue

Ƭ **BlockStyleSpacingValue**: `string` \| `number`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:58](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L58)

___

### BlockStyleBorderWidthValue

Ƭ **BlockStyleBorderWidthValue**: `string` \| `number`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:59](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L59)

___

### BlockStyleBorderRadiusValue

Ƭ **BlockStyleBorderRadiusValue**: `string` \| `number`

#### Defined in

[packages/wp-typia-block-types/src/block-editor/style-attributes.ts:60](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/style-attributes.ts#L60)
