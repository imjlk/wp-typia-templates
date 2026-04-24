# Examples

`wp-typia` now keeps focused reference apps under `examples/` instead of several built-in kitchen-sink templates.

## `my-typia-block`

[`examples/my-typia-block`](./my-typia-block) is the repo-local reference app for the repository.

It demonstrates:

- Typia-driven `block.json`, `typia.manifest.json`, and `typia-validator.php`
- runtime validation and manifest-driven defaults
- shared semantic types from `@wp-typia/block-types`
- server rendering with `render.php`
- WordPress Interactivity API usage
- snapshot migrations, fixtures, and admin preview tooling

## When to use it

Use the reference app when you want to:

- inspect the fullest supported `wp-typia` feature set
- copy migration workspace patterns into a real block
- understand the app that powers the repo's E2E and fixture coverage

Use the built-in scaffolds from `wp-typia` when you want a smaller starting point:

- `basic`
- `interactivity`
- `persistence`
- `compound`

## `persistence-examples`

[`examples/persistence-examples`](./persistence-examples) is the runtime reference plugin for persistence policies.

It demonstrates:

- a public counter protected by signed short-lived write tokens
- an authenticated per-user like toggle
- a multi-block example plugin that registers both blocks from one workspace

## `compound-patterns`

[`examples/compound-patterns`](./compound-patterns) is the runtime reference plugin for compound parent/child scaffolds.

It demonstrates:

- a top-level parent block backed by `InnerBlocks`
- a hidden child block constrained by `parent`
- template-seeded internal items that remain valid after save and reopen

## `api-contract-adapter-poc`

[`examples/api-contract-adapter-poc`](./api-contract-adapter-poc) is the
non-WordPress proof of concept for serving the shared endpoint manifests outside
PHP.

It demonstrates:

- a portable adapter server that mounts the same route table as the shared
  endpoint manifest and OpenAPI document
- opt-in `typia.llm` artifact generation for adapter-facing REST contracts
- explicit `lint` and `format` scripts even though it does not use the
  `wp-scripts` block toolchain

## Quick Start

```bash
bun install
bun run examples:build
bun run examples:dev
bun run examples:dev:persistence
bun run examples:dev:compound
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

- [Migration Guide](https://imjlk.github.io/wp-typia/guides/migrations/)
- [Interactivity Guide](https://imjlk.github.io/wp-typia/guides/interactivity/)
- [API Guide](https://imjlk.github.io/wp-typia/reference/api/)
- [Compound Block Tutorial](https://imjlk.github.io/wp-typia/tutorials/compound-block-tutorial/)
