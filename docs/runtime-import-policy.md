# Runtime Import Policy

This document is the normative generated-project runtime import policy for
wp-typia generated projects.

It defines which import paths generated projects may rely on as supported
public API through v1. The broader audit in
[`docs/runtime-surface.md`](./runtime-surface.md) remains descriptive only.

## Supported generated-project import paths

Generated projects may rely on these import paths as supported public API:

- `@wp-typia/block-runtime/metadata-core`
- `@wp-typia/block-runtime`
- `@wp-typia/block-runtime/blocks`
- `@wp-typia/block-runtime/defaults`
- `@wp-typia/block-runtime/editor`
- `@wp-typia/block-runtime/inspector`
- `@wp-typia/block-runtime/validation`

## Support promise

For the supported generated-project import paths above:

- breaking removals are semver-significant
- breaking signature changes are semver-significant
- additive exports remain allowed
- generated projects do not need to treat these paths as internal or unstable

`@wp-typia/create` remains public overall, but this policy only blesses
`@wp-typia/block-runtime/metadata-core` plus the `@wp-typia/block-runtime` helper
surface listed above for generated projects.

## Compatibility exports

`@wp-typia/create/metadata-core` remains exported as a backward-compatible
facade to `@wp-typia/block-runtime/metadata-core`.

`@wp-typia/create/runtime/*` remains exported for backward compatibility, but it
is no longer the preferred generated-project import surface.

Newly generated projects should use `@wp-typia/block-runtime/*` for block
runtime helpers and keep `@wp-typia/block-runtime/metadata-core` for TypeScript-to-
metadata sync.

## Exported but non-canonical generated-project path

`@wp-typia/create/runtime/schema-core` remains exported, but it is not a
canonical generated-project import path.

That subpath is still available when someone explicitly wants it, but the docs
prefer the root schema exports for manual imports, such as:

- `projectJsonSchemaDocument()`
- `manifestToJsonSchema()`
- `manifestToOpenApi()`

## Not part of the generated-project runtime policy

The following areas are not part of the generated-project runtime support
policy:

- scaffold flow internals
- template registry, rendering, and composition internals
- CLI implementation internals

Those areas may still be exported or reachable indirectly today, but they are
not covered by the generated-project runtime compatibility promise in this
document.
