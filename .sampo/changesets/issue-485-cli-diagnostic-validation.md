---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Unify high-frequency create/add validation paths around shared helpers so built-in `--variant` errors, `externalLayerId` composition rules, and local `--external-layer-source` path failures surface the same messages across CLI entry points. Query Loop post-type validation now mentions the original offending input, and `wp-typia add block` explains when a provided name normalizes to an empty slug instead of falling back to a generic required-field error.
