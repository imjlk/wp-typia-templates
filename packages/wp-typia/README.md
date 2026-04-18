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
- the published CLI now ships built `dist-bunli` runtimes, and the canonical Node bin uses a Node-safe fallback runtime for non-TUI `create`/`add`/`migrate`, `doctor`, `sync`, `--version`, `--help`, and template inspection without requiring a locally installed Bun binary
- Bunli-specific command surfaces such as `skills`, `completions`, and `mcp` still run through the built `dist-bunli/cli.js` artifact and require Bun; if you need the full Bunli/OpenTUI runtime story, prefer `bunx wp-typia` or install Bun locally
- any future `curl`-style installer should reuse the same published `dist-bunli` runtime instead of reintroducing a Bun bootstrap path
- internal runtime-bridge helper modules are implementation details; integrations
  should target the CLI or `@wp-typia/project-tools`, not CLI internals

Maintainers: see [`docs/bunli-cli-migration.md`](https://imjlk.github.io/wp-typia/maintainers/bunli-cli-migration/)
for the active CLI ownership contract and the staged Bunli cutover plan.

Project meta docs:

- [Upgrade Guide](https://github.com/imjlk/wp-typia/blob/main/UPGRADE.md)
- [License](https://github.com/imjlk/wp-typia/blob/main/LICENSE)
- [Security Policy](https://github.com/imjlk/wp-typia/blob/main/SECURITY.md)
- [Contributing Guide](https://github.com/imjlk/wp-typia/blob/main/CONTRIBUTING.md)
