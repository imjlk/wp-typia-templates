---
title: 'typia.llm Adapter Target'
---

This page records the `typia.llm` evaluation outcome from `#35` and the
supported opt-in adapter target added later.

## Outcome

- `typia.llm` can reuse the same REST contract source as the current
  endpoint-manifest and OpenAPI flow
- it does that through generated TypeScript tool/controller types, not by
  ingesting `api.openapi.json` directly
- its supported role in this repo is as a downstream tool/function-calling
  adapter target

## Supported adapter surface

The public build-time surface is
`@wp-typia/project-tools/typia-llm`.

It provides:

- `syncTypiaLlmAdapterModule(...)` for writing or checking the generated
  TypeScript adapter module
- `renderTypiaLlmModule(...)` and
  `buildTypiaLlmEndpointMethodDescriptors(...)` for lower-level generation
- `projectTypiaLlmApplicationArtifact(...)` and
  `projectTypiaLlmStructuredOutputArtifact(...)` for JSON-friendly projection
  of compiled `typia.llm` outputs

The adapter target stays build-time only. The consuming project is responsible
for compiling the generated module with the Typia transformer before reading
the generated `typia.llm.application(...)` and
`typia.llm.structuredOutput(...)` values.

## What the example emits

The adapter example generates these typia.llm-facing artifacts under
`examples/api-contract-adapter-poc/src/typia-llm/`:

- `counter.llm.generated.ts`
- `counter.llm.application.json`
- `counter-response.structured-output.json`

`counter.llm.generated.ts` is generated through
`@wp-typia/project-tools/typia-llm`. It turns the counter endpoint manifest into
a TypeScript controller interface and then asks `typia.llm` to derive:

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

## Result compared with the supported WordPress AI path

The WordPress AI path in
[`docs/wordpress-ai-projections.md`](./wordpress-ai-projections.md) still maps
most naturally to:

- `projectJsonSchemaDocument( ..., { profile: "ai-structured-output" } )`

That flow now has a supported sync surface through
`@wp-typia/project-tools/ai-artifacts` and `wp-typia sync ai`, and it produces
provider-friendly JSON Schema for WordPress AI Client structured responses.

By contrast, the `typia.llm` adapter target is strongest when the consumer
wants:

- tool/function-calling schemas
- parse/coerce/validate helpers attached to those schemas
- a TypeScript-first downstream contract consumer outside WordPress runtime code

## What this does not change

- No scaffold templates change
- No generated plugin runtime dependency on `typia.llm` is added
- This is a supported opt-in downstream adapter target, not a generated-project
  runtime feature
