# Block Generator Service

`BlockGeneratorService` is the Phase 1 typed generation boundary for built-in
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
  including template variables, README/gitignore content, and post-render hooks.
- `BlockGeneratorService.apply`
  Copies the built-in template, writes starter manifests, seeds persistence
  artifacts when needed, applies migration/local-dev capabilities, normalizes
  package-manager files, and optionally installs dependencies.

## Phase 1 render policy

Phase 1 does not migrate major scaffold file bodies away from Mustache.

- `types.ts`, `block.json`, `edit.tsx`, and `save.tsx` remain Mustache-rendered
  today.
- The service boundary exists so later work can move those structural files to
  emitters without reworking CLI and scaffold orchestration again.

## Out of scope in Phase 1

- external template composition
- non-block `wp-typia add` generators such as variations, patterns,
  binding-sources, and hooked-blocks
- template-engine replacement
- AST emitter migration
