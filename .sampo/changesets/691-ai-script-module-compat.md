---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Document and test that generated server-only AI feature PHP avoids WordPress
script-module enqueue APIs, keeping older WordPress sites from loading an
unguarded script-module call. Keep the CLI package in the same release lane as
its exact `@wp-typia/project-tools` dependency.
