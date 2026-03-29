[WordPress Typia Boilerplate - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-types/src/block-editor/dimensions

# Module: packages/wp-typia-block-types/src/block-editor/dimensions

## Table of contents

### Type Aliases

- [AspectRatio](packages_wp_typia_block_types_src_block_editor_dimensions.md#aspectratio)
- [MinHeightValue](packages_wp_typia_block_types_src_block_editor_dimensions.md#minheightvalue)
- [MinHeightKeyword](packages_wp_typia_block_types_src_block_editor_dimensions.md#minheightkeyword)

### Variables

- [ASPECT\_RATIOS](packages_wp_typia_block_types_src_block_editor_dimensions.md#aspect_ratios)
- [MIN\_HEIGHT\_KEYWORDS](packages_wp_typia_block_types_src_block_editor_dimensions.md#min_height_keywords)

## Type Aliases

### AspectRatio

Ƭ **AspectRatio**: ``"auto"`` \| ``"1"`` \| ``"1/1"`` \| ``"4/3"`` \| ``"3/4"`` \| ``"3/2"`` \| ``"2/3"`` \| ``"16/9"`` \| ``"9/16"`` \| ``"21/9"``

Derived from Gutenberg aspect ratio presets and dimensions controls.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/dimensions.ts:4](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/dimensions.ts#L4)

___

### MinHeightValue

Ƭ **MinHeightValue**: \`$\{number}px\` \| \`$\{number}rem\` \| \`$\{number}em\` \| \`$\{number}%\` \| \`$\{number}vh\` \| \`$\{number}vw\` \| \`var($\{string})\` \| \`clamp($\{string})\` \| \`min($\{string})\` \| \`max($\{string})\`

Practical min-height value surface for WordPress dimension controls.

This is primarily a type-level DX helper today. Typia metadata generation does
not yet consume imported template literal aliases such as `${number}px`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/dimensions.ts:35](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/dimensions.ts#L35)

___

### MinHeightKeyword

Ƭ **MinHeightKeyword**: ``"auto"`` \| ``"inherit"`` \| ``"initial"`` \| ``"unset"``

Pipeline-compatible min-height keyword subset for use in `types.ts`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/dimensions.ts:50](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/dimensions.ts#L50)

## Variables

### ASPECT\_RATIOS

• `Const` **ASPECT\_RATIOS**: readonly [``"auto"``, ``"1"``, ``"1/1"``, ``"4/3"``, ``"3/4"``, ``"3/2"``, ``"2/3"``, ``"16/9"``, ``"9/16"``, ``"21/9"``]

#### Defined in

[packages/wp-typia-block-types/src/block-editor/dimensions.ts:16](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/dimensions.ts#L16)

___

### MIN\_HEIGHT\_KEYWORDS

• `Const` **MIN\_HEIGHT\_KEYWORDS**: readonly [``"auto"``, ``"inherit"``, ``"initial"``, ``"unset"``]

#### Defined in

[packages/wp-typia-block-types/src/block-editor/dimensions.ts:52](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/dimensions.ts#L52)
