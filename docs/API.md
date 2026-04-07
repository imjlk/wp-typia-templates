# API Guide

This repository has seven public surfaces:

## 1. `wp-typia`

The CLI is the primary entrypoint for new users.

```bash
bunx wp-typia create my-block
npx wp-typia create my-block
```

Common commands:

```bash
wp-typia create my-block --template basic --package-manager bun --yes --no-install
wp-typia add block counter-card --template basic
wp-typia add variation
wp-typia add pattern
wp-typia templates list
wp-typia templates inspect basic
wp-typia doctor
```

Built-in templates currently include `basic`, `interactivity`, `persistence`, and `compound`.

Generated built-in projects now scaffold starter `typia.manifest.json` files so
editor/runtime imports resolve before the first sync, use `dev` as the primary
watch workflow, and can opt into local presets with `--with-wp-env` and
`--with-test-preset`. They can also opt into the migration dashboard/runtime
bundle with `--with-migration-ui`.

The positional `wp-typia <project-dir>` form remains available as a backward-compatible alias to `create`.

Official empty workspace flow:

```bash
wp-typia create my-plugin --template @wp-typia/create-workspace-template --package-manager bun --yes --no-install
wp-typia add block counter-card --template basic
wp-typia add block faq-stack --template compound --persistence-policy public --data-storage custom-table
```

`persistence` also accepts:

```bash
wp-typia create my-block --template persistence --data-storage custom-table --persistence-policy authenticated --package-manager bun --yes --no-install
wp-typia create my-block --template persistence --data-storage custom-table --persistence-policy public --package-manager npm --yes --no-install
wp-typia create my-block --template persistence --package-manager npm --with-wp-env --with-test-preset --yes --no-install
wp-typia create my-block --template basic --with-migration-ui --package-manager bun --yes --no-install
```

`compound` accepts the same persistence flags, but treats them as an optional parent-only layer:

```bash
wp-typia create my-block --template compound --package-manager bun --yes --no-install
wp-typia create my-block --template compound --persistence-policy authenticated --package-manager bun --yes --no-install
wp-typia create my-block --template compound --data-storage post-meta --package-manager npm --yes --no-install
```

Remote template MVP:

```bash
wp-typia create my-block --template ./local-template-dir --package-manager npm --yes --no-install
wp-typia create my-block --template github:owner/repo/path#main --package-manager npm --yes --no-install
wp-typia create my-block --template @scope/create-block-template --variant hero --package-manager npm --yes --no-install
```

`--variant` only applies to official create-block external template configs. If a config defines variants and `--variant` is omitted, the first variant becomes the default.

Security note: external template configs are trusted JavaScript and are executed during scaffold normalization. Treat local paths, GitHub locators, and npm package templates with the same trust model as `@wordpress/create-block`.

Migration commands remain available inside migration-capable projects such as [`examples/my-typia-block`](../examples/my-typia-block):

```bash
wp-typia migrations init --current-migration-version v1
wp-typia migrations wizard
wp-typia migrations plan --from-migration-version v1
wp-typia migrations snapshot --migration-version v1
wp-typia migrations doctor --all
wp-typia migrations diff --from-migration-version v1
wp-typia migrations scaffold --from-migration-version v1
wp-typia migrations fixtures --all --force
wp-typia migrations verify --all
wp-typia migrations fuzz --all --iterations 25 --seed 1
```

For older projects, `wp-typia migrations init --current-migration-version <label>` now
auto-detects supported retrofit layouts:

- single-block projects using `src/block.json`, `src/types.ts`, and `src/save.tsx`
- legacy single-block projects still using root `block.json` plus `src/types.ts`
  and `src/save.tsx`
- multi-block projects using `src/blocks/*/block.json`

When `src/blocks/*` is detected, `migration:init` writes `src/migrations/config.ts`
with `blocks: []` entries for every discovered block target, including scaffolded
hidden compound child blocks.

Migration versions now use strict schema labels like `v1`, `v2`, and `v3`.
Those labels are separate from your package version, plugin version, OpenAPI
`info.version`, PHP storage version options, and block attribute
`schemaVersion`.

Older semver-based migration workspaces are now a breaking reset. If a project
still uses `currentVersion`, `supportedVersions`, or semver-named migration
artifacts under `src/migrations/`, back up that folder if needed, remove or
reset it, and rerun `wp-typia migrations init --current-migration-version v1`.

Migration-capable projects now also expose two read-only preview paths before
you scaffold anything:

