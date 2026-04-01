# create-wp-typia

## 1.3.1 — 2026-04-01

### Patch changes

- [5ab6956](https://github.com/imjlk/wp-typia/commit/5ab69563b9dfde3d99625622121ded62c200f804) Add a compound block scaffold with optional parent-only persistence support. — Thanks @imjlk!
- [6796256](https://github.com/imjlk/wp-typia/commit/6796256c0d89a7baea647563b3f1fbb1441f5a21) Add scaffold identifier overrides for block namespace, text domain, and PHP prefix while separating the default slug-based naming rules for package metadata and PHP symbols. — Thanks @imjlk!
- Updated dependencies: create@0.5.0

## 1.3.0 — 2026-03-31

### Minor changes

- [602c85c](https://github.com/imjlk/wp-typia/commit/602c85cf60c09b329836625b4a22b491961f297c) Add the built-in `data` template, introduce the `@wp-typia/rest` package for typed WordPress REST helpers, and extend the Typia sync pipeline with optional JSON Schema and OpenAPI outputs for block and API contracts. — Thanks @imjlk!

### Patch changes

- [fc639de](https://github.com/imjlk/wp-typia/commit/fc639de56c83057659c3ecd362dd7f20b9f156fb) Add manifest-driven editor helper APIs, use them in the reference app, and lightly adopt them in the built-in basic and interactivity templates. — Thanks @imjlk!
- [c79f56b](https://github.com/imjlk/wp-typia/commit/c79f56b41275a90892284aa62bc8397dd453c2f4) Add migration workspace doctor, explicit fixture refresh, seeded fuzz verification, and shared migration risk summaries for the CLI and reference app. — Thanks @imjlk!
- Updated dependencies: create@0.4.0

## 1.2.0 — 2026-03-30

### Minor changes

- [02a4f65](https://github.com/imjlk/wp-typia/commit/02a4f6512abf18fd1ab47e95193a33a1a9b7ce22) Expand `--template` to support official `@wordpress/create-block`-style external template configs from local paths, GitHub locators, and npm package specs. Add `--variant` support for external templates, normalize rendered seeds into the wp-typia scaffold flow, and document the trusted-JavaScript execution model for external template configs. — Thanks @imjlk!

### Patch changes

- [665ce99](https://github.com/imjlk/wp-typia/commit/665ce9917e344654adf5c61f34ff17943b2c6380) Clarify the repository boundary between product packages and the example app by introducing `examples:*` root scripts, tightening built-in template composition around an explicit shared base layer, and documenting `examples/my-typia-block` as the repo-local reference app. This keeps scaffold behavior stable while making repo structure and generated template maintenance easier to follow. — Thanks @imjlk!
- [4503f18](https://github.com/imjlk/wp-typia/commit/4503f18f6adbe8ccde1b1ce36316a2f8ad9ccbd6) Tighten the generated template validation contract by introducing typed `ValidationResult` helpers, shared runtime validation utilities, and consistent validation error handling across the `basic` and `interactivity` templates. The showcase block now shares the same typed validation flow, includes visible editor-side error summaries, and adds stronger runtime test coverage for clone, prune, attribute updates, and validation UI behavior. — Thanks @imjlk!
- Updated dependencies: create@0.3.0

## 1.1.0 — 2026-03-29

### Minor changes

- [01f58fd](https://github.com/imjlk/wp-typia/commit/01f58fdb3a88b7fb06c743181c5afeda57c35537) Reduce the built-in scaffold surface to `basic` and `interactivity`, add remote template MVP support for local paths and GitHub locators, expose shared metadata/default helpers from `@wp-typia/create`, and move the richer showcase app into `examples/my-typia-block`. — Thanks @imjlk!

### Patch changes

- Updated dependencies: create@0.2.0

## 1.0.3 — 2026-03-29

### Patch changes

- [d89441f](https://github.com/imjlk/wp-typia/commit/d89441faf32906763807aa9bde1e960cc2ecf274) Improve Typia-powered metadata and validator generation, expand shared WordPress semantic block types, and strengthen the full/interactivity templates with precompiled validators and manifest-driven default application. — Thanks @imjlk!
- Updated dependencies: create@0.1.3

## 1.0.2 — 2026-03-29

### Patch changes

- [2634593](https://github.com/imjlk/wp-typia/commit/2634593c4791272f90f01b7ddb344ab09ec418fe) Tighten the repository config baseline by fixing metadata placeholders, aligning Node and npm engine requirements, simplifying root TypeScript typecheck settings, and cleaning up CI workflow defaults. — Thanks @imjlk!
- Updated dependencies: create@0.1.2

## 1.0.1 — 2026-03-29

### Patch changes

- Updated dependencies: create@0.1.1

