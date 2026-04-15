---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Keep migration registry generation validating the current manifest even when retrofitted projects import a local `manifest-document.ts` wrapper, so malformed or stale wrappers still fail fast during migration setup.
