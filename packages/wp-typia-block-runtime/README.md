# `@wp-typia/block-runtime`

Generated-project runtime and metadata sync helpers for `wp-typia`.

This is the supported generated-project package boundary for:

- manifest-driven defaults
- editor model generation
- manifest-driven inspector helpers
- validation-aware attribute updates
- TypeScript-to-metadata sync
- typed block nesting contracts for `parent`, `ancestor`, and `allowedBlocks`
- generated `InnerBlocks` template constants validated against nesting contracts
- serialized pattern content validation against typed block nesting contracts
- manifest-first REST/OpenAPI/client codegen

It does not include:

- scaffold or CLI internals
- migration tooling

Typical usage:

```ts
import { createEditorModel } from '@wp-typia/block-runtime/editor';
import {
  InspectorFromManifest,
  usePersistentBlockIdentity,
  useEditorFields,
} from '@wp-typia/block-runtime/inspector';
import { collectPersistentBlockIdentityRepairs } from '@wp-typia/block-runtime/identifiers';
import { assertResponseMatchesSchema } from '@wp-typia/block-runtime/schema-test';
import { createNestedAttributeUpdater } from '@wp-typia/block-runtime/validation';
import {
  defineBlockNesting,
  runSyncBlockMetadata,
} from '@wp-typia/block-runtime/metadata-core';
import type { tags } from '@wp-typia/block-runtime/typia-tags';
```

`wp-typia` remains the CLI package.

Import `tags` from `@wp-typia/block-runtime/typia-tags` when REST settings
contracts need wp-typia-only metadata such as `tags.Secret<"hasApiKey">` and
`tags.PreserveOnEmpty<true>` for write-only credentials.

`@wp-typia/project-tools` is the canonical programmatic project orchestration
package, while newly generated projects should prefer `@wp-typia/block-runtime/*`
and `@wp-typia/block-runtime/metadata-core`.

Public subpaths such as `@wp-typia/block-runtime/inspector`,
`@wp-typia/block-runtime/metadata-core`, and
`@wp-typia/block-runtime/schema-core` stay stable even as their implementations
are split into smaller focused modules internally. `@wp-typia/block-runtime/schema-test`
adds test-only helpers for asserting smoke/integration response payloads against
generated `*.schema.json` artifacts. Consumers should keep importing the
documented facade subpaths rather than reaching into those helper files
directly.

Advanced helper entrypoints such as `metadata-analysis`, `metadata-model`,
`metadata-parser`, `metadata-php-render`, `metadata-projection`, `identifiers`,
and `json-utils` are also published and documented, but they are secondary to
the main generated-project runtime roots. The canonical hosted reference now
splits these into Core API, Advanced Helpers, and Internal APIs sections under
`https://imjlk.github.io/wp-typia/`.

For structured document blocks that need stable logical ids separate from the
editor `clientId`, use:

- `collectPersistentBlockIdentityRepairs(...)` from
  `@wp-typia/block-runtime/identifiers` when you already have a plain block
  tree and want deterministic duplicate-safe repairs without React.
- `usePersistentBlockIdentity(...)` from `@wp-typia/block-runtime/inspector`
  when you are inside a block edit component and want the same repair logic
  wired to `setAttributes(...)`.
