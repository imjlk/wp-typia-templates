---
npm/@wp-typia/api-client: patch
npm/@wp-typia/rest: patch
---

Clarify the public runtime error contract and `@wp-typia/rest` export semantics
by documenting validation-vs-throw behavior, introducing named configuration and
assertion errors for the runtime client packages, and making the `./http`
subpath a distinct decoder-only export while keeping `./client` as a documented
compatibility alias.
