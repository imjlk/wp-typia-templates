---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Remove built-in scaffold `types.ts.mustache` and `block.json.mustache` files now that structural artifacts are emitter-owned, keep the generator contract documented as “template bodies from Mustache, structural files from emitters”, and add guard tests so built-in template trees cannot regress back to shipping stale structural Mustache sources.
