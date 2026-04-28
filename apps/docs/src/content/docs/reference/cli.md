---
title: 'CLI Reference'
---

`wp-typia` is the canonical command-line entrypoint for scaffold, adoption,
sync, doctor, migration, and workspace extension workflows.

```bash
npx wp-typia --help
bunx wp-typia --help
wp-typia --version
```

The published binary keeps common non-interactive commands available through the
Node fallback runtime. Bun-powered command surfaces such as `mcp`, `skills`, and
shell `completions` require Bun 1.3.11+ or the standalone release binary.

## Global flags

| Flag              | Description                                                               |
| ----------------- | ------------------------------------------------------------------------- |
| `--help`          | Show top-level or command-specific help.                                  |
| `--version`       | Print the installed `wp-typia` version.                                   |
| `--config <path>` | Load a config override file for the current invocation.                   |
| `--format json`   | Emit machine-readable output for commands that support structured output. |

Status markers honor `WP_TYPIA_ASCII=1`, `WP_TYPIA_ASCII=0`, and `NO_COLOR` in
the same way as generated project onboarding output.

## Machine-readable diagnostics

Commands that support `--format json` emit stable failure envelopes for CI, IDE,
and wrapper integrations. The `error.code` field is the integration contract;
human-readable `message`, `summary`, and `detailLines` can change as guidance
improves.

```json
{
  "ok": false,
  "error": {
    "code": "missing-argument",
    "command": "create",
    "kind": "command-execution",
    "tag": "CommandExecutionError"
  }
}
```

Known throw sites attach an explicit diagnostic code. Message-based inference is
kept only as a compatibility fallback for legacy or untyped errors.

| Code                         | Typical cause                                            | Recovery                                                                |
| ---------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| `command-execution`          | The command failed after preflight checks completed.     | Read the detail lines and rerun after fixing the underlying tool error. |
| `configuration-missing`      | Required wp-typia configuration is missing.              | Add the missing config section or rerun the scaffold/init setup.        |
| `dependencies-not-installed` | Project or workspace dependencies are not installed.     | Run the reported package-manager install command from the project root. |
| `doctor-check-failed`        | One or more doctor checks failed.                        | Fix the failed doctor rows, then rerun `wp-typia doctor`.               |
| `invalid-argument`           | An argument value is present but unsupported or invalid. | Correct the argument value using command help and the detail lines.     |
| `invalid-command`            | The command or subcommand is not supported.              | Run `wp-typia --help` and switch to a listed command/subcommand.        |
| `missing-argument`           | A required positional argument or flag value is missing. | Provide the missing value shown in the detail lines.                    |
| `missing-build-artifact`     | The CLI package layout is missing bundled artifacts.     | Reinstall the package/binary or rebuild the workspace.                  |
| `outside-project-root`       | The command ran outside a generated project/workspace.   | `cd` into the scaffolded root or rerun the scaffold/init flow.          |
| `template-source-timeout`    | External template resolution timed out.                  | Retry with a reachable source, local path, or cached package.           |
| `template-source-too-large`  | External template content exceeded the safety limit.     | Reduce the package size or use a smaller template layer.                |
| `unknown-template`           | The requested template id is not registered.             | Run `wp-typia templates list` and use one of the listed ids.            |
| `unsupported-command`        | The current runtime cannot execute that command surface. | Install Bun 1.3.11+ or use the standalone wp-typia binary if required.  |

## `create`

Scaffold a new project.

```bash
wp-typia create <project-dir> --template basic --package-manager npm --yes
wp-typia create <project-dir> --template persistence --data-storage custom-table --persistence-policy public
wp-typia create <project-dir> --template workspace
```

Common flags:

