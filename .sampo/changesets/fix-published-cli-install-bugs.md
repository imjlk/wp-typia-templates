---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Fix the published CLI create flow so it no longer eagerly loads project-tools runtime modules that drag in TypeScript during startup, and align the CLI React dependency range with Bunli's current React peer floor to avoid duplicate-React crashes in interactive `wp-typia create`.
