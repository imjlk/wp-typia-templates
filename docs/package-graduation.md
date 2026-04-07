# Package Graduation Path

This document records the current recommendation from `#54` for graduating
stable runtime helpers out of `@wp-typia/create`.

## Summary

Current recommendation:

- keep `wp-typia` as the canonical CLI package
- keep `@wp-typia/create` as the compatibility/programmatic scaffold package
- treat `@wp-typia/block-runtime` as the normative generated-project helper
  surface for stable runtime helpers
- continue narrowing `@wp-typia/create/runtime/*` toward compatibility shims
  only

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
- temporary duplication while `@wp-typia/create` remains a compatibility bridge

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
2. Migrate generated projects, examples, and docs onto `@wp-typia/block-runtime/*`.
3. Keep `@wp-typia/create` available as a compatibility/programmatic package.
4. Validate docs, tests, and external DX on the new package boundary.
5. Only then consider deeper source extraction or retiring compatibility layers.

## Release note for the first version

The initial bootstrap strategy for this prototype is:

- seed `@wp-typia/block-runtime@0.1.0` with a local manual npm publish
- keep a patch changeset in the PR so the merge-triggered Sampo/OIDC flow
  naturally targets the next version (`0.1.1`)

This keeps the first official automation-backed release on the existing GitHub
release pipeline while still reserving the package name and validating the
manual bootstrap path once.
