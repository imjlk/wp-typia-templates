# REST Contract Adapter PoC

This example proves that a `wp-typia` endpoint manifest can drive a small non-PHP runtime.

- It reuses the counter REST manifest from [`examples/persistence-examples`](../persistence-examples).
- It serves the same `GET` and `POST` routes from a minimal Node/TypeScript HTTP server.
- It keeps state in memory and validates requests/responses with generated JSON Schemas derived from the same TypeScript contracts used by the WordPress example.

This is an architecture proof only.

- It is not a supported alternative runtime for generated scaffolds.
- It does not attempt WordPress auth parity such as REST nonces or signed token verification.
- It exists to validate contract portability ahead of follow-up work like `#35`.
