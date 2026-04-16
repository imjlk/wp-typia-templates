# `wp-typia`

Canonical CLI package for `wp-typia`.

Use this package for new installs:

- `npx wp-typia create my-block`
- `bunx wp-typia create my-block`
- `npx wp-typia create my-plugin --template @wp-typia/create-workspace-template`
- `wp-typia add block counter-card --template basic`
- `wp-typia add binding-source hero-data`
- `wp-typia add hooked-block counter-card --anchor core/post-content --position after`

`wp-typia <project-dir>` remains available as a backward-compatible alias to
`wp-typia create <project-dir>` when `<project-dir>` is the only positional
argument.

Compatibility notes:

- `@wp-typia/project-tools` is the canonical programmatic project orchestration package
- `@wp-typia/create` is the deprecated legacy package shell
- `create-wp-typia` is archived and should not be used for new installs

Maintainers: see [`docs/bunli-cli-migration.md`](../../docs/bunli-cli-migration.md)
for the active CLI ownership contract and the staged Bunli cutover plan.

Project meta docs:

- [Upgrade Guide](https://github.com/imjlk/wp-typia/blob/main/UPGRADE.md)
- [License](https://github.com/imjlk/wp-typia/blob/main/LICENSE)
- [Security Policy](https://github.com/imjlk/wp-typia/blob/main/SECURITY.md)
- [Contributing Guide](https://github.com/imjlk/wp-typia/blob/main/CONTRIBUTING.md)
