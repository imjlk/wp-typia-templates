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
npx @wp-typia/create my-block --template persistence --data-storage custom-table --persistence-policy authenticated --package-manager bun --yes --no-install
npx @wp-typia/create my-block --template compound --package-manager bun --yes --no-install
npx @wp-typia/create my-block --template persistence --namespace experiments --text-domain my-block --php-prefix my_block --package-manager bun --yes --no-install
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

Built-in templates currently cover:

- `basic`
- `interactivity`
- `persistence`
- `compound`

Inside `@wp-typia/create`, built-in templates are composed from a shared base layer plus per-template overlays. That keeps package setup, sync scripts, and shared runtime wiring aligned as `wp-typia` evolves while still letting the public template surface grow when there is a stable use case.

The `persistence` template adds:

- `--data-storage <post-meta|custom-table>`
- `--persistence-policy <authenticated|public>`
- `sync-rest` contract/schema generation
- a typed REST client through `@wp-typia/rest`
- generated PHP route/bootstrap files for policy-aware persistence

The `compound` template adds:

- a parent block plus a hidden implementation child block
- `InnerBlocks` seeding with two default internal items
- multi-block plugin registration from `build/blocks/*`
- optional persistence on the parent block when `--data-storage` or `--persistence-policy` is provided

Identifier overrides:

- `--namespace` changes the block namespace used in `block.json` names such as `namespace/slug`
- `--text-domain` changes the WordPress text domain used for `block.json`, JS i18n, and PHP plugin headers
- `--php-prefix` changes the snake_case PHP symbol prefix used for functions, constants, option keys, locks, and storage helpers

Defaults keep these concerns separate:

- package names and block slugs stay kebab-case
- block names remain `namespace/slug`
- text domains default to the kebab-case slug
- PHP symbols default to a snake_case prefix derived from the slug

Every generated project exposes `sync-types`, and persistence-enabled scaffolds also expose `sync-rest`. `start` and `build` already run the relevant sync scripts for you. Run them manually only when you want generated metadata/schema artifacts committed before the first `start` or `build` cycle. These syncs do not create migration history.

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

Data-backed projects can also opt into schema output from the existing sync pipeline:

```ts
import {
  defineEndpointManifest,
  syncBlockMetadata,
  syncRestOpenApi,
  syncTypeSchemas,
} from "@wp-typia/create/metadata-core";

await syncBlockMetadata({
  blockJsonFile: "src/block.json",
  jsonSchemaFile: "src/typia.schema.json",
  openApiFile: "src/typia.openapi.json",
  sourceTypeName: "MyBlockAttributes",
  typesFile: "src/types.ts",
});

await syncTypeSchemas({
  jsonSchemaFile: "src/api-schemas/request.schema.json",
  openApiFile: "src/api-schemas/request.openapi.json",
  sourceTypeName: "MyRequestContract",
  typesFile: "src/api-types.ts",
});

const REST_ENDPOINT_MANIFEST = defineEndpointManifest({
  contracts: {
    request: { sourceTypeName: "MyRequestContract" },
    response: { sourceTypeName: "MyResponseContract" },
  },
  endpoints: [
    {
      authMode: "authenticated-rest-nonce",
      bodyContract: "request",
      method: "POST",
      operationId: "writeMyRequest",
      path: "/create-block/v1/my-block/state",
      responseContract: "response",
      tags: ["My Block"],
    },
  ],
  info: {
    title: "My Block REST API",
    version: "1.0.0",
  },
});

await syncRestOpenApi({
  manifest: REST_ENDPOINT_MANIFEST,
  openApiFile: "src/api.openapi.json",
  typesFile: "src/api-types.ts",
});
```

`src/api-types.ts` remains the source of truth for scaffolded REST contracts, and the endpoint manifest is the canonical TypeScript description of the scaffolded REST surface. `src/api-schemas/*.schema.json` remains the runtime-facing artifact for generated PHP validation, and `src/api.openapi.json` is the canonical endpoint-aware REST document when a scaffold defines route metadata. Per-contract `src/api-schemas/*.openapi.json` files remain available as compatibility fragments.

When you need an AI- or tool-facing schema surface, derive it from the generated REST schema instead of creating a second hand-maintained contract:

```ts
import requestSchema from "./src/api-schemas/request.schema.json";
import { projectJsonSchemaDocument } from "@wp-typia/create";

const aiSafeSchema = projectJsonSchemaDocument(requestSchema, {
  profile: "ai-structured-output",
});
```

`ai-structured-output` is an opt-in derived profile. It does not change the default generated REST/runtime artifacts.

For persistence-capable scaffolds, generated PHP stays intentionally boring glue:

- edit the plugin bootstrap file when you need to customize storage helpers, route handlers, response shaping, or route registration
- edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to customize write permission policy
- update the endpoint manifest alongside `src/api-types.ts`, then regenerate `src/api-schemas/*` and `src/api.openapi.json` instead of treating those generated artifacts as hand-maintained sources

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
