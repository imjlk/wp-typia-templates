---
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Implement external template-layer composition manifests and `extends` resolution on top of the built-in shared scaffold model.

Programmatic built-in scaffold flows can now accept an external layer package through `externalLayerSource` and optional `externalLayerId`, while preserving built-in emitter ownership and explicit protected-path conflict errors.
