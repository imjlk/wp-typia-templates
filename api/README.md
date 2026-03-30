wp-typia / [Modules](modules.md)

# wp-typia

Create practical WordPress blocks with Typia-driven metadata, validation, and shared scaffold tooling.

`wp-typia` is a Bun-first monorepo centered on two products:

- [`@wp-typia/create`](https://www.npmjs.com/package/@wp-typia/create) for scaffolding
- [`@wp-typia/block-types`](https://www.npmjs.com/package/@wp-typia/block-types) for reusable WordPress semantic types

It generates `block.json`, `typia.manifest.json`, and `typia-validator.php` from `src/types.ts`, keeps runtime validation close to the block code, and now focuses its built-in scaffold surface on the two templates that are most useful to start from.

## Quick Start

```bash
bun create wp-typia my-block
# or
bunx @wp-typia/create my-block
# or
npx @wp-typia/create my-block
# compatibility
npx create-wp-typia my-block
```

Built-in templates:

- `basic`
- `interactivity`

Non-interactive examples:

```bash
npx @wp-typia/create my-block --template basic --package-manager pnpm --yes --no-install
npx @wp-typia/create my-block --template interactivity --package-manager npm --yes --no-install
```

Remote template MVP:

```bash
npx @wp-typia/create my-block --template ./local-template-dir --package-manager npm --yes --no-install
npx @wp-typia/create my-block --template github:owner/repo/path#main --package-manager npm --yes --no-install
npx @wp-typia/create my-block --template @scope/create-block-template --variant hero --package-manager npm --yes --no-install
```

## Built-in Templates

| Template | What it optimizes for |
| --- | --- |
| `basic` | Minimal, clean boilerplate with Typia metadata sync and runtime validation |
| `interactivity` | The same foundation plus WordPress Interactivity API wiring |

`full` and `advanced` are no longer built-in scaffold targets. Their richer patterns live on in the repo-local reference app under [`examples/my-typia-block`](examples/my-typia-block).

## How the Scaffold Works

1. `src/types.ts` is the source of truth.
2. `bun run sync-types` derives:
   - `block.json`
   - `typia.manifest.json`
   - `typia-validator.php`
3. `src/validators.ts` uses precompiled Typia validators and manifest-driven default application.

Example:

```ts
import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";
import { tags } from "typia";

export interface MyBlockAttributes {
  content: string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">;
  alignment?: TextAlignment & tags.Default<"left">;
  isVisible?: boolean & tags.Default<true>;
}
```

## Reference App

[`examples/my-typia-block`](examples/my-typia-block) is the repo-local kitchen-sink reference app. It is not a built-in template. It is the place where richer features live together:

- server rendering with `render.php`
- migration snapshots and dashboard preview tooling
- richer Typia tags and semantic block types
- interactivity and validator patterns used by E2E and fixture tests

If you want to see the “everything included” shape of `wp-typia`, start there.

## Remote Template MVP

`@wp-typia/create` can scaffold from:

- built-in template ids
- local paths
- GitHub locators in the form `github:owner/repo/path[#ref]`
- npm package specs such as `@scope/create-block-template@latest`

When the source is an official create-block external template config, `--variant <name>` is supported. If the config defines variants and no variant is passed, the first variant is selected automatically.

The current remote adapter supports a `create-block`-style subset:

- `block.json`
- `src/index.*`, `src/edit.*`, `src/save.*`
- optional `render.php`
- style/editor/view assets

The remote source is treated as a seed. `wp-typia` still regenerates its own package setup, Typia sync flow, and runtime helpers around it.

External template configs execute trusted JavaScript (`index.js` / `index.cjs` / `index.mjs`) and can run a `transformer(view)` hook before normalization. Only use template sources you trust.

## Packages

- [`@wp-typia/create`](https://www.npmjs.com/package/@wp-typia/create)
- [`@wp-typia/block-types`](https://www.npmjs.com/package/@wp-typia/block-types)
- [`create-wp-typia`](https://www.npmjs.com/package/create-wp-typia) for `bun create wp-typia` compatibility

## Project Structure

```text
wp-typia/
├── packages/
│   ├── create/                 # Canonical scoped CLI source (@wp-typia/create)
│   ├── create-wp-typia/        # Unscoped compatibility shim
│   └── wp-typia-block-types/   # Shared semantic block types
├── examples/
│   └── my-typia-block/         # Kitchen-sink reference app
├── tests/
├── docs/
└── .github/
```

## Documentation

- [Examples Guide](examples/EXAMPLES.md)
- [Architecture Guide](docs/architecture.md)
- [API Guide](docs/API.md)
- [Interactivity Guide](docs/interactivity.md)
- [Migration Guide](docs/migrations.md)
- [Union Support Guide](docs/union-support.md)
- [Basic Block Tutorial](docs/tutorials/basic-block-tutorial.md)
- [Contributing Guide](CONTRIBUTING.md)

## Repository Development

The repository itself stays Bun-first even though generated projects can use `bun`, `npm`, `pnpm`, or `yarn`.

```bash
bun install
bun run typecheck
bun run test
bun run build
bun run examples:test:e2e
```

Example-specific commands live under the `examples:*` namespace:

```bash
bun run examples:build
bun run examples:dev
bun run examples:lint
bun run examples:test:e2e
```

Command map:

| Command | What it targets |
| --- | --- |
| `bun run build` | Product packages and the repo-local reference app |
| `bun run examples:build` | Reference app only |
| `bun run --filter @wp-typia/create test` | CLI/runtime only |
| `bun run examples:test:e2e` | Playwright against the reference app |

## License

GPL-2.0-or-later. See [LICENSE](LICENSE) for details.
