import { PACKAGE_MANAGER_IDS } from "./package-managers.js";
import { TEMPLATE_IDS } from "./template-registry.js";

/**
 * Return the canonical CLI usage text for `wp-typia`.
 *
 * The rendered help includes the current built-in template ids and supported
 * package manager ids from the runtime registry.
 *
 * @returns Human-readable help text for CLI usage output.
 */
export function formatHelpText(): string {
	return `Usage:
  wp-typia create <project-dir> [--template <basic|interactivity>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template <./path|github:owner/repo/path[#ref]>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template <npm-package>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template persistence] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template compound] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [create flags...]
  wp-typia add block <name> --template <basic|interactivity|persistence|compound> [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>]
  wp-typia add variation <name> --block <block-slug>
  wp-typia add pattern <name>
  wp-typia add binding-source <name>
  wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>
  wp-typia migrate <init|snapshot|diff|scaffold|verify|doctor|fixtures|fuzz> [...]
  wp-typia templates list
  wp-typia templates inspect <id>
  wp-typia doctor
  wp-typia mcp <list|sync>
  wp-typia skills <list|sync>
  wp-typia completions <bash|zsh|fish|powershell>

Built-in templates: ${TEMPLATE_IDS.join(", ")}
Package managers: ${PACKAGE_MANAGER_IDS.join(", ")}
Notes:
  \`wp-typia create\` is the canonical scaffold command.
  \`wp-typia <project-dir>\` remains a backward-compatible alias to \`create\`.
  Use \`--template @wp-typia/create-workspace-template\` for the official empty workspace scaffold behind \`wp-typia add ...\`.
  \`add variation\` uses an existing workspace block from \`scripts/block-config.ts\`.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.
  \`wp-typia doctor\` checks environment readiness plus workspace inventory and source-tree drift.
  \`wp-typia migrate doctor --all\` checks migration target alignment, snapshots, fixtures, and generated migration artifacts.
  \`migrate\` is the canonical migration command; \`migrations\` is no longer supported.`;
}
