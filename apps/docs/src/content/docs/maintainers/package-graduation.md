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

## Historical package shells

The old `@wp-typia/create` and `create-wp-typia` package shells are no longer
kept in-repo. Current package-boundary docs should point directly at
`wp-typia`, `@wp-typia/project-tools`, `@wp-typia/block-runtime`, and
`@wp-typia/create-workspace-template`.
