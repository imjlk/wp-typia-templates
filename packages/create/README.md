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
- a WordPress-specific typed REST client through `@wp-typia/rest`
- a generated portable `src/api-client.ts` module backed by `@wp-typia/api-client`
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

Every generated project exposes `sync-types`, and persistence-enabled scaffolds also expose `sync-rest`. `start` and `build` already run the relevant sync scripts for you. Run them manually only when you want generated metadata/schema artifacts committed before the first `start` or `build` cycle. `sync-types` stays warn-only by default, supports `-- --fail-on-lossy` when CI should fail only on lossy WordPress projections, and supports `-- --strict --report json` when CI should fail on every warning while reading a machine-friendly JSON report from stdout. These syncs do not create migration history.

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

`runtime/inspector` builds on top of those descriptors when you do want a
higher-level inspector layer:

```tsx
import currentManifest from "./typia.manifest.json";
import {
  InspectorFromManifest,
  type ManifestDocument,
  useEditorFields,
  useTypedAttributeUpdater,
} from "@wp-typia/create/runtime/inspector";

const editorFields = useEditorFields(currentManifest as ManifestDocument, {
  manual: ["content"],
});
const { updateField } = useTypedAttributeUpdater(attributes, setAttributes);

<InspectorFromManifest
  attributes={attributes}
  fieldLookup={editorFields}
  onChange={updateField}
  paths={["alignment", "isVisible"]}
  title="Settings"
/>;
```

Use `runtime/editor` for descriptor/model generation and `runtime/inspector`
when you want a manifest-driven WordPress inspector surface.

Data-backed projects can also opt into schema output from the existing sync pipeline:

```ts
import {
  defineEndpointManifest,
  runSyncBlockMetadata,
  syncEndpointClient,
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

// Or use the reporting wrapper when CI needs explicit status handling.
const syncReport = await runSyncBlockMetadata(
  {
    blockJsonFile: "src/block.json",
    sourceTypeName: "MyBlockAttributes",
    typesFile: "src/types.ts",
  },
  {
    strict: true,
  },
);

if (syncReport.status === "error") {
  throw new Error(syncReport.failure?.message ?? "sync-types failed");
}

if (syncReport.status === "warning") {
  console.warn(syncReport.lossyProjectionWarnings);
  console.warn(syncReport.phpGenerationWarnings);
}

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
      auth: "authenticated",
      bodyContract: "request",
      method: "POST",
      operationId: "writeMyRequest",
      path: "/create-block/v1/my-block/state",
      responseContract: "response",
      tags: ["My Block"],
      wordpressAuth: {
        mechanism: "rest-nonce",
      },
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

await syncEndpointClient({
  clientFile: "src/api-client.ts",
  manifest: REST_ENDPOINT_MANIFEST,
  typesFile: "src/api-types.ts",
});
```

Neutral auth intent is now the primary manifest surface:

- `auth: "public"`
- `auth: "authenticated"`
- `auth: "public-write-protected"`

WordPress-specific auth details remain an adapter overlay via
`wordpressAuth`, for example `rest-nonce` or `public-signed-token`.
Legacy `authMode` still works for compatibility, but new manifests should
author `auth` plus `wordpressAuth` when needed.

`src/api-types.ts` remains the source of truth for scaffolded REST contracts, and the endpoint manifest is the canonical TypeScript description of the scaffolded REST surface. `src/api-client.ts` is the generated portable client artifact and the canonical home for generated endpoint definitions. `src/api.ts` remains the WordPress-facing helper layer for generated persistence scaffolds, but now composes those generated endpoint exports to add WordPress-specific route resolution and nonce/header behavior. `src/api-schemas/*.schema.json` remains the runtime-facing artifact for generated PHP validation, and `src/api.openapi.json` is the canonical endpoint-aware REST document when a scaffold defines route metadata. Per-contract `src/api-schemas/*.openapi.json` files remain available as compatibility fragments.

