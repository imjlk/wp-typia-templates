# wp-typia

[![CI/CD](https://github.com/imjlk/wp-typia/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/imjlk/wp-typia/actions)
[![License: GPL-2.0+](https://img.shields.io/badge/License-GPL--2.0+-blue.svg)](https://opensource.org/licenses/GPL-2.0+)
[![npm version](https://badge.fury.io/js/wp-typia.svg)](https://www.npmjs.com/package/wp-typia)
[![codecov](https://codecov.io/gh/imjlk/wp-typia/branch/main/graph/badge.svg)](https://codecov.io/gh/imjlk/wp-typia)

Build WordPress blocks that can evolve safely.

`wp-typia` is a type-first toolkit for WordPress block development. Use `src/types.ts` as the source of truth, then generate `block.json`, `typia.manifest.json`, `typia-validator.php`, and optional schema artifacts from the same contract.

It is built for projects where block attributes change over time, saved content must stay compatible, and data-backed or multi-block patterns should not turn into one-off glue code.

## Who this is for

`wp-typia` is for teams building WordPress blocks that are expected to evolve:

- long-lived blocks with changing attributes and compatibility pressure
- blocks that need typed persistence or REST contracts
- plugin workspaces that may grow into multi-block, variation, pattern, binding-source, or hooked-block workflows

If you only need the smallest possible starter for a single block, `@wordpress/create-block` is still the better default.

## Why wp-typia

- Type-driven block metadata from `src/types.ts`
- Runtime validation close to the block code
- Opt-in migration workflows for versioned block evolution
- Built-in templates for `basic`, `interactivity`, `persistence`, and `compound`
- Typed REST and persistence contracts when blocks need data
- Remote template seeding from local paths, GitHub locators, npm packages, and create-block-style configs

## Choose the right tool

Use **`@wordpress/create-block`** when you want the official minimal starting point for a new block.

Use **`wp-typia`** when you need a block that will grow:

- attributes that will change after release
- validation and defaults derived from a shared contract
- typed persistence and REST surfaces
- compound parent/child block structures
- a migration path for long-lived production blocks

## Quick Start

```bash
bunx wp-typia create my-block
# or
npx wp-typia create my-block
```

`wp-typia <project-dir>` remains available as a backward-compatible alias to `create`.

### Built-in templates

| Template        | What it optimizes for                                                              |
| --------------- | ---------------------------------------------------------------------------------- |
| `basic`         | Minimal block scaffold with type sync and runtime validation                       |
| `interactivity` | The same foundation plus WordPress Interactivity API wiring                        |
| `persistence`   | Typed REST contracts, storage policy options, and data-backed block patterns       |
| `compound`      | Parent/child multi-block scaffolding with optional persistence on the parent layer |

## What makes it different

### 1. Types are the source of truth

Update `src/types.ts`, then sync the WordPress-facing artifacts from that contract.

Generated outputs can include:

- `block.json`
- `typia.manifest.json`
- `typia-validator.php`
- optional `typia.schema.json`
- optional `typia.openapi.json`

Example:

```ts
import type { TextAlignment } from '@wp-typia/block-types/block-editor/alignment';
import { tags } from 'typia';

export interface MyBlockAttributes {
  content: string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<''>;
  alignment?: TextAlignment & tags.Default<'left'>;
  isVisible?: boolean & tags.Default<true>;
}
```

### 2. Blocks can evolve without treating old content as disposable

`wp-typia` includes an opt-in migration workflow for projects that need to preserve compatibility over time.

With migration support enabled, you can:

- snapshot released schemas
- scaffold migration edges from older versions
- verify generated rules and fixtures
- preview and batch migration behavior from a dashboard-enabled project

Use `--with-migration-ui` when you want the scaffolded migration workspace from day one.

### 3. Data-backed blocks are first-class

When a block needs storage or API interaction, the `persistence` template adds a typed contract layer instead of leaving REST and validation as ad-hoc manual code.

Use it for:

- authenticated per-user actions
- public aggregate actions
- custom-table or post-meta-backed flows
- blocks that need both editor UX and runtime-safe API surfaces

### 4. Compound blocks are scaffolded as a system

The `compound` template creates a parent/child block structure with hidden implementation children, so complex `InnerBlocks` patterns start from a maintainable project shape rather than a one-off setup.

## Example flows

```bash
npx wp-typia create my-block --template basic --package-manager pnpm --yes --no-install
npx wp-typia create my-block --template interactivity --package-manager npm --yes --no-install
npx wp-typia create my-block --template persistence --data-storage custom-table --persistence-policy authenticated --package-manager bun --yes --no-install
npx wp-typia create my-block --template persistence --data-storage custom-table --persistence-policy public --package-manager npm --yes --no-install
npx wp-typia create my-block --template compound --package-manager bun --yes --no-install
npx wp-typia create my-block --template compound --persistence-policy public --package-manager npm --yes --no-install
npx wp-typia create my-block --template basic --with-migration-ui --package-manager bun --yes --no-install
```

Empty workspace flow:

```bash
npx wp-typia create my-plugin --template @wp-typia/create-workspace-template --package-manager bun --yes --no-install
cd my-plugin
wp-typia add block counter-card --template basic
wp-typia add block faq-stack --template compound --persistence-policy public --data-storage custom-table
wp-typia add binding-source hero-data
wp-typia add hooked-block counter-card --anchor core/post-content --position after
```

## Start here

- Want the smallest possible starting point? Start with `basic`.
- Need lightweight frontend behavior? Start with `interactivity`.
- Need data, REST, or persistence policies? Start with `persistence`.
- Need a parent/child block system? Start with `compound`.
- Need schema evolution for a long-lived block? Enable `--with-migration-ui`.

## Remote templates

`wp-typia` can scaffold from:

- built-in template ids
- local paths
- GitHub locators in the form `github:owner/repo/path[#ref]`
- npm package specs such as `@scope/create-block-template@latest`

When the source is an official create-block external template config, `--variant <name>` is supported. If the config defines variants and no variant is passed, the first variant is selected automatically.

The current remote adapter supports a create-block-style subset:

- `block.json`
- `src/index.*`, `src/edit.*`, `src/save.*`
- optional `render.php`
- style/editor/view assets

The remote source is treated as a seed. `wp-typia` still regenerates its own package setup, Typia sync flow, and runtime helpers around it.

External template configs execute trusted JavaScript (`index.js` / `index.cjs` / `index.mjs`) and can run a `transformer(view)` hook before normalization. Only use template sources you trust.

Remote template examples:

```bash
npx wp-typia create my-block --template ./local-template-dir --package-manager npm --yes --no-install
npx wp-typia create my-block --template github:owner/repo/path#main --package-manager npm --yes --no-install
npx wp-typia create my-block --template @scope/create-block-template --variant hero --package-manager npm --yes --no-install
```

## Documentation

- [Architecture Guide](docs/architecture.md)
- [Block Generator Architecture](docs/block-generator-architecture.md)
- [Block Generator Tool Contract](docs/block-generator-tool-contract.md)
- [External Template-Layer Composition RFC](docs/external-template-layer-composition.md)
- [API Guide](docs/API.md)
- [Migration Guide](docs/migrations.md)
- [Error and Export Contract Guide](docs/error-export-contracts.md)
- [Formatting Toolchain Policy](docs/formatting-toolchain-policy.md)
- [Maintenance Automation Policy](docs/maintenance-automation-policy.md)
- [Package Manifest Policy](docs/package-manifest-policy.md)
- [TypeScript Strictness Policy](docs/typescript-strictness-policy.md)
- [Upgrade Guide](UPGRADE.md)
- [Security Policy](SECURITY.md)
- [Interactivity Guide](docs/interactivity.md)
- [Examples Guide](examples/EXAMPLES.md)
- [Package Graduation](docs/package-graduation.md)
- [Union Support Guide](docs/union-support.md)
- [Basic Block Tutorial](docs/tutorials/basic-block-tutorial.md)
- [Compound Block Tutorial](docs/tutorials/compound-block-tutorial.md)
- [Contributing Guide](CONTRIBUTING.md)

## Reference Apps

[`examples/my-typia-block`](examples/my-typia-block) is the repo-local kitchen-sink reference app. It is not a built-in template. It is the place where richer Typia, migration, and editor patterns live together:

- server rendering with `render.php`
- migration snapshots and dashboard preview tooling
- richer Typia tags and semantic block types
- interactivity and validator patterns used by E2E and fixture tests

[`examples/persistence-examples`](examples/persistence-examples) is the runtime reference for persistence policies. It demonstrates:

- a public aggregate counter backed by signed short-lived write tokens
- an authenticated per-user like button backed by a custom table
- multi-block plugin registration from one example workspace

[`examples/compound-patterns`](examples/compound-patterns) is the runtime reference for compound parent/child scaffolds. It demonstrates:

- a single top-level parent block with `InnerBlocks`
- a hidden implementation child block constrained by `parent`
- template-seeded internal items that survive save and reopen cycles

If you want to see the “everything included” shape of `wp-typia`, start with `my-typia-block`. If you want to study persistence policy behavior, start with `persistence-examples`. If you want to scaffold parent/child `InnerBlocks` structures, start with `compound-patterns`.

## Packages

- [`wp-typia`](https://www.npmjs.com/package/wp-typia) as the canonical CLI package
- [`@wp-typia/create-workspace-template`](https://www.npmjs.com/package/@wp-typia/create-workspace-template) as the official empty workspace template package
- [`@wp-typia/project-tools`](https://www.npmjs.com/package/@wp-typia/project-tools) as the canonical programmatic project orchestration package
- [`@wp-typia/create`](https://www.npmjs.com/package/@wp-typia/create) as the deprecated legacy package shell
- [`@wp-typia/block-types`](https://www.npmjs.com/package/@wp-typia/block-types)
- [`@wp-typia/rest`](https://www.npmjs.com/package/@wp-typia/rest)
- [`@wp-typia/api-client`](https://www.npmjs.com/package/@wp-typia/api-client)
- [`@wp-typia/block-runtime`](https://www.npmjs.com/package/@wp-typia/block-runtime) as the current graduation prototype for defaults/editor/validation helpers

## Project Structure

```text
wp-typia/
├── packages/
│   ├── wp-typia/               # Canonical CLI package
│   ├── create/                 # Compatibility/programmatic scaffold runtime
│   ├── create-workspace-template/ # Official empty workspace template package
│   ├── wp-typia-api-client/    # Backend-neutral generated API client runtime
│   ├── wp-typia-block-runtime/ # Prototype block runtime facade package
│   ├── wp-typia-rest/          # Typed REST client helpers
│   └── wp-typia-block-types/   # Shared semantic block types
├── examples/
│   ├── my-typia-block/         # Kitchen-sink reference app
│   ├── persistence-examples/   # Persistence policy reference plugin
│   └── compound-patterns/      # Compound parent/child reference plugin
├── tests/
├── docs/
└── .github/
```

## Repository Development

The repository itself stays Bun-first even though generated projects can use `bun`, `npm`, `pnpm`, or `yarn`.

```bash
bun install
bun run lint:repo
bun run format:check
bun run maintenance-automation:validate
bun run typecheck
bun run test:all
bun run build
bun run ci:local
bun run examples:test:e2e
```

Root ESLint covers repository infrastructure code such as `scripts/**`,
`tests/**`, root config files, and package-side non-example sources. Example app
source stays under the existing `examples:lint` workflow powered by
`@wordpress/scripts`.

Repository-owned docs/config/workflow files use a shared `Prettier 3.8.2`
baseline. `bun run format:check` and `bun run formatting-policy:validate` are
part of both the maintainer preflight and the GitHub Actions lint gate. See the
[Formatting Toolchain Policy](docs/formatting-toolchain-policy.md) for the
explicit scope and rationale.

Repository maintenance automation is explicit too. Dependabot currently owns
GitHub Actions and Composer update PRs on `main`, while Bun/npm workspace
dependency bumps stay maintainer-led until we have release-aware bot support.
Composer audit now gates PRs and `main`, while the broader Bun audit stays on a
scheduled/manual maintenance lane until the JS toolchain baseline is narrower
and more actionable. See the
[Maintenance Automation Policy](docs/maintenance-automation-policy.md) for the
chosen review posture and release interaction rules.

Example-specific commands live under the `examples:*` namespace:

```bash
bun run examples:build
bun run examples:dev
bun run examples:lint
bun run examples:test:e2e
```

`bun run ci:local` is the recommended maintainer pre-PR command. It mirrors the
fast CI path for changesets, publish validation, linting, typechecking, tests,
and builds, but intentionally excludes `wp-env` startup and Playwright E2E.

Command map:

| Command                                   | What it targets                                   |
| ----------------------------------------- | ------------------------------------------------- |
| `bun run lint:repo`                       | Root ESLint for repo infrastructure code          |
| `bun run lint:all`                        | Root ESLint, example linting, and PHP checks      |
| `bun run format:check`                    | Non-mutating Prettier check for repo-owned files  |
| `bun run formatting-policy:validate`      | Validates the documented formatter/toolchain gate |
| `bun run maintenance-automation:validate` | Validates Dependabot and audit workflow policy    |
| `bun run test:all`                        | Root unit and CLI test aggregation                |
| `bun run ci:local`                        | Fast maintainer preflight without E2E/wp-env      |
| `bun run build`                           | Product packages and the repo-local reference app |
| `bun run examples:build`                  | Reference app only                                |
| `bun run --filter wp-typia test`          | Canonical CLI package checks                      |
| `bun run examples:test:e2e`               | Playwright against the reference app              |

## License

GPL-2.0-or-later. See [LICENSE](LICENSE) for details.
