---
npm/wp-typia: patch
---

Normalize `wp-typia init --format json` and `wp-typia init --apply --format json`
to the standard `{ ok: true, data: ... }` CLI success envelope while keeping
the detailed retrofit plan nested under `data.plan`.
