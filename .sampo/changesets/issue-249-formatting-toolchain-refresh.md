---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Refresh the repository formatting/toolchain baseline by adopting Prettier 3 in
the root policy layer, making `format:check` a first-class CI gate, and aligning
built-in scaffold package manifests on the same formatter version so generated
projects no longer carry stale Prettier 2.x pins.
