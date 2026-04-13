---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Deduplicate the remaining shared manifest and migration contract types behind
`@wp-typia/block-runtime/migration-types`, centralize the official workspace
template package constant, and align built-in scaffold `Edit` emitters on the
shared `BlockEditProps` typing convention.