| Flag                                                   | Description                                                                                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--template <id \| path \| github:... \| npm-package>` | Template id or external template source. Built-ins include `basic`, `interactivity`, `persistence`, `compound`, `query-loop`, and the `workspace` alias. |
| `--package-manager <bun \| npm \| pnpm \| yarn>`       | Package manager for generated install and script commands.                                                                                               |
| `--yes`                                                | Accept non-interactive defaults.                                                                                                                         |
| `--no-install`                                         | Skip dependency installation.                                                                                                                            |
| `--dry-run`                                            | Preview generated files without writing the target directory.                                                                                            |
| `--namespace <value>`                                  | Override the generated block namespace.                                                                                                                  |
| `--text-domain <value>`                                | Override the generated text domain.                                                                                                                      |
| `--php-prefix <value>`                                 | Override generated PHP symbol prefixes.                                                                                                                  |
| `--with-migration-ui`                                  | Add migration UI support where the selected template supports it.                                                                                        |
| `--with-wp-env`                                        | Add local `wp-env` preset files and scripts.                                                                                                             |
| `--with-test-preset`                                   | Add a test-only `wp-env` preset and smoke-test wiring.                                                                                                   |
| `--external-layer-source <source>`                     | Compose an external layer package on top of a built-in template.                                                                                         |
| `--external-layer-id <id>`                             | Select a specific external layer when a package exposes multiple layers.                                                                                 |
| `--variant <name>`                                     | Select a variant from an official external template config.                                                                                              |
| `--query-post-type <post-type>`                        | Set the default post type for `query-loop` scaffolds.                                                                                                    |
| `--inner-blocks-preset <id>`                           | Select a compound `InnerBlocks` preset.                                                                                                                  |
| `--alternate-render-targets <list>`                    | Add alternate render targets for persistence-capable dynamic scaffolds.                                                                                  |
| `--data-storage <post-meta \| custom-table>`           | Select persistence storage for persistence-capable scaffolds.                                                                                            |
| `--persistence-policy <authenticated \| public>`       | Select persistence write policy.                                                                                                                         |

The positional alias `wp-typia <project-dir>` remains available only for
unambiguous create invocations with a single local project directory.

### External template cache

Remote template resolution keeps the existing timeout, size, and symlink guards.
After those guards pass, npm templates with registry `integrity` or `shasum`
metadata and GitHub templates with a resolvable remote revision are cached under
a private per-user local temp cache. Cache keys include the source locator plus
the resolved npm tarball integrity or GitHub revision so repeated scaffolds
reuse only the same source.

Set `WP_TYPIA_EXTERNAL_TEMPLATE_CACHE=0` to bypass the cache for a forced
refresh. Set `WP_TYPIA_EXTERNAL_TEMPLATE_CACHE_DIR=/path/to/cache` to place the
cache in a project- or CI-managed directory.

## `add`

Extend an official wp-typia workspace from the workspace root.

```bash
wp-typia add block <name> --template basic
wp-typia add variation <name> --block <block-slug>
wp-typia add style <name> --block <block-slug>
wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>
wp-typia add pattern <name>
wp-typia add binding-source <name>
wp-typia add binding-source <name> --block <block-slug|namespace/block-slug> --attribute <attribute>
wp-typia add rest-resource <name> --namespace <vendor/v1> --methods GET,POST
wp-typia add ability <name>
wp-typia add ai-feature <name> --namespace <vendor/v1>
wp-typia add editor-plugin <name> --slot sidebar
wp-typia add editor-plugin seo-notes --slot document-setting-panel
wp-typia add hooked-block <block-slug> --anchor core/post-content --position after
```

Common flags:

| Flag                                                             | Description                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--template <basic \| interactivity \| persistence \| compound>` | Built-in block family for `add block`.                                                                                          |
| `--dry-run`                                                      | Preview workspace file updates and completion guidance.                                                                         |
| `--block <block-slug>`                                           | Target block for variation, style, and binding-source workflows.                                                                |
| `--from <namespace/block>`                                       | Source block name for transform workflows.                                                                                      |
| `--to <block-slug \| namespace/block-slug>`                      | Target workspace block for transform workflows.                                                                                 |
| `--anchor <block-name>`                                          | Anchor block for hooked-block workflows.                                                                                        |
| `--position <before \| after \| firstChild \| lastChild>`        | Hook position for hooked blocks.                                                                                                |
| `--slot <sidebar \| document-setting-panel>`                     | Editor shell slot for editor-plugin scaffolds; legacy aliases `PluginSidebar` and `PluginDocumentSettingPanel` remain accepted. |
| `--namespace <vendor/v1>`                                        | REST namespace for REST resource and AI feature workflows.                                                                      |
| `--methods <method[,method...]>`                                 | REST methods for REST resource workflows.                                                                                       |
| `--external-layer-source <source>`                               | Compose an external layer package on top of a built-in block template.                                                          |
| `--external-layer-id <id>`                                       | Select a specific external layer.                                                                                               |
| `--inner-blocks-preset <id>`                                     | Select a compound `InnerBlocks` preset.                                                                                         |
| `--alternate-render-targets <list>`                              | Add alternate render targets for persistence-capable dynamic scaffolds.                                                         |
| `--data-storage <post-meta \| custom-table>`                     | Select persistence storage.                                                                                                     |
| `--persistence-policy <authenticated \| public>`                 | Select persistence write policy.                                                                                                |

