# @wp-typia/create

## 0.1.1 — 2026-03-29

### Patch changes

- [bc2d1b9](https://github.com/imjlk/wp-typia/commit/bc2d1b9cde0085c74ec01cc40ac46aeee68dc11d) Refresh workspace configuration and GitHub Actions release wiring for the scoped `@wp-typia` package flow. — Thanks @imjlk!

### Major Changes

- 4e50d3b: Consolidate the repository and published scaffolding surface around the scoped `@wp-typia/create` package.

### Highlights

- Package-manager-selectable scaffolding through a single CLI entrypoint
- Manifest v2 metadata generation with explicit defaults and supported discriminated union metadata
- Generated `typia-validator.php` for the supported PHP-safe attribute subset
- Advanced snapshot migrations with nested authoring, preview UX, and dynamic `render.php` validation
- Legacy wrapper packages removed from the repository and release flow

### Patch Changes

- 92d5318: Refactor the published CLI to use a typed TypeScript runtime with `dist/cli.js` as the single runtime entrypoint, and improve advanced migration scaffolding internals.

