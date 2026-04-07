---
npm/@wp-typia/api-client: minor
npm/@wp-typia/rest: patch
---

Consolidate the shared validation/object/form-data runtime helpers used by
`@wp-typia/api-client` and `@wp-typia/rest` under one maintained internal
implementation owned by `@wp-typia/api-client`, while keeping the existing root
public APIs unchanged.
