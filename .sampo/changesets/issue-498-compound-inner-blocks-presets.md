---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Add compound scaffold InnerBlocks presets for richer nested authoring flows.

Compound create and workspace add flows now accept `--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>`, generated compound container code exposes preset-backed `orientation`, `templateLock`, `defaultBlock`, and `directInsert` behavior, and scaffolded READMEs explain which nested constraints stay metadata-owned versus runtime-owned.
