---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Harden template rendering internals by removing global Mustache escape mutation, centralizing template traversal behind explicit rendering semantics, and stabilizing block-generation fingerprints with deterministic JSON serialization.
