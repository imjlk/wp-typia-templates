---
npm/@wp-typia/create: minor
npm/@wp-typia/block-runtime: minor
---

Graduate generated-project runtime imports to `@wp-typia/block-runtime`, add
supported `@wp-typia/block-runtime/blocks` and
`@wp-typia/block-runtime/metadata-core` surfaces, and update scaffolded
templates/examples to use them as the normative generated-project runtime and
sync packages while keeping `@wp-typia/create` as the CLI package plus
compatibility facade.

Tighten the basic scaffold WordPress baseline by restoring a real
`editorStyle` asset, renaming the legacy `version` attribute to
`schemaVersion`, keeping `save.tsx` serialization stable when visibility is
toggled, bumping generated plugin PHP minimums to 8.0, and changing the
default scaffold namespace fallback from `create-block` to the normalized
project slug.
