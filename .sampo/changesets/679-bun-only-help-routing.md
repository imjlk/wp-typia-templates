---
npm/wp-typia: patch
---

Normalize `wp-typia --help <bun-only-command>` so it no longer falls into
low-level Bunli validation errors and instead matches the existing command-help
or Bun-runtime guidance flow.
