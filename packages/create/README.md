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

Inside `@wp-typia/create`, built-in templates are composed from a shared base layer plus per-template overlays. That keeps package setup, sync scripts, and shared runtime wiring aligned as `wp-typia` evolves without expanding the public template surface.

Generated projects can also reuse small runtime helpers from `@wp-typia/create` instead of copying local utility code:

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

For nested object leaves such as `padding.top`, generated projects can keep validation-aware updates inside the shared runtime layer too:

```ts
import { createNestedAttributeUpdater } from "@wp-typia/create/runtime/validation";
```

`runtime/editor` is intentionally lightweight. It infers editor control hints from Typia manifest metadata:

- `boolean` -> toggle
- enum-backed `string` -> select
- bounded `number` -> range
- other `number` -> number
- plain `string` -> text
- `preferTextarea` strings -> textarea

Unions, arrays, formatted IDs/URLs, and paths marked as `manual` are reported as unsupported so projects can keep custom UI where it matters.

The `migrations` commands remain available for projects that include the migration workspace, such as the repo-local reference app in [`examples/my-typia-block`](../../examples/my-typia-block) or compatible remote seeds:

```bash
wp-typia migrations init --current-version 1.0.0
wp-typia migrations doctor --all
wp-typia migrations diff --from 1.0.0
wp-typia migrations scaffold --from 1.0.0
wp-typia migrations fixtures --all --force
wp-typia migrations verify --all
wp-typia migrations fuzz --all --iterations 25 --seed 1
```

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

Inside the monorepo, reference-app commands use the `examples:*` namespace at the root:

```bash
bun run examples:build
bun run examples:lint
bun run examples:test:e2e
```

`@wp-typia/create` is the canonical package. `create-wp-typia` remains only as a compatibility shim for `bun create wp-typia` and existing unscoped installs.
