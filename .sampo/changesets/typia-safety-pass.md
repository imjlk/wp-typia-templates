---
"npm/@wp-typia/create": patch
"npm/create-wp-typia": patch
---

Tighten the generated template validation contract by introducing typed `ValidationResult` helpers, shared runtime validation utilities, and consistent validation error handling across the `basic` and `interactivity` templates. The showcase block now shares the same typed validation flow, includes visible editor-side error summaries, and adds stronger runtime test coverage for clone, prune, attribute updates, and validation UI behavior.
