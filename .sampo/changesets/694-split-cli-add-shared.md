---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Split shared add runtime helpers into focused type, validation, filesystem,
collision, block JSON, and help modules while keeping the compatibility barrel.
Also deduplicate the CLI line-printer type used by add and runtime bridge flows.
