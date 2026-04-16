---
npm/wp-typia: patch
---

Reduced example maintenance drift by switching the repo-local `my-typia-block`
reference app to the workspace `wp-typia` CLI instead of a hardcoded published
version, and by giving `api-contract-adapter-poc` explicit `lint` / `format`
scripts that now participate in the shared examples maintenance workflow.
