# wp-typia Project Guide

## Overview

`wp-typia` is a Bun-first monorepo for WordPress block development with Typia-driven metadata sync, validation, and scaffold tooling.

The repo has three practical layers:

- product packages in `packages/`
- a repo-local reference app in `examples/`
- tests and docs at the root

## Packages

- `wp-typia`
  Canonical CLI for scaffolding, add-block flows, migrations, and Bunli-owned terminal UX.
- `@wp-typia/project-tools`
  Canonical project orchestration package for scaffold, add, migrate, template, doctor, and schema helpers.
- `@wp-typia/create`
  Deprecated legacy package shell kept publishable for migration messaging.
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
- `@wp-typia/block-runtime/*` exposes shared generated-project runtime helpers.
- Migration flows live in the reference app and remain available through the CLI.
- Built-in templates are composed from a shared base layer plus per-template overlays inside `packages/create/templates/`.

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

### Command map

- `bun run build`
  Builds the product packages and the reference app.
- `bun run examples:build`
  Builds the reference app only.
- `bun run --filter @wp-typia/project-tools test`
  Focused project orchestration/runtime regression checks.
- `bun run examples:test:e2e`
  Playwright coverage against the repo-local reference app.

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

Release flow:

1. Merge feature PRs into `main`
2. Let the release PR update from `main`
3. Merge the release PR
4. Let GitHub Actions create the GitHub Release
5. Let OIDC publish package releases from that release event

## Code Style

- TypeScript strict mode
- JSDoc in English for public runtime modules
- Built-in template ids remain `basic` and `interactivity`
- Prefer shared runtime helpers over template-local copies when a behavior is meant to stay aligned across generated projects

## High-Value Paths

- `packages/wp-typia-project-tools/src/runtime/`
  Project orchestration implementation and shared scaffold helpers
- `packages/wp-typia-project-tools/templates/`
  Built-in template layers (`_shared/base` + per-template overlays)
- `examples/my-typia-block/`
  Reference app used by E2E and fixture tests
- `tests/unit/helpers/example-showcase.ts`
  Shared helper for tests that touch the example app
