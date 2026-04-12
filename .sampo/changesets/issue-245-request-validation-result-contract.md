---
npm/@wp-typia/api-client: patch
npm/@wp-typia/rest: patch
---

Fix request validation failure paths so `callEndpoint()` and the React REST
helpers preserve an honest request-vs-response validation contract instead of
casting request failures to response validation results.
