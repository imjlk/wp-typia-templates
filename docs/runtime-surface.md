# Runtime Surface Audit

This document is descriptive, not normative. For support guarantees, see
[`docs/runtime-import-policy.md`](./runtime-import-policy.md).

## Current exported surfaces

- `wp-typia`
  CLI package and Bunli command tree.
- `@wp-typia/project-tools`
  Project orchestration helpers used by the CLI and programmatic tooling,
  including the additive `BlockSpec` / `BlockGeneratorService` boundary and
  emitter ownership for built-in structural files, TS/TSX scaffold bodies, and
  built-in style/PHP source assets.
- `@wp-typia/project-tools/schema-core`
  Schema and OpenAPI helpers for project-level documents.
- `@wp-typia/block-runtime`
  Generated-project helper root.
- `@wp-typia/block-runtime/migration-types`
- `@wp-typia/block-runtime/schema-core`
- `@wp-typia/block-runtime/metadata-core`
- `@wp-typia/block-runtime/blocks`
- `@wp-typia/block-runtime/defaults`
- `@wp-typia/block-runtime/editor`
- `@wp-typia/block-runtime/identifiers`
- `@wp-typia/block-runtime/inspector`
- `@wp-typia/block-runtime/validation`
- `@wp-typia/create`
  Deprecated legacy package shell only.

## Classification

### Stable public

- `wp-typia`
- `@wp-typia/project-tools`
- `@wp-typia/project-tools/schema-core`
- `@wp-typia/block-runtime/migration-types`
- `@wp-typia/block-runtime/schema-core`
- `@wp-typia/block-runtime/*`
- `@wp-typia/block-runtime/metadata-core`

### Deprecated public

- `@wp-typia/create`
  Publishable for migration messaging, but no longer the maintained runtime
  implementation.

## Ownership notes

- `wp-typia` owns the CLI, help, TUI, completions, skills, MCP, and bin entry.
- `@wp-typia/project-tools` owns scaffold, add-block, migrate, template,
  doctor, package-manager, starter-manifest, the typed generator boundary, the
  built-in structural/code emitters, and the preferred schema project imports.
  Built-in templates no longer ship structural, TS/TSX, style, or block-local
  `render.php` Mustache files for those generated artifacts.
- `@wp-typia/block-runtime/*` owns generated-project runtime helpers directly,
  including the canonical `schema-core` implementation and shared
  manifest/migration contract types.
- `@wp-typia/create` no longer owns runtime exports or CLI behavior.
