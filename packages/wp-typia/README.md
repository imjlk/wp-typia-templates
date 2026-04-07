# `wp-typia`

Canonical CLI package for `wp-typia`.

Use this package for new installs:

- `npx wp-typia create my-block`
- `bunx wp-typia create my-block`
- `npx wp-typia create my-plugin --template @wp-typia/create-workspace-template`
- `wp-typia add block counter-card --template basic`

`wp-typia <project-dir>` remains available as a backward-compatible alias to
`wp-typia create <project-dir>`.

Compatibility notes:

- `@wp-typia/create` remains available for programmatic scaffold/runtime imports and compatibility exports
- `create-wp-typia` is archived and should not be used for new installs
