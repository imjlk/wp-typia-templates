---
npm/wp-typia: patch
npm/@wp-typia/project-tools: patch
npm/@wp-typia/create: major
---

Split project orchestration out of `@wp-typia/create` into the new
`@wp-typia/project-tools` package, rewire `wp-typia` to consume the new
programmatic surface, and retire `@wp-typia/create` to a deprecated legacy
package shell.
