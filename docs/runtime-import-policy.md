# Runtime Import Policy

This document is the normative import policy for public `wp-typia` package
surfaces.

## Canonical package map

- `wp-typia`
  CLI only.
- `@wp-typia/api-client`
  Transport-neutral runtime surface.
- `@wp-typia/api-client/client-utils`
  Distinct low-level request/response helper surface.
- `@wp-typia/api-client/runtime-primitives`
  Distinct validation/runtime primitive helper surface.
- `@wp-typia/rest`
  Canonical WordPress REST runtime surface.
- `@wp-typia/rest/client`
  Compatibility alias of the root `@wp-typia/rest` surface, not a distinct
  semantic contract.
- `@wp-typia/rest/http`
  Compatibility alias of the root `@wp-typia/rest` surface in the current
  major line. It is not yet a distinct decoder-only contract.
- `@wp-typia/rest/react`
  React cache and hook surface.
- `@wp-typia/project-tools`
  Project orchestration and programmatic tooling.
- `@wp-typia/project-tools/schema-core`
  Project schema and OpenAPI helpers.
- `@wp-typia/block-runtime`
  Generated-project block helper root.
- `@wp-typia/block-runtime/migration-types`
  Shared manifest and migration contract implementation owner.
- `@wp-typia/block-runtime/schema-core`
  Shared schema/OpenAPI implementation owner.
- `@wp-typia/block-runtime/metadata-core`
  Metadata sync and endpoint manifest helpers.
- `@wp-typia/block-runtime/blocks`
- `@wp-typia/block-runtime/defaults`
- `@wp-typia/block-runtime/editor`
- `@wp-typia/block-runtime/identifiers`
- `@wp-typia/block-runtime/inspector`
- `@wp-typia/block-runtime/validation`

## Generated-project support promise

Generated projects may rely on `@wp-typia/block-runtime/*` and
`@wp-typia/block-runtime/metadata-core` as supported public API.

That means:

- breaking removals are semver-significant
- breaking signature changes are semver-significant
- additive exports remain allowed

## Programmatic project tooling

Manual orchestration or repo tooling should use:

- `@wp-typia/project-tools`
- `@wp-typia/project-tools/schema-core`

Those imports cover scaffold, add-block, migrate, template, doctor, package
manager, starter manifest, schema/OpenAPI project helpers, the `BlockSpec` /
`BlockGeneratorService` generator boundary, the non-mutating
`inspectBlockGeneration(...)` tool contract, and the emitter-owned built-in
structural/source path where built-in templates no longer ship structural,
TS/TSX, style, or block-local `render.php` Mustache files.

For the architecture record behind that boundary, including the staged
non-mutating tool-facing contract and current phase map, see
[`docs/block-generator-architecture.md`](./block-generator-architecture.md).

For the public staged controller/tool payload contract itself, see
[`docs/block-generator-tool-contract.md`](./block-generator-tool-contract.md).

For the external layer package contract on top of the built-in shared scaffold
model, including the current programmatic composition path and remaining CLI UX
questions, see
[`docs/external-template-layer-composition.md`](./external-template-layer-composition.md).

`@wp-typia/block-runtime/schema-core` is public and stable, but it is the
implementation owner path rather than the preferred project-tooling import.

## Error contract baseline

Validation failures should stay in result unions such as `ValidationResult<T>`
or `EndpointValidationResult<Req, Res>`.

Public runtime throws should prefer named contract errors:

- `WpTypiaContractError`
- `ApiClientConfigurationError`
- `RestConfigurationError`
- `RestRootResolutionError`
- `RestQueryHookUsageError`
- `WpTypiaValidationAssertionError`
- `RestValidationAssertionError`

Internal generator, parser, migration, and build invariants may still use
generic `Error` until there is a concrete downstream need for a typed public
catch contract.

## Deprecated surface

`@wp-typia/create` remains publishable only as a deprecated legacy package
shell. It is not a supported runtime import target anymore.

## Out of scope

These areas are not covered by the generated-project compatibility promise:

- CLI implementation internals
- Bunli command composition
- template rendering internals
- Mustache-vs-emitter implementation details below the current generator boundary
- project-scaffold orchestration internals
