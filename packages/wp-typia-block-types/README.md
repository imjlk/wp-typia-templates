# `@wp-typia/block-types`

Shared WordPress block semantic types derived from Gutenberg source and unofficial type declarations.

## Goals

- reuse unofficial WordPress type declarations where they already exist
- add the smallest possible project-owned aliases where they do not
- keep the package split by WordPress package/topic instead of collapsing everything into one file

## Current exports

- `@wp-typia/block-types`
- `@wp-typia/block-types/block-editor`
- `@wp-typia/block-types/block-editor/alignment`
- `@wp-typia/block-types/block-editor/layout`
- `@wp-typia/block-types/block-editor/spacing`
- `@wp-typia/block-types/block-editor/typography`
- `@wp-typia/block-types/blocks`
- `@wp-typia/block-types/blocks/supports`

## Current policy

- alignment types reuse `@types/wordpress__block-editor` where a narrow union already exists
- layout, spacing, typography, and supports types are curated from Gutenberg source when no stable unofficial narrow export exists
- every exported tuple has a matching exported type alias so templates can share both values and semantics
- this package is publish-ready, but scaffolded projects will switch to semver usage in the same round

## Current v1 areas

- block editor alignment and content-position values
- color and dimensions helper types
- layout and flex vocabulary
- spacing sides and axes
- typography enums used by core block supports
- block support keys used by `block.json`

## Typia pipeline notes

- `CssColorValue` and `MinHeightValue` are richer DX aliases that currently rely on template literal types.
- imported template literal aliases are not yet consumed by the `sync-types` metadata pipeline
- when a type must round-trip through `types.ts` -> `typia.manifest.json` -> `typia-validator.php`, prefer pipeline-compatible aliases such as `CssNamedColor` and `MinHeightKeyword`
- for broader CSS-like string shapes in `types.ts`, prefer native Typia constraints on `string`, for example `string & tags.Pattern<"..."> & tags.MaxLength<...>`
