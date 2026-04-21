# `wp-typia`

Canonical CLI package for `wp-typia`.

Use this package for new projects:

- `npx wp-typia create my-block`
- `bunx wp-typia create my-block`
- `npx wp-typia create my-plugin --template workspace`
- `npx wp-typia create my-books --template query-loop --query-post-type book`

Extend an existing workspace with:

- `wp-typia add block counter-card --template basic`
- `wp-typia add binding-source hero-data`
- `wp-typia add rest-resource snapshots --namespace my-plugin/v1 --methods list,read,create`
- `wp-typia add hooked-block counter-card --anchor core/post-content --position after`

`wp-typia <project-dir>` remains available as a backward-compatible alias to
`wp-typia create <project-dir>` when `<project-dir>` is the only positional
argument.

Compatibility notes:

- `@wp-typia/project-tools` is the canonical programmatic project orchestration package
- the published CLI now ships built `dist-bunli` runtimes, and the canonical Node bin uses a Node-safe fallback runtime for non-TUI `create`/`add`/`migrate`, `doctor`, `sync`, `--version`, `--help`, and template inspection without requiring a locally installed Bun binary
- if `wp-typia --help` says `Runtime: Node fallback`, you are on that Bun-free path. You get human-readable help/output, common non-interactive project workflows, and lighter prompt behavior where interactive fallback is still supported
- when that Node fallback prompts interactively, it intentionally stays lighter than the Bun/OpenTUI flow: numbered lists, option label/value matching, inline validation retries, and redraw commands for the current choices: `?` for the short reprint shortcut, `help` for the explicit redraw command, and `list` for users who expect option listing semantics
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
