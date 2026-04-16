---
npm/@wp-typia/block-types: patch
---

Added first-class validation coverage for `@wp-typia/block-types`, including
published export-contract checks, compile-time public type fixtures, and CI
coverage wiring so block type regressions fail fast before they leak to
downstream packages.
