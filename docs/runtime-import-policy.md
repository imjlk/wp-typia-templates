# Runtime Import Policy

This document is the normative import policy for public `wp-typia` package
surfaces.

## Canonical package map

- `wp-typia`
  CLI only.
- `@wp-typia/project-tools`
  Project orchestration and programmatic tooling.
- `@wp-typia/project-tools/schema-core`
  Project schema and OpenAPI helpers.
- `@wp-typia/block-runtime`
  Generated-project block helper root.
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
`BlockGeneratorService` generator boundary, and the Phase 2 emitter-owned
built-in `types.ts` / `block.json` path.

`@wp-typia/block-runtime/schema-core` is public and stable, but it is the
implementation owner path rather than the preferred project-tooling import.

## Deprecated surface

`@wp-typia/create` remains publishable only as a deprecated legacy package
shell. It is not a supported runtime import target anymore.

## Out of scope

These areas are not covered by the generated-project compatibility promise:

- CLI implementation internals
- Bunli command composition
- template rendering internals
- Mustache-vs-emitter implementation details below the Phase 2 generator boundary
- project-scaffold orchestration internals
