---
npm/wp-typia: patch
npm/@wp-typia/project-tools: patch
---

Harden `wp-typia create` project-directory handling by warning on awkward names, rejecting `.` and `..`, and limiting the positional shortcut to unambiguous local paths.
