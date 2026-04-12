---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Trim the default interactivity scaffold down to the runtime surface it actually uses by removing dead context fields, unbound actions, unused editor attributes like `uniqueId` and `autoPlayInterval`, and the unused `interactiveMode: "auto"` scaffold option.
