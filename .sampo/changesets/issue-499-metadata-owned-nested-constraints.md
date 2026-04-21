---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Clarify compound nested block ownership so static child constraints stay metadata-owned.

Generated compound parent and nested child editors now rely on `block.json` for static `allowedBlocks`, `parent`, and `ancestor` relationships, while `children.ts` stays focused on editor-only preset behavior such as `template`, `defaultBlock`, `orientation`, `templateLock`, and `directInsert`.
