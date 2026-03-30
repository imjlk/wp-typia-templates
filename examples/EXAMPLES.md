# Examples

`wp-typia` now keeps a single reference app under `examples/` instead of several built-in kitchen-sink templates.

## `my-typia-block`

[`examples/my-typia-block`](./my-typia-block) is the showcase app for the repository.

It demonstrates:

- Typia-driven `block.json`, `typia.manifest.json`, and `typia-validator.php`
- runtime validation and manifest-driven defaults
- shared semantic types from `@wp-typia/block-types`
- server rendering with `render.php`
- WordPress Interactivity API usage
- snapshot migrations, fixtures, and admin preview tooling

## When to use it

Use the showcase when you want to:

- inspect the fullest supported `wp-typia` feature set
- copy migration workspace patterns into a real block
- understand the app that powers the repo's E2E and fixture coverage

Use the built-in scaffolds from `@wp-typia/create` when you want a smaller starting point:

- `basic`
- `interactivity`

## Quick Start

```bash
bun install
bun run examples:build
bun run examples:dev
```

## Structure

```text
examples/my-typia-block/
├── block.json
├── render.php
├── typia.manifest.json
├── typia-validator.php
├── scripts/
│   └── sync-types-to-block-json.ts
├── src/
│   ├── admin/
│   ├── migrations/
│   ├── types.ts
│   ├── validators.ts
│   ├── edit.tsx
│   ├── save.tsx
│   ├── index.tsx
│   └── view.ts
└── package.json
```

## Related Docs

- [Migration Guide](../docs/migrations.md)
- [Interactivity Guide](../docs/interactivity.md)
- [API Guide](../docs/API.md)
