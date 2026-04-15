---
npm/@wp-typia/block-types: patch
npm/@wp-typia/project-tools: patch
npm/wp-typia: patch
---

Fixed published scaffold outputs so generated basic, persistence, and compound block registration files no longer rely on `registerBlockType<T>()` generic calls that break against the current published `@wordpress/blocks` type surface. Hardened the packed publish-install smoke to verify wrapper exports and to typecheck generated basic and compound scaffolds, including the compound `add-compound-child` path, against packed local release tarballs before publish.
