# @wp-typia/rest

## 0.3.5 — 2026-04-09

### Patch changes

- [ab7d1c9](https://github.com/imjlk/wp-typia/commit/ab7d1c9afaf4039b5053991ca9fe88cabcd46a13) Publish shared API client utilities and runtime primitives from `@wp-typia/api-client`, reuse them across rest and runtime packages, and align active package Bun minimums with `1.3.11`. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.2

## 0.3.4 — 2026-04-09

### Patch changes

- [a451f32](https://github.com/imjlk/wp-typia/commit/a451f327279e717c4bd98eb4c400e9d88c42017a) Prevent the `@wp-typia/rest` postpack restore step from reverting the manifest before npm registry metadata is finalized during publish, while still restoring after the publish wrapper completes. — Thanks @imjlk!

## 0.3.3 — 2026-04-09

### Patch changes

- [896bc10](https://github.com/imjlk/wp-typia/commit/896bc10908c0f32951998a538434ce64d24113c0) Ensure npm publish rewrites `@wp-typia/rest` workspace protocol dependencies before the registry captures package metadata, so published installs resolve `@wp-typia/api-client` through a semver range instead of `workspace:*`. — Thanks @imjlk!

## 0.3.2 — 2026-04-09

### Patch changes

- [66b9ccc](https://github.com/imjlk/wp-typia/commit/66b9cccd918a50326adcf0b1f7eb693e0144e2ad) Fix the published `@wp-typia/rest` manifest so workspace protocol dependencies are rewritten to npm-safe version ranges during pack/publish, and add CI validation for tarball-based install smoke coverage. — Thanks @imjlk!

## 0.3.1 — 2026-04-07

### Patch changes

- [9f9e6dd](https://github.com/imjlk/wp-typia/commit/9f9e6ddb0bdd041a678ecce381ff82db8a0123e8) Consolidate the shared validation/object/form-data runtime helpers used by
  `@wp-typia/api-client` and `@wp-typia/rest` under one maintained internal
  implementation owned by `@wp-typia/api-client`, while keeping the existing root
  public APIs unchanged. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.0

## 0.3.0 — 2026-04-05

### Minor changes

- [b6decd0](https://github.com/imjlk/wp-typia/commit/b6decd0aa905fac2e12dc739c4c5e43159501f9d) Add a React/data helper layer at `@wp-typia/rest/react` with query and mutation
  hooks, then wire persistence examples and generated persistence scaffolds to
  emit `src/data.ts` wrappers on top of the existing WordPress REST helpers. — Thanks @imjlk!

## 0.2.0 — 2026-03-31

### Minor changes

- [602c85c](https://github.com/imjlk/wp-typia/commit/602c85cf60c09b329836625b4a22b491961f297c) Add the built-in `data` template, introduce the `@wp-typia/rest` package for typed WordPress REST helpers, and extend the Typia sync pipeline with optional JSON Schema and OpenAPI outputs for block and API contracts. — Thanks @imjlk!

