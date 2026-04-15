# AI-Friendly Block Generator Architecture

This document is the architecture record for the typed built-in block generator
that now powers `wp-typia`.

It closes the design thread from issue `#193`: block generation is no longer a
string-template-only pipeline, but it is also not an AST-first rewrite. The
current architecture is intentionally hybrid.

## Design goals

- keep generation centered on typed semantic input instead of ad-hoc template
  variables
- preserve Typia-first validation and metadata projection as first-class
  concerns
- support AI/tool-driven generation through structured non-mutating stages
- keep scaffold behavior backward-compatible while the generator evolves
- use the simplest emitter strategy that is safe for each file type

## Current architecture contract

### `BlockSpec` is the semantic source of truth

`BlockSpec` is the normalized semantic model for built-in block generation.

It owns the parts of generation that matter structurally:

- block identity: namespace, slug, text domain, PHP prefix
- block metadata: title, description, keyword, icon, category
- persistence intent: enabled/disabled, policy, storage mode, scope
- runtime intent: migration UI and local-dev presets
- built-in template family metadata

Structural rules no longer live primarily in Mustache templates. Built-in
generation now starts from a typed spec and only later renders files from that
spec.

Generated projects now consume JSON artifacts through typed wrapper modules
instead of local casts:

- `block-metadata.ts` wraps `block.json`
- `manifest-document.ts` wraps `typia.manifest.json` for editor and migration
  consumers
- `manifest-defaults-document.ts` wraps `typia.manifest.json` for validator and
  defaults-oriented consumers

### `BlockGeneratorService` is the orchestration boundary

`BlockGeneratorService` is the stable internal service boundary for built-in
block generation.

It exposes four explicit stages:

- `plan`
  Normalize scaffold answers and built-in flags into a `BlockSpec`.
- `validate`
  Preserve invariants before rendering or workspace mutation.
- `render`
  Produce file-generation intent, emitter-owned artifacts, template variables,
  and post-render hooks without mutating the workspace.
- `apply`
  Copy templates, write emitter-owned files, seed starter manifests, apply
  migration/local-dev capabilities, normalize package-manager files, and
  optionally install dependencies.

That split is what makes the generator AI-friendly. Tooling can stop at
`plan`, `validate`, or `render` and inspect a structured result before deciding
whether to mutate the workspace.

### Typia remains first-class

The generator architecture is not a replacement for Typia. It is the layer that
feeds Typia-driven metadata, schema, OpenAPI, PHP validator, and starter
manifest flows from a better structural model.

The contract is:

- `src/types.ts` remains the authoring source of truth inside generated projects
- built-in generation derives starter artifacts from the same semantic model
- schema/OpenAPI/manifest/validator flows stay compatible with the existing
  sync pipeline

### Hybrid rendering stays intentional

The generator is deliberately hybrid.

Emitter-owned built-in artifacts:

- `types.ts`
- `block.json`
- `block-metadata.ts`
- `manifest-document.ts`
- `manifest-defaults-document.ts`
- built-in TS/TSX scaffold bodies such as `edit.tsx`, `save.tsx`, `index.tsx`,
  `hooks.ts`, `validators.ts`, `interactivity.ts`, and `children.ts`
- built-in style assets and block-local `render.php`
- starter `typia.manifest.json`

Mustache-backed or copied/shared assets that still stay outside the typed
emitter path:

- project bootstrap and package-manager scaffolding
- sync scripts and shared REST helpers
- shared `_shared` project layers that are still copied/interpolated
- external template composition
- non-block `wp-typia add` generators such as variation, pattern,
  binding-source, and hooked-block flows

This keeps the architecture explicit without turning the migration into a
template-engine replacement project.

## Tool-facing usage model

The current non-mutating service surface is now formalized for future
Agentica-, MCP-, or other structured tool controllers.

```ts
import { BlockGeneratorService } from '@wp-typia/project-tools';

const service = new BlockGeneratorService();
const answers = {
  // minimal scaffold answers for demonstration
};

const plan = await service.plan({
  answers,
  packageManager: 'bun',
  projectDir: 'demo-block',
  templateId: 'basic',
});

const validated = await service.validate({ plan });
const rendered = await service.render({ validated });

// Tooling can inspect rendered.spec, rendered.variables, rendered.warnings,
// rendered.templateDir, and the planned post-render hooks here.

await service.apply({ rendered });
```

That means the future AI/tool contract does not need a second generator. The
formal controller-facing follow-through now lives in
[`docs/block-generator-tool-contract.md`](./block-generator-tool-contract.md).

## Phase status

The architecture in issue `#193` was implemented incrementally.

- Phase 1: complete
  `BlockSpec` and `BlockGeneratorService` were introduced as the typed
  planning/validation/render/apply boundary.
- Phase 2: complete
  Built-in `types.ts` and `block.json` moved to typed emitters.
- Phase 2.5: complete
  Stale built-in structural Mustache files were removed and ownership
  guardrails were added.
- Phase 3: complete
  Built-in TS/TSX scaffold bodies, built-in style assets, and block-local
  `render.php` moved to emitter ownership for all built-in block families.
- Phase 4: complete
  The non-mutating tool/controller contract is now formalized around
  `inspectBlockGeneration(...)`.
- Phase 5: complete
  External template-layer manifests and `extends` resolution now compose around
  the built-in generator through the runtime API and canonical CLI flags,
  while richer interactive selection UX remains future follow-through from
  issue `#198`.

## What this architecture does not do

This design intentionally does not promise:

- a full Mustache removal across every scaffold asset
- AST-first emission or `ts-morph` as a baseline dependency
- a finalized end-user CLI UX for external `_shared` layer composition
- a commitment that every internal helper becomes public API

The public compatibility promise is still the root
`@wp-typia/project-tools` orchestration surface plus the generated-project
runtime surfaces under `@wp-typia/block-runtime/*`.

## Relationship to the rest of the repo

- [`docs/block-generator-service.md`](./block-generator-service.md)
  describes the current concrete responsibility split inside the generator.
- [`docs/block-generator-tool-contract.md`](./block-generator-tool-contract.md)
  records the public non-mutating generator controller contract.
- [`docs/API.md`](./API.md)
  maps the public package surfaces that expose the generator boundary.
- [`docs/runtime-import-policy.md`](./runtime-import-policy.md)
  defines which imports are stable and which details stay internal.
- Issue `#198`
  remains the separate RFC for external template-layer composition on top of the
  built-in shared scaffold model. See
  [`docs/external-template-layer-composition.md`](./external-template-layer-composition.md).
