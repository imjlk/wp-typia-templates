# `@wp-typia/block-runtime`

Generated-project runtime and metadata sync helpers for `wp-typia`.

This is the supported generated-project package boundary for:

- manifest-driven defaults
- editor model generation
- manifest-driven inspector helpers
- validation-aware attribute updates
- TypeScript-to-metadata sync
- manifest-first REST/OpenAPI/client codegen

It does not include:

- scaffold or CLI internals
- migration tooling

Typical usage:

```ts
import { createEditorModel } from "@wp-typia/block-runtime/editor";
import { InspectorFromManifest, useEditorFields } from "@wp-typia/block-runtime/inspector";
import { createNestedAttributeUpdater } from "@wp-typia/block-runtime/validation";
import { runSyncBlockMetadata } from "@wp-typia/block-runtime/metadata-core";
```

`@wp-typia/create` remains the CLI/scaffolding package.

`@wp-typia/create/metadata-core` and `@wp-typia/create/runtime/*` remain
available as backward-compatible facades, but newly generated projects should
prefer `@wp-typia/block-runtime/*` and
`@wp-typia/block-runtime/metadata-core`.
