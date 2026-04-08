# wp-typia

## 0.12.0 — 2026-04-08

### Minor changes

- [d04adea](https://github.com/imjlk/wp-typia/commit/d04adeac260748549ccc33d51d59aa6db902b5cf) Promote `wp-typia` to the canonical CLI package, remove the published CLI/bin
  surface from `@wp-typia/create`, archive `create-wp-typia`, and update docs,
  generated migration pinning, and publish wiring to follow the new package
  identity. — Thanks @imjlk!
- [99bd9dc](https://github.com/imjlk/wp-typia/commit/99bd9dcb4f5a61fa8af8baf861e85bde5c8b8b2a) Polish workspace-aware diagnostics by extending root `wp-typia doctor` with
  workspace package metadata, block convention, generated artifact, and collection
  import checks, while keeping deep migration validation under
  `wp-typia migrate doctor --all` with explicit workspace target-alignment
  verification. — Thanks @imjlk!
- [efc4da6](https://github.com/imjlk/wp-typia/commit/efc4da6375383fa87f753296259d23e86bbfb6b5) Add explicit `wp-typia create` and `wp-typia add` command groups, ship the first official empty workspace template package, and enable `wp-typia add block` for built-in block families inside workspace projects. — Thanks @imjlk!
- [76351a1](https://github.com/imjlk/wp-typia/commit/76351a1c0cc9ea247473d080cf39723687078270) Add first-class workspace variation and pattern workflows, extend `wp-typia doctor`
  with lightweight workspace-aware diagnostics, and update the official workspace
  template to track `BLOCKS`, `VARIATIONS`, and `PATTERNS` through a single
  inventory. — Thanks @imjlk!

### Patch changes

- [9f38901](https://github.com/imjlk/wp-typia/commit/9f389017463f3b566e59095f45f8c9ddfdcd1067) Split project orchestration out of `@wp-typia/create` into the new
  `@wp-typia/project-tools` package, rewire `wp-typia` to consume the new
  programmatic surface, and retire `@wp-typia/create` to a deprecated legacy
  package shell. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.12.0

