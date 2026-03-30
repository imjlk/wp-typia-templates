# API Guide

This repository has two public surfaces:

## 1. `@wp-typia/create`

The CLI is the primary entrypoint for new users.

```bash
bun create wp-typia my-block
bunx @wp-typia/create my-block
npx @wp-typia/create my-block
```

Common commands:

```bash
wp-typia templates list
wp-typia templates inspect basic
wp-typia doctor
```

Built-in templates are intentionally limited to `basic` and `interactivity`.

Remote template MVP:

```bash
wp-typia my-block --template ./local-template-dir --package-manager npm --yes --no-install
wp-typia my-block --template github:owner/repo/path#main --package-manager npm --yes --no-install
wp-typia my-block --template @scope/create-block-template --variant hero --package-manager npm --yes --no-install
```

`--variant` only applies to official create-block external template configs. If a config defines variants and `--variant` is omitted, the first variant becomes the default.

Security note: external template configs are trusted JavaScript and are executed during scaffold normalization. Treat local paths, GitHub locators, and npm package templates with the same trust model as `@wordpress/create-block`.

Migration commands remain available inside migration-capable projects such as [`examples/my-typia-block`](../examples/my-typia-block):

```bash
wp-typia migrations init --current-version 1.0.0
wp-typia migrations snapshot --version 1.0.0
wp-typia migrations diff --from 1.0.0
wp-typia migrations scaffold --from 1.0.0
wp-typia migrations verify --all
```

Compatibility note: `create-wp-typia` remains available only as an unscoped shim for `bun create wp-typia` and historical installs. New users should start from `@wp-typia/create`.

## 2. `@wp-typia/block-types`

Generated projects can import shared semantic unions directly in `src/types.ts`.

```ts
import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";
```

## 3. Generated project runtime

Each scaffolded project exposes a few predictable files:

- `src/types.ts`: source of truth for the current attribute contract
- `src/validators.ts`: Typia runtime helpers such as `validate`, `assert`, `is`, `random`, `clone`, and `prune`
- `block.json`: WordPress-facing metadata projection
- `typia.manifest.json`: manifest v2 with explicit default markers and supported discriminated union metadata
- `typia-validator.php`: generated PHP validator for the supported server-side subset

Generated projects can also import shared runtime helpers from `@wp-typia/create`:

- `@wp-typia/create/runtime/defaults`
- `@wp-typia/create/runtime/validation`
- `@wp-typia/create/runtime/editor`

The `runtime/editor` helper turns manifest metadata into editor control hints without trying to auto-generate the entire inspector UI.

```ts
import currentManifest from "./typia.manifest.json";
import {
  createEditorModel,
  type ManifestDocument,
} from "@wp-typia/create/runtime/editor";

const editorFields = createEditorModel(currentManifest as ManifestDocument, {
  hidden: ["id", "version"],
  manual: ["content", "linkTarget"],
  preferTextarea: ["content"],
});
```

`createEditorModel()` returns field descriptors with:

- label and dotted `path`
- inferred control kind (`toggle`, `select`, `range`, `number`, `text`, `textarea`, `unsupported`)
- default value, required flag, and Typia constraints
- select options derived from `wp.enum`
- unsupported/manual reasons for unions, arrays, and complex fields

Migration-capable reference apps or custom projects may also add:

- `render.php`
- `typia-migration-registry.php`
- `src/migrations/config.ts`
- `src/migrations/versions/`
- `src/migrations/rules/`
- `src/migrations/generated/`
- `src/migrations/fixtures/`

## 4. Repo-local example app

The repository keeps one reference app at [`examples/my-typia-block`](../examples/my-typia-block). From the root workspace, example-oriented commands live under:

```bash
bun run examples:build
bun run examples:dev
bun run examples:lint
bun run examples:test:e2e
```

Legacy root shortcuts such as `bun run dev` and `bun run test:e2e` remain available as compatibility aliases.

## 5. Generated reference docs

Contributor note:

```bash
bun run docs:build
```

This generates API reference files under `docs/api/` for local inspection or GitHub Pages publishing.
