[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-types/src/block-editor

# Module: packages/wp-typia-block-types/src/block-editor

## Table of contents

### References

- [BlockAlignment](packages_wp_typia_block_types_src_block_editor.md#blockalignment)
- [BLOCK\_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor.md#block_alignments)
- [TextAlignment](packages_wp_typia_block_types_src_block_editor.md#textalignment)
- [TEXT\_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor.md#text_alignments)
- [BlockVerticalAlignment](packages_wp_typia_block_types_src_block_editor.md#blockverticalalignment)
- [BLOCK\_VERTICAL\_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor.md#block_vertical_alignments)
- [JustifyContent](packages_wp_typia_block_types_src_block_editor.md#justifycontent)
- [JUSTIFY\_CONTENT\_OPTIONS](packages_wp_typia_block_types_src_block_editor.md#justify_content_options)
- [BlockContentPosition](packages_wp_typia_block_types_src_block_editor.md#blockcontentposition)
- [BLOCK\_CONTENT\_POSITIONS](packages_wp_typia_block_types_src_block_editor.md#block_content_positions)
- [CssColorValue](packages_wp_typia_block_types_src_block_editor.md#csscolorvalue)
- [CssNamedColor](packages_wp_typia_block_types_src_block_editor.md#cssnamedcolor)
- [CSS\_NAMED\_COLORS](packages_wp_typia_block_types_src_block_editor.md#css_named_colors)
- [DuotonePalette](packages_wp_typia_block_types_src_block_editor.md#duotonepalette)
- [AspectRatio](packages_wp_typia_block_types_src_block_editor.md#aspectratio)
- [ASPECT\_RATIOS](packages_wp_typia_block_types_src_block_editor.md#aspect_ratios)
- [MinHeightValue](packages_wp_typia_block_types_src_block_editor.md#minheightvalue)
- [MinHeightKeyword](packages_wp_typia_block_types_src_block_editor.md#minheightkeyword)
- [MIN\_HEIGHT\_KEYWORDS](packages_wp_typia_block_types_src_block_editor.md#min_height_keywords)
- [LayoutType](packages_wp_typia_block_types_src_block_editor.md#layouttype)
- [LAYOUT\_TYPES](packages_wp_typia_block_types_src_block_editor.md#layout_types)
- [FlexWrap](packages_wp_typia_block_types_src_block_editor.md#flexwrap)
- [FLEX\_WRAP\_OPTIONS](packages_wp_typia_block_types_src_block_editor.md#flex_wrap_options)
- [Orientation](packages_wp_typia_block_types_src_block_editor.md#orientation)
- [ORIENTATIONS](packages_wp_typia_block_types_src_block_editor.md#orientations)
- [SpacingSide](packages_wp_typia_block_types_src_block_editor.md#spacingside)
- [SPACING\_SIDES](packages_wp_typia_block_types_src_block_editor.md#spacing_sides)
- [SpacingAxis](packages_wp_typia_block_types_src_block_editor.md#spacingaxis)
- [SPACING\_AXES](packages_wp_typia_block_types_src_block_editor.md#spacing_axes)
- [SpacingDimension](packages_wp_typia_block_types_src_block_editor.md#spacingdimension)
- [SPACING\_DIMENSIONS](packages_wp_typia_block_types_src_block_editor.md#spacing_dimensions)
- [PresetColorReference](packages_wp_typia_block_types_src_block_editor.md#presetcolorreference)
- [PresetGradientReference](packages_wp_typia_block_types_src_block_editor.md#presetgradientreference)
- [PresetFontFamilyReference](packages_wp_typia_block_types_src_block_editor.md#presetfontfamilyreference)
- [PresetFontSizeReference](packages_wp_typia_block_types_src_block_editor.md#presetfontsizereference)
- [BlockColorSlug](packages_wp_typia_block_types_src_block_editor.md#blockcolorslug)
- [BlockGradientSlug](packages_wp_typia_block_types_src_block_editor.md#blockgradientslug)
- [BlockFontFamilySlug](packages_wp_typia_block_types_src_block_editor.md#blockfontfamilyslug)
- [BlockFontSizeSlug](packages_wp_typia_block_types_src_block_editor.md#blockfontsizeslug)
- [BlockStyleColorValue](packages_wp_typia_block_types_src_block_editor.md#blockstylecolorvalue)
- [BlockStyleGradientValue](packages_wp_typia_block_types_src_block_editor.md#blockstylegradientvalue)
- [BlockStyleFontSizeValue](packages_wp_typia_block_types_src_block_editor.md#blockstylefontsizevalue)
- [BlockStyleFontFamilyValue](packages_wp_typia_block_types_src_block_editor.md#blockstylefontfamilyvalue)
- [BlockStyleSpacingValue](packages_wp_typia_block_types_src_block_editor.md#blockstylespacingvalue)
- [BlockStyleBorderWidthValue](packages_wp_typia_block_types_src_block_editor.md#blockstyleborderwidthvalue)
- [BlockStyleBorderRadiusValue](packages_wp_typia_block_types_src_block_editor.md#blockstyleborderradiusvalue)
- [BlockLinkColorAttributes](packages_wp_typia_block_types_src_block_editor.md#blocklinkcolorattributes)
- [BlockElementsStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockelementsstyleattributes)
- [BlockColorStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockcolorstyleattributes)
- [BlockBorderStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockborderstyleattributes)
- [BlockDimensionsStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockdimensionsstyleattributes)
- [BlockSpacingStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockspacingstyleattributes)
- [BlockTypographyStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blocktypographystyleattributes)
- [BlockPositionStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockpositionstyleattributes)
- [BlockStyleAttributes](packages_wp_typia_block_types_src_block_editor.md#blockstyleattributes)
- [BlockColorSupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blockcolorsupportattributes)
- [BlockTypographySupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blocktypographysupportattributes)
- [BlockSpacingSupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blockspacingsupportattributes)
- [BlockDimensionsSupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blockdimensionssupportattributes)
- [BlockBorderSupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blockbordersupportattributes)
- [BlockStyleSupportAttributes](packages_wp_typia_block_types_src_block_editor.md#blockstylesupportattributes)
- [TextTransform](packages_wp_typia_block_types_src_block_editor.md#texttransform)
- [TEXT\_TRANSFORMS](packages_wp_typia_block_types_src_block_editor.md#text_transforms)
- [TextDecoration](packages_wp_typia_block_types_src_block_editor.md#textdecoration)
- [TEXT\_DECORATIONS](packages_wp_typia_block_types_src_block_editor.md#text_decorations)
- [FontStyle](packages_wp_typia_block_types_src_block_editor.md#fontstyle)
- [FONT\_STYLES](packages_wp_typia_block_types_src_block_editor.md#font_styles)
- [WritingMode](packages_wp_typia_block_types_src_block_editor.md#writingmode)
- [WRITING\_MODES](packages_wp_typia_block_types_src_block_editor.md#writing_modes)

## References

### BlockAlignment

Re-exports [BlockAlignment](packages_wp_typia_block_types_src_block_editor_alignment.md#blockalignment)

___

### BLOCK\_ALIGNMENTS

Re-exports [BLOCK_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor_alignment.md#block_alignments)

___

### TextAlignment

Re-exports [TextAlignment](packages_wp_typia_block_types_src_block_editor_alignment.md#textalignment)

___

### TEXT\_ALIGNMENTS

Re-exports [TEXT_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor_alignment.md#text_alignments)

___

### BlockVerticalAlignment

Re-exports [BlockVerticalAlignment](packages_wp_typia_block_types_src_block_editor_alignment.md#blockverticalalignment)

___

### BLOCK\_VERTICAL\_ALIGNMENTS

Re-exports [BLOCK_VERTICAL_ALIGNMENTS](packages_wp_typia_block_types_src_block_editor_alignment.md#block_vertical_alignments)

___

### JustifyContent

Re-exports [JustifyContent](packages_wp_typia_block_types_src_block_editor_alignment.md#justifycontent)

___

### JUSTIFY\_CONTENT\_OPTIONS

Re-exports [JUSTIFY_CONTENT_OPTIONS](packages_wp_typia_block_types_src_block_editor_alignment.md#justify_content_options)

___

### BlockContentPosition

Re-exports [BlockContentPosition](packages_wp_typia_block_types_src_block_editor_alignment.md#blockcontentposition)

___

### BLOCK\_CONTENT\_POSITIONS

Re-exports [BLOCK_CONTENT_POSITIONS](packages_wp_typia_block_types_src_block_editor_alignment.md#block_content_positions)

___

### CssColorValue

Re-exports [CssColorValue](packages_wp_typia_block_types_src_block_editor_color.md#csscolorvalue)

___

### CssNamedColor

Re-exports [CssNamedColor](packages_wp_typia_block_types_src_block_editor_color.md#cssnamedcolor)

___

### CSS\_NAMED\_COLORS

Re-exports [CSS_NAMED_COLORS](packages_wp_typia_block_types_src_block_editor_color.md#css_named_colors)

___

### DuotonePalette

Re-exports [DuotonePalette](../interfaces/packages_wp_typia_block_types_src_block_editor_color.DuotonePalette.md)

___

### AspectRatio

Re-exports [AspectRatio](packages_wp_typia_block_types_src_block_editor_dimensions.md#aspectratio)

___

### ASPECT\_RATIOS

Re-exports [ASPECT_RATIOS](packages_wp_typia_block_types_src_block_editor_dimensions.md#aspect_ratios)

___

### MinHeightValue

Re-exports [MinHeightValue](packages_wp_typia_block_types_src_block_editor_dimensions.md#minheightvalue)

___

### MinHeightKeyword

Re-exports [MinHeightKeyword](packages_wp_typia_block_types_src_block_editor_dimensions.md#minheightkeyword)

___

### MIN\_HEIGHT\_KEYWORDS

Re-exports [MIN_HEIGHT_KEYWORDS](packages_wp_typia_block_types_src_block_editor_dimensions.md#min_height_keywords)

___

### LayoutType

Re-exports [LayoutType](packages_wp_typia_block_types_src_block_editor_layout.md#layouttype)

___

### LAYOUT\_TYPES

Re-exports [LAYOUT_TYPES](packages_wp_typia_block_types_src_block_editor_layout.md#layout_types)

___

### FlexWrap

Re-exports [FlexWrap](packages_wp_typia_block_types_src_block_editor_layout.md#flexwrap)

___

### FLEX\_WRAP\_OPTIONS

Re-exports [FLEX_WRAP_OPTIONS](packages_wp_typia_block_types_src_block_editor_layout.md#flex_wrap_options)

___

### Orientation

Re-exports [Orientation](packages_wp_typia_block_types_src_block_editor_layout.md#orientation)

___

### ORIENTATIONS

Re-exports [ORIENTATIONS](packages_wp_typia_block_types_src_block_editor_layout.md#orientations)

___

### SpacingSide

Re-exports [SpacingSide](packages_wp_typia_block_types_src_block_editor_spacing.md#spacingside)

___

### SPACING\_SIDES

Re-exports [SPACING_SIDES](packages_wp_typia_block_types_src_block_editor_spacing.md#spacing_sides)

___

### SpacingAxis

Re-exports [SpacingAxis](packages_wp_typia_block_types_src_block_editor_spacing.md#spacingaxis)

___

### SPACING\_AXES

Re-exports [SPACING_AXES](packages_wp_typia_block_types_src_block_editor_spacing.md#spacing_axes)

___

### SpacingDimension

Re-exports [SpacingDimension](packages_wp_typia_block_types_src_block_editor_spacing.md#spacingdimension)

___

### SPACING\_DIMENSIONS

Re-exports [SPACING_DIMENSIONS](packages_wp_typia_block_types_src_block_editor_spacing.md#spacing_dimensions)

___

### PresetColorReference

Re-exports [PresetColorReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetcolorreference)

___

### PresetGradientReference

Re-exports [PresetGradientReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetgradientreference)

___

### PresetFontFamilyReference

Re-exports [PresetFontFamilyReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontfamilyreference)

___

### PresetFontSizeReference

Re-exports [PresetFontSizeReference](packages_wp_typia_block_types_src_block_editor_style_attributes.md#presetfontsizereference)

___

### BlockColorSlug

Re-exports [BlockColorSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockcolorslug)

___

### BlockGradientSlug

Re-exports [BlockGradientSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockgradientslug)

___

### BlockFontFamilySlug

Re-exports [BlockFontFamilySlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockfontfamilyslug)

___

### BlockFontSizeSlug

Re-exports [BlockFontSizeSlug](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockfontsizeslug)

___

### BlockStyleColorValue

Re-exports [BlockStyleColorValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylecolorvalue)

___

### BlockStyleGradientValue

Re-exports [BlockStyleGradientValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylegradientvalue)

___

### BlockStyleFontSizeValue

Re-exports [BlockStyleFontSizeValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylefontsizevalue)

___

### BlockStyleFontFamilyValue

Re-exports [BlockStyleFontFamilyValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylefontfamilyvalue)

___

### BlockStyleSpacingValue

Re-exports [BlockStyleSpacingValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstylespacingvalue)

___

### BlockStyleBorderWidthValue

Re-exports [BlockStyleBorderWidthValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstyleborderwidthvalue)

___

### BlockStyleBorderRadiusValue

Re-exports [BlockStyleBorderRadiusValue](packages_wp_typia_block_types_src_block_editor_style_attributes.md#blockstyleborderradiusvalue)

___

### BlockLinkColorAttributes

Re-exports [BlockLinkColorAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockLinkColorAttributes.md)

___

### BlockElementsStyleAttributes

Re-exports [BlockElementsStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockElementsStyleAttributes.md)

___

### BlockColorStyleAttributes

Re-exports [BlockColorStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockColorStyleAttributes.md)

___

### BlockBorderStyleAttributes

Re-exports [BlockBorderStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockBorderStyleAttributes.md)

___

### BlockDimensionsStyleAttributes

Re-exports [BlockDimensionsStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockDimensionsStyleAttributes.md)

___

### BlockSpacingStyleAttributes

Re-exports [BlockSpacingStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockSpacingStyleAttributes.md)

___

### BlockTypographyStyleAttributes

Re-exports [BlockTypographyStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockTypographyStyleAttributes.md)

___

### BlockPositionStyleAttributes

Re-exports [BlockPositionStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockPositionStyleAttributes.md)

___

### BlockStyleAttributes

Re-exports [BlockStyleAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockStyleAttributes.md)

___

### BlockColorSupportAttributes

Re-exports [BlockColorSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockColorSupportAttributes.md)

___

### BlockTypographySupportAttributes

Re-exports [BlockTypographySupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockTypographySupportAttributes.md)

___

### BlockSpacingSupportAttributes

Re-exports [BlockSpacingSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockSpacingSupportAttributes.md)

___

### BlockDimensionsSupportAttributes

Re-exports [BlockDimensionsSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockDimensionsSupportAttributes.md)

___

### BlockBorderSupportAttributes

Re-exports [BlockBorderSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockBorderSupportAttributes.md)

___

### BlockStyleSupportAttributes

Re-exports [BlockStyleSupportAttributes](../interfaces/packages_wp_typia_block_types_src_block_editor_style_attributes.BlockStyleSupportAttributes.md)

___

### TextTransform

Re-exports [TextTransform](packages_wp_typia_block_types_src_block_editor_typography.md#texttransform)

___

### TEXT\_TRANSFORMS

Re-exports [TEXT_TRANSFORMS](packages_wp_typia_block_types_src_block_editor_typography.md#text_transforms)

___

### TextDecoration

Re-exports [TextDecoration](packages_wp_typia_block_types_src_block_editor_typography.md#textdecoration)

___

### TEXT\_DECORATIONS

Re-exports [TEXT_DECORATIONS](packages_wp_typia_block_types_src_block_editor_typography.md#text_decorations)

___

### FontStyle

Re-exports [FontStyle](packages_wp_typia_block_types_src_block_editor_typography.md#fontstyle)

___

### FONT\_STYLES

Re-exports [FONT_STYLES](packages_wp_typia_block_types_src_block_editor_typography.md#font_styles)

___

### WritingMode

Re-exports [WritingMode](packages_wp_typia_block_types_src_block_editor_typography.md#writingmode)

___

### WRITING\_MODES

Re-exports [WRITING_MODES](packages_wp_typia_block_types_src_block_editor_typography.md#writing_modes)
