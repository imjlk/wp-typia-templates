---
npm/wp-typia: patch
---

Treat `wp-typia add` without a subcommand kind as a real CLI error. The command now still prints add help text for interactive users, but exits non-zero so shells, CI, and wrappers can distinguish malformed invocations from successful add workflows.
