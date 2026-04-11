# @wp-typia/block-runtime

## 0.4.4 — 2026-04-11

### Patch changes

- [f3ad2ae](https://github.com/imjlk/wp-typia/commit/f3ad2ae8a94f5db626e080c9972e4749e03a1927) Align persistence and compound scaffold validator and inspector conventions, including generated storage-mode labels and compound add-child validator wiring. — Thanks @imjlk!

## 0.4.3 — 2026-04-10

### Patch changes

- [4a02664](https://github.com/imjlk/wp-typia/commit/4a026642692b6b101d454bd14c70d0b5c28b900e) Fix generated-project Typia/Webpack compatibility by moving generic Typia
  factory calls out of the shared validator helper, adding a fail-fast supported
  toolchain guard around the Webpack integration, and covering the path with
  generated-project build smoke tests. — Thanks @imjlk!

## 0.4.2 — 2026-04-09

### Minor changes

- [e20511a](https://github.com/imjlk/wp-typia/commit/e20511af33a65a9a78cde9b015dac8ec1e9ad4f5) Standardize generated block ids, scoped client ids, persistence resource keys,

### Patch changes

- [ab7d1c9](https://github.com/imjlk/wp-typia/commit/ab7d1c9afaf4039b5053991ca9fe88cabcd46a13) Publish shared API client utilities and runtime primitives from `@wp-typia/api-client`, reuse them across rest and runtime packages, and align active package Bun minimums with `1.3.11`. — Thanks @imjlk!
- [0cc5a61](https://github.com/imjlk/wp-typia/commit/0cc5a61bb50bc0fd871645b6dad29b01bb66950b) Make block metadata helpers live in `@wp-typia/block-runtime` as the single source of truth and have `@wp-typia/project-tools` re-export the identical runtime modules instead of carrying duplicate copies. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.2

## 0.3.0 — 2026-04-07

### Minor changes

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

## 0.2.3 — 2026-04-06

### Patch changes

- Updated dependencies: create (npm)@0.10.1

## 0.2.2 — 2026-04-05

### Patch changes

- Updated dependencies: create (npm)@0.10.0

## 0.2.1 — 2026-04-05

### Patch changes

- Updated dependencies: create (npm)@0.9.0

## 0.2.0 — 2026-04-05

### Minor changes

- [58a8c97](https://github.com/imjlk/wp-typia/commit/58a8c97a52107eb16148a5fd5e3da2ab5a612fba) Add a new manifest-driven `runtime/inspector` surface for generated projects,
  including `useEditorFields`, `useTypedAttributeUpdater`, `FieldControl`, and
  `InspectorFromManifest`, and mirror that subpath through
  `@wp-typia/block-runtime/inspector`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: create@0.8.0

## 0.1.2 — 2026-04-03

### Patch changes

- Updated dependencies: create@0.7.0

## 0.1.1 — 2026-04-02

### Patch changes

- [c8c5429](https://github.com/imjlk/wp-typia/commit/c8c54298019cd1a61a8cfe95001c38efc39eaef5) Add the first `@wp-typia/block-runtime` facade package as the prototype graduation path for block runtime helpers. — Thanks @imjlk!
- Updated dependencies: create@0.6.0

