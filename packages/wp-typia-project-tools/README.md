# `@wp-typia/project-tools`

Programmatic project orchestration package for `wp-typia`.

Package roles:

- `wp-typia` owns the CLI, help, TUI, completions, skills, MCP, and bin entry.
- `@wp-typia/project-tools` owns scaffold, add-block, migrate, template, doctor, and schema project helpers.
  It also owns the phase-1 typed generator boundary via `BlockSpec` and `BlockGeneratorService`.
- `@wp-typia/block-runtime/*` owns generated-project runtime helpers.
- `@wp-typia/create` is the deprecated legacy package shell.

Supported public imports:

- `@wp-typia/project-tools`
- `@wp-typia/project-tools/schema-core`

Implementation note:

- `@wp-typia/project-tools/schema-core` remains the preferred project-tooling
  import path.
- The shared implementation now lives in `@wp-typia/block-runtime/schema-core`.

Example:

```ts
import {
	BlockGeneratorService,
	getTemplateById,
	parseMigrationArgs,
	projectJsonSchemaDocument,
	resolvePackageManagerId,
} from "@wp-typia/project-tools";
```

```ts
import { normalizeEndpointAuthDefinition } from "@wp-typia/project-tools/schema-core";
```

`BlockGeneratorService` is the additive Phase 1 orchestration boundary for built-in
block scaffolds. It currently plans, validates, renders, and applies built-in
block generation while Mustache file templates remain the implementation for
rendered file bodies.

If you need metadata sync, editor helpers, validation helpers, or other generated-project runtime utilities, import them directly from `@wp-typia/block-runtime/*`.
