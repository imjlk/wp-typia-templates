# External Template-Layer Composition RFC

This document records the architecture contract for external template-layer
composition on top of the built-in shared scaffold model.

It closes the RFC thread from issue `#198`. The goal is not to replace the
current scaffold pipeline or the existing remote-template adapter. The goal is
to define how another package can extend the built-in shared layer graph
without forking the whole scaffold system.

## Design goals

- keep built-in `_shared` layers as the canonical internal scaffold model
- let external packages add reusable layers on top of that model
- define deterministic `extends` and override rules
- keep conflict handling explicit instead of implicit
- preserve the current trust model for third-party template sources

## What this RFC is and is not

This RFC defines a package contract for reusable external scaffold layers.

It does not:

- replace current external template seed support
- replace the typed built-in generator architecture from
  [`docs/block-generator-architecture.md`](./block-generator-architecture.md)
- change the official empty workspace template package contract
- define the final CLI UX for selecting a composed external layer package

The follow-up implementation work now lives in issue `#268`.

## Relationship to current template support

Today `wp-typia` supports three remote-template shapes:

- a remote/local `wp-typia` template directory
- an official create-block external template config
- a create-block-style subset (`block.json` plus `src/index|edit|save`)

Those flows are still seed-oriented. `wp-typia` normalizes them into a scaffold
project and then re-applies its own package/tooling/runtime conventions around
that seed.

External template-layer composition is different:

- it is layer-oriented instead of seed-oriented
- it composes on top of built-in `_shared` scaffold layers
- it does not replace built-in emitter ownership
- it is intended for reusable agencies/vendors/community overlays rather than
  one-off remote template forks

## Package contract

An external layer package should publish a root manifest named
`wp-typia.layers.json`.

The manifest is data, not executable code. A minimal shape is:

```json
{
  "version": 1,
  "layers": {
    "acme/persistence-observability": {
      "path": "layers/persistence-observability",
      "extends": [
        "builtin:shared/base",
        "builtin:shared/rest-helpers/shared",
        "builtin:shared/persistence/core"
      ],
      "description": "Adds shared observability files for persistence-capable blocks"
    }
  }
}
```

### Manifest fields

- `version`
  Required. Initial contract version is `1`.
- `layers`
  Required object keyed by external layer id.
- `layers.<id>.path`
  Required relative directory path inside the package. It must stay within the
  package root and may not resolve through symlinks.
- `layers.<id>.extends`
  Optional ordered array of ancestor layer ids. Ancestors may reference
  canonical built-in ids or other external layer ids from the same package.
- `layers.<id>.description`
  Optional human-readable description.

This RFC intentionally does not add package-level JavaScript transformers to
the layer manifest. The manifest itself should stay statically inspectable.

## Canonical built-in layer ids

Built-in `_shared` layers remain the canonical internal model. The RFC maps
those directories to stable layer ids using the rule:

- `packages/wp-typia-project-tools/templates/_shared/<path>`
- becomes `builtin:shared/<path>`

Examples:

- `templates/_shared/base`
  -> `builtin:shared/base`
- `templates/_shared/rest-helpers/shared`
  -> `builtin:shared/rest-helpers/shared`
- `templates/_shared/rest-helpers/public`
  -> `builtin:shared/rest-helpers/public`
- `templates/_shared/rest-helpers/auth`
  -> `builtin:shared/rest-helpers/auth`
- `templates/_shared/persistence/core`
  -> `builtin:shared/persistence/core`
- `templates/_shared/persistence/public`
  -> `builtin:shared/persistence/public`
- `templates/_shared/persistence/auth`
  -> `builtin:shared/persistence/auth`
- `templates/_shared/compound/core`
  -> `builtin:shared/compound/core`
- `templates/_shared/compound/persistence`
  -> `builtin:shared/compound/persistence`
- `templates/_shared/compound/persistence-public`
  -> `builtin:shared/compound/persistence-public`
- `templates/_shared/compound/persistence-auth`
  -> `builtin:shared/compound/persistence-auth`
- `templates/_shared/migration-ui/common`
  -> `builtin:shared/migration-ui/common`
- `templates/_shared/presets/wp-env`
  -> `builtin:shared/presets/wp-env`
- `templates/_shared/presets/test-preset`
  -> `builtin:shared/presets/test-preset`
- `templates/_shared/workspace/persistence-public`
  -> `builtin:shared/workspace/persistence-public`
- `templates/_shared/workspace/persistence-auth`
  -> `builtin:shared/workspace/persistence-auth`

## Resolution rules

Layer resolution is deterministic and order-sensitive.

Given a selected external layer:

1. Resolve ancestors from `extends` depth-first, left to right.
2. Materialize each ancestor exactly once.
3. Apply the selected layer's own `path` last.
4. Apply the built-in template-specific overlay and emitter-owned files after
   shared/external layer copy.

That means:

- earlier `extends` entries are lower precedence
- later `extends` entries override earlier ones
- the selected layer overrides every ancestor
- the typed built-in generator still owns emitter-written artifacts after layer
  copy completes

## Conflict handling and precedence

The contract distinguishes between ordinary copied assets and protected
`wp-typia`-owned outputs.

### Ordinary copied assets

Examples:

- shared scripts
- non-emitter README/bootstrap fragments
- copied helper files that still live in `_shared`

For these, later layers win deterministically.

### Protected paths

External layers may not override paths owned by the generator or by
`wp-typia`'s package/tooling/bootstrap contract.

Protected outputs include:

- emitter-owned built-in artifacts such as `types.ts`, `block.json`,
  built-in TS/TSX scaffold bodies, built-in styles, and block-local
  `render.php`
- starter `typia.manifest.json`
- package/tooling bootstrap files that `wp-typia` explicitly normalizes, such
  as package-manager metadata and sync/runtime setup

If an external layer writes a protected path, the implementation should fail
hard with an explicit conflict error instead of silently accepting drift.

## Trust model

External layer packages are third-party code and should be treated with the
same trust posture as existing external template sources.

- local paths, GitHub locators, and npm package sources are all trusted inputs
- layer packages must not contain symlinks
- the layer manifest should stay data-only so it can be inspected without
  executing package JavaScript
- if a package also exposes the current create-block-style external config
  entrypoint, that JavaScript path keeps the existing trusted-JS model

## Relation to workspace templates

The official empty workspace template package remains a separate concept.

- `@wp-typia/create-workspace-template` still defines the empty workspace root
  used by `wp-typia create --template @wp-typia/create-workspace-template`
- `wp-typia add block` continues to grow that workspace through the built-in
  generator path
- external template-layer composition is for reusable shared scaffold layers,
  not for replacing the official empty workspace template contract

Future implementation may let workspace-aware flows reuse the same external
layer ids, but the official workspace template itself remains canonical.

## Relation to the typed generator architecture

This RFC extends the current generator architecture; it does not compete with
it.

- built-in block planning/validation/render/apply still flows through
  `BlockSpec` and `BlockGeneratorService`
- built-in emitter-owned files remain authoritative
- external layer composition only broadens the shared copied-layer graph around
  that typed core

That is why issue `#193` could close independently while `#198` stayed open:
the typed generator is implemented, while the external layer contract is a
separate follow-through.

## Follow-up implementation

Issue `#268` tracks the implementation of:

- manifest loading and validation
- canonical built-in layer id mapping
- `extends` resolution and precedence
- protected-path conflict errors
- regression coverage for composed external layers
