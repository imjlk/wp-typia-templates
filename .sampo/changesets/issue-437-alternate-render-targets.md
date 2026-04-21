---
npm/@wp-typia/project-tools: minor
npm/wp-typia: minor
---

Add alternate render target scaffold support for persistence-capable dynamic blocks. `wp-typia create` and `wp-typia add block` now accept `--alternate-render-targets <email,mjml,plain-text>` for persistence scaffolds and persistence-enabled compound scaffolds, emitting shared `render-targets.php` helpers plus per-target render entry files alongside the default web render boundary.
