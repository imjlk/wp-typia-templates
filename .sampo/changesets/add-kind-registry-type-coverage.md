---
npm/wp-typia: patch
---

Strengthen add-kind registry type coverage so each add kind's
`prepareExecution()` result stays compile-time compatible with its
corresponding `getValues(result)` contract as the registry grows.
