# Contributing

Thanks for helping improve `wp-typia-templates`.

## Local setup

This repository is Bun-first:

```bash
bun install
```

## Common checks

```bash
bun run typecheck
bun run test
bun run build
bun run test:coverage
```

For generated project smoke checks:

```bash
node scripts/run-generated-project-smoke.mjs --runtime node --template basic --package-manager npm --project-name smoke-basic
```

## Documentation

```bash
bun run docs:build
```

## Pull requests

- Keep changes scoped and intentional.
- Add or update tests when behavior changes.
- If a template workflow changes, update the user-facing README or tutorial in the same PR.
- For `advanced` migration changes, verify at least one `migration:*` flow locally before opening the PR.
