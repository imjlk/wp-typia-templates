---
"npm/@wp-typia/create": patch
"npm/create-wp-typia": patch
---

Clarify the repository boundary between product packages and the example app by introducing `examples:*` root scripts, tightening built-in template composition around an explicit shared base layer, and documenting `examples/my-typia-block` as the repo-local reference app. This keeps scaffold behavior stable while making repo structure and generated template maintenance easier to follow.
