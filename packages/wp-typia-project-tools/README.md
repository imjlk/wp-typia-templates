# `@wp-typia/project-tools`

Programmatic project orchestration package for `wp-typia`.

Package roles:

- `wp-typia` owns the CLI, help, TUI, completions, skills, MCP, and bin entry.
- `@wp-typia/project-tools` owns scaffold, add-block, migrate, template, doctor, and schema project helpers.
  It also owns the typed generator boundary via `BlockSpec`, `BlockGeneratorService`,
  and `inspectBlockGeneration(...)`,
  plus the emitter-owned built-in structural/code path where built-in
  templates no longer ship structural, TS/TSX, style, or block-local `render.php`
  Mustache files.
- `@wp-typia/block-runtime/*` owns generated-project runtime helpers.
- `@wp-typia/create` is the deprecated legacy package shell.

Supported public imports:

- `@wp-typia/project-tools`
- `@wp-typia/project-tools/schema-core`

Implementation note:

- `@wp-typia/project-tools/schema-core` remains the preferred project-tooling
  import path.
- The shared implementation now lives in `@wp-typia/block-runtime/schema-core`.
- Shared manifest/migration contract types now live in
  `@wp-typia/block-runtime/migration-types`.

Example:

```ts
import {
  BlockGeneratorService,
  getTemplateById,
  parseMigrationArgs,
  projectJsonSchemaDocument,
  resolvePackageManagerId,
} from '@wp-typia/project-tools';
```

```ts
import { normalizeEndpointAuthDefinition } from '@wp-typia/project-tools/schema-core';
```

`BlockGeneratorService` is the additive typed orchestration boundary for built-in
block scaffolds. Built-in templates no longer ship structural, TS/TSX, style,
or block-local `render.php` Mustache files for built-in `types.ts`,
`block.json`, generated scaffold bodies, or block-local non-TS assets; those
files and starter `typia.manifest.json` now come from the emitter path, while
project bootstrap/package-manager files, sync scripts, shared REST helpers, and
the remaining non-block assets still come from Mustache-backed template copy.

The higher-level generator architecture record, including the current phase map
and the non-mutating `plan -> validate -> render -> apply` tool-facing usage
model, lives in
[`docs/block-generator-architecture.md`](../../docs/block-generator-architecture.md).
The public non-mutating controller/tool contract now lives in
[`docs/block-generator-tool-contract.md`](../../docs/block-generator-tool-contract.md).

Reusable external layer packages on top of the built-in shared scaffold model
are now available programmatically through `scaffoldProject(...)`,
`BlockGeneratorService`, and `inspectBlockGeneration(...)` via
`externalLayerSource` and optional `externalLayerId`. The RFC/CLI UX record
still lives in
[`docs/external-template-layer-composition.md`](../../docs/external-template-layer-composition.md).

If you need metadata sync, editor helpers, validation helpers, or other generated-project runtime utilities, import them directly from `@wp-typia/block-runtime/*`.
