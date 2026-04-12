# Block Generator Service

`BlockGeneratorService` is the typed generation boundary for built-in
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
  including template variables, emitter-owned structural/code artifacts,
  README/gitignore content, and post-render hooks.
- `BlockGeneratorService.apply`
  Copies the built-in template, overwrites emitter-owned `types.ts`,
  `block.json`, and built-in TS/TSX scaffold bodies, writes starter manifests
  from the same structural model, seeds persistence artifacts when needed,
  applies migration/local-dev capabilities, normalizes package-manager files,
  and optionally installs dependencies.

## Current render policy

The current generator keeps built-in structural artifacts and built-in TS/TSX
scaffold bodies on typed emitters without migrating styles/PHP or external
template composition away from Mustache.

- `types.ts`, `block.json`, and the built-in TS/TSX scaffold bodies are now
  emitter-owned for all built-in block families.
- built-in templates no longer ship structural or TS/TSX Mustache files for
  those artifacts.
- starter `typia.manifest.json` files reuse the same structural artifact model.
- built-in `style.scss`, `editor.scss`, `render.php`, and other non-TS assets
  still come from Mustache/interpolated directory copy.

## Out of scope

- external template composition
- non-block `wp-typia add` generators such as variations, patterns,
  binding-sources, and hooked-blocks
- full template-engine replacement
- AST emitter migration
