# `@wp-typia/api-client`

## 0.3.0 — 2026-04-05

### Minor changes

- [56d9906](https://github.com/imjlk/wp-typia/commit/56d9906401db82940cb1bb9b2840da0dcac694d4) Separate backend-neutral endpoint auth intent from WordPress-specific auth
  mechanisms in endpoint manifests, generated OpenAPI metadata, and portable API
  client endpoint metadata while preserving legacy `authMode` compatibility. — Thanks @imjlk!

## 0.2.0 — 2026-04-05

### Minor changes

- [faef0a6](https://github.com/imjlk/wp-typia/commit/faef0a66b974956373a42be8324db37c4be3f97f) Add first-class mixed `{ query, body }` request support to generated portable
  endpoint clients so `syncEndpointClient(...)` and `@wp-typia/api-client` can
  handle endpoints that define both `queryContract` and `bodyContract`. — Thanks @imjlk!
- [ec0c3fb](https://github.com/imjlk/wp-typia/commit/ec0c3fb82abfa11be512f999e1acbd91d466cff1) Add a new transport-neutral `@wp-typia/api-client` package and manifest-first
  `syncEndpointClient(...)` generation in `@wp-typia/create/metadata-core` so
  persistence-style contracts can emit portable `api-client.ts` modules alongside
  their existing WordPress-specific `api.ts` and aggregate OpenAPI artifacts. — Thanks @imjlk!
- [a6cfe68](https://github.com/imjlk/wp-typia/commit/a6cfe68388dc20f65fd2ea71189514a9a3a4d6eb) Add optional transport decorator helpers such as `withHeaders(...)`,
  `withComputedHeaders(...)`, `withHeaderValue(...)`, and `withBearerToken(...)`
  so portable API clients can attach common header and auth behavior without
  rewriting custom transport wrappers. — Thanks @imjlk!

