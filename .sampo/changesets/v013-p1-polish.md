---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Polish the basic scaffold and CLI regression surface by adding a static `render.php` placeholder to the basic template, avoiding duplicate wrapper CSS class segments when the namespace matches the slug, and locking `wp-typia --version` behavior with an explicit regression test.
