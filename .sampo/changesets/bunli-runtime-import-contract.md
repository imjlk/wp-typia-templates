---
npm/wp-typia: patch
---

Keep the published `wp-typia` Bunli runtime compatible with Node fallback and generated project smoke flows by avoiding chunk-name collisions during rebuilds and declaring the direct runtime packages that the bundled CLI imports (`@wp-typia/block-runtime`, `@wp-typia/block-types`, and `@wp-typia/rest`).