- `wp-typia migrations wizard`: TTY-only guided legacy migration version selection
- `wp-typia migrations plan --from-migration-version <label>`: scriptable preview when you already know the migration edge

Both commands preview one selected edge across every eligible block target,
list skipped targets that do not have the selected snapshot yet, and stop after
printing the next commands to run. They do not write rules, fixtures, or
snapshots.

When a built-in scaffold uses `--with-migration-ui`, the generated project is
already initialized at `v1`, includes `src/admin/migration-dashboard.tsx`,
and writes `src/migrations/config.ts` in the newer multi-block shape:

```ts
export const migrationConfig = {
  currentMigrationVersion: "v1",
  supportedMigrationVersions: ["v1"],
  snapshotDir: "src/migrations/versions",
  blocks: [
    {
      key: "my-block",
      blockName: "create-block/my-block",
      blockJsonFile: "src/block.json",
      manifestFile: "src/typia.manifest.json",
      saveFile: "src/save.tsx",
      typesFile: "src/types.ts",
    },
  ],
} as const;
```

Compound scaffolds use the same config shape but seed both the parent block and
the scaffolded hidden child block as migration-capable targets. `migrations init`
remains the retrofit command for older projects that were not scaffolded with
`--with-migration-ui`. Add `--all` to migration verification, fixture refresh,
and fuzzing commands when you want to cover every configured legacy migration version and
every configured block target in that workspace. `migrations doctor` remains
version-scoped and is not broadened by `--all`.

Compatibility note: `@wp-typia/create` remains available for programmatic imports and compatibility exports, but `wp-typia` is the canonical CLI package. `create-wp-typia` is archived and no longer a supported path for new installs.

## 2. `@wp-typia/create`

`@wp-typia/create` now owns the non-CLI scaffold/runtime export surface:

- root runtime exports such as `projectJsonSchemaDocument()`
- `@wp-typia/create/metadata-core` as a compatibility facade
- `@wp-typia/create/runtime/*` compatibility subpaths

It is still publishable, but it is no longer the canonical CLI install surface.

## 3. `@wp-typia/block-types`

Generated projects can import shared semantic unions, block support metadata
types, and support-generated style attribute helpers directly in `src/types.ts`
and registration modules.

```ts
import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";
import type { BlockStyleSupportAttributes } from "@wp-typia/block-types/block-editor/style-attributes";
import type { BlockSupports } from "@wp-typia/block-types/blocks/supports";
```

## 4. `@wp-typia/rest`

`@wp-typia/rest` provides typed client-side helpers for WordPress REST usage:

- `createValidatedFetch<T>()`
- `createEndpoint<Req, Res>()`
- `callEndpoint<Req, Res>()`
- `resolveRestRouteUrl(routePath, root?)`
- `createQueryDecoder<T>()`
- `createHeadersDecoder<T>()`

The package stays TypeScript-side only. WordPress/PHP route registration and schema bridging remain generated by `@wp-typia/create`.

Use it when the consumer should understand WordPress REST root discovery and
nonce-aware request wiring.

The root package stays transport-only. React/data helpers live under the
separate `@wp-typia/rest/react` subpath:

- `createEndpointDataClient()`
- `EndpointDataProvider`
- `useEndpointDataClient()`
- `useEndpointQuery(endpoint, request, options?)`
- `useEndpointMutation(endpoint, options?)`

That hook layer is built directly on `callEndpoint(...)`, not on an external
query library. `useEndpointQuery(...)` is GET-only in this first pass, while
mutations and explicit non-query calls go through `useEndpointMutation(...)`.

Refresh-sensitive auth remains explicit there:

- query hooks re-run `resolveCallOptions()` on each execution so REST nonce
  readers can fetch the latest value at request time
- mutation hooks use the latest mutation variables and the latest
  `resolveCallOptions(variables)` so public signed-token payloads can be passed
  in explicitly
- there is no built-in automatic retry when nonce or token state is stale; the
  caller refreshes state and then invokes `refetch()` or `mutate()` again

## 5. `@wp-typia/api-client`

`@wp-typia/api-client` is the transport-neutral sibling to `@wp-typia/rest`.

- `createEndpoint<Req, Res>()`
- `callEndpoint<Req, Res>()`
- `createFetchTransport({ baseUrl })`
- `withHeaders(transport, headers)`
- `withComputedHeaders(transport, resolveHeaders)`
- `withHeaderValue(transport, headerName, resolveValue)`
- `withBearerToken(transport, resolveToken)`
- `toValidationResult(...)`

