# wp-typia

## 0.16.8 — 2026-04-13

### Patch changes

- [a9e4a8d](https://github.com/imjlk/wp-typia/commit/a9e4a8dfb9c67fdb0b53e754dfa0bcb87794ca8a) Split the `cli-add` implementation into focused runtime modules and replace the
  readline prompt retry recursion with iterative control flow so repeated invalid
  input stays stable during long-running interactive CLI sessions. — Thanks @imjlk!
- [e58b434](https://github.com/imjlk/wp-typia/commit/e58b434bee5b5149aa3b1593f6884d06c38ed957) Refresh the repository formatting/toolchain baseline by adopting Prettier 3 in
  the root policy layer, making `format:check` a first-class CI gate, and aligning
  built-in scaffold package manifests on the same formatter version so generated
  projects no longer carry stale Prettier 2.x pins. — Thanks @imjlk!
- [6d4bee7](https://github.com/imjlk/wp-typia/commit/6d4bee76f55c1cab40d0d0b4f25a157e17aef7cb) Deduplicate the remaining shared manifest and migration contract types behind
  `@wp-typia/block-runtime/migration-types`, centralize the official workspace
  template package constant, and align built-in scaffold `Edit` emitters on the
  shared `BlockEditProps` typing convention. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.4, project-tools (npm)@0.16.7

## 0.16.7 — 2026-04-12

### Patch changes

- Updated dependencies: api-client (npm)@0.4.3, project-tools (npm)@0.16.6

## 0.16.6 — 2026-04-12

### Patch changes

- [7b9a136](https://github.com/imjlk/wp-typia/commit/7b9a136394233b8f894ad4155b8d4ed4de636cc3) Make built-in scaffold styles and block-local render.php emitter-owned, remove the remaining built-in non-TS Mustache sources, and document the narrowed Mustache ownership split. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.16.5

## 0.16.5 — 2026-04-12

### Patch changes

- [1bcbaad](https://github.com/imjlk/wp-typia/commit/1bcbaadde08c1f9b38cf0fc0770dfd4c1c4a794f) Trim the default interactivity scaffold down to the runtime surface it actually uses by removing dead context fields, unbound actions, unused editor attributes like `uniqueId` and `autoPlayInterval`, and the unused `interactiveMode: "auto"` scaffold option. — Thanks @imjlk!
- [d963e91](https://github.com/imjlk/wp-typia/commit/d963e91309f8a0f07192508b67271cfb98fb232e) Add a Phase 1 typed block generation boundary to `@wp-typia/project-tools` via `BlockSpec` and `BlockGeneratorService`, while keeping built-in scaffold file bodies on their current Mustache rendering path. — Thanks @imjlk!
- [9d60ecf](https://github.com/imjlk/wp-typia/commit/9d60ecf03431b281fb804d48b753ab5b5641051f) Remove built-in scaffold `types.ts.mustache` and `block.json.mustache` files now that structural artifacts are emitter-owned, keep the generator contract documented as “template bodies from Mustache, structural files from emitters”, and add guard tests so built-in template trees cannot regress back to shipping stale structural Mustache sources. — Thanks @imjlk!
- [f31b84b](https://github.com/imjlk/wp-typia/commit/f31b84be3bb4eea2583a610e4c96039f62fa290e) Move built-in scaffold `types.ts` and `block.json` generation onto the typed Phase 2 emitter path behind `BlockGeneratorService`, reuse the same structural artifact model for starter manifests, and document the new ownership split where structural files are emitter-owned while the remaining built-in scaffold files still come from Mustache templates. — Thanks @imjlk!
- [4ed3170](https://github.com/imjlk/wp-typia/commit/4ed31709b87ecc0f3fb7bd1524d40700cac44c82) Make built-in scaffold TS/TSX bodies emitter-owned alongside structural files, remove stale built-in TS/TSX Mustache sources, and document the narrowed Mustache ownership split. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.16.4

## 0.16.4 — 2026-04-12

### Patch changes

- [93576a1](https://github.com/imjlk/wp-typia/commit/93576a118a3dfa355391eefea05b95e3337b153a) Fix generated interactivity scaffolds so their WordPress Interactivity context is typed through explicit `getContext<T>()` imports, and restore GitHub Pages publishing by deploying a real static docs site artifact from CI. — Thanks @imjlk!
- [5ff0a04](https://github.com/imjlk/wp-typia/commit/5ff0a04584f9433e89e4fc227523105980e3ac9e) Keep successful first-party TUI workflows open long enough to review their completion output in-buffer, with shared completion surfaces for `create`, `add`, and `migrate` before exit. — Thanks @imjlk!
- [9a9ca7c](https://github.com/imjlk/wp-typia/commit/9a9ca7cfc29dda649a7c63dcbc9d91034963d60e) Fix first-party TUI submit rendering so create/add/migrate replace stale form content with a shared submitting surface, and restore GitHub Pages deploys by pinning the documentation artifact upload action to a real `actions/upload-pages-artifact` release tag. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.16.3

## 0.16.3 — 2026-04-12

### Patch changes

- [e9901fa](https://github.com/imjlk/wp-typia/commit/e9901fa3c6b461b7b4c112cba20cc4e5e3654a99) Deduplicate schema-core behind the block-runtime implementation owner while keeping the project-tools import path stable, run project-tools regression tests on pull requests while keeping coverage uploads on main, and refresh workflow actions to reduce wall-clock time and remove Node 20 runtime warnings. — Thanks @imjlk!
- [18b51b2](https://github.com/imjlk/wp-typia/commit/18b51b2d450c36b7943cb83ac6f33682d645d7cf) Fix the published CLI create flow so it no longer eagerly loads project-tools runtime modules that drag in TypeScript during startup, and align the CLI React dependency range with Bunli's current React peer floor to avoid duplicate-React crashes in interactive `wp-typia create`. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.16.2

## 0.16.2 — 2026-04-11

### Patch changes

- [3dd1c99](https://github.com/imjlk/wp-typia/commit/3dd1c99df1aa69cd11563861adf9b75f5ec5be71) Fix generated interactivity scaffolds to emit valid `data-wp-class--is-active` directives for animation state toggling. — Thanks @imjlk!
- [548c95b](https://github.com/imjlk/wp-typia/commit/548c95b07b97b8e4264af94651c5d9dea9974c8b) Fix `wp-typia create --template workspace` to normalize the shorthand alias before npm template resolution. — Thanks @imjlk!
- [f3ad2ae](https://github.com/imjlk/wp-typia/commit/f3ad2ae8a94f5db626e080c9972e4749e03a1927) Align persistence and compound scaffold validator and inspector conventions, including generated storage-mode labels and compound add-child validator wiring. — Thanks @imjlk!
- [024bab0](https://github.com/imjlk/wp-typia/commit/024bab003d1e20a2248c08ffe772cf7875ae0acb) Fix persistence scaffold regressions in authenticated bootstrap typing and generated PHP storage-mode handling. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.16.1

## 0.16.1 — 2026-04-11

### Patch changes

- [7c8a2ef](https://github.com/imjlk/wp-typia/commit/7c8a2efac24f97abb92b9d20b73366c2a4bc6f17) Fixed alternate-buffer TUI lifecycle handling so interactive create/add/migrate flows exit cleanly on submit, cancel, quit, lazy-load failure, and runtime command failure. — Thanks @imjlk!

## 0.16.0 — 2026-04-10

### Minor changes

- [1470cc5](https://github.com/imjlk/wp-typia/commit/1470cc5ed02064e616292faa1e38765ce80b7da0) Add a unified `sync` entrypoint for generated projects and the `wp-typia sync`
  CLI, and make `sync-rest` fail fast when type-derived metadata artifacts are
  stale or missing. — Thanks @imjlk!

### Patch changes

- Updated dependencies: project-tools (npm)@0.16.0

## 0.15.5 — 2026-04-10

### Patch changes

- [c935242](https://github.com/imjlk/wp-typia/commit/c9352422b12ad7168425125c39932381a57e56dc) Avoid duplicating existing `typia` imports when `wp-typia add block --template compound`
  repairs legacy compound validator files inside older workspaces. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.15.4

## 0.15.4 — 2026-04-10

### Patch changes

- [4a02664](https://github.com/imjlk/wp-typia/commit/4a026642692b6b101d454bd14c70d0b5c28b900e) Fix generated-project Typia/Webpack compatibility by moving generic Typia
  factory calls out of the shared validator helper, adding a fail-fast supported
  toolchain guard around the Webpack integration, and covering the path with
  generated-project build smoke tests. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.15.3

## 0.15.3 — 2026-04-10

### Patch changes

- [d4ec944](https://github.com/imjlk/wp-typia/commit/d4ec94407e77933245dba1017f753b7eda5ed353) Add repository upgrade and security docs, GitHub issue/PR templates, and link
  the new meta guidance from the published `wp-typia` README. — Thanks @imjlk!

## 0.15.2 — 2026-04-09

### Patch changes

- [ab7d1c9](https://github.com/imjlk/wp-typia/commit/ab7d1c9afaf4039b5053991ca9fe88cabcd46a13) Publish shared API client utilities and runtime primitives from `@wp-typia/api-client`, reuse them across rest and runtime packages, and align active package Bun minimums with `1.3.11`. — Thanks @imjlk!
- Updated dependencies: api-client (npm)@0.4.2, project-tools (npm)@0.15.2

## 0.15.1 — 2026-04-09

### Patch changes

- [70137df](https://github.com/imjlk/wp-typia/commit/70137df4e131872e1d01b2d883e9fc890a42a673) Fix scaffold DX regressions by seeding persistence REST artifacts during create, restoring interactivity editor styles, exposing the official workspace template in `templates`, and making compound child scaffolds read live parent metadata. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.15.1

## 0.15.0 — 2026-04-09

### Minor changes

- [e4610ff](https://github.com/imjlk/wp-typia/commit/e4610ffe8201d47f2de6c03a41a89fb4c63fcebc) Add dedicated static-safe `/bootstrap` endpoints for persistence scaffolds and align generated runtime flow around fresh session-only write access hydration. — Thanks @imjlk!

### Patch changes

- Updated dependencies: project-tools (npm)@0.15.0

## 0.14.0 — 2026-04-09

### Minor changes

- [6c0af4a](https://github.com/imjlk/wp-typia/commit/6c0af4af622d18435ef4a03d3a1c4928d6c55db6) Add a generated `src/transport.ts` seam for persistence scaffolds so editor and frontend runtime calls can be redirected to contract-compatible proxies or BFFs without rewriting generated API glue. — Thanks @imjlk!

### Patch changes

- Updated dependencies: project-tools (npm)@0.14.0

## 0.13.4 — 2026-04-09

### Patch changes

- [fb2f09a](https://github.com/imjlk/wp-typia/commit/fb2f09ad62cf8c789f22111db110ea9dffef2504) Polish the basic scaffold and CLI regression surface by adding a static `render.php` placeholder to the basic template, avoiding duplicate wrapper CSS class segments when the namespace matches the slug, and locking `wp-typia --version` behavior with an explicit regression test. — Thanks @imjlk!
- Updated dependencies: project-tools (npm)@0.13.4

## 0.13.3 — 2026-04-09

### Patch changes

- Updated dependencies: project-tools (npm)@0.13.3

## 0.13.2 — 2026-04-09

### Patch changes

- Updated dependencies: project-tools (npm)@0.13.2

## 0.13.1 — 2026-04-09

### Patch changes

- Updated dependencies: project-tools (npm)@0.13.1

## 0.13.0 — 2026-04-08

### Minor changes

- [ebdb173](https://github.com/imjlk/wp-typia/commit/ebdb1739010f335b14d8be1ace016920193278a1) Add the first-class `wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>` workflow with `block.json` `blockHooks` patching, root doctor validation, generated-project smoke coverage, and updated CLI/workspace docs. — Thanks @imjlk!
- [1d12a52](https://github.com/imjlk/wp-typia/commit/1d12a52efc0f7215b130257cfe1f010a963cf232) Add the first-class `wp-typia add binding-source <name>` workspace workflow with
  inventory entries, shared PHP/editor bootstrap wiring, workspace doctor checks,
  and generated-project smoke coverage for binding-source builds. — Thanks @imjlk!

### Patch changes

- Updated dependencies: project-tools (npm)@0.13.0

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

