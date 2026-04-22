# `wp-typia`

Canonical CLI package for `wp-typia`.

Use this package for new projects:

- `npx wp-typia create my-block`
- `bunx wp-typia create my-block`
- `curl -fsSL https://github.com/imjlk/wp-typia/releases/latest/download/install-wp-typia.sh | sh`
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
- when you request machine-readable output with `--format json`, CLI failures now include a stable `error.code` field so wrappers and CI can branch without parsing English text
- when that Node fallback prompts interactively, it intentionally stays lighter than the Bun/OpenTUI flow: numbered lists, option label/value matching, inline validation retries, and redraw commands for the current choices: `?` for the short reprint shortcut, `help` for the explicit redraw command, and `list` for users who expect option listing semantics
- Bunli-specific command surfaces such as `skills`, `completions`, and `mcp` still run through the built `dist-bunli/cli.js` artifact and require Bun when you use the npm package directly; if you want the full Bunli/OpenTUI runtime story without a local Bun install, prefer the standalone installer from the latest GitHub Release
- standalone release assets are published per platform together with checksum manifests and install scripts: `install-wp-typia.sh` for macOS/Linux and `install-wp-typia.ps1` for Windows
- internal runtime-bridge helper modules are implementation details; integrations
  should target the CLI or `@wp-typia/project-tools`, not CLI internals

Maintainers: see [`docs/bunli-cli-migration.md`](https://imjlk.github.io/wp-typia/maintainers/bunli-cli-migration/)
for the active CLI ownership contract and the staged Bunli cutover plan.

Project meta docs:

- [Upgrade Guide](https://github.com/imjlk/wp-typia/blob/main/UPGRADE.md)
- [License](https://github.com/imjlk/wp-typia/blob/main/LICENSE)
- [Security Policy](https://github.com/imjlk/wp-typia/blob/main/SECURITY.md)
- [Contributing Guide](https://github.com/imjlk/wp-typia/blob/main/CONTRIBUTING.md)
