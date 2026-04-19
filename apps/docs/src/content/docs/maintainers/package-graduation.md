---
title: 'Package Graduation Path'
---

This document records the current package-boundary recommendation.

## Current package map

- `wp-typia`
  Canonical CLI package.
- `@wp-typia/project-tools`
  Programmatic project orchestration package.
- `@wp-typia/block-runtime`
  Normative generated-project runtime helper package.
- `@wp-typia/create`
  Deprecated legacy package shell.

## Why this split

- CLI ownership stays in one place.
- Project orchestration stays reusable without turning the CLI package into a
  library dump.
- Generated-project helpers live with the package that actually owns them.
- Re-export-only compatibility layers stop obscuring package boundaries.

## What moved where

Moved to `@wp-typia/project-tools`:

- scaffold flow and onboarding
- template resolution and rendering
- add-block orchestration
- migration engine and helpers
- doctor and template inspection helpers
- package-manager and version helpers
- project schema/OpenAPI helpers
- starter manifest helpers

Kept in `@wp-typia/block-runtime`:

- `metadata-core`
- `blocks`
- `defaults`
- `editor`
- `inspector`
- `validation`
- `identifiers`

## Legacy package stance

`@wp-typia/create` remains publishable so npm deprecation and migration
messaging can point somewhere stable, but it is no longer the supported home
for runtime imports or orchestration code.

## Archived npm entrypoints

`create-wp-typia` remains in-repo only as an archived npm-facing redirect.

- keep its source manifest private so future releases do not accidentally
  republish it
- keep its README and manifest description aligned with the canonical
  `wp-typia create` install path
- after a release, use `bun run archived-entrypoints:plan` to print the
  expected npm deprecation command, or `bun run archived-entrypoints:deprecate`
  from an npm-authenticated shell to apply it