When an endpoint manifest defines both `queryContract` and `bodyContract`,
`syncEndpointClient(...)` now generates a portable request shape of
`{ query, body }` and emits `requestLocation: 'query-and-body'` in the
generated `src/api-client.ts` module. Other internal manifest consumers such as
`typia.llm` and WordPress AI projection helpers keep their current
mixed-input rejection behavior in this pass.

When you need an AI- or tool-facing schema surface, derive it from the generated REST schema instead of creating a second hand-maintained contract:

```ts
import requestSchema from "./src/api-schemas/request.schema.json";
import { projectJsonSchemaDocument } from "@wp-typia/create";

const aiSafeSchema = projectJsonSchemaDocument(requestSchema, {
  profile: "ai-structured-output",
});
```

`ai-structured-output` is an opt-in derived profile. It does not change the default generated REST/runtime artifacts.

For saved-markup attributes that should project directly into `block.json`, the
metadata sync pipeline also understands `Source` and `Selector` tags for the
WordPress extraction sources that are fully expressible by those two values
alone:

```ts
import { tags } from "typia";

export interface MyBlockAttributes {
  title: string &
    tags.Source<"rich-text"> &
    tags.Selector<".wp-block-my-block__title">;
  eyebrow: string &
    tags.Source<"text"> &
    tags.Selector<".wp-block-my-block__eyebrow">;
}
```

That projects `source` and `selector` into both `block.json` and
`typia.manifest.json`. The first pass intentionally supports only
`"html" | "text" | "rich-text"` and requires both tags together. WordPress
sources such as `attribute` and `query` remain out of scope until companion
metadata tags exist.

Generated projects may continue using `@wp-typia/create`,
`@wp-typia/create/metadata-core`, `@wp-typia/create/runtime/blocks`,
`@wp-typia/create/runtime/defaults`, `@wp-typia/create/runtime/editor`,
`@wp-typia/create/runtime/inspector`, and
`@wp-typia/create/runtime/validation` as supported public paths through v1.
Root exports for blocks, defaults, editor, validation, and schema helpers
remain additive convenience aliases rather than a migration requirement.

`@wp-typia/create/runtime/schema-core` remains exported, but it is not the
canonical generated-project import path. Prefer the root schema exports such as
`projectJsonSchemaDocument()` when you are importing schema helpers manually.

`runtime/blocks` includes typed registration helpers such as
`ScaffoldBlockMetadata`, `ScaffoldBlockRegistrationSettings`, and
`ScaffoldBlockSupports`, and those types are intended to line up with the
shared support vocabulary in `@wp-typia/block-types`.

For the normative generated-project import policy, see
[`docs/runtime-import-policy.md`](../../docs/runtime-import-policy.md). For a
repo-backed inventory of the current public runtime surface and how it is used
today, see [`docs/runtime-surface.md`](../../docs/runtime-surface.md).

Scaffold flow internals, template rendering/composition internals, and CLI
implementation internals are not part of the generated-project runtime support
policy even when they live in the same package.

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

Built-in templates can now opt into that workflow at scaffold time with
`--with-migration-ui`. Those generated projects:

- seed an initialized migration workspace at `1.0.0`
- wire editor-side dashboard assets into the generated block editor
- scaffold `src/migrations/config.ts` with explicit `blocks: []` entries for each migration-capable block target

`migration:init` remains the retrofit command for older projects that were not
scaffolded with `--with-migration-ui`.

Repo development stays Bun-first. The generated project can use `bun`, `npm`, `pnpm`, or `yarn`.

Inside the monorepo, reference-app commands use the `examples:*` namespace at the root:

```bash
bun run examples:build
bun run examples:lint
bun run examples:test:e2e
```

`@wp-typia/create` is the canonical package. `create-wp-typia` remains only as a compatibility shim for `bun create wp-typia` and existing unscoped installs.