It does not include WordPress route resolution, `wpApiSettings`, or
`@wordpress/api-fetch`. Generated persistence contracts can emit a portable
`src/api-client.ts` module through `syncEndpointClient(...)` in
`@wp-typia/block-runtime/metadata-core`. In persistence-style scaffolds, that
generated module is the canonical endpoint-definition artifact, while
WordPress-facing `src/api.ts` composes those generated endpoint exports to add
WordPress route resolution and nonce/header behavior.

When a manifest endpoint defines both `queryContract` and `bodyContract`, the
portable generated client now uses a `{ query, body }` request envelope and
marks the generated endpoint with `requestLocation: 'query-and-body'`.
This support is currently limited to the portable client/runtime path; other
internal manifest consumers such as `typia.llm` and WordPress AI projections
still reject mixed query/body inputs.

These header/auth decorators remain optional and adapter-level. They do not
turn manifest `auth` or legacy `authMode` metadata into automatic
runtime behavior, and they do not replace WordPress-specific route resolution
or nonce-aware ergonomics from `@wp-typia/rest`.

For new manifests, backend-neutral auth intent is the primary contract
surface:

- `auth: "public"`
- `auth: "authenticated"`
- `auth: "public-write-protected"`

WordPress-specific auth remains an optional overlay via `wordpressAuth`, such
as `{ mechanism: "rest-nonce" }` or
`{ mechanism: "public-signed-token", publicTokenField: "publicWriteToken" }`.
Legacy `authMode` is still accepted for compatibility, but it is now adapter
metadata rather than the primary authored meaning.

## 6. `@wp-typia/block-runtime`

`@wp-typia/block-runtime` is the normative generated-project runtime package for
shared block helpers, while `@wp-typia/block-runtime/metadata-core` owns the
generated-project TypeScript-to-metadata sync and REST/OpenAPI/client codegen
surface.

It currently exports:

- block registration and webpack helpers
- defaults helpers
- editor model helpers
- inspector helpers
- validation-aware attribute update helpers

The root `@wp-typia/block-runtime` export does not include `metadata-core` or
`schema-core` directly. Those stay on explicit subpaths, and this package is
now the canonical scaffold import target for generated projects.

## 7. Generated project runtime

Each scaffolded project exposes a few predictable files:

- `src/types.ts`: source of truth for the current attribute contract
- `src/validators.ts`: Typia runtime helpers such as `validate`, `assert`, `is`, `random`, `clone`, and `prune`
- `block.json`: WordPress-facing metadata projection
- `typia.manifest.json`: manifest v2 with explicit default markers and supported discriminated union metadata
- `typia-validator.php`: generated PHP validator for the supported server-side subset
- optional `typia.schema.json` / `typia.openapi.json` when schema output is enabled

The `types.ts -> block.json` projection can now also carry WordPress extraction
metadata for top-level string attributes via `tags.Source<"html" | "text" |
"rich-text">` plus `tags.Selector<"...">`.

Generated projects also expose `sync-types` as the metadata generator entrypoint.
It stays warn-only by default, supports `-- --fail-on-lossy` when CI should fail
only on lossy WordPress projections, and supports
`-- --strict --report json` when CI should fail on all warnings while reading a
machine-friendly JSON report from stdout. Hard source-analysis and unsupported
type failures still exit non-zero regardless of mode.

If you need the same behavior programmatically, `@wp-typia/block-runtime/metadata-core`
also exposes `runSyncBlockMetadata(...)` alongside the lower-level
`syncBlockMetadata(...)`, plus `syncEndpointClient(...)` for portable endpoint
client generation from a manifest-first REST surface.

Generated projects can also import shared runtime helpers from `@wp-typia/block-runtime`:

- `@wp-typia/block-runtime/blocks`
- `@wp-typia/block-runtime/defaults`
- `@wp-typia/block-runtime/validation`
- `@wp-typia/block-runtime/editor`
- `@wp-typia/block-runtime/identifiers`

Use `@wp-typia/block-runtime/metadata-core` for metadata sync and
`@wp-typia/block-runtime/*` for generated-project runtime helpers.
`@wp-typia/create/metadata-core` remains available as a backward-compatible
facade, and `@wp-typia/create` remains the compatibility/programmatic package.
`@wp-typia/create/runtime/*` remains exported for backward compatibility, but
it is no longer the preferred generated-project import path.

`runtime/blocks` is the shared generated-project surface for scaffold-owned
block registration helpers and webpack artifact/config adapters.

