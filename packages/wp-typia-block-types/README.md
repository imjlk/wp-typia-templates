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
- `@wp-typia/block-types/block-editor/style-attributes`
- `@wp-typia/block-types/block-editor/typography`
- `@wp-typia/block-types/blocks`
- `@wp-typia/block-types/blocks/compatibility`
- `@wp-typia/block-types/blocks/registration`
- `@wp-typia/block-types/blocks/supports`

## Current policy

- alignment types reuse `@types/wordpress__block-editor` where a narrow union already exists
- layout, spacing, typography, and supports types are curated from Gutenberg source when no stable unofficial narrow export exists
- registration-facing block types are exposed through a local facade that currently adapts the upstream `@wordpress/blocks` declarations behind a stable `@wp-typia/block-types/blocks/registration` boundary
- every exported tuple has a matching exported type alias so templates can share both values and semantics
- this package is publish-ready, but scaffolded projects will switch to semver usage in the same round

## Current v1 areas

- block editor alignment and content-position values
- color and dimensions helper types
- layout and flex vocabulary
- spacing sides and axes
- support-generated block style attribute helpers
- typography enums used by core block supports
- structural block support types for `block.json`
- registration-facing block types for `registerBlockType(...)`,
  `BlockEditProps`, `BlockSaveProps`, `BlockVariation`, deprecations, and
  migration-facing `BlockInstance`
- additive stable Core coverage for drop caps, spacing sizes, layout gaps,
  duotone, per-side border widths, and `js` / `locking`
- a WordPress block API compatibility matrix for Supports, Variations, and
  Bindings features that codegen and diagnostics can share

## Registration facade

Generated scaffolds and reference apps should prefer the local registration
facade over direct type imports from `@wordpress/blocks`:

```ts
import type {
  BlockConfiguration,
  BlockEditProps,
  BlockInstance,
  BlockVariation,
  RegisterBlockTypeResult,
} from '@wp-typia/block-types/blocks/registration';
```

The facade is locally owned but targets the current generated-project minimum
WordPress blocks baseline:

- `@wordpress/blocks@^15.2.0`
- `@types/wordpress__blocks@^12.5.18`

The package manifest declares the same pair as peer dependencies so downstream
TypeScript installs surface the requirement explicitly.

Compatibility should track that floor unless the generated project dependency
matrix changes in the same release.

## WordPress block API compatibility

`@wp-typia/block-types/blocks/compatibility` exposes the shared compatibility
foundation used by future block Supports, Variations, and Bindings helpers.
The matrix records documented WordPress version floors, runtime surfaces, derived
attributes, fallback hints, and source URLs for feature checks.

```ts
import { createWordPressBlockApiCompatibilityManifest } from '@wp-typia/block-types/blocks/compatibility';

const manifest = createWordPressBlockApiCompatibilityManifest(
  [
    { area: 'blockSupports', feature: 'allowedBlocks' },
    { area: 'blockBindings', feature: 'editorRegistration' },
  ],
  {
    minVersion: '6.7',
    strict: true,
    allowUnknownFutureKeys: false,
  },
);
```

Strict mode marks known unsupported features as errors and recommends skipping
generation. Non-strict mode downgrades them to warnings and recommends guarded
generation. Unknown future keys are guarded by default, or passed through only
when `allowUnknownFutureKeys` is enabled.

## Validation coverage

`@wp-typia/block-types` now validates itself with a mixed strategy that matches
the package surface:

- runtime/export-contract tests verify the published subpath map, ESM-safe
  built re-exports, and the tuple/helper values that downstream packages import
  at runtime
- compile-time fixture tests verify the most-used public type surfaces through
  package-style imports, including block registration facades and style/support
  helpers

This keeps the package failing fast on its own instead of relying on downstream
breakage in scaffold or runtime packages.

## WordPress style support helpers

The package now exposes three complementary surfaces:

- `@wp-typia/block-types/blocks/supports` for typed `block.json` `supports`,
  the `defineSupports()` helper, and `SupportAttributes<typeof supports>`
- `@wp-typia/block-types/block-editor/style-attributes` for the attribute and `style` shapes WordPress injects when those supports are enabled
- `@wp-typia/block-types/blocks/compatibility` for version-aware diagnostics
  when a support key requires a newer WordPress floor

Example:

```ts
import {
  defineSupports,
  type SupportAttributes,
} from '@wp-typia/block-types/blocks/supports';

const supports = defineSupports({
  minWordPress: '6.6',
  color: { text: true, background: true },
  spacing: {
    padding: true,
    margin: true,
    blockGap: true,
  },
  typography: {
    fontSize: true,
    lineHeight: true,
    letterSpacing: true,
    textAlign: ['left', 'center'],
  },
  layout: {
    default: {
      type: 'constrained',
    },
  },
  anchor: true,
  html: false,
});

type OwnAttributes = {
  content: string;
  density: 'compact' | 'balanced' | 'airy';
};

type BlockAttributes = OwnAttributes & SupportAttributes<typeof supports>;
```

`defineSupports()` returns a plain object that can be written directly to
`block.json.supports`; inline helper controls such as `minWordPress`, `strict`,
and `allowUnknownFutureKeys` are stripped from the returned metadata. The helper
stores its compatibility manifest on a non-enumerable symbol so generated JSON
stays clean while tests and codegen can still inspect diagnostics through
`getDefinedSupportsCompatibilityManifest()`.

Strict mode is enabled by default. Known support keys that require a newer
WordPress version throw, while `strict: false` reports warnings through
`onDiagnostic` and keeps the metadata pass-through. Unknown future top-level
support keys are rejected unless `allowUnknownFutureKeys` is enabled.

`SupportAttributes<typeof supports>` is intentionally conservative where
Gutenberg behavior is broad. Enabling color, spacing, typography, border,
dimensions, background, filter duotone, position, or shadow includes the shared
`style` attribute shape. Typography also exposes slug attributes such as
`fontSize` and `fontFamily` when typography support is enabled; the compatibility
matrix tracks version-gated typography keys like `textAlign` separately from
longstanding keys such as `dropCap`.

Stable Core coverage now also includes support/style helpers for layout
`rowGap` / `columnGap`, color `duotone`, per-side border widths, and other
recently stabilized support keys.

`__experimentalSkipSerialization` is also typed on selected support sections
for blocks that compute style output on the server. This follows Gutenberg's
current experimental surface and should not be treated as a long-term
stability guarantee.

## Typia pipeline notes

- `CssColorValue` and `MinHeightValue` are richer DX aliases that currently rely on template literal types.
- `BlockStyleAttributes` also contains template-literal-style preset references such as `var:preset|color|...` for editor/runtime DX.
- imported template literal aliases are not yet consumed by the `sync-types` metadata pipeline
- when a type must round-trip through `types.ts` -> `typia.manifest.json` -> `typia-validator.php`, prefer pipeline-compatible aliases such as `CssNamedColor` and `MinHeightKeyword`
- for broader CSS-like string shapes in `types.ts`, prefer native Typia constraints on `string`, for example `string & tags.Pattern<"..."> & tags.MaxLength<...>`
