---
npm/wp-typia: minor
npm/@wp-typia/project-tools: minor
---

Polish workspace-aware diagnostics by extending root `wp-typia doctor` with
workspace package metadata, block convention, generated artifact, and collection
import checks, while keeping deep migration validation under
`wp-typia migrate doctor --all` with explicit workspace target-alignment
verification.
