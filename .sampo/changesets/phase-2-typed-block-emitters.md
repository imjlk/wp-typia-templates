---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Move built-in scaffold `types.ts` and `block.json` generation onto the typed Phase 2 emitter path behind `BlockGeneratorService`, reuse the same structural artifact model for starter manifests, and document the new ownership split where structural files are emitter-owned while the remaining built-in scaffold files still come from Mustache templates.
