---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Split the `cli-add` implementation into focused runtime modules and replace the
readline prompt retry recursion with iterative control flow so repeated invalid
input stays stable during long-running interactive CLI sessions.
