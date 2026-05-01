---
npm/wp-typia: patch
---

Return a non-zero exit code when `wp-typia` is invoked without a command while
still printing the Node fallback help output, and keep explicit help/version
requests successful.
