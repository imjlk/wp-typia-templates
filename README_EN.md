# wp-typia

[![CI/CD](https://github.com/imjlk/wp-typia/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/imjlk/wp-typia/actions)
[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://opensource.org/licenses/GPL-2.0+)
[![npm version](https://badge.fury.io/js/%40wp-typia%2Fcreate.svg)](https://www.npmjs.com/package/@wp-typia/create)
[![codecov](https://codecov.io/gh/imjlk/wp-typia/branch/main/graph/badge.svg)](https://codecov.io/gh/imjlk/wp-typia)

Practical WordPress block scaffolding with Typia-driven metadata, validation, and shared semantic block types.

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
```

## Built-in Template Model

`wp-typia` now keeps the built-in scaffold surface intentionally small:

- `basic` for clean Typia-first block boilerplate
- `interactivity` for the same base plus WordPress Interactivity API wiring

Richer patterns that used to live in more specialized templates are now demonstrated in the repo-local reference app under [`examples/my-typia-block`](examples/my-typia-block).

## Core Workflow

`src/types.ts` remains the source of truth. From that file, the generated project derives:

- `block.json`
- `typia.manifest.json`
- `typia-validator.php`

Runtime helpers then use precompiled Typia validators and manifest-driven defaults.

```ts
import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";
import { tags } from "typia";

export interface MyBlockAttributes {
  content: string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">;
  alignment?: TextAlignment & tags.Default<"left">;
}
```

## Remote Template MVP

The CLI accepts:

- built-in ids
- local paths
- GitHub locators in the form `github:owner/repo/path[#ref]`

The first remote adapter targets a `create-block`-style subset. `wp-typia` treats the remote source as a seed, then regenerates its own package setup, Typia sync flow, and runtime helpers around it.

## Reference App

[`examples/my-typia-block`](examples/my-typia-block) is the repo-local kitchen-sink reference app. It keeps the richer migration, validation, and server-rendering flows visible without turning the default scaffold into a kitchen-sink starter.

## Packages

- [`@wp-typia/create`](https://www.npmjs.com/package/@wp-typia/create)
- [`@wp-typia/block-types`](https://www.npmjs.com/package/@wp-typia/block-types)
- [`create-wp-typia`](https://www.npmjs.com/package/create-wp-typia) for compatibility with `bun create wp-typia`

## Repository Structure

```text
wp-typia/
├── packages/
│   ├── create/
│   ├── create-wp-typia/
│   └── wp-typia-block-types/
├── examples/
│   └── my-typia-block/
├── tests/
├── docs/
└── .github/
```

## Docs

- [Examples Guide](examples/EXAMPLES.md)
- [Architecture Guide](docs/architecture.md)
- [API Guide](docs/API.md)
- [Interactivity Guide](docs/interactivity.md)
- [Migration Guide](docs/migrations.md)
- [Union Support Guide](docs/union-support.md)
- [Contributing Guide](CONTRIBUTING.md)

## Repository Development

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
