---
npm/@wp-typia/api-client: patch
npm/@wp-typia/rest: patch
---

Clarify the public runtime error contract and `@wp-typia/rest` export semantics
by documenting validation-vs-throw behavior, introducing named configuration and
assertion errors for the runtime client packages, and explicitly documenting
that `./client` and `./http` remain compatibility aliases in the current major
line instead of introducing a breaking export split.
