---
npm/@wp-typia/block-runtime: patch
npm/@wp-typia/project-tools: patch
---

Make block metadata helpers live in `@wp-typia/block-runtime` as the single source of truth and have `@wp-typia/project-tools` re-export the identical runtime modules instead of carrying duplicate copies.
