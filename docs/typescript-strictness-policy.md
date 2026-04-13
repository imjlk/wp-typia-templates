# TypeScript Strictness Policy

The repository uses a staged TypeScript strictness policy instead of letting packages opt into stricter behavior ad hoc.

## Stage 1: repo-wide baseline

`/Users/imjlk/repos/imjlk/wp-typia-boilerplate/tsconfig.base.json` is the canonical owner for the current repo-wide baseline:

- `strict: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `useUnknownInCatchVariables: true`

Every package and example should inherit those flags from `tsconfig.base.json`, either directly or through `/Users/imjlk/repos/imjlk/wp-typia-boilerplate/tsconfig.json`.

Package-level `tsconfig` files should not repeat those options locally. If a config sets one of the adopted baseline flags itself, that is treated as accidental drift rather than intentional policy.

## Deferred strictness flags

The following flags are intentionally deferred until the repo is ready to ratchet them in a focused pass:

- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- `noImplicitReturns`
- `noPropertyAccessFromIndexSignature`

Those flags should not appear in package or example `tsconfig` files without an explicit, temporary exception recorded in `/Users/imjlk/repos/imjlk/wp-typia-boilerplate/scripts/validate-typescript-strictness-policy.mjs`.

## Temporary exceptions

If a package truly needs a temporary deviation:

1. add the exact override to `TYPESCRIPT_STRICTNESS_POLICY_EXCEPTIONS`
2. document why the exception exists
3. remove it once the package can inherit the repo baseline cleanly

The validator treats undeclared strictness overrides as policy drift.

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
