# @wp-typia/project-tools

## 0.13.4 — 2026-04-09

### Patch changes

- [fb2f09a](https://github.com/imjlk/wp-typia/commit/fb2f09ad62cf8c789f22111db110ea9dffef2504) Polish the basic scaffold and CLI regression surface by adding a static `render.php` placeholder to the basic template, avoiding duplicate wrapper CSS class segments when the namespace matches the slug, and locking `wp-typia --version` behavior with an explicit regression test. — Thanks @imjlk!

## 0.13.3 — 2026-04-09

### Patch changes

- Updated dependencies: rest (npm)@0.3.4

## 0.13.2 — 2026-04-09

### Patch changes

- Updated dependencies: rest (npm)@0.3.3

## 0.13.1 — 2026-04-09

### Patch changes

- Updated dependencies: rest (npm)@0.3.2

## 0.13.0 — 2026-04-08

### Minor changes

- [ebdb173](https://github.com/imjlk/wp-typia/commit/ebdb1739010f335b14d8be1ace016920193278a1) Add the first-class `wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>` workflow with `block.json` `blockHooks` patching, root doctor validation, generated-project smoke coverage, and updated CLI/workspace docs. — Thanks @imjlk!
- [1d12a52](https://github.com/imjlk/wp-typia/commit/1d12a52efc0f7215b130257cfe1f010a963cf232) Add the first-class `wp-typia add binding-source <name>` workspace workflow with
  inventory entries, shared PHP/editor bootstrap wiring, workspace doctor checks,
  and generated-project smoke coverage for binding-source builds. — Thanks @imjlk!

## 0.12.0 — 2026-04-08

### Minor changes

- [99bd9dc](https://github.com/imjlk/wp-typia/commit/99bd9dcb4f5a61fa8af8baf861e85bde5c8b8b2a) Polish workspace-aware diagnostics by extending root `wp-typia doctor` with
  workspace package metadata, block convention, generated artifact, and collection
  import checks, while keeping deep migration validation under
  `wp-typia migrate doctor --all` with explicit workspace target-alignment
  verification. — Thanks @imjlk!
- [76351a1](https://github.com/imjlk/wp-typia/commit/76351a1c0cc9ea247473d080cf39723687078270) Add first-class workspace variation and pattern workflows, extend `wp-typia doctor`
  with lightweight workspace-aware diagnostics, and update the official workspace
  template to track `BLOCKS`, `VARIATIONS`, and `PATTERNS` through a single
  inventory. — Thanks @imjlk!

### Patch changes

- [9f38901](https://github.com/imjlk/wp-typia/commit/9f389017463f3b566e59095f45f8c9ddfdcd1067) Split project orchestration out of `@wp-typia/create` into the new
  `@wp-typia/project-tools` package, rewire `wp-typia` to consume the new
  programmatic surface, and retire `@wp-typia/create` to a deprecated legacy
  package shell. — Thanks @imjlk!
- Updated dependencies: block-runtime (npm)@0.4.0

