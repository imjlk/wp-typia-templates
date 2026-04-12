# Runtime Surface Audit

This document is descriptive, not normative. For support guarantees, see
[`docs/runtime-import-policy.md`](./runtime-import-policy.md).

## Current exported surfaces

- `wp-typia`
  CLI package and Bunli command tree.
- `@wp-typia/project-tools`
  Project orchestration helpers used by the CLI and programmatic tooling,
  including the additive `BlockSpec` / `BlockGeneratorService` boundary and
  Phase 2 structural emitters for built-in `types.ts` / `block.json`.
- `@wp-typia/project-tools/schema-core`
  Schema and OpenAPI helpers for project-level documents.
- `@wp-typia/block-runtime`
  Generated-project helper root.
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
  Phase 2 built-in structural emitters, and the preferred schema project
  imports.
- `@wp-typia/block-runtime/*` owns generated-project runtime helpers directly,
  including the canonical `schema-core` implementation.
- `@wp-typia/create` no longer owns runtime exports or CLI behavior.
