---
npm/@wp-typia/block-runtime: minor
npm/@wp-typia/create: minor
---

Add optional `check` verification mode to `@wp-typia/block-runtime/metadata-core`
sync helpers so generated projects and repo examples can verify committed
artifacts without rewriting them. Scaffolded `build` and `typecheck` scripts now
fail on stale generated metadata instead of silently mutating tracked files,
while `start`, `dev`, and explicit `sync-*` commands remain refresh-oriented.
