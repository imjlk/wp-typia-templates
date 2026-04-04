---
npm/@wp-typia/api-client: minor
npm/@wp-typia/create: minor
---

Add a new transport-neutral `@wp-typia/api-client` package and manifest-first
`syncEndpointClient(...)` generation in `@wp-typia/create/metadata-core` so
persistence-style contracts can emit portable `api-client.ts` modules alongside
their existing WordPress-specific `api.ts` and aggregate OpenAPI artifacts.
