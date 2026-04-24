---
title: 'WordPress AI Projections'
---

This repo-local proof of concept combines `#47` and `#48` on top of the
existing persistence counter example.

The projection path is no longer internal-only: the supported helper surface now
lives on `@wp-typia/project-tools/ai-artifacts`, and generated projects can opt
into a dedicated `sync-ai` script that `wp-typia sync ai` understands.

That supported sync path now also underpins scaffolded server-only AI feature
endpoints. Official workspaces can generate a starter feature with
`wp-typia add ai-feature <name>`, which wires a typed REST endpoint plus an
AI-safe response schema under `src/ai-features/<slug>/ai-schemas/`.

## Outcome

- WordPress AI Client: the generated counter response schema can be reused after
  `projectJsonSchemaDocument( ..., { profile: "ai-structured-output" } )`
- Abilities API: the endpoint manifest is a strong typed source, but it is not
  sufficient on its own
- the repo now names that additive WordPress-only layer `AbilitySpec` instead
  of treating it as ad hoc per-example projection wiring
- typia.llm: see [`docs/typia-llm-evaluation.md`](./typia-llm-evaluation.md)
  for the separate build-time tool/function consumer evaluation

## What the PoC emits

The counter example now generates two WordPress-facing artifacts under
`examples/persistence-examples/src/blocks/counter/wordpress-ai/`:

- `counter-response.ai.schema.json`
- `counter.abilities.json`

`counter-response.ai.schema.json` is the AI-safe schema reused by the example
PHP AI Client helper.

`counter.abilities.json` projects the counter endpoint manifest into
WordPress-friendly ability registration metadata and attaches AI-safe input and
output schemas for the `GET` and `POST` operations.

## What had to be added beyond the endpoint manifest

The backend-neutral endpoint manifest was enough to supply:

- operation ids
- HTTP method and path
- summaries
- request/response contract selection

The Abilities API proof still needed a WordPress-only extension layer for:

- category id and label
- execute callback name
- permission callback name
- semantic annotations such as `readonly`, `destructive`, and `idempotent`
- optional MCP exposure metadata such as `meta.mcp.public`

That result is the key design takeaway from `#48`: the manifest is a strong
typed source, but WordPress-native ability registration still needs a small
additive `AbilitySpec` layer for execution semantics and capability metadata.

## Current merge boundary

The current internal split is:

- endpoint manifest owns `operationId`, method/path, summary, request and
  response contract selection, and auth intent / `wordpressAuth`
- `AbilitySpec` owns category metadata, WordPress callback names, semantic
  annotations, optional `meta.mcp.public`, and `showInRest`

That keeps WordPress-only execution semantics out of the backend-neutral REST
manifest while still letting the two sources compose at build time.

## Compatibility draft for future scaffolds

The repo also now carries a draft AI feature capability model that lets future
scaffolds describe feature surfaces as either:

- `required`
- `optional`

That draft is intentionally only a foundation for now. It records the minimum
WordPress floor and runtime gate expectations for surfaces such as:

- server-side Abilities registration
- `@wordpress/core-abilities`
- the WordPress AI Client
- optional MCP public metadata

Scaffolds do not apply the compatibility policy yet. The current state is:

- no plugin header changes
- no generated runtime guards
- a server-only `add ai-feature` workflow for WordPress AI Client endpoints
- no typed Abilities scaffold rollout yet

## What this does not change

- No typed Abilities scaffold is included here yet
- No MCP integration is included here
- No frontend or default AI behavior is added to generated projects
- `typia.llm` remains a separate evaluation path rather than part of the
  supported WordPress AI sync surface

The main distinction to keep in mind is:

- WordPress AI Client structured outputs still map most naturally to the
  `ai-structured-output` JSON Schema projection
- `typia.llm` is being evaluated separately as a tool/function-calling
  downstream consumer of the same TypeScript contracts
