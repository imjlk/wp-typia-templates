# Package Graduation Path

This document records the current recommendation from `#54` for graduating
stable runtime helpers out of `@wp-typia/create`.

## Summary

Current recommendation:

- keep `@wp-typia/create` as the canonical generated-project import surface
  through v1
- introduce `@wp-typia/block-runtime` now as the graduation prototype for the
  stable block runtime helper set
- defer scaffold migration and source extraction until the facade package is
  proven in docs, tests, and real usage

## Options considered

### 1. Keep everything in `@wp-typia/create`

Pros:

- no migration work
- simplest release story

Cons:

- block runtime helpers stay coupled to a scaffolding package
- public package boundaries remain less obvious for block developers

### 2. Add one consolidated block runtime package

Pros:

- clean home for generated-project block runtime helpers
- avoids mixing block runtime concerns with metadata/codegen concerns
- gives the repo a low-churn migration target without rewriting scaffolds yet

Cons:

- one more package to build, test, and publish
- temporary duplication while `@wp-typia/create` remains canonical

### 3. Split into narrower packages immediately

Pros:

- sharper long-term package boundaries

Cons:

- too much churn for the current stage
- forces premature decisions around helper ownership and migration

## Recommendation

Prototype `@wp-typia/block-runtime` now as a thin facade over the stable
generated-project block runtime helpers:

- defaults
- editor model helpers
- validation-aware attribute update helpers

Keep these out of scope for the new package:

- `metadata-core`
- schema/OpenAPI generation helpers
- scaffold flow and CLI internals
- migration tooling

## Migration path

1. Ship `@wp-typia/block-runtime` as a facade package.
2. Keep `@wp-typia/create` canonical for generated projects through v1.
3. Validate docs, tests, and external DX without changing scaffold imports.
4. If the package boundary proves useful, migrate docs/examples later.
5. Only then consider source extraction or scaffold adoption.

## Release note for the first version

The initial bootstrap strategy for this prototype is:

- seed `@wp-typia/block-runtime@0.1.0` with a local manual npm publish
- keep a patch changeset in the PR so the merge-triggered Sampo/OIDC flow
  naturally targets the next version (`0.1.1`)

This keeps the first official automation-backed release on the existing GitHub
release pipeline while still reserving the package name and validating the
manual bootstrap path once.
