---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Improve create/add/sync CLI ergonomics for preview-first and no-install workflows. `wp-typia create --dry-run` now defaults non-interactive answers without requiring an extra `--yes`, `wp-typia sync` fails early with install guidance when local dependencies like `tsx` are missing, and `wp-typia add ... --dry-run` can preview planned workspace file updates without mutating the real workspace.
