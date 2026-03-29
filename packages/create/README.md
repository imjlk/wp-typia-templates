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
wp-typia doctor
```

Remote template MVP:

```bash
npx @wp-typia/create my-block --template ./local-template-dir --package-manager npm --yes --no-install
npx @wp-typia/create my-block --template github:owner/repo/path#main --package-manager npm --yes --no-install
```

Built-in templates are intentionally limited to `basic` and `interactivity`.

The `migrations` commands remain available for projects that include the migration workspace, such as the showcase app in [`examples/my-typia-block`](../../examples/my-typia-block) or compatible remote seeds:

```bash
wp-typia migrations init --current-version 1.0.0
wp-typia migrations diff --from 1.0.0
wp-typia migrations scaffold --from 1.0.0
wp-typia migrations verify --all
```

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

`@wp-typia/create` is the canonical package. `create-wp-typia` remains only as a compatibility shim for `bun create wp-typia` and existing unscoped installs.
