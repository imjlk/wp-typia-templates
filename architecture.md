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
- `examples/persistence-examples`
  The persistence-policy reference plugin with two blocks.

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

Release publishing is intentionally package-only and rerun-safe. Example builds stay in CI/dev flows, while npm publish paths build only publishable workspaces and treat partially published reruns as a normal recovery path.

Example-specific root commands use the `examples:*` namespace so the boundary between product packages and the reference app stays explicit.

## Template Model

Built-in templates stay limited to:

- `basic`
- `interactivity`
- `persistence`

Inside `@wp-typia/create`, built-in templates are composed from:

- a shared base layer for common project assets
- a persistence `core` layer for shared typed REST/interactivity wiring
- a persistence policy layer (`public` or `auth`)
- a template-specific overlay

This keeps public scaffold behavior stable while letting shared runtime/helper changes flow into the built-in templates.

The `persistence` template extends the same base with:

- typed REST contracts and client helpers
- schema sync outputs
- generated PHP route/storage files
- a selectable persistence mode (`post-meta` or `custom-table`)
- a selectable persistence policy (`authenticated` or `public`)

Generated projects also import shared runtime helpers from `@wp-typia/create/runtime/*`, so validator/default/runtime behavior can evolve centrally instead of being copied into every generated block.

## Intended Flow

1. Scaffold a block with `@wp-typia/create`
2. Author the schema in `src/types.ts`
3. Run `sync-types`
4. Build and validate the block
5. Use `persistence --persistence-policy public` for signed public writes
6. Use `persistence --persistence-policy authenticated` for logged-in writes
7. Use the reference apps when you need kitchen-sink or policy-specific runtime patterns
