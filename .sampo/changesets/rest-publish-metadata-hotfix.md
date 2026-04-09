---
npm/@wp-typia/rest: patch
---

Ensure npm publish rewrites `@wp-typia/rest` workspace protocol dependencies before the registry captures package metadata, so published installs resolve `@wp-typia/api-client` through a semver range instead of `workspace:*`.
