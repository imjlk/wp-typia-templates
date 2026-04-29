---
npm/wp-typia: patch
---

Route interactive `wp-typia create`, `add`, and `migrate` invocations back
through the Bunli/OpenTUI runtime when Bun and a TTY are available, while
preserving Node fallback behavior for CI, JSON, help, and Bun-free runs.
