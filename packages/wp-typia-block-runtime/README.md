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
import { createEditorModel } from '@wp-typia/block-runtime/editor';
import {
  InspectorFromManifest,
  useEditorFields,
} from '@wp-typia/block-runtime/inspector';
import { createNestedAttributeUpdater } from '@wp-typia/block-runtime/validation';
import { runSyncBlockMetadata } from '@wp-typia/block-runtime/metadata-core';
```

`wp-typia` remains the CLI package.

`@wp-typia/project-tools` is the canonical programmatic project orchestration
package, while newly generated projects should prefer `@wp-typia/block-runtime/*`
and `@wp-typia/block-runtime/metadata-core`.

Public subpaths such as `@wp-typia/block-runtime/inspector`,
`@wp-typia/block-runtime/metadata-core`, and
`@wp-typia/block-runtime/schema-core` stay stable even as their implementations
are split into smaller focused modules internally. Consumers should keep
importing the documented facade subpaths rather than reaching into those helper
files directly.

Advanced helper entrypoints such as `metadata-analysis`, `metadata-model`,
`metadata-parser`, `metadata-php-render`, `metadata-projection`, `identifiers`,
and `json-utils` are also published and documented, but they are secondary to
the main generated-project runtime roots. The canonical hosted reference now
splits these into Core API, Advanced Helpers, and Internal APIs sections under
`https://imjlk.github.io/wp-typia/`.
