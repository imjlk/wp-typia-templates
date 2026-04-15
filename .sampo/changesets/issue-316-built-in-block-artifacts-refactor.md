---
npm/@wp-typia/project-tools: patch
---

Refactored the built-in block artifact emitter so template attribute definitions are driven by shared declarative spec tables while preserving the generated `block.json`, `typia.manifest.json`, and TypeScript outputs. Added explicit artifact summary equivalence coverage to guard against refactor-only output drift across the built-in template families.
