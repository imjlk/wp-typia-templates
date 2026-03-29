[wp-typia - v1.0.0](../README.md) / [Modules](../modules.md) / packages/wp-typia-block-types/src/block-editor/color

# Module: packages/wp-typia-block-types/src/block-editor/color

## Table of contents

### Interfaces

- [DuotonePalette](../interfaces/packages_wp_typia_block_types_src_block_editor_color.DuotonePalette.md)

### Type Aliases

- [CssColorValue](packages_wp_typia_block_types_src_block_editor_color.md#csscolorvalue)
- [CssNamedColor](packages_wp_typia_block_types_src_block_editor_color.md#cssnamedcolor)

### Variables

- [CSS\_NAMED\_COLORS](packages_wp_typia_block_types_src_block_editor_color.md#css_named_colors)

## Type Aliases

### CssColorValue

Ƭ **CssColorValue**: \`#$\{string}\` \| \`rgb($\{string})\` \| \`rgba($\{string})\` \| \`hsl($\{string})\` \| \`hsla($\{string})\` \| \`var($\{string})\` \| \`color-mix($\{string})\` \| ``"transparent"`` \| ``"currentColor"``

Practical CSS color vocabulary used by block editor controls and theme.json values.

This is primarily a type-level DX helper today. Typia metadata generation does
not yet consume template literal aliases like `#${string}` or `rgb(${string})`
when they are imported into `types.ts`.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/color.ts:8](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/color.ts#L8)

___

### CssNamedColor

Ƭ **CssNamedColor**: ``"transparent"`` \| ``"currentColor"`` \| ``"inherit"`` \| ``"initial"`` \| ``"unset"``

Pipeline-compatible named-color subset for use in `types.ts`.

Prefer this alias when the value needs to flow through `sync-types`,
`typia.manifest.json`, and the generated PHP validator unchanged.

#### Defined in

[packages/wp-typia-block-types/src/block-editor/color.ts:25](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/color.ts#L25)

## Variables

### CSS\_NAMED\_COLORS

• `Const` **CSS\_NAMED\_COLORS**: readonly [``"transparent"``, ``"currentColor"``, ``"inherit"``, ``"initial"``, ``"unset"``]

#### Defined in

[packages/wp-typia-block-types/src/block-editor/color.ts:32](https://github.com/imjlk/wp-typia/blob/main/packages/wp-typia-block-types/src/block-editor/color.ts#L32)
