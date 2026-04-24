# API Contract Adapter PoC

This example proves that a `wp-typia` endpoint manifest can drive a small non-PHP runtime.

- It reuses the counter REST manifest from [`examples/persistence-examples`](../persistence-examples).
- It serves the same `GET` and `POST` routes from a minimal Node/TypeScript HTTP server.
- It keeps state in memory and validates requests/responses with generated JSON Schemas derived from the same TypeScript contracts used by the WordPress example.
- It consumes the generated portable `src/api-client.ts` counter client from the persistence example through `@wp-typia/api-client`.
- It now also uses the opt-in `@wp-typia/project-tools/typia-llm` adapter target
  as a build-time downstream consumer of the same counter contracts.

This is still an architecture proof, but it is now the reference example for
the generated `src/transport.ts` seam used by persistence scaffolds.

- It is not a first-class runtime package or a drop-in deployment target for generated scaffolds.
- It accepts generated persistence scaffold `/state` route aliases and serves the dedicated `/bootstrap` route so scaffolded `src/transport.ts` files can point only their base URLs at the adapter during transport-seam verification.
- It does not attempt WordPress auth parity such as REST nonces or signed token verification.
- It exists to validate contract portability ahead of follow-up work like `#35`.

## Conformance harness

The repo now validates this adapter through the shared conformance harness at
[`tests/helpers/rest-adapter-conformance.ts`](../../tests/helpers/rest-adapter-conformance.ts).

To plug another adapter experiment into the same harness, expose:

- the shared endpoint manifest
- a `startServer()` helper that returns `{ url, close(), routeTable }`
- a route table whose entries include `method`, `path`, `operationId`, and `authMode`
- response validators keyed by `operationId`
- scenario fixtures that describe successful and invalid raw HTTP requests

This first-pass harness checks manifest route parity, response contract parity,
raw invalid-request behavior, and manifest-level auth metadata parity. It does
not require runtime-specific WordPress nonce or signed-token enforcement.

## typia.llm adapter target

Run the opt-in adapter sync flow with:

```bash
bun run sync-typia-llm
```

That sync emits these artifacts under `src/typia-llm/`:

- `counter.llm.generated.ts`
- `counter.llm.application.json`
- `counter-response.structured-output.json`

This is a build-time adapter target. It does not add any runtime LLM dependency
to generated WordPress plugins, and it does not replace the WordPress AI Client
JSON Schema flow used in the separate
[`docs/wordpress-ai-projections.md`](https://imjlk.github.io/wp-typia/reference/wordpress-ai-projections/)
path.
