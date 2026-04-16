# Formatting Toolchain Policy

`wp-typia` keeps formatting expectations explicit instead of leaving them to drift package by package.

## Current baseline

- the repository root owns `eslint` at `9.39.4`
- the repository root owns `@eslint/js` at `9.39.4`
- the repository root owns `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` at `8.58.2`
- the repository root owns `prettier` at `3.8.2`
- the repository root owns `eslint-config-prettier` at `10.1.8`
- `bun run format:check` is the canonical non-mutating formatter gate for repo-owned files
- `bun run format:write` is the canonical mutating formatter command for the same repo-owned files
- `bun run lint:fix` is the canonical autofix entrypoint for the root ESLint scope
- `bun run formatting-policy:validate` checks that package manifests and CI wiring still match the documented formatter baseline

## Scope of `format:check`

`bun run format:check` is intentionally scoped to repo-owned documentation, configuration, workflow, and policy files such as:

- root docs and meta docs
- `docs/**/*.md` except generated Typedoc outputs under `docs/API.md` and `docs/api/**`
- root config and workspace metadata
- `.github` workflow and markdown files
- repo policy/validation scripts that define the formatter baseline itself

It is not a blanket formatter pass over every source file in the monorepo.

Why the scope stays narrow:

- package and example source already have stronger ownership through ESLint, TypeScript, `@wordpress/scripts`, and targeted runtime tests
- generated or emitter-owned template sources should not pick up large formatting churn unless we explicitly choose that in a separate PR
- repo-owned prose, workflow, and policy files are the places where style drift hurts maintainer velocity the fastest

## Autofix commands

Use the root autofix scripts when you are changing repo-owned infrastructure,
docs, or policy files:

- `bun run lint:fix` for root ESLint autofixes
- `bun run format:write` for the repo-owned Prettier write pass

Those commands intentionally match the same repo-owned scope as `lint:repo` and
`format:check`; they are not meant to replace package-local or example-local
tooling such as `@wordpress/scripts`.

## Example apps and built-in templates

Example apps and built-in scaffold package manifests stay aligned on `prettier` `3.8.2` when they declare a direct formatter dependency.

Those packages still use `wp-scripts format` as their primary formatter command. The direct Prettier pin exists so editor integrations and ad hoc local formatting do not silently drift away from the repository baseline.

## CI posture

Formatting is a first-class CI expectation.

- the main lint job runs `bun run formatting-policy:validate`
- the same lint job runs `bun run format:check`
- `bun run ci:local` includes both commands before the broader lint/type/test/build pass

If we decide to widen or narrow formatter scope later, change this document, the validator, and the CI step in the same PR so the policy remains intentional.
