---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Validate compound child graphs before generated nested child scaffolds write files.

Generated compound child add-flow scripts can now preview the resulting nested hierarchy with `--dry-run`, emit planned writes before mutating files, and fail early when existing or requested ancestor graphs are structurally invalid.
