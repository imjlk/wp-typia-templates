# Block Generator Service

`BlockGeneratorService` is the typed generation boundary for built-in
`wp-typia` block scaffolds.

For the higher-level architecture record, phase map, and AI/tool-facing staged
usage model, see
[`docs/block-generator-architecture.md`](./block-generator-architecture.md).
For the public non-mutating tool/controller contract, see
[`docs/block-generator-tool-contract.md`](./block-generator-tool-contract.md).

## Current responsibility split

- `BlockSpec`
  Normalized semantic source of truth for a built-in block scaffold request.
- `BlockGeneratorService.plan`
  Normalizes built-in scaffold inputs into a `BlockSpec`.
- `BlockGeneratorService.validate`
  Preserves built-in scaffold invariants before rendering.
- `BlockGeneratorService.render`
  Resolves the built-in template root and produces render/apply intent,
  including template variables, emitter-owned structural/source artifacts,
  README/gitignore content, and post-render hooks.
- `BlockGeneratorService.apply`
  Copies the built-in template, overwrites emitter-owned `types.ts`,
  `block.json`, built-in TS/TSX scaffold bodies, built-in styles, and
  block-local `render.php`, writes starter manifests from the same structural
  model, seeds persistence artifacts when needed, applies migration/local-dev
  capabilities, normalizes package-manager files, and optionally installs
  dependencies.

## Current render policy

The current generator keeps built-in block source artifacts on typed emitters
without migrating external template composition or shared project/bootstrap
assets away from Mustache.

- `types.ts`, `block.json`, built-in TS/TSX scaffold bodies, built-in
  `style.scss` / `editor.scss`, and built-in block-local `render.php` are now
  emitter-owned for all built-in block families.
- built-in templates no longer ship structural, TS/TSX, style, or block-local
  `render.php` Mustache files for those artifacts.
- starter `typia.manifest.json` files reuse the same structural artifact model.
- project bootstrap/package-manager files, sync scripts, shared REST helpers,
  and external layer package copy still come from Mustache/interpolated
  directory copy.

## Out of scope

- richer interactive discovery/selection UX for external layer packages
- non-block `wp-typia add` generators such as variations, patterns,
  binding-sources, and hooked-blocks
- full template-engine replacement
- AST emitter migration

External layer composition now rides the same generator boundary for both the
canonical built-in CLI flags and programmatic callers. Built-in families can
accept `externalLayerSource` and optional `externalLayerId`, while the
remaining interactive selection questions live in
[`docs/external-template-layer-composition.md`](./external-template-layer-composition.md).
