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
npx @wp-typia/create my-block --template @scope/create-block-template --variant hero --package-manager npm --yes --no-install
```

When `--template` points at an official create-block external template config, `@wp-typia/create` supports `--variant <name>`. If the external template defines variants and you omit `--variant`, the first variant is selected automatically.

External template configs execute trusted JavaScript (`index.js` / `index.cjs` / `index.mjs`) in the same way `@wordpress/create-block` does. Only use local, GitHub, or npm template sources that you trust.

Built-in templates are intentionally limited to `basic` and `interactivity`.

The `migrations` commands remain available for projects that include the migration workspace, such as the repo-local reference app in [`examples/my-typia-block`](../../examples/my-typia-block) or compatible remote seeds:

```bash
wp-typia migrations init --current-version 1.0.0
wp-typia migrations diff --from 1.0.0
wp-typia migrations scaffold --from 1.0.0
wp-typia migrations verify --all
```

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

Inside the monorepo, reference-app commands use the `examples:*` namespace at the root:

```bash
bun run examples:build
bun run examples:lint
bun run examples:test:e2e
```

`@wp-typia/create` is the canonical package. `create-wp-typia` remains only as a compatibility shim for `bun create wp-typia` and existing unscoped installs.
