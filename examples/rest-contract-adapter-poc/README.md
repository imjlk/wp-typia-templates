# REST Contract Adapter PoC

This example proves that a `wp-typia` endpoint manifest can drive a small non-PHP runtime.

- It reuses the counter REST manifest from [`examples/persistence-examples`](../persistence-examples).
- It serves the same `GET` and `POST` routes from a minimal Node/TypeScript HTTP server.
- It keeps state in memory and validates requests/responses with generated JSON Schemas derived from the same TypeScript contracts used by the WordPress example.
- It now also evaluates `typia.llm` as a build-time downstream consumer of the
  same counter contracts.

This is an architecture proof only.

- It is not a supported alternative runtime for generated scaffolds.
- It does not attempt WordPress auth parity such as REST nonces or signed token verification.
- It exists to validate contract portability ahead of follow-up work like `#35`.

## typia.llm evaluation

Run the repo-local evaluation flow with:

```bash
bun run sync-typia-llm
```

That sync emits these artifacts under `src/typia-llm/`:

- `counter.llm.generated.ts`
- `counter.llm.application.json`
- `counter-response.structured-output.json`

This is a build-time proof only. It does not add any runtime LLM dependency to
generated WordPress plugins, and it does not replace the WordPress AI Client
JSON Schema flow used in the separate
[`docs/wordpress-ai-projections.md`](../../docs/wordpress-ai-projections.md)
evaluation.
