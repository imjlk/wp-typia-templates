---
npm/wp-typia: patch
---

Validate CLI `--format` values before command execution so typoed formats fail
clearly with the supported `json` and `toon` values instead of silently falling
back to human-readable output.
