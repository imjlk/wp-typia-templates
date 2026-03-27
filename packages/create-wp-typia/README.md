# create-wp-typia

Scaffold WordPress Typia block templates with a selectable project package manager.

## Usage

```bash
bun create wp-typia my-block
```

Alternative entrypoints:

```bash
bunx create-wp-typia my-block
npx create-wp-typia my-block
```

The CLI always asks which package manager the generated project should use.
For non-interactive usage, pass it explicitly:

```bash
npx create-wp-typia my-block --template basic --package-manager pnpm --yes --no-install
```

Additional commands:

```bash
create-wp-typia templates list
create-wp-typia templates inspect basic
create-wp-typia doctor
```

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.
