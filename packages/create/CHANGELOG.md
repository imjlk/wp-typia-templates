# @wp-typia/create

## 1.0.0

### Major Changes

- 4e50d3b: Consolidate the repository and published scaffolding surface around the scoped `@wp-typia/create` package.

  This release removes the legacy `wp-typia-*` wrapper packages from the repository and release flow, keeps `packages/create/templates` as the single template source of truth, and makes `@wp-typia/create` the canonical scaffolding package.

### Highlights

- Package-manager-selectable scaffolding through a single CLI entrypoint
- Manifest v2 metadata generation with explicit defaults and supported discriminated union metadata
- Generated `typia-validator.php` for the supported PHP-safe attribute subset
- Advanced snapshot migrations with nested authoring, preview UX, and dynamic `render.php` validation
- Legacy wrapper packages removed from the repository and release flow

### Patch Changes

- 92d5318: Refactor the published CLI to use a typed TypeScript runtime with `dist/cli.js` as the single runtime entrypoint, and improve advanced migration scaffolding internals.
