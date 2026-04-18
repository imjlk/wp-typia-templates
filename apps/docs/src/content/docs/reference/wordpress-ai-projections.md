---
title: 'WordPress AI Projections'
---

This repo-local proof of concept combines `#47` and `#48` on top of the
existing persistence counter example.

## Outcome

- WordPress AI Client: the generated counter response schema can be reused after
  `projectJsonSchemaDocument( ..., { profile: "ai-structured-output" } )`
- Abilities API: the endpoint manifest is a strong typed source, but it is not
  sufficient on its own
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

That result is the key design takeaway from `#48`: the manifest is a strong
typed source, but WordPress-native ability registration still needs a small
projection layer for execution semantics and capability metadata.

## What this does not change

- No scaffold imports or templates change
- No new public `@wp-typia/create` APIs are introduced
- No MCP integration is included here
- No frontend or default AI behavior is added to generated projects
- The current build-time projection flow is still backed by an internal
  `@wp-typia/create` helper rather than a supported public package surface

The main distinction to keep in mind is:

- WordPress AI Client structured outputs still map most naturally to the
  `ai-structured-output` JSON Schema projection
- `typia.llm` is being evaluated separately as a tool/function-calling
  downstream consumer of the same TypeScript contracts