It now also exports typed registration metadata/settings surfaces so generated
projects can pass `supports` without dropping to `unknown`:

```ts
import {
  buildScaffoldBlockRegistration,
  type ScaffoldBlockMetadata,
} from "@wp-typia/block-runtime/blocks";
```

`@wp-typia/create/runtime/schema-core` remains exported, but it is not the
canonical generated-project import path. When you manually import schema
helpers, prefer the root exports such as `projectJsonSchemaDocument()`.

For the normative generated-project runtime import policy, see
[`docs/runtime-import-policy.md`](./runtime-import-policy.md). For the broader
repo-backed audit, see [`docs/runtime-surface.md`](./runtime-surface.md). For
the current package graduation recommendation, see
[`docs/package-graduation.md`](./package-graduation.md).

The `runtime/editor` helper turns manifest metadata into editor control hints
without taking over inspector rendering by itself.

```ts
import currentManifest from "./typia.manifest.json";
import {
  createEditorModel,
  type ManifestDocument,
} from "@wp-typia/block-runtime/editor";

const editorFields = createEditorModel(currentManifest as ManifestDocument, {
  hidden: ["id", "schemaVersion"],
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

When you want a higher-level inspector layer, use
`@wp-typia/block-runtime/inspector` on top of those descriptors:

```tsx
import currentManifest from "./typia.manifest.json";
import {
  InspectorFromManifest,
  type ManifestDocument,
  useEditorFields,
  useTypedAttributeUpdater,
} from "@wp-typia/block-runtime/inspector";

const editorFields = useEditorFields(currentManifest as ManifestDocument, {
  manual: ["content"],
});
const { updateField } = useTypedAttributeUpdater(attributes, setAttributes, validateAttributes);

<InspectorFromManifest
  attributes={attributes}
  fieldLookup={editorFields}
  onChange={updateField}
  paths={["alignment", "isVisible"]}
  title="Settings"
