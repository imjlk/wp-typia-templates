# @wp-typia/create-workspace-template

## 0.16.0 — 2026-04-29

### Minor changes

- [e8e3b8a](https://github.com/imjlk/wp-typia/commit/e8e3b8acd03902626260c2189948d99876df5d17) Elevate binding-source scaffolds with optional end-to-end block target wiring, including typed attribute updates, supported-attributes doctor checks, and CLI/docs coverage. — Thanks @imjlk!
- [7fe9336](https://github.com/imjlk/wp-typia/commit/7fe93360fa7cc5dc03a6c2e24d5e8fda4b502a9b) Add first-class `wp-typia add style` and `wp-typia add transform` workspace
  scaffolds, including workspace inventory sections, block entrypoint wiring,
  doctor coverage, CLI/TUI metadata, generated-project build coverage, and docs. — Thanks @imjlk!

## 0.15.0 — 2026-04-20

### Minor changes

- [79e43bd](https://github.com/imjlk/wp-typia/commit/79e43bd23a146e2aef4fdf2ebcb995ad3dad5a79) Add first-class `wp-typia add editor-plugin <name> [--slot <PluginSidebar>]` workspace scaffolding, including workspace inventory support, editor build/bootstrap wiring, doctor coverage, and generated-project smoke validation. — Thanks @imjlk!

### Patch changes

- [65b8eb2](https://github.com/imjlk/wp-typia/commit/65b8eb2cf876eb73c8200da4fbcfd9fc30d2b5e0) Add the first-class `wp-typia add rest-resource <name>` workspace workflow so official workspace plugins can scaffold plugin-level typed REST resources with generated TypeScript contracts, validators, endpoint clients, React data hooks, PHP route starters, `sync-rest` inventory support, and matching add/doctor/help surfaces.
  
  Teach `@wp-typia/rest` endpoint execution to honor `requestLocation: "query-and-body"` so generated update clients can split query parameters and JSON bodies correctly. — Thanks @imjlk!

## 0.14.0 — 2026-04-10

### Minor changes

- [1470cc5](https://github.com/imjlk/wp-typia/commit/1470cc5ed02064e616292faa1e38765ce80b7da0) Add a unified `sync` entrypoint for generated projects and the `wp-typia sync`
  CLI, and make `sync-rest` fail fast when type-derived metadata artifacts are
  stale or missing. — Thanks @imjlk!

## 0.13.1 — 2026-04-10

### Patch changes

- [4a02664](https://github.com/imjlk/wp-typia/commit/4a026642692b6b101d454bd14c70d0b5c28b900e) Fix generated-project Typia/Webpack compatibility by moving generic Typia
  factory calls out of the shared validator helper, adding a fail-fast supported
  toolchain guard around the Webpack integration, and covering the path with
  generated-project build smoke tests. — Thanks @imjlk!

## 0.13.0 — 2026-04-08

### Minor changes

- [1d12a52](https://github.com/imjlk/wp-typia/commit/1d12a52efc0f7215b130257cfe1f010a963cf232) Add the first-class `wp-typia add binding-source <name>` workspace workflow with
  inventory entries, shared PHP/editor bootstrap wiring, workspace doctor checks,
  and generated-project smoke coverage for binding-source builds. — Thanks @imjlk!

## 0.12.0 — 2026-04-08

### Minor changes

- [efc4da6](https://github.com/imjlk/wp-typia/commit/efc4da6375383fa87f753296259d23e86bbfb6b5) Add explicit `wp-typia create` and `wp-typia add` command groups, ship the first official empty workspace template package, and enable `wp-typia add block` for built-in block families inside workspace projects. — Thanks @imjlk!
- [76351a1](https://github.com/imjlk/wp-typia/commit/76351a1c0cc9ea247473d080cf39723687078270) Add first-class workspace variation and pattern workflows, extend `wp-typia doctor`
  with lightweight workspace-aware diagnostics, and update the official workspace
  template to track `BLOCKS`, `VARIATIONS`, and `PATTERNS` through a single
  inventory. — Thanks @imjlk!

