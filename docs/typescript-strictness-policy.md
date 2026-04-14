# TypeScript Strictness Policy

The repository uses a staged TypeScript strictness policy instead of letting packages opt into stricter behavior ad hoc.

## Stage 1: repo-wide baseline

`tsconfig.base.json` is the canonical owner for the current repo-wide baseline:

- `strict: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `useUnknownInCatchVariables: true`

Every package and example should inherit those flags from `tsconfig.base.json`, either directly or through `tsconfig.json`.

Package-level `tsconfig` files should not repeat those options locally. If a config sets one of the adopted baseline flags itself, that is treated as accidental drift rather than intentional policy.

## Deferred strictness flags

The following flags are intentionally deferred until the repo is ready to ratchet them in a focused pass:

- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noImplicitReturns`
- `noPropertyAccessFromIndexSignature`

Those flags should not appear in package or example `tsconfig` files without an explicit, temporary exception recorded in `scripts/validate-typescript-strictness-policy.mjs`.

## Targeted package ratchets and temporary exceptions

Deferred flags can still be enabled package-by-package, but only through an
explicit policy entry in `scripts/validate-typescript-strictness-policy.mjs`.

Use that allowlist for either:

1. an intentional package-level ratchet that already passes cleanly
2. a temporary exception that needs to be tracked explicitly

The validator treats undeclared strictness overrides as policy drift, and it
fails stale allowlist entries once the matching override disappears.

### Current targeted ratchet

- `packages/wp-typia-block-types/tsconfig.json`
  - `exactOptionalPropertyTypes: true`
  - `noUncheckedIndexedAccess: true`
  - rationale: the locally owned block registration surface from `#279`,
    plus the JSON artifact/helper cleanup from `#280`, `#281`, and `#286`,
    reduced the package's cast-heavy boundaries enough for both flags to pass
    cleanly.

## Current blockers

Focused trials on `2026-04-15` produced the following result set:

- `@wp-typia/block-types`: passes `exactOptionalPropertyTypes` and
  `noUncheckedIndexedAccess` cleanly, so the package-level ratchet is now
  enabled.
- `@wp-typia/block-runtime`: remains deferred for both flags.

### `@wp-typia/block-runtime` blockers

- `exactOptionalPropertyTypes`
  - optional-property ownership still leaks `undefined` through runtime-facing
    descriptors such as `EditorFieldDescriptor`, `InspectorComponentMap`,
    metadata parsing nodes, validation results, and sync/report option bags
  - the experiment also surfaced shared-graph fallout in
    `packages/wp-typia-api-client/src/internal/runtime-primitives.ts`, so a
    clean ratchet there needs coordinated optional-property cleanup across that
    boundary rather than a one-off tsconfig flip
- `noUncheckedIndexedAccess`
  - remaining hotspots are concentrated in runtime indexing code:
    identifier segments, metadata parser tree walks, diagnostic/root-node
    selection, and validation record indexing
  - `#281` removed the worst generic helper noise, but the remaining errors are
    still meaningful enough that they should be fixed deliberately instead of
    hidden behind a broad exception

### Current decision

- landed: package-level ratchet for `@wp-typia/block-types`
- deferred: `@wp-typia/block-runtime`
- no explicit `@wp-typia/block-runtime` exception is recorded yet

## Validation

Run:

```bash
bun run typescript-strictness:validate
```

That validator ensures:

- the adopted baseline is owned by `tsconfig.base.json`
- package and example configs do not redundantly restate adopted flags
- deferred flags are not enabled ad hoc
- any future exceptions stay explicit rather than accidental
