---
"wp-typia-basic": minor
"wp-typia-full": minor
"wp-typia-interactivity": minor
"wp-typia-advanced": minor
---

Upgrade the published block templates to `typia@12` and migrate scaffolded builds to `@typia/unplugin`.

The generated projects now build `block.json` from `types.ts` through a shared TypeScript Compiler API analyzer and emit a colocated `typia.manifest.json` file as the future PHP validation contract.

This release also ships the template files inside the npm tarballs so `npx wp-typia-*` installs include the actual scaffold assets.
