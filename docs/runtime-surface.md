# Runtime Surface Audit

This document audits the current public runtime surface around `@wp-typia/create`.

It is intentionally descriptive, not normative. The goal is to capture what the repo currently exposes and relies on so follow-up issues can decide support policy and package boundaries without repeating discovery work.

## Current exported surface

`packages/create/package.json` currently exposes:

- root package: `@wp-typia/create`
- `@wp-typia/create/cli`
- `@wp-typia/create/metadata-core`
- `@wp-typia/create/runtime/defaults`
- `@wp-typia/create/runtime/editor`
- `@wp-typia/create/runtime/schema-core`
- `@wp-typia/create/runtime/validation`

## Classification

### Stable public

These exports already behave like product APIs and are documented or used directly in generated-project-facing material.

- `@wp-typia/create`
  - root runtime exports are documented in [`packages/create/README.md`](../packages/create/README.md) and used as the main public package surface
  - recent examples include `projectJsonSchemaDocument()` from the root export
- `@wp-typia/create/metadata-core`
  - used by repo examples and scaffold sync scripts for `syncBlockMetadata()`, `syncTypeSchemas()`, `syncRestOpenApi()`, and `defineEndpointManifest()`
  - this is already the practical authoring surface for schema and manifest generation
- `@wp-typia/create/runtime/editor`
  - documented in [`packages/create/README.md`](../packages/create/README.md) and [`docs/API.md`](./API.md)
  - used by examples and generated templates to build editor models from manifests
- `@wp-typia/create/runtime/validation`
  - documented and heavily used by examples and generated templates for nested attribute updates and validation-aware helpers

### Public but create-coupled

These are exported today and used in generated projects, but they still feel closely tied to scaffold internals or generation-era assumptions.

- `@wp-typia/create/runtime/defaults`
  - used by examples and templates for applying manifest/template defaults
  - practical and reusable, but closely tied to how `wp-typia` models manifest defaults
- `@wp-typia/create/runtime/schema-core`
  - used in example bundler aliasing and now contains reusable schema helpers
  - however, much of its value still depends on `wp-typia` manifest and schema-generation conventions rather than a clearly separated standalone package contract

### Internal-only

These are effectively internal even when reachable through the root package implementation.

- CLI scaffolding and template-rendering internals under `packages/create/src/runtime/*`
  - examples: scaffold flow, package manager resolution, template registry, migration command internals
  - these are not documented as public runtime APIs for generated projects
- template composition and overlay logic inside `packages/create/templates/*`
  - widely relied on by scaffold generation, but not a developer-facing runtime surface

### Candidate for package graduation

These are plausible future package candidates because they are already useful outside the CLI/scaffolding story.

- runtime validation helpers
  - nested patch/update helpers are reused across examples and templates and could eventually live in a narrower runtime package
- editor model helpers
  - `createEditorModel()` is runtime-facing and developer-consumable in a way that resembles a standalone support package
- schema projection and manifest/schema utilities
  - recent work like `projectJsonSchemaDocument()` increases the amount of schema logic that could eventually outgrow the scaffolding package

## Current repo usage map

### Docs and public examples

- `packages/create/README.md`
  - documents root exports, `metadata-core`, `runtime/editor`, and `runtime/validation`
- `docs/API.md`
  - documents `runtime/defaults`, `runtime/editor`, and `runtime/validation` as generated-project imports
- repo examples
  - `examples/my-typia-block` imports `runtime/defaults`, `runtime/editor`, and `runtime/validation`
  - `examples/persistence-examples` imports `metadata-core`, `runtime/defaults`, `runtime/editor`, and `runtime/validation`
  - `examples/rest-contract-adapter-poc` imports `metadata-core`

### Generated template usage

- base and compound/persistence sync scripts import `@wp-typia/create/metadata-core`
- `basic`, `interactivity`, and persistence-capable templates import `runtime/editor`, `runtime/defaults`, and `runtime/validation`
- generated templates currently do not import `runtime/schema-core` directly, but example webpack configs alias it for repo-local development

## Current mismatch

The repo already treats some `@wp-typia/create` runtime helpers like stable product APIs:

- they are exported from the published package
- they are documented in public docs
- they are imported by examples
- they are baked into generated templates

But the long-term stability level is not stated clearly:

- some helpers feel intentionally public
- some exports appear public mainly because generated projects need them today
- package boundaries still reflect the scaffolding origin more than the runtime developer experience

## Policy input for #53

`#53` should decide:

- whether `@wp-typia/create/runtime/*` remains a supported public import surface
- whether `runtime/editor` and `runtime/validation` should stay on subpaths or move behind narrower root exports
- whether `runtime/defaults` and `runtime/schema-core` should remain create-coupled or be treated as emerging stable surfaces
- what semver promises apply to generated-project runtime helpers versus CLI/scaffolding internals
- whether package extraction should remain optional long term or become part of the product direction
