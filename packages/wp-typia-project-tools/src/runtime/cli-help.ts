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
  wp-typia create <project-dir> [--template <basic|interactivity>] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template query-loop] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--query-post-type <post-type>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template <./path|github:owner/repo/path[#ref]>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template <npm-package>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template persistence] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia create <project-dir> [--template compound] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--dry-run] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [create flags...]
  wp-typia init [project-dir]
  wp-typia add block <name> --template <basic|interactivity|persistence|compound> [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>]
  wp-typia add variation <name> --block <block-slug>
  wp-typia add pattern <name>
  wp-typia add binding-source <name>
  wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <method[,method...]>]
  wp-typia add ability <name>
  wp-typia add ai-feature <name> [--namespace <vendor/v1>]
  wp-typia add editor-plugin <name> [--slot <PluginSidebar>]
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
Output environment:
  WP_TYPIA_ASCII=1 forces ASCII status markers; WP_TYPIA_ASCII=0 opts back into Unicode markers even when NO_COLOR is set.
  NO_COLOR requests ASCII-safe markers such as [ok], [dry-run], [!], and [...] when WP_TYPIA_ASCII is not set.
Notes:
  \`wp-typia create\` is the canonical scaffold command.
  \`wp-typia <project-dir>\` remains a backward-compatible alias to \`create\` when \`<project-dir>\` is the only positional argument.
  \`wp-typia init\` is a preview-only retrofit planner for existing projects. It does not write files yet.
  Use \`--template workspace\` as shorthand for \`@wp-typia/create-workspace-template\`, the official empty workspace scaffold behind \`wp-typia add ...\`.
  \`query-loop\` is create-only. Use \`wp-typia create <project-dir> --template query-loop\`; \`wp-typia add block\` accepts only basic, interactivity, persistence, and compound families.
  \`add variation\` uses an existing workspace block from \`scripts/block-config.ts\`.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`.
  \`add rest-resource\` scaffolds plugin-level TypeScript REST contracts under \`src/rest/\` and PHP route glue under \`inc/rest/\`.
  \`add ability\` scaffolds typed workflow abilities under \`src/abilities/\` and server registration under \`inc/abilities/\`.
  \`add ai-feature\` scaffolds server-owned AI feature endpoints under \`src/ai-features/\` and PHP route glue under \`inc/ai-features/\`.
  \`add editor-plugin\` scaffolds a document-level editor extension under \`src/editor-plugins/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.
  \`wp-typia doctor\` always checks environment readiness and reports when it only ran environment-level diagnostics; official workspace roots also get inventory and source-tree drift checks.
  \`wp-typia init\` previews the minimum sync/doctor/migration adoption layer for supported existing layouts before a future write mode exists.
  \`wp-typia migrate doctor --all\` checks migration target alignment, snapshots, fixtures, and generated migration artifacts.
  \`migrate\` is the canonical migration command; \`migrations\` is no longer supported.`;
}
