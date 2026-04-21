---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Expose hook-friendly InnerBlocks option helpers for generated compound containers.

Generated compound parents and container children now export reusable `get*InnerBlocksPropsOptions()` helpers so projects can move to `useInnerBlocksProps` without manually reconstructing preset-driven `template`, `defaultBlock`, `templateLock`, `orientation`, `directInsert`, or `renderAppender` settings.
