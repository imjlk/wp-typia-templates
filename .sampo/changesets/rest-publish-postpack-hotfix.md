---
npm/@wp-typia/rest: patch
---

Prevent the `@wp-typia/rest` postpack restore step from reverting the manifest before npm registry metadata is finalized during publish, while still restoring after the publish wrapper completes.
