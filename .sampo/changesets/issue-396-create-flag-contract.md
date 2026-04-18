---
npm/wp-typia: patch
npm/@wp-typia/project-tools: patch
---

Tighten `wp-typia create` flag handling by defaulting `--yes` scaffolds to npm, rejecting persistence-only flags on non-persistence built-in templates, and surfacing built-in `--variant` misuse earlier.
