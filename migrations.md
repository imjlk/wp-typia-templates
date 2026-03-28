# Migration Guide

The `advanced` template is designed for blocks that need to preserve compatibility with legacy attributes over time.

## What stays the source of truth

- `src/types.ts` describes the current block contract.
- `block.json` is generated from that contract for WordPress.
- `typia.manifest.json` keeps the richer Typia constraints that are not projected into `block.json`.

## Snapshot model

Legacy versions are stored as generated snapshots:

- `src/migrations/versions/<semver>/block.json`
- `src/migrations/versions/<semver>/typia.manifest.json`
- `src/migrations/versions/<semver>/save.tsx`

Those snapshots are committed so the project can keep deprecated Gutenberg entries and migration rules aligned with old releases.

## First release

After creating an `advanced` project:

```bash
bun run migration:init
```

This bootstraps the migration workspace and stores the first snapshot at `1.0.0`.

## New schema version

When the block schema changes:

1. Update `src/types.ts`.
2. Regenerate metadata.
3. Snapshot the new release.
4. Scaffold a direct migration edge from the old version.
5. Verify the generated rule and fixture set.

Example:

```bash
bun run sync-types
bun run migration:snapshot -- --version 2.0.0
bun run migration:diff -- --from 1.0.0
bun run migration:scaffold -- --from 1.0.0
bun run migration:verify
```

## Generated rule files

Scaffolded rules live in:

```text
src/migrations/rules/<from>-to-<to>.ts
```

Automatic cases are filled for you:

- copy compatible fields
- fill new defaults
- drop removed fields
- normalize additive object and array changes

Manual work is still required for:

- field renames
- primitive type changes
- stricter enums or format constraints
- semantic transforms

If unresolved `TODO MIGRATION:` markers remain, `migration:verify` fails on purpose.

## Deprecated Gutenberg entries

The CLI also regenerates:

- `src/migrations/generated/registry.ts`
- `src/migrations/generated/deprecated.ts`
- `src/migrations/generated/verify.ts`

`src/index.tsx` wires `deprecated` into `registerBlockType`, so legacy blocks can be upgraded through the normal Gutenberg deprecation flow.

## Dashboard and site scan

The advanced template includes an admin-side migration dashboard that can:

- scan posts for legacy block attributes
- summarize version distribution
- preview migration work
- batch-migrate matching blocks

This scan is REST-based and stays on the JavaScript side. It does not depend on PHP migration code.
