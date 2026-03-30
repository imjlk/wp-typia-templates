# wp-typia Project Guide

## Overview

`wp-typia` is a Bun-first monorepo for WordPress block development with Typia-driven metadata sync, validation, and scaffold tooling.

The repo has three practical layers:

- product packages in `packages/`
- a repo-local reference app in `examples/`
- tests and docs at the root

## Packages

- `@wp-typia/create`
  Canonical CLI for scaffolding `basic` and `interactivity` blocks plus remote template seeds.
- `create-wp-typia`
  Compatibility shim for `bun create wp-typia` and existing unscoped installs.
- `@wp-typia/block-types`
  Shared WordPress semantic block types that generated projects can import in `src/types.ts`.

## Example App

- `examples/my-typia-block`
  Kitchen-sink reference app for migrations, richer Typia tags, interactivity, server rendering, and E2E coverage.

This example is not a built-in scaffold target. It exists to demonstrate the fullest supported `wp-typia` feature set and to anchor fixture/E2E coverage.

## Key Concepts

- `src/types.ts` is the source of truth for a block schema.
- `sync-types` derives:
  - `block.json`
  - `typia.manifest.json`
  - `typia-validator.php`
- `@wp-typia/create/runtime/*` exposes shared runtime helpers used by generated projects.
- Migration flows live in the showcase/reference app and remain available through the CLI.

## Development Workflow

### Install

```bash
bun install
```

### Core checks

```bash
bun run typecheck
bun run test
bun run build
```

### Example-specific commands

```bash
bun run examples:build
bun run examples:dev
bun run examples:lint
bun run examples:test:e2e
```

Legacy root commands like `bun run dev`, `bun run lint`, and `bun run test:e2e` are compatibility aliases that delegate to the `examples:*` namespace.

### Releases

- `bun run sampo:add`
- `bun run release`
- GitHub Actions handles release PRs, GitHub Releases, and npm publish.

## Code Style

- TypeScript strict mode
- JSDoc in English for public runtime modules
- Built-in template ids remain `basic` and `interactivity`
- Prefer shared runtime helpers over template-local copies when a behavior is meant to stay aligned across generated projects

## High-Value Paths

- `packages/create/src/runtime/`
  CLI/runtime implementation and shared scaffold helpers
- `packages/create/templates/`
  Built-in template layers
- `examples/my-typia-block/`
  Reference app used by E2E and fixture tests
- `tests/unit/helpers/example-showcase.ts`
  Shared helper for tests that touch the example app
