# API Guide

This repository has two public surfaces:

## 1. `create-wp-typia`

The CLI is the primary entrypoint for new users.

```bash
bun create wp-typia my-block
bunx create-wp-typia my-block
npx create-wp-typia my-block
```

Common commands:

```bash
create-wp-typia templates list
create-wp-typia templates inspect advanced
create-wp-typia doctor
```

Migration commands are available only inside projects generated from the `advanced` template:

```bash
create-wp-typia migrations init --current-version 1.0.0
create-wp-typia migrations snapshot --version 1.0.0
create-wp-typia migrations diff --from 1.0.0
create-wp-typia migrations scaffold --from 1.0.0
create-wp-typia migrations verify --all
```

## 2. Generated project runtime

Each scaffolded project exposes a few predictable files:

- `src/types.ts`: source of truth for the current attribute contract
- `src/validators.ts`: Typia runtime helpers such as `validate`, `assert`, `is`, `random`, `clone`, and `prune`
- `block.json`: WordPress-facing metadata projection
- `typia.manifest.json`: richer schema details preserved for generated PHP validation and migration tooling

The `advanced` template adds:

- `src/migrations/config.ts`
- `src/migrations/versions/`
- `src/migrations/rules/`
- `src/migrations/generated/`
- `src/migrations/fixtures/`

## 3. Generated reference docs

Contributor note:

```bash
bun run docs:build
```

This generates API reference files under `docs/api/` for local inspection or GitHub Pages publishing.