Use variations when you want alternate inserter presets for the same block,
Block Styles when you want a named visual class for an existing block, transforms
when users should convert content from another block type into your block, and
patterns when you need a reusable PHP-registered content layout.

Editor plugin scaffolds are slot-aware. The default `sidebar` slot generates a
`PluginSidebar` shell with a matching more-menu entry, while
`document-setting-panel` generates a `PluginDocumentSettingPanel` surface inside
the document settings sidebar. Existing automation that still passes
`PluginSidebar` or `PluginDocumentSettingPanel` continues to resolve to the
matching canonical slot.

## `init`

Preview the minimum adoption plan for an existing project. The command is
read-only today.

```bash
wp-typia init [project-dir]
wp-typia init [project-dir] --format json
```

`init` reports dependency, script, generated artifact, and migration follow-up
steps for supported single-block and multi-block layouts.

## `sync`

Run the generated-project sync workflow from a scaffolded project or official
workspace root.

```bash
wp-typia sync
wp-typia sync --check
wp-typia sync --dry-run
wp-typia sync ai
```

| Flag            | Description                                             |
| --------------- | ------------------------------------------------------- |
| `--check`       | Check generated artifacts without writing changes.      |
| `--dry-run`     | Preview generated sync commands without executing them. |
| `--format json` | Emit structured sync completion output.                 |

`sync ai` runs the supported WordPress AI artifact target when the project
provides a compatible script.

## `doctor`

Run read-only diagnostics.

```bash
wp-typia doctor
wp-typia doctor --format json
wp-typia doctor --help
```

`doctor` always checks environment readiness. Official wp-typia workspace roots
also get inventory, source-tree drift, and shared convention checks. Use
`--format json` for CI, IDE, and wrapper integrations that need stable
machine-readable check results.

Workspace block diagnostics also include iframe/API v3 readiness rows. `WARN`
rows do not fail `doctor`; treat them as compatibility follow-up before relying
on iframe-enabled Post Editor or Site Editor rendering. The static checks cover
`block.json` `apiVersion`, block stylesheet registration, direct
`window`/`document`/`parent`/`top` DOM access in editor-facing sources, and
detectable missing `useBlockProps`/`useInnerBlocksProps` wrapper usage. JSON
output exposes stable check-level codes such as
`wp-typia.workspace.block.iframe.api-version`. See WordPress' [iframe editor
migration guide](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-api-versions/block-migration-for-iframe-editor-compatibility/)
for the platform rationale.

## `templates`

Inspect scaffold templates.

```bash
wp-typia templates list
wp-typia templates inspect basic
wp-typia templates inspect --id basic
```

| Flag                 | Description                          |
| -------------------- | ------------------------------------ |
| `--id <template-id>` | Template id for `templates inspect`. |
| `--format json`      | Emit structured template data.       |

## `migrate`

Run migration workflows for migration-capable projects.

```bash
wp-typia migrate init --current-migration-version v1
wp-typia migrate snapshot --migration-version v1
wp-typia migrate wizard
wp-typia migrate plan --from-migration-version v1
wp-typia migrate diff --from-migration-version v1
wp-typia migrate scaffold --from-migration-version v1
wp-typia migrate verify --all
wp-typia migrate doctor --all
wp-typia migrate fixtures --all --force
wp-typia migrate fuzz --all --iterations 25 --seed 1
```

Common flags:

| Flag                                  | Description                                                     |
| ------------------------------------- | --------------------------------------------------------------- |
| `--current-migration-version <label>` | Current migration version label for `migrate init`.             |
| `--migration-version <label>`         | Version label to capture with `migrate snapshot`.               |
| `--from-migration-version <label>`    | Source migration version label.                                 |
| `--to-migration-version <label>`      | Target migration version label.                                 |
| `--all`                               | Run across every configured migration version and block target. |
| `--force`                             | Force overwrite behavior where supported.                       |
| `--iterations <count>`                | Iteration count for `migrate fuzz`.                             |
| `--seed <value>`                      | Deterministic fuzz seed.                                        |

`migrate` is the canonical command. The older `migrations` alias is no longer
supported.

## Bun-powered utility commands

These commands require the Bun-powered runtime.

```bash
wp-typia mcp list
wp-typia mcp sync --output-dir .bunli/mcp
wp-typia skills list
wp-typia skills sync
wp-typia completions zsh
```

`mcp` reads configured `mcp.schemaSources` and can emit MCP metadata for
downstream tooling. `skills` and `completions` are provided by the Bunli plugin
surface.
