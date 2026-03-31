# Architecture

`wp-typia` is a WordPress block tooling monorepo rather than a single plugin or theme repository.

## Repository Layers

### 1. Product packages

- `packages/create`
  The canonical CLI and shared scaffold runtime.
- `packages/create-wp-typia`
  The unscoped compatibility shim.
- `packages/wp-typia-block-types`
  Shared WordPress semantic types for generated projects.
- `packages/wp-typia-rest`
  Shared TypeScript REST helpers for data-backed blocks.

### 2. Reference app

- `examples/my-typia-block`
  The kitchen-sink reference block.

This package is the place for:

- richer Typia usage
- interactivity and validation UX
- migration snapshots and admin tooling
- server rendering patterns
- E2E and fixture-backed behavior

### 3. Root orchestration

The root workspace owns:

- Bun install/build/test orchestration
- GitHub Actions workflows
- release metadata and publish scripts
- API/usage docs

Example-specific root commands use the `examples:*` namespace so the boundary between product packages and the reference app stays explicit.

## Template Model

Built-in templates stay limited to:

- `basic`
- `interactivity`
- `data`
- `persisted`

Inside `@wp-typia/create`, built-in templates are composed from:

- a shared base layer for common project assets
- a template-specific overlay

This keeps public scaffold behavior stable while letting shared runtime/helper changes flow into the built-in templates.

The `data` template extends the same base with:

- typed REST contracts and client helpers
- schema sync outputs
- generated PHP route/storage files
- a selectable persistence mode (`post-meta` or `custom-table`)

The `persisted` template extends the same base with:

- typed REST contracts and client helpers
- schema sync outputs
- generated PHP route/storage files
- a selectable persistence mode (`post-meta` or `custom-table`)
- a selectable write auth mode (`nonce` or `public`)

Generated projects also import shared runtime helpers from `@wp-typia/create/runtime/*`, so validator/default/runtime behavior can evolve centrally instead of being copied into every generated block.

## Intended Flow

1. Scaffold a block with `@wp-typia/create`
2. Author the schema in `src/types.ts`
3. Run `sync-types`
4. Build and validate the block
5. Use `data` for simple public persistence samples or `persisted` for auth-first write patterns
6. Use the example app as the richer reference when you need migration or kitchen-sink patterns
