# @wp-typia/rest

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

