---
title: '`wp-typia` Bunli Runtime Contract'
---

This note records the implemented ownership boundary after the Bunli cutover
and the project-tools split.

## Current state

- `packages/wp-typia` owns the published CLI package, top-level command
  taxonomy, help surface, Bunli runtime entrypoint, and `bin/wp-typia.js`.
- The active runtime lives in `packages/wp-typia/src/cli.ts` and runs through
  Bunli.
- `packages/wp-typia/bin/wp-typia.js` is only a boot shim that invokes the
  Bunli runtime with Bun.
- The active Bunli runtime assumes Bun `>=1.3.11`.

Canonical usage remains:

- `npx wp-typia create <project-dir>`
- `bunx wp-typia create <project-dir>`
- `wp-typia <project-dir>` as the compatibility alias when `<project-dir>` is the only positional argument
- `wp-typia migrate <subcommand>`

Shorthand references like `npx wp-typia` and `bunx wp-typia` should still map
to the canonical `create` surface in docs and review notes.

## Non-negotiable ownership boundary

- `wp-typia` must remain the only CLI-owning package.
- `@wp-typia/project-tools` must remain non-CLI.
- `@wp-typia/project-tools` must not gain a `bin` entry.
- `@wp-typia/project-tools` must not expose a second top-level CLI parser.
- `@wp-typia/create` must remain a deprecated legacy package shell.

`@wp-typia/project-tools` is the runtime library behind:

- create execution
- add-block execution
- template inspection
- migrate execution
- doctor checks
- schema/OpenAPI project helpers

## Alternate-buffer TUI exit contract

- Commands that use Bunli `render` with `bufferMode: "alternate"` must have explicit
  `runtime.exit()` ownership.
- `packages/wp-typia/src/ui/lazy-flow.tsx` owns loader-stage failure and loading-stage quit behavior.
- Mounted `create`, `add`, and `migrate` flows use a shared lifecycle helper for submit,
  cancel, quit, and runtime failure handling.
- Runtime failures are exit-on-failure: report the error, then exit instead of leaving the
  form mounted in the alternate buffer.

## Canonical Bunli command tree

- `create`
- `add`
- `migrate`
- `templates`
- `doctor`
- `mcp`
- `skills`
- `completions`

Compatibility alias:

- `wp-typia <project-dir>` remains supported as a compatibility alias to
  `wp-typia create <project-dir>` when `<project-dir>` is the only positional
  argument.

Breaking change:

- `wp-typia migrations` is removed. Use `wp-typia migrate` instead.
