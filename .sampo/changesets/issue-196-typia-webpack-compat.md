---
npm/@wp-typia/block-runtime: patch
npm/@wp-typia/create-workspace-template: patch
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Fix generated-project Typia/Webpack compatibility by moving generic Typia
factory calls out of the shared validator helper, adding a fail-fast supported
toolchain guard around the Webpack integration, and covering the path with
generated-project build smoke tests.
