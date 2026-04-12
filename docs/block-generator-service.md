# Block Generator Service

`BlockGeneratorService` is the Phase 2 typed generation boundary for built-in
`wp-typia` block scaffolds.

## Current responsibility split

- `BlockSpec`
  Normalized semantic source of truth for a built-in block scaffold request.
- `BlockGeneratorService.plan`
  Normalizes built-in scaffold inputs into a `BlockSpec`.
- `BlockGeneratorService.validate`
  Preserves built-in scaffold invariants before rendering.
- `BlockGeneratorService.render`
  Resolves the built-in template root and produces render/apply intent,
  including template variables, emitter-owned structural artifacts,
  README/gitignore content, and post-render hooks.
- `BlockGeneratorService.apply`
  Copies the built-in template, overwrites emitter-owned `types.ts` and
  `block.json`, writes starter manifests from the same structural model, seeds
  persistence artifacts when needed, applies migration/local-dev capabilities,
  normalizes package-manager files, and optionally installs dependencies.

## Phase 2 render policy

Phase 2 moves structural artifacts to typed emitters without migrating the rest
of the scaffold body away from Mustache.

- `types.ts` and `block.json` are now emitter-owned for all built-in block
  families.
- starter `typia.manifest.json` files reuse the same structural artifact model.
- `edit.tsx`, `save.tsx`, `index.tsx`, and the remaining template files still
  come from Mustache/interpolated directory copy.

## Out of scope in Phase 2

- external template composition
- non-block `wp-typia add` generators such as variations, patterns,
  binding-sources, and hooked-blocks
- full template-engine replacement
- AST emitter migration
