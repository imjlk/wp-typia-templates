---
npm/@wp-typia/create: patch
---

Split the internal `metadata-core` implementation in `@wp-typia/create`
into focused analysis, parser, projection, and PHP rendering modules without
changing the public metadata sync API or generated artifact semantics.
