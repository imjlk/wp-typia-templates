---
title: 'Block Generator Tool Contract'
---

This document records the first non-mutating tool/controller contract on top of
`BlockGeneratorService`.

It closes issue `#267`. The generator already had explicit internal stages
through `plan`, `validate`, `render`, and `apply`. This contract makes the
non-mutating half of that flow stable for tools that need to inspect the
generator before mutating a workspace.

## Goals

- expose a stable controller-friendly entrypoint around `BlockGeneratorService`
- keep the tool-facing contract serializable
- let a caller stop after `plan`, `validate`, or `render`
- avoid workspace mutation until the caller explicitly chooses to call
  `BlockGeneratorService.apply(...)`

## Public entrypoint

`@wp-typia/project-tools` now exports:

- `inspectBlockGeneration(...)`
- `BLOCK_GENERATION_TOOL_CONTRACT_VERSION`

The current contract version is `1`.

```ts
import {
  BLOCK_GENERATION_TOOL_CONTRACT_VERSION,
  inspectBlockGeneration,
} from '@wp-typia/project-tools';

const inspection = await inspectBlockGeneration({
  answers,
  packageManager: 'bun',
  projectDir: 'demo-block',
  templateId: 'basic',
  stopAfter: 'render',
});

if (inspection.contractVersion !== BLOCK_GENERATION_TOOL_CONTRACT_VERSION) {
  throw new Error('Unexpected generator tool contract version');
}
```

## Compatibility policy

`BLOCK_GENERATION_TOOL_CONTRACT_VERSION` is intentionally a simple integer,
not a SemVer string.

The contract currently uses a single compatibility rule:

- controller and tool consumers should treat `contractVersion` as an exact-match
  gate before assuming the serialized shape

That keeps downstream behavior predictable for MCP, AI-controller, and other
structured integrations that need a fail-closed boundary instead of heuristic
schema guessing.

### Changes that do not require a version bump

These changes stay within the same contract version:

- documentation-only clarifications
- internal implementation refactors that do not change the serialized
  inspection payload
- additive object fields that are both optional and safely ignorable by a
  consumer that already understands the surrounding object

In other words, consumers may ignore unknown object keys within a recognized
`contractVersion`, but they should not assume new keys exist.

### Changes that require a version bump

Increment `BLOCK_GENERATION_TOOL_CONTRACT_VERSION` whenever a change would make
an exact-version consumer misinterpret the payload or branch incorrectly.

That includes:

- removing, renaming, or retyping an existing field
- changing the meaning, units, or default interpretation of an existing field
- making an optional field effectively required for correct interpretation
- changing stage names or stage ordering assumptions
- adding or removing discriminator values such as preview `owner`, preview
  `kind`, or other tagged union members
- reshaping nested objects in ways that break an existing exact-version parser

As a maintainer shortcut:

- if an older consumer can keep working by ignoring a new key, it is additive
- if an older consumer could parse the payload but act incorrectly, it is
  breaking

## Consumer behavior on version mismatch

The recommended consumer behavior is intentionally strict:

1. read `contractVersion`
2. compare it to the supported constant or explicit allowlist
3. stop immediately on mismatch with an actionable error

Default controller logic should not attempt forward-compat parsing across a
version mismatch.

Recommended behavior:

- newer producer, older consumer:
  fail closed and tell the caller which contract version was expected vs
  received
- older producer, newer consumer:
  fail closed unless the consumer intentionally carries compatibility logic for
  that older version
- same version:
  proceed, while ignoring unknown optional object keys

This is why the example above uses a direct equality check instead of a range
comparison.

## Stage model

The contract is intentionally stage-based.

### `stopAfter: 'plan'`

Returns:

- `contractVersion`
- `mutatesWorkspace: false`
- `stage: 'plan'`
- normalized `plan`

This is the lightest-weight way to inspect how raw scaffold answers become a
typed `BlockSpec` plus generation target metadata.

### `stopAfter: 'validate'`

Returns everything from `plan`, plus:

- `stage: 'validate'`
- `validated`

This is the point where built-in invariants such as unsupported built-in
variant usage have already been enforced.

### `stopAfter: 'render'`

Returns everything from `validate`, plus a serializable `rendered` snapshot:

- `template`
- `warnings`
- `copiedTemplateFiles`
- `emittedFiles`
- `starterManifestFiles`
- `readmeContent`
- `gitignoreContent`
- `postRender`

The render contract is still non-mutating. It shows what the generator would
copy or emit, but it does not write to the destination project directory.

## Render contract shape

The render-stage snapshot intentionally distinguishes three categories:

- `copiedTemplateFiles`
  Output paths that would come from the remaining built-in Mustache/copied
  template tree.
- `emittedFiles`
  Emitter-owned files such as structural artifacts, generated JSON wrapper
  modules (`block-metadata.ts`, `manifest-document.ts`,
  `manifest-defaults-document.ts`), and built-in generated source files.
- `starterManifestFiles`
  Starter `typia.manifest.json` documents derived from the same semantic model.

That split mirrors the current generator architecture:

- built-in structural files and scaffold bodies are emitter-owned
- some shared/bootstrap assets still come from copied template layers

## Mutation boundary

`inspectBlockGeneration(...)` never mutates the workspace.

Mutation still happens only when a caller explicitly goes through
`BlockGeneratorService.apply(...)`.

That means tool/controller code can safely:

1. call `inspectBlockGeneration(...)`
2. inspect the structured result
3. decide whether to continue
4. only then call the mutating path

## Relation to Agentica and MCP

This contract is the bridge from the typed generator architecture in
[`docs/block-generator-architecture.md`](./block-generator-architecture.md) to
future Agentica, MCP, or other structured controller surfaces.

It does not add Agentica or MCP integration directly. Instead, it provides a
stable serializable shape that a future controller can expose without needing to
redefine generator stages or invent a second preview path.

Future controller surfaces should keep delegating compatibility decisions to
`contractVersion` instead of trying to infer compatibility from payload shape.

## Out of scope

This contract intentionally does not:

- implement an MCP server
- implement Agentica runtime wiring
- replace `BlockGeneratorService`
- add richer discovery UX beyond the current interactive layer selector

External layer composition is now available through the same inspection input
shape (`externalLayerSource` and optional `externalLayerId`) and the canonical
`wp-typia create` / `wp-typia add block` built-in flags. The canonical CLI now
prompts for a layer when a package exposes multiple public roots and the caller
omits `externalLayerId`, while programmatic and non-interactive callers still
pass the layer id explicitly when ambiguity exists.
