# @wp-typia/create

## 0.3.0 — 2026-03-30

### Minor changes

- [02a4f65](https://github.com/imjlk/wp-typia/commit/02a4f6512abf18fd1ab47e95193a33a1a9b7ce22) Expand `--template` to support official `@wordpress/create-block`-style external template configs from local paths, GitHub locators, and npm package specs. Add `--variant` support for external templates, normalize rendered seeds into the wp-typia scaffold flow, and document the trusted-JavaScript execution model for external template configs. — Thanks @imjlk!

### Patch changes

- [665ce99](https://github.com/imjlk/wp-typia/commit/665ce9917e344654adf5c61f34ff17943b2c6380) Clarify the repository boundary between product packages and the example app by introducing `examples:*` root scripts, tightening built-in template composition around an explicit shared base layer, and documenting `examples/my-typia-block` as the repo-local reference app. This keeps scaffold behavior stable while making repo structure and generated template maintenance easier to follow. — Thanks @imjlk!
- [4503f18](https://github.com/imjlk/wp-typia/commit/4503f18f6adbe8ccde1b1ce36316a2f8ad9ccbd6) Tighten the generated template validation contract by introducing typed `ValidationResult` helpers, shared runtime validation utilities, and consistent validation error handling across the `basic` and `interactivity` templates. The showcase block now shares the same typed validation flow, includes visible editor-side error summaries, and adds stronger runtime test coverage for clone, prune, attribute updates, and validation UI behavior. — Thanks @imjlk!

## 0.2.0 — 2026-03-29

### Minor changes

- [01f58fd](https://github.com/imjlk/wp-typia/commit/01f58fdb3a88b7fb06c743181c5afeda57c35537) Reduce the built-in scaffold surface to `basic` and `interactivity`, add remote template MVP support for local paths and GitHub locators, expose shared metadata/default helpers from `@wp-typia/create`, and move the richer showcase app into `examples/my-typia-block`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: block-types@0.1.3

## 0.1.3 — 2026-03-29

### Patch changes

- [d89441f](https://github.com/imjlk/wp-typia/commit/d89441faf32906763807aa9bde1e960cc2ecf274) Improve Typia-powered metadata and validator generation, expand shared WordPress semantic block types, and strengthen the full/interactivity templates with precompiled validators and manifest-driven default application. — Thanks @imjlk!

## 0.1.2 — 2026-03-29

### Patch changes

- [2634593](https://github.com/imjlk/wp-typia/commit/2634593c4791272f90f01b7ddb344ab09ec418fe) Tighten the repository config baseline by fixing metadata placeholders, aligning Node and npm engine requirements, simplifying root TypeScript typecheck settings, and cleaning up CI workflow defaults. — Thanks @imjlk!

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

