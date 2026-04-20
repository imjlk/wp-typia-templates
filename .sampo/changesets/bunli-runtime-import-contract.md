---
npm/wp-typia: patch
---

Keep the published `wp-typia` Bunli runtime compatible with Node fallback and generated project smoke flows by avoiding Bun chunk-name collisions during linked-runtime rebuilds without forcing the full CLI into a single-file bundle.
