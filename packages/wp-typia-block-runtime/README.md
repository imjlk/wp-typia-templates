# `@wp-typia/block-runtime`

Prototype block runtime helpers for `wp-typia` generated projects.

This package is the current graduation path for the stable generated-project
runtime helpers that still live canonically under `@wp-typia/create`.

It currently re-exports the block runtime helper surface for:

- manifest-driven defaults
- editor model generation
- manifest-driven inspector helpers
- validation-aware attribute updates

It does not include:

- scaffold or CLI internals
- REST/OpenAPI metadata generation
- schema generation helpers
- migration tooling

Typical usage:

```ts
import { createEditorModel } from "@wp-typia/block-runtime/editor";
import { InspectorFromManifest, useEditorFields } from "@wp-typia/block-runtime/inspector";
import { createNestedAttributeUpdater } from "@wp-typia/block-runtime/validation";
```

`@wp-typia/create` remains the canonical generated-project import surface
through v1. This package exists to validate the long-term package boundary and
migration path without changing scaffolds yet.
