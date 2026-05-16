---
npm/@wp-typia/block-types: patch
---

Make block-types diagnostic output explicit and silent by default. Non-strict
warnings from Supports, Variations, and Bindings no longer fall back to
`console.warn`; pass `onDiagnostic` for structured callbacks or `logger:
console`/a custom logger for visible warning output.
