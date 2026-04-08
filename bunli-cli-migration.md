# `wp-typia` Bunli Migration Contract

This note records the agreed boundary for the next `wp-typia` CLI migration
round.

## Current State

- `packages/wp-typia` owns the published CLI package, top-level command
  taxonomy, help surface, and `bin/wp-typia.js`.
- The active runtime is still the hand-run bridge in
  `packages/wp-typia/lib/cli.js`.
- `packages/wp-typia/src/*` and `packages/wp-typia/bunli.config.ts` are the
  staged Bunli target layout only. They are not the active runtime yet.

## Non-Negotiable Ownership Boundary

- `wp-typia` must remain the only CLI-owning package.
- `@wp-typia/create` must remain non-CLI.
- `@wp-typia/create` must not regain a `bin` entry.
- `@wp-typia/create` must not regain an exported `./cli` surface.
- `@wp-typia/create` remains the scaffold/runtime library behind:
  - create execution
  - add-block execution
  - template inspection
  - migration execution
  - doctor checks

## Intended Bunli Command Tree

- `create`
- `add`
- `templates`
- `migrations`
- `doctor`

Compatibility alias:

- `wp-typia <project-dir>` remains supported as a compatibility alias to
  `wp-typia create <project-dir>`.

## Full-TUI Scope For The Next Round

TTY-first TUI flows should cover:

- `wp-typia create`
- `wp-typia add`
- `wp-typia migrations`

Those TUI flows must not break automation. Fully specified commands must remain
non-interactive for CI, shell scripts, `npx wp-typia`, and `bunx wp-typia`.

## Tooling Note

The checked-in Bunli prep currently stops short of executing `@bunli/test`
inside the repo test suite because the package advertises a Bun `>=1.3.11`
peer floor and the current repo toolchain still runs on Bun `1.3.10`. Keep the
prep coverage structural in this round, then move command-surface execution onto
`@bunli/test` once the Bun toolchain floor is raised in the next migration
round.

## Migration Tasks For The Next Round

1. Move active command parsing and dispatch from `packages/wp-typia/lib/cli.js`
   into the Bunli command tree under `packages/wp-typia/src/`.
2. Keep the published package name and canonical entrypoints stable:
   - `npx wp-typia`
   - `bunx wp-typia`
3. Preserve the positional alias:
   - `wp-typia <project-dir>`
4. Keep `@wp-typia/create` focused on runtime/library helpers only.
5. Use Bunli-owned tests to validate the migrated command tree before removing
   the hand-run bridge.
