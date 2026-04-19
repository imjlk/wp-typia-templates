---
title: 'typia.llm Evaluation'
---

This repo-local proof of concept records the outcome of `#35`.

## Outcome

- `typia.llm` can reuse the same REST contract source as the current
  endpoint-manifest and OpenAPI flow
- it does that through generated TypeScript tool/controller types, not by
  ingesting `api.openapi.json` directly
- its clearest value in this repo is as a downstream
  tool/function-calling contract consumer

## What the PoC emits

The adapter example now generates these typia.llm-facing artifacts under
`examples/api-contract-adapter-poc/src/typia-llm/`:

- `counter.llm.generated.ts`
- `counter.llm.application.json`
- `counter-response.structured-output.json`

`counter.llm.generated.ts` is a manifest-driven generated module that turns the
counter endpoint manifest into a TypeScript controller interface and then asks
`typia.llm` to derive:

- function-calling schemas for the `GET` and `POST` counter endpoints
- a structured-output schema for `PersistenceCounterResponse`

`counter.llm.application.json` is the sanitized tool/function artifact derived
from `typia.llm.application<...>()`.

`counter-response.structured-output.json` is the sanitized structured-output
artifact derived from `typia.llm.structuredOutput<...>()`.

## What OpenAPI-first means here

For this evaluation, OpenAPI-first means:

- `src/api.openapi.json` remains the canonical downstream baseline for the
  REST surface
- the typia.llm artifacts are generated from the same TypeScript contracts that
  already feed the endpoint manifest and OpenAPI flow
- the evaluation compares those outputs instead of trying to feed OpenAPI JSON
  directly into `typia.llm`

That distinction matters because `typia.llm` currently operates on TypeScript
types, not on imported OpenAPI documents.

## Result compared with the WordPress AI proof

The existing WordPress AI proof in
[`docs/wordpress-ai-projections.md`](./wordpress-ai-projections.md) still maps
most naturally to:

- `projectJsonSchemaDocument( ..., { profile: "ai-structured-output" } )`

That flow produces provider-friendly JSON Schema for WordPress AI Client
structured responses.

By contrast, the `typia.llm` proof is strongest when the consumer wants:

- tool/function-calling schemas
- parse/coerce/validate helpers attached to those schemas
- a TypeScript-first downstream contract consumer outside WordPress runtime code

## What this does not change

- No scaffold templates change
- No new public `@wp-typia/project-tools` API is introduced
- No generated plugin runtime dependency on `typia.llm` is added
- This is still an evaluation, not a supported generated-project feature
