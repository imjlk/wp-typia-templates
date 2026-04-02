# Runtime Import Policy

This document is the normative generated-project runtime import policy for
`@wp-typia/create`.

It defines which import paths generated projects may rely on as supported
public API through v1. The broader audit in
[`docs/runtime-surface.md`](./runtime-surface.md) remains descriptive only.

## Supported generated-project import paths

Generated projects may rely on these import paths as supported public API:

- `@wp-typia/create`
- `@wp-typia/create/metadata-core`
- `@wp-typia/create/runtime/defaults`
- `@wp-typia/create/runtime/editor`
- `@wp-typia/create/runtime/validation`

## Support promise

For the supported generated-project import paths above:

- breaking removals are semver-significant
- breaking signature changes are semver-significant
- additive exports remain allowed
- generated projects do not need to treat these paths as internal or unstable

The root package remains public overall, but this policy only blesses the
generated-project runtime subset listed above. It does not imply that every
root export is part of the generated-project runtime support promise.

The current graduation prototype for this helper set is
`@wp-typia/block-runtime`, but generated projects should continue to treat
`@wp-typia/create` as the canonical import surface through v1.

## Root convenience aliases

The root package also exposes convenience aliases for several runtime helpers,
including defaults, editor, validation, and schema helpers.

Generated projects are not expected to migrate away from the supported
`runtime/*` paths to use those aliases. They are additive convenience exports,
not a preferred replacement for the documented generated-project imports.

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