/>;
```

`runtime/inspector` keeps `runtime/editor` as the descriptor/model layer and
adds:

- `useEditorFields()` for memoized field lookup, defaults, and select options
- `useTypedAttributeUpdater()` for top-level and dotted-path updates from one hook
- `FieldControl` for one manifest-backed WordPress control
- `InspectorFromManifest` for ordered manifest-driven `PanelBody` rendering

`runtime/validation` also exposes nested update helpers for dotted editor paths such as `padding.top`. They convert dotted paths into top-level Gutenberg attribute patches and run the same validation contract before calling `setAttributes`.

Scaffold flow internals, template rendering/composition internals, and CLI
implementation internals are not part of the generated-project runtime support
policy even when they live in the same package.

Migration-capable reference apps or custom projects may also add:

- `render.php`
- `typia-migration-registry.php`
- `src/migrations/config.ts`
- `src/migrations/versions/`
- `src/migrations/rules/`
- `src/migrations/generated/`
- `src/migrations/fixtures/`

Migration-enabled generated projects may also wire:

- `src/admin/migration-dashboard.tsx`
- `src/migration-detector.ts`

`migrations wizard` and `migrations plan` are the read-only preview layer,
`migrations doctor` is the read-only workspace health check, `migrations fixtures`
refreshes deterministic edge fixtures, and `migrations fuzz` replays those
fixtures plus seeded random legacy-shaped inputs derived from the current Typia
validator. Without `--all`, migration commands target the first legacy migration
version only; `--all` runs across every configured legacy migration version and every configured
block target. `migrations wizard` requires a TTY; use `migrations plan --from-migration-version
<label>` in non-interactive shells. In TTY usage, `migrations fixtures --force`
asks before overwriting existing fixture files, while non-interactive runs
overwrite immediately for script compatibility. Existing fixture files are
otherwise preserved and reported as skipped, so `--force` is the explicit
refresh path even when `--all` is present.

The built-in `persistence` template adds another predictable layer:

- `src/api-types.ts`
- `src/api-validators.ts`
- `src/api-client.ts`
- `src/api.ts`
- `src/data.ts`
- `src/api.openapi.json`
- `src/api-schemas/`
- `scripts/sync-rest-contracts.ts`
- a plugin bootstrap PHP file with generated REST route/storage wiring

For persistence-capable scaffolds, the endpoint manifest authored in TypeScript is the canonical description of the REST surface and the primary input to `syncRestOpenApi()`. `src/api-client.ts` is the generated portable endpoint-definition artifact, `src/api.ts` is the WordPress-specific call helper layer, and `src/data.ts` is the additive React/data wrapper layer built on `@wp-typia/rest/react`. `src/api.openapi.json` is the canonical endpoint-aware REST document, `src/api-schemas/*.schema.json` files remain the runtime contract artifacts, and `src/api-schemas/*.openapi.json` files remain available as per-contract compatibility fragments.

```ts
await syncRestOpenApi({
  manifest: REST_ENDPOINT_MANIFEST,
  openApiFile: "src/api.openapi.json",
  typesFile: "src/api-types.ts",
});
```

When you customize the generated PHP:

- edit the plugin bootstrap file for storage helpers, route handlers, response shaping, and route registration
- edit `inc/rest-auth.php` or `inc/rest-public.php` for permission policy changes
- keep `src/api-types.ts` plus the endpoint manifest as the source of truth for REST contracts, then regenerate `src/api-schemas/*` and `src/api.openapi.json`
- avoid hand-editing generated schema and OpenAPI artifacts unless you are debugging the generation output itself

`persistence` keeps one minimal aggregate-counter scaffold and lets you choose between:

- `authenticated`: logged-in writes protected by a WordPress REST nonce
- `public`: anonymous writes protected by signed short-lived public tokens, per-request ids, and coarse rate limiting

The public policy is still a scaffold default, not a complete abuse-prevention system. Add application-specific controls before using the same pattern for experiments, impressions, or other high-value metrics.

The built-in `compound` template adds a multi-block project structure:

- `src/blocks/<parent>/`
- `src/blocks/<parent>-item/`
- `src/blocks/<parent>/children.ts`
- `scripts/block-config.ts`
- `scripts/add-compound-child.ts`
- a root plugin bootstrap that registers `build/blocks/*/block.json`

The generated parent and child editors now follow the same validated attribute
update path used by the other built-in templates, and new child block types can
be scaffolded on demand:

```bash
npm run add-child -- --slug faq-item --title "FAQ Item"
```

That command updates `scripts/block-config.ts` plus `src/blocks/<parent>/children.ts`
without changing the parent block's default seeded template.

When you opt `compound` into persistence with `--data-storage` or `--persistence-policy`, the parent block also gains:

- `src/blocks/<parent>/api-types.ts`
- `src/blocks/<parent>/api-validators.ts`
- `src/blocks/<parent>/api.ts`
- `src/blocks/<parent>/api.openapi.json`
- `src/blocks/<parent>/api-schemas/`
- `src/blocks/<parent>/interactivity.ts`
- generated PHP route/storage wiring in the plugin bootstrap

For persistence-enabled `compound`, the parent block follows the same REST extension pattern as `persistence`. The hidden child block does not own REST routes or storage behavior.

## 8. Repo-local example app

The repository keeps two reference apps:

- [`examples/my-typia-block`](../examples/my-typia-block) for the kitchen-sink editor/migration reference
- [`examples/persistence-examples`](../examples/persistence-examples) for persistence-policy behavior and the repo-local WordPress AI projection proof described in [`docs/wordpress-ai-projections.md`](./wordpress-ai-projections.md)
- [`examples/compound-patterns`](../examples/compound-patterns) for compound parent/child patterns
- [`examples/api-contract-adapter-poc`](../examples/api-contract-adapter-poc) for a minimal non-PHP proof that endpoint manifests can be served outside WordPress/PHP, plus the repo-local `typia.llm` evaluation described in [`docs/typia-llm-evaluation.md`](./typia-llm-evaluation.md)

The repo-owned adapter conformance harness lives at
[`tests/helpers/rest-adapter-conformance.ts`](../tests/helpers/rest-adapter-conformance.ts).
Adapter experiments can plug into it by exporting a manifest, a
`startServer(): Promise<{ url, close(), routeTable }>` helper, route metadata
with `method`/`path`/`operationId`/`authMode`, response validators keyed by
`operationId`, and scenario fixtures that describe valid plus invalid raw HTTP
requests. The first pass checks contract-level route and response parity plus
manifest-level auth metadata, not WordPress-specific auth runtime semantics.

From the root workspace, example-oriented commands live under:

```bash
bun run examples:build
bun run examples:dev
bun run examples:dev:persistence
bun run examples:dev:compound
bun run examples:lint
bun run examples:test:e2e
```

Legacy root shortcuts such as `bun run dev` and `bun run test:e2e` remain available as compatibility aliases.

## 9. Generated reference docs

Contributor note:

```bash
bun run docs:build
```

This generates API reference files under `docs/api/` for local inspection or GitHub Pages publishing.
