---
title: 'Migration Guide'
---

`wp-typia` no longer treats migrations as a built-in scaffold template. Instead, the repository ships a migration-capable repo-local reference app at [`examples/my-typia-block`](https://github.com/imjlk/wp-typia/tree/main/examples/my-typia-block), and built-in scaffolds can now opt into the same capability with `--with-migration-ui`.

That opt-in scaffold mode:

- seeds an initialized migration workspace at `v1`
- wires an editor-embedded migration dashboard into the generated block
- keeps the CLI migration commands as the public workflow
- stays optional, so default scaffolds remain lightweight

From the repository root, treat the example app as the reference target and use `examples:*` commands for build/dev/test flows.

The `migration:*` and `sync-types` commands shown below are run inside `examples/my-typia-block` (or inside your own generated project root after scaffolding), not from the repository root `package.json`.

## What stays the source of truth

- `src/types.ts` describes the current block contract.
- `block.json` is generated from that contract for WordPress.
- `typia.manifest.json` v2 keeps richer Typia constraints, explicit default markers, and supported discriminated union metadata.
- Migration version labels like `v1`, `v2`, and `v3` track schema lineage only. They do not replace your package version, plugin version, OpenAPI `info.version`, or block attribute `schemaVersion`.

## Breaking reset for old workspaces

Older semver-based migration workspaces are no longer supported in place. If
you still have `currentVersion`, `supportedVersions`, or semver-named snapshot
or rule paths under `src/migrations/`, the CLI now fails early and asks you to:

1. back up `src/migrations/` if needed
2. remove or reset the old migration workspace
3. rerun `wp-typia migrate init --current-migration-version v1`

## Snapshot model

Legacy versions are stored as generated snapshots.

Single-block legacy projects may still use the original flat layout:

- `src/migrations/versions/<label>/block.json`
- `src/migrations/versions/<label>/typia.manifest.json`
- `src/migrations/versions/<label>/save.tsx`

New `--with-migration-ui` scaffolds use the multi-block-aware layout instead:

- `src/migrations/versions/<label>/<blockKey>/block.json`
- `src/migrations/versions/<label>/<blockKey>/typia.manifest.json`
- `src/migrations/versions/<label>/<blockKey>/save.tsx`

Those snapshots are committed so the project can keep deprecated Gutenberg entries and migration rules aligned with old releases.

## First release

After adopting an older project into the migration workflow:

```bash
bun run migration:init
```

This bootstraps the migration workspace and stores the first snapshot at `v1`.

For retrofit workflows, `migration:init` now auto-detects the common first-party
layouts:

- single-block projects using `src/block.json`, `src/types.ts`, and `src/save.tsx`
- legacy single-block projects still using root `block.json` plus `src/types.ts` and `src/save.tsx`
- multi-block projects using `src/blocks/*/block.json`

When `src/blocks/*` is present, every detected block target is added to
`src/migrations/config.ts`, including scaffolded hidden compound child blocks.

If you scaffolded with `--with-migration-ui`, that initialization already
happened during scaffold creation and you do not need to run `migration:init`
again.

For example, a retrofitted multi-block config now starts like this:

```ts
export const migrationConfig = {
  currentMigrationVersion: 'v1',
  supportedMigrationVersions: ['v1'],
  snapshotDir: 'src/migrations/versions',
  blocks: [
    {
      key: 'compound-parent',
      blockName: 'create-block/compound-parent',
      blockJsonFile: 'src/blocks/compound-parent/block.json',
      manifestFile: 'src/blocks/compound-parent/typia.manifest.json',
      saveFile: 'src/blocks/compound-parent/save.tsx',
      typesFile: 'src/blocks/compound-parent/types.ts',
    },
  ],
} as const;
```

Custom layouts can still skip auto-detection and author `src/migrations/config.ts`
manually.

## Previewing an edge before scaffold

The migration CLI now has two read-only preview entrypoints:

- `wp-typia migrate wizard`: interactive, TTY-only legacy-version discovery
- `wp-typia migrate plan --from-migration-version <label>`: scriptable preview when you already know the legacy migration version

Both commands stop after previewing one selected `from -> to` edge. They do not
write rules, fixtures, snapshots, or generated artifacts.

Use `wp-typia migrate wizard` when you want the CLI to show the configured
legacy migration versions first and let you pick one. Use
`wp-typia migrate plan --from-migration-version <label>` when you already know the migration version
you want to inspect and just need a read-only summary of:

- the current migration version
- available legacy migration versions
- the selected migration edge
- included and skipped block targets
- per-block diffs and risk summaries
- the exact next commands to run

For example:

```bash
wp-typia migrate wizard
wp-typia migrate plan --from-migration-version v1
```

## New schema version

When the block schema changes:

1. Update `src/types.ts`.
2. Regenerate metadata.
3. Preview the edge you want to preserve.
4. Snapshot the new release.
5. Scaffold a direct migration edge from the old migration version.
6. Verify the generated rule and fixture set.

Example:

```bash
bun run sync-types
wp-typia migrate plan --from-migration-version v1
bun run migration:snapshot -- --migration-version v3
bun run migration:doctor
bun run migration:diff -- --from-migration-version v1
bun run migration:scaffold -- --from-migration-version v1
bun run migration:fixtures -- --all --force
bun run migration:verify
bun run migration:fuzz -- --all --iterations 25 --seed 1
```

When omitted, `verify`, `doctor`, `fixtures`, and `fuzz` target the first legacy
migration version only. Add `--all` to run across every configured legacy migration version and,
for multi-block projects, every configured block target in the workspace.

The intended authoring flow is:

1. change `src/types.ts`
2. regenerate metadata with `bun run sync-types`
3. preview the selected legacy migration edge with `wp-typia migrate wizard` or `wp-typia migrate plan --from-migration-version <label>`
4. snapshot the release you want to preserve
5. scaffold the edge from the old snapshot to the current schema
6. review auto-applied renames
7. fill in any suggested semantic transforms
8. adjust nested leaf paths like `settings.label` or `linkTarget.url.href` if object or union-branch fields moved
9. adjust the generated fixture cases to match real legacy payloads
10. run `migration:doctor`
11. run `migration:verify`
12. run `migration:fuzz`
13. use the admin dashboard dry-run before batch migration

## Generated rule files

Scaffolded rules live in:

```text
src/migrations/rules/<from>-to-<to>.ts
```

Block-aware scaffolds scope those files per target:

```text
src/migrations/rules/<blockKey>/<from>-to-<to>.ts
```

Edge fixtures now live next to them:

```text
src/migrations/fixtures/<from>-to-<to>.json
```

Or, for block-aware scaffolds:

```text
src/migrations/fixtures/<blockKey>/<from>-to-<to>.json
```

Automatic cases are filled for you:

- copy compatible fields
- fill new defaults
- drop removed fields
- normalize additive object and array changes
- preserve compatible discriminated union branches
- auto-apply high-confidence top-level renames
- auto-apply high-confidence nested leaf renames inside objects and supported union branches

Manual work is still required for:

- field renames
- primitive type changes
- stricter enums or format constraints
- semantic transforms
- discriminator changes or branch removals in discriminated unions

Scaffolded rules expose:

- `renameMap`: `currentField -> legacy.path`
- `transforms`: field-level semantic overrides
- `unresolved`: issues that must be resolved before `verify`
- `migrate()`: the generated edge implementation used by deprecated entries and batch migration

`migration:doctor` is the deep read-only audit for migration-enabled workspaces.
Use root `wp-typia doctor` for environment readiness and lightweight workspace
source-tree drift checks. Use `migration:doctor` when you want to verify:

- migration block targets stay aligned with the current workspace `BLOCKS` inventory
- snapshot directories and required files
- generated `registry.ts`, `deprecated.ts`, `verify.ts`, and `fuzz.ts`
- missing or empty edge fixtures
- unresolved `TODO MIGRATION:` markers
- deprecated / generated registry drift
- fixture coverage for default, rename, transform, and supported union-branch cases

`migration:fixtures` is the explicit refresh path for edge fixtures. Without
`--force`, existing fixture files are preserved and reported as skipped. Use
`--force` when you want the CLI to refresh those files from the current
generated edge output.

In TTY usage, `migration:fixtures -- --force` asks once before overwriting
existing fixture files and reports how many files will be replaced. In
non-interactive usage, `--force` still overwrites immediately so scripted flows
stay compatible. `--all` does not change that overwrite rule by itself; it only
widens the set of legacy migration versions and block targets considered for
generation.

`migration:fuzz` is intentionally separate from `migration:verify`. `verify` stays deterministic and fixture-driven, while `fuzz` replays fixture cases and then generates seeded random current samples with `validators.random()`, converts the safe subset back into legacy-shaped inputs, migrates them, and validates the result against the current Typia validator.

High-confidence renames are written into `renameMap` automatically. Ambiguous candidates stay unresolved, and semantic-risk coercions are emitted as suggested transform bodies with unresolved markers left in place. Nested authoring uses the current-path convention:

- `settings.label`
- `cta.href`
- `linkTarget.url.href`

If unresolved `TODO MIGRATION:` markers or unresolved entries remain, `migration:verify` fails on purpose.

If `verify` or `fuzz` report missing generated inputs, rerun
`migration:scaffold -- --from-migration-version <label>` for the missing edge and then
`migration:doctor -- --all` to confirm the workspace is back in sync.

`wp-typia migrate wizard` is TTY-only by design. If you are in a
non-interactive shell, use `wp-typia migrate plan --from-migration-version <label>` instead.

## Deprecated Gutenberg entries

The CLI also regenerates:

- `src/migrations/generated/registry.ts`
- `src/migrations/generated/deprecated.ts`
- `src/migrations/generated/verify.ts`

Block-aware scaffolds use scoped generated directories such as:

- `src/migrations/generated/<blockKey>/registry.ts`
- `src/migrations/generated/<blockKey>/deprecated.ts`
- `src/migrations/generated/<blockKey>/verify.ts`
- `src/migrations/generated/<blockKey>/fuzz.ts`
- `src/migrations/generated/index.ts`

`src/index.tsx` wires `deprecated` into `registerBlockType`, so legacy blocks can be upgraded through the normal Gutenberg deprecation flow.

## Dashboard and site scan

The reference app and `--with-migration-ui` scaffolds include an editor-side
migration dashboard that can:

- scan posts for legacy block attributes
- summarize version distribution
- preview migration work with before/after payloads
- batch-migrate matching blocks
- export markdown and JSON reports

This scan is REST-based and stays on the JavaScript side. It does not depend on PHP migration code.

Dry-run and batch execution share the same `autoMigrate()` path, so the preview you see in the dashboard is the same migration logic that will be applied during writes.

For compound scaffolds, the dashboard entrypoint lives on the parent block, but
the scan and migration runtime cover both the parent and the scaffolded hidden
child blocks.

That same parent-plus-hidden-child coverage now applies to retrofitted compound
projects when `migration:init` discovers both block directories under
`src/blocks/*`.

The dashboard preview now highlights:

- changed field paths
- discriminated union branch matches
- migration risk summary buckets (`additive`, `rename`, `semanticTransform`, `unionBreaking`)
- validation errors
- unresolved/manual review badges
- compact post summaries with expandable before/after payload detail

## Example pack

The reference app also ships a reference-only example pack at:

```text
src/migrations/examples/rename-transform-union/
```

It demonstrates:

- a top-level rename
- a nested path rename
- a semantic transform
- a discriminated union branch change that still needs manual review

The example pack does not register itself into `supportedMigrationVersions` and does not affect runtime migration execution.

## Server-side foundation

The reference app and other migration-capable projects can also ship:

- `typia-validator.php`
- `typia-migration-registry.php`
- `render.php`

`render.php` demonstrates the intended server boundary: normalize with the generated validator, validate the supported subset, and render only when the payload is safe. Migration execution still stays JS-first.
