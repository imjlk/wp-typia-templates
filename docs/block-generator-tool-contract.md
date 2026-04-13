# Block Generator Tool Contract

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
  Emitter-owned files such as structural artifacts and built-in generated
  source files.
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

## Out of scope

This contract intentionally does not:

- implement an MCP server
- implement Agentica runtime wiring
- replace `BlockGeneratorService`
- define the final CLI UX for external template-layer composition

External layer composition is now available programmatically through the same
inspection input shape (`externalLayerSource` and optional `externalLayerId`),
but the end-user CLI selection flow remains the separate concern documented in
[`docs/external-template-layer-composition.md`](./external-template-layer-composition.md).
