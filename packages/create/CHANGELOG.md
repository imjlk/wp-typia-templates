# @wp-typia/create

## 0.11.1 — 2026-04-07

### Patch changes

- [fa8f580](https://github.com/imjlk/wp-typia/commit/fa8f5809bd1f54065160183aa8f781373ad79bbe) Patch scaffold DX regressions in `@wp-typia/create` by preserving the published
  `@wp-typia/block-runtime` dependency range during version resolution, clarifying
  fixture refresh messaging, and documenting the intentional static/basic
  template defaults. — Thanks @imjlk!

## 0.11.0 — 2026-04-07

### Minor changes

- [8a52767](https://github.com/imjlk/wp-typia/commit/8a52767bce49f8170245fa4173aa2ac77d0b5ad7) Replace semver-based migration workspace labels with explicit `vN` schema migration versions across the CLI, generated config, migration UI defaults, and migration docs. — Thanks @imjlk!
- [5a8e531](https://github.com/imjlk/wp-typia/commit/5a8e531c09c3d95a9ac2cabb07487a83c9b0e3c3) Graduate generated-project runtime imports to `@wp-typia/block-runtime`, add
  supported `@wp-typia/block-runtime/blocks` and
  `@wp-typia/block-runtime/metadata-core` surfaces, and update scaffolded
  templates/examples to use them as the normative generated-project runtime and
  sync packages while keeping `@wp-typia/create` as the CLI package plus
  compatibility facade.
  
  Tighten the basic scaffold WordPress baseline by restoring a real
  `editorStyle` asset, renaming the legacy `version` attribute to
  `schemaVersion`, keeping `save.tsx` serialization stable when visibility is
  toggled, bumping generated plugin PHP minimums to 8.0, and changing the
  default scaffold namespace fallback from `create-block` to the normalized
  project slug. — Thanks @imjlk!
- [6937278](https://github.com/imjlk/wp-typia/commit/6937278f24003d31091953eed86433414b3ed42d) Add optional `check` verification mode to `@wp-typia/block-runtime/metadata-core`
  sync helpers so generated projects and repo examples can verify committed
  artifacts without rewriting them. Scaffolded `build` and `typecheck` scripts now
  fail on stale generated metadata instead of silently mutating tracked files,
  while `start`, `dev`, and explicit `sync-*` commands remain refresh-oriented. — Thanks @imjlk!

### Patch changes

- [eea8262](https://github.com/imjlk/wp-typia/commit/eea826299ba1c1a49c10773984087a2e5e887a1a) Turn the remaining `@wp-typia/create/runtime/*` helper modules into
  compatibility re-exports backed by `@wp-typia/block-runtime`, while keeping the
  existing create runtime import paths available for older generated projects. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.0, block-runtime (npm)@0.3.0, rest (npm)@0.3.1

## 0.10.1 — 2026-04-06

### Patch changes

- [345d81e](https://github.com/imjlk/wp-typia/commit/345d81eee92583d5e4fb20230ece1ce5557e0482) Remove generated `editorStyle` metadata entries that pointed at a non-existent `index.css` asset, and harden scaffold smoke checks so built `block.json` file references stay aligned with emitted assets. — Thanks @imjlk!

## 0.10.0 — 2026-04-05

### Minor changes

- [1192fc6](https://github.com/imjlk/wp-typia/commit/1192fc698734f32888284ea7878905bf94f4ba29) Add read-only `migrations plan` and TTY-guided `migrations wizard` commands so migration-capable projects can preview one selected legacy edge before scaffolding rules or fixtures. — Thanks @imjlk!

### Patch changes

- [44478ca](https://github.com/imjlk/wp-typia/commit/44478ca5bc396b40842484ee9f46613d426c83df) Restore the missing default plugin bootstrap for base scaffolds and tighten migration planning guidance around previewable legacy versions and manifest preflight errors. — Thanks @imjlk!

## 0.9.0 — 2026-04-05

### Minor changes

- [b6decd0](https://github.com/imjlk/wp-typia/commit/b6decd0aa905fac2e12dc739c4c5e43159501f9d) Add a React/data helper layer at `@wp-typia/rest/react` with query and mutation
  hooks, then wire persistence examples and generated persistence scaffolds to
  emit `src/data.ts` wrappers on top of the existing WordPress REST helpers. — Thanks @imjlk!
- [56d9906](https://github.com/imjlk/wp-typia/commit/56d9906401db82940cb1bb9b2840da0dcac694d4) Separate backend-neutral endpoint auth intent from WordPress-specific auth
  mechanisms in endpoint manifests, generated OpenAPI metadata, and portable API
  client endpoint metadata while preserving legacy `authMode` compatibility. — Thanks @imjlk!
- [ca31cc2](https://github.com/imjlk/wp-typia/commit/ca31cc230bb814f23559f652fe3b34320645ebf5) Harden generated WordPress templates with stronger plugin metadata, plugin-level textdomain bootstrap, safer dynamic rendering output, baseline accessibility improvements, and a lightweight PHPCS workflow for maintained example PHP plus generated scaffold smoke checks. — Thanks @imjlk!
- [cf13504](https://github.com/imjlk/wp-typia/commit/cf13504cb4548e3f73d072072b74a0aeec1e5333) Dedup built-in template hooks and validator wiring, move the basic template onto the `.mustache` path, and fix interactivity scaffolds to respect custom namespaces in generated block names. — Thanks @imjlk!

### Patch changes

- [56e4272](https://github.com/imjlk/wp-typia/commit/56e42729816a8455b03c2a045a78b50ffcc9b2ae) Consolidate repeated internal runtime helpers in `@wp-typia/create` and
  simplify scaffold and CLI helper resolution paths without changing scaffold
  output semantics. — Thanks @imjlk!
- [0016f4c](https://github.com/imjlk/wp-typia/commit/0016f4c7c51736f6a3138323fd26747d9d738c39) Improve `migrations init` retrofit detection for current single-block and `src/blocks/*` multi-block layouts, and clarify migration onboarding for retrofitted compound workspaces. — Thanks @imjlk!
- [a29b175](https://github.com/imjlk/wp-typia/commit/a29b175bdece9dd1903a7ce462b0ad9c6a1c8d1c) Follow up the WordPress template hardening pass by improving generated interactivity accessibility markup and strengthening generated project smoke assertions for plugin bootstrap and render output safety. — Thanks @imjlk!
- [9acb36d](https://github.com/imjlk/wp-typia/commit/9acb36d23d9654b9c9ba62534690bbfae7da5ede) Split the internal `metadata-core` implementation in `@wp-typia/create`
  into focused analysis, parser, projection, and PHP rendering modules without
  changing the public metadata sync API or generated artifact semantics. — Thanks @imjlk!
- [66c4395](https://github.com/imjlk/wp-typia/commit/66c439587fc26f6d97c82566a53aec7c35179c29) Improve `@wp-typia/create` hot-path performance for repeated metadata sync
  flows, restore the CLI runtime barrel compatibility export, and tighten the
  runtime benchmark and CLI helper behavior around quoted next steps. — Thanks @imjlk!
- [5ae2070](https://github.com/imjlk/wp-typia/commit/5ae2070549141857d6e34993a30186ee32ff8931) Improve migration CLI recovery guidance, same-version edge validation, and interactive safety for fixture overwrites. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.3.0, rest (npm)@0.3.0

## 0.8.0 — 2026-04-05

### Minor changes

- [58a8c97](https://github.com/imjlk/wp-typia/commit/58a8c97a52107eb16148a5fd5e3da2ab5a612fba) Add a new manifest-driven `runtime/inspector` surface for generated projects,
  including `useEditorFields`, `useTypedAttributeUpdater`, `FieldControl`, and
  `InspectorFromManifest`, and mirror that subpath through
  `@wp-typia/block-runtime/inspector`. — Thanks @imjlk!
- [faef0a6](https://github.com/imjlk/wp-typia/commit/faef0a66b974956373a42be8324db37c4be3f97f) Add first-class mixed `{ query, body }` request support to generated portable
  endpoint clients so `syncEndpointClient(...)` and `@wp-typia/api-client` can
  handle endpoints that define both `queryContract` and `bodyContract`. — Thanks @imjlk!
- [ec0c3fb](https://github.com/imjlk/wp-typia/commit/ec0c3fb82abfa11be512f999e1acbd91d466cff1) Add a new transport-neutral `@wp-typia/api-client` package and manifest-first
  `syncEndpointClient(...)` generation in `@wp-typia/create/metadata-core` so
  persistence-style contracts can emit portable `api-client.ts` modules alongside
  their existing WordPress-specific `api.ts` and aggregate OpenAPI artifacts. — Thanks @imjlk!
- [5eff751](https://github.com/imjlk/wp-typia/commit/5eff75114df07b0f0de5cfaddb0c527c40f602a4) Add opt-in `--with-migration-ui` scaffold support for built-in templates, including seeded migration workspaces, editor-embedded migration dashboard assets, and multi-block migration config/artifact generation. — Thanks @imjlk!
- [01630cc](https://github.com/imjlk/wp-typia/commit/01630cca3573af287269890c57d5fbc9deed69df) Add structured `sync-types` reporting to `@wp-typia/create/metadata-core` via `runSyncBlockMetadata(...)`, plus generated `sync-types --strict`, `sync-types --fail-on-lossy`, and `sync-types --report json` support for CI-friendly metadata sync workflows. — Thanks @imjlk!
- [00e148e](https://github.com/imjlk/wp-typia/commit/00e148e788160dd2564faeebc7fba530c037bce8) Add first-class WordPress block support metadata types and public style-support helper types, and teach the scaffold metadata pipeline to understand indexed-access support attributes and primitive-compatible intersections from `@wp-typia/block-types`. — Thanks @imjlk!
- [d9e70b6](https://github.com/imjlk/wp-typia/commit/d9e70b664c7b4ce98feb2805208f4b3703e2eac3) Refactor generated persistence `api.ts` helpers to compose the generated
  portable `api-client.ts` endpoint exports instead of redefining the same
  endpoint metadata locally. — Thanks @imjlk!
- [6ec5640](https://github.com/imjlk/wp-typia/commit/6ec5640edc5c6e95c9ca8c0bd868d6e0a644a0e3) Add `tags.Source<...>` and `tags.Selector<...>` support to the `sync-types`
  metadata pipeline so top-level string attributes can project WordPress
  `source`/`selector` extraction metadata into `block.json` and
  `typia.manifest.json`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: api-client@0.2.0, block-types@0.2.0

## 0.7.0 — 2026-04-03

### Minor changes

- [fe19a8b](https://github.com/imjlk/wp-typia/commit/fe19a8bc6036b74cdd4f3eec33b39711e87f2921) Consolidate built-in scaffold runtime helpers behind shared validation, block registration, and webpack helper surfaces, and add the supported `@wp-typia/create/runtime/blocks` generated-project import path. — Thanks @imjlk!

### Patch changes

- [3250087](https://github.com/imjlk/wp-typia/commit/32500876e7ff838751d0320c8a4eabf4c2b3fcd4) Align the basic built-in template with the RichText editing flow and English default scaffold copy used by the other built-in templates. — Thanks @imjlk!
- [13f2e72](https://github.com/imjlk/wp-typia/commit/13f2e72c663897281ba99e7a98a9ab20e5135bc9) Clarify dynamic-rendered persistence scaffold output and remove dead interactivity callback wiring from generated templates. — Thanks @imjlk!
- [44c016c](https://github.com/imjlk/wp-typia/commit/44c016c211f2d467c4ce39082bfa73ebe93f4d93) Seed starter `typia.manifest.json` files in generated projects, add a watch-based `dev` workflow, and support opt-in local `wp-env` plus Playwright smoke-test presets. — Thanks @imjlk!
- [e9eb14b](https://github.com/imjlk/wp-typia/commit/e9eb14bb9ffedb786ecf2a75d9e3d590c064aa2c) Bring compound scaffolds onto the validated editor-update path and add an on-demand child-block workflow for extending generated compound projects. — Thanks @imjlk!

## 0.6.0 — 2026-04-02

### Minor changes

- [7881cfd](https://github.com/imjlk/wp-typia/commit/7881cfdbdac4ab146bfaab622aa94c81a6a7006d) Add a public endpoint manifest helper for scaffolded REST surfaces and adopt it across persistence-capable scaffold scripts. — Thanks @imjlk!
- [9597309](https://github.com/imjlk/wp-typia/commit/9597309b45d57f4f0ddd4bc74d00c7cb7fa04ce8) Make endpoint manifests the primary input to aggregate REST OpenAPI generation while keeping the decomposed syncRestOpenApi contract registry API compatible. — Thanks @imjlk!
- [1177f02](https://github.com/imjlk/wp-typia/commit/1177f02957751ec992a41958d40590fa30dc9091) Add opt-in AI-safe JSON Schema projection helpers for generated wp-typia contracts. — Thanks @imjlk!

### Patch changes

- [9715067](https://github.com/imjlk/wp-typia/commit/97150671f18bb795d5da97284a25382657d8bc08) Clarify and test the supported generated-project runtime import policy for `@wp-typia/create`. — Thanks @imjlk!
- [5bd7d5e](https://github.com/imjlk/wp-typia/commit/5bd7d5e4915ebc322e24ce75c0b04393b34d5e22) Document the current runtime surface and classification for `@wp-typia/create`. — Thanks @imjlk!
- [a18f819](https://github.com/imjlk/wp-typia/commit/a18f819b73920ce560ef101f2e218efc8f2d188f) Harden public persistence scaffolds with per-request replay protection, coarse rate limiting, and safer default write routing. — Thanks @imjlk!
- [1e8f738](https://github.com/imjlk/wp-typia/commit/1e8f738f358f7d631a0d4c370d9ed58256cd5e54) Polish runtime OpenAPI typing, error messages, and scaffold onboarding guidance for persistence-capable templates. — Thanks @imjlk!

## 0.5.0 — 2026-04-01

### Minor changes

- [6cb1fc5](https://github.com/imjlk/wp-typia/commit/6cb1fc53941e62e56208a58520845aa788eee0f1) Generate endpoint-aware REST OpenAPI documents for persistence-capable scaffolds while keeping per-contract schema artifacts intact. — Thanks @imjlk!
- [5ab6956](https://github.com/imjlk/wp-typia/commit/5ab69563b9dfde3d99625622121ded62c200f804) Add a compound block scaffold with optional parent-only persistence support. — Thanks @imjlk!
- [6796256](https://github.com/imjlk/wp-typia/commit/6796256c0d89a7baea647563b3f1fbb1441f5a21) Add scaffold identifier overrides for block namespace, text domain, and PHP prefix while separating the default slug-based naming rules for package metadata and PHP symbols. — Thanks @imjlk!

### Patch changes

- [e52d122](https://github.com/imjlk/wp-typia/commit/e52d122b19735e931a463fe06e60ceeb0b2e2da5) Generalize generated persistence REST route and contract naming beyond the counter sample, and update CI artifact downloads to the Node 24-compatible action release. — Thanks @imjlk!
- [45c5948](https://github.com/imjlk/wp-typia/commit/45c5948991b06f980c15b189905df95eaa7e9da3) Extract shared PHP REST helper files for generated persistence-capable scaffolds. — Thanks @imjlk!
- [acb5c7a](https://github.com/imjlk/wp-typia/commit/acb5c7a542271b8acefc9d62fba18b599e53333f) Document PHP REST extension points in persistence-capable scaffolds, generated README files, and repository guides. — Thanks @imjlk!
- [34b8170](https://github.com/imjlk/wp-typia/commit/34b8170e1ff783d09b133a2f97725e361b6ac8e7) Improve scaffold onboarding messages for manual sync scripts and generated metadata guidance. — Thanks @imjlk!
- [c950536](https://github.com/imjlk/wp-typia/commit/c950536ddf5c8eeffe8a3d5049306d0c94a4d593) Refactor template resolution and maintenance workflows. — Thanks @imjlk!

## 0.4.0 — 2026-03-31

### Minor changes

- [602c85c](https://github.com/imjlk/wp-typia/commit/602c85cf60c09b329836625b4a22b491961f297c) Add the built-in `data` template, introduce the `@wp-typia/rest` package for typed WordPress REST helpers, and extend the Typia sync pipeline with optional JSON Schema and OpenAPI outputs for block and API contracts. — Thanks @imjlk!

### Patch changes

- [fc639de](https://github.com/imjlk/wp-typia/commit/fc639de56c83057659c3ecd362dd7f20b9f156fb) Add manifest-driven editor helper APIs, use them in the reference app, and lightly adopt them in the built-in basic and interactivity templates. — Thanks @imjlk!
- [c79f56b](https://github.com/imjlk/wp-typia/commit/c79f56b41275a90892284aa62bc8397dd453c2f4) Add migration workspace doctor, explicit fixture refresh, seeded fuzz verification, and shared migration risk summaries for the CLI and reference app. — Thanks @imjlk!
- Updated dependencies: rest@0.2.0

## 0.3.0 — 2026-03-30

### Minor changes

- [02a4f65](https://github.com/imjlk/wp-typia/commit/02a4f6512abf18fd1ab47e95193a33a1a9b7ce22) Expand `--template` to support official `@wordpress/create-block`-style external template configs from local paths, GitHub locators, and npm package specs. Add `--variant` support for external templates, normalize rendered seeds into the wp-typia scaffold flow, and document the trusted-JavaScript execution model for external template configs. — Thanks @imjlk!

### Patch changes

- [665ce99](https://github.com/imjlk/wp-typia/commit/665ce9917e344654adf5c61f34ff17943b2c6380) Clarify the repository boundary between product packages and the example app by introducing `examples:*` root scripts, tightening built-in template composition around an explicit shared base layer, and documenting `examples/my-typia-block` as the repo-local reference app. This keeps scaffold behavior stable while making repo structure and generated template maintenance easier to follow. — Thanks @imjlk!
- [4503f18](https://github.com/imjlk/wp-typia/commit/4503f18f6adbe8ccde1b1ce36316a2f8ad9ccbd6) Tighten the generated template validation contract by introducing typed `ValidationResult` helpers, shared runtime validation utilities, and consistent validation error handling across the `basic` and `interactivity` templates. The showcase block now shares the same typed validation flow, includes visible editor-side error summaries, and adds stronger runtime test coverage for clone, prune, attribute updates, and validation UI behavior. — Thanks @imjlk!

## 0.2.0 — 2026-03-29

### Minor changes

- [01f58fd](https://github.com/imjlk/wp-typia/commit/01f58fdb3a88b7fb06c743181c5afeda57c35537) Reduce the built-in scaffold surface to `basic` and `interactivity`, add remote template MVP support for local paths and GitHub locators, expose shared metadata/default helpers from `@wp-typia/create`, and move the richer showcase app into `examples/my-typia-block`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: block-types@0.1.3

## 0.1.3 — 2026-03-29

### Patch changes

- [d89441f](https://github.com/imjlk/wp-typia/commit/d89441faf32906763807aa9bde1e960cc2ecf274) Improve Typia-powered metadata and validator generation, expand shared WordPress semantic block types, and strengthen the full/interactivity templates with precompiled validators and manifest-driven default application. — Thanks @imjlk!

## 0.1.2 — 2026-03-29

### Patch changes

- [2634593](https://github.com/imjlk/wp-typia/commit/2634593c4791272f90f01b7ddb344ab09ec418fe) Tighten the repository config baseline by fixing metadata placeholders, aligning Node and npm engine requirements, simplifying root TypeScript typecheck settings, and cleaning up CI workflow defaults. — Thanks @imjlk!

## 0.1.1 — 2026-03-29

### Patch changes

- [bc2d1b9](https://github.com/imjlk/wp-typia/commit/bc2d1b9cde0085c74ec01cc40ac46aeee68dc11d) Refresh workspace configuration and GitHub Actions release wiring for the scoped `@wp-typia` package flow. — Thanks @imjlk!

### Major Changes

- 4e50d3b: Consolidate the repository and published scaffolding surface around the scoped `@wp-typia/create` package.

### Highlights

- Package-manager-selectable scaffolding through a single CLI entrypoint
- Manifest v2 metadata generation with explicit defaults and supported discriminated union metadata
- Generated `typia-validator.php` for the supported PHP-safe attribute subset
- Advanced snapshot migrations with nested authoring, preview UX, and dynamic `render.php` validation
- Legacy wrapper packages removed from the repository and release flow

### Patch Changes

- 92d5318: Refactor the published CLI to use a typed TypeScript runtime with `dist/cli.js` as the single runtime entrypoint, and improve advanced migration scaffolding internals.

