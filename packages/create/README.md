# @wp-typia/create

Scaffold WordPress Typia block templates with a selectable project package manager.

## Usage

```bash
bun create wp-typia my-block
```

Alternative entrypoints:

```bash
bunx @wp-typia/create my-block
npx @wp-typia/create my-block
# compatibility
npx create-wp-typia my-block
```

The CLI always asks which package manager the generated project should use.
For non-interactive usage, pass it explicitly:

```bash
npx @wp-typia/create my-block --template basic --package-manager pnpm --yes --no-install
```

Additional commands:

```bash
wp-typia templates list
wp-typia templates inspect basic
wp-typia migrations init --current-version 1.0.0
wp-typia migrations diff --from 1.0.0
wp-typia migrations scaffold --from 1.0.0
wp-typia migrations verify --all
wp-typia doctor
```

The `migrations` commands are for projects generated from the `advanced` template. That template includes a dynamic `render.php` server example, snapshot-based migration workspace, generated `typia-validator.php`, and `renameMap` / `transforms` authoring helpers. Basic, full, and interactivity projects do not include the snapshot migration workspace.

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

`@wp-typia/create` is the canonical package. `create-wp-typia` remains only as a compatibility shim for `bun create wp-typia` and existing unscoped installs.
