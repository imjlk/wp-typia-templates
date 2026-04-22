---
title: '`wp-typia` Bunli Runtime Contract'
---

This note records the implemented ownership boundary after the Bunli cutover
and the project-tools split.

## Current state

- `packages/wp-typia` owns the published CLI package, top-level command
  taxonomy, help surface, Bunli runtime entrypoint, and `bin/wp-typia.js`.
- The authored runtime lives in `packages/wp-typia/src/cli.ts` and is compiled
  into `packages/wp-typia/dist-bunli/cli.js` for the published package.
- `packages/wp-typia/bin/wp-typia.js` must launch built artifacts only:
  `dist-bunli/cli.js` for the full Bunli runtime and `dist-bunli/node-cli.js`
  for Bun-free fallback commands. It must not shell out to `src/cli.ts`.
- Bun `>=1.3.11` remains the maintainer build toolchain for generating Bunli
  metadata and the published runtime artifacts, but the published Node bin no
  longer requires a locally installed Bun binary for the guaranteed fallback
  commands.
- Standalone GitHub Release assets are now a separate distribution lane:
  platform binaries, checksum manifests, and install scripts are published for
  users who want the full Bunli/OpenTUI runtime without relying on `bunx`.

Canonical usage remains:

- `npx wp-typia create <project-dir>`
- `bunx wp-typia create <project-dir>`
- `wp-typia <project-dir>` as the compatibility alias when `<project-dir>` is the only positional argument
- `wp-typia migrate <subcommand>`

Published runtime support model:

- `npx wp-typia` and direct Node execution should target the built
  `dist-bunli` artifacts rather than source TypeScript.
- Bun-free support is guaranteed for the non-TUI Node fallback surface:
  `--version`, `--help`, non-interactive `create` / `add` / `migrate`,
  `doctor`, `sync`, `templates list`, and `templates inspect`.
- Both the Bun runtime and the Node fallback should preserve stable
  machine-readable `error.code` identifiers whenever `--format json` is
  requested, so automation can branch on failure categories without parsing the
  human-readable message body.
- `bunx wp-typia` and local Bun installs should keep using the same published
  full-runtime artifact (`dist-bunli/cli.js`) for Bunli-specific surfaces such
  as `skills`, `completions`, and `mcp`, rather than a separate source
  bootstrap.
- Standalone release assets should compile from the same authored CLI entry
  (`src/cli.ts`) and the same generated Bunli command metadata, but they are a
  distinct build lane from the npm package runtime and are published through a
  dedicated release-asset workflow, not npm tarballs.
- The repo currently drives that standalone compile lane through a small
  repo-owned build script instead of calling `bunli build` directly, because
  the current Bunli CLI path still collides on duplicated OpenTUI environment
  registration in this dependency graph. Revisit that wrapper if upstream
  Bunli resolves the conflict.
- Install scripts should target those standalone release assets directly:
  `install-wp-typia.sh` for macOS/Linux and `install-wp-typia.ps1` for Windows.

Shorthand references like `npx wp-typia` and `bunx wp-typia` should still map
to the canonical `create` surface in docs and review notes.

## Node fallback prompt model

- Bun/OpenTUI remains the canonical rich interactive surface for `create`,
  `add`, and `migrate`.
- The Node fallback should stay readline-based and intentionally lighter, but
  it must no longer feel like a bare escape hatch.
- The fallback prompt contract is:
  - render numbered options with explicit defaults
  - accept option numbers, labels, and raw values
  - support `?`, `help`, and `list` to redraw the current option set
  - retry validation inline with direct guidance instead of dropping the user
    back into an opaque loop
- Business logic, defaults, and validation rules should stay shared with the
  Bun/TUI path through `@wp-typia/project-tools`; only the prompt presentation
  should differ.

## Non-negotiable ownership boundary

- `wp-typia` must remain the only CLI-owning package.
- `@wp-typia/project-tools` must remain non-CLI.
- `@wp-typia/project-tools` must not gain a `bin` entry.
- `@wp-typia/project-tools` must not expose a second top-level CLI parser.

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
