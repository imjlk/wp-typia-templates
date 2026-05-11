import {
	HOOKED_BLOCK_POSITION_IDS,
} from "./hooked-blocks.js";
import {
	ADD_BLOCK_TEMPLATE_IDS,
	EDITOR_PLUGIN_SLOT_IDS,
	REST_RESOURCE_METHOD_IDS,
} from "./cli-add-types.js";
import {
	WORKSPACE_TEMPLATE_PACKAGE,
} from "./workspace-project.js";

/**
 * Returns help text for the canonical `wp-typia add` subcommands.
 */
export function formatAddHelpText(): string {
	return `Usage:
  wp-typia add admin-view <name> [--source <rest-resource:slug|core-data:kind/name>] [--dry-run]
  wp-typia add block <name> [--template <${ADD_BLOCK_TEMPLATE_IDS.join("|")}>] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--dry-run]
  wp-typia add integration-env <name> [--wp-env] [--service <none|docker-compose>] [--dry-run]
  wp-typia add variation <name> --block <block-slug> [--dry-run]
  wp-typia add style <name> --block <block-slug> [--dry-run]
  wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug> [--dry-run]
  wp-typia add pattern <name> [--dry-run]
  wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--dry-run]
  wp-typia add contract <name> [--type <ExportedTypeName>] [--dry-run]
  wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <${REST_RESOURCE_METHOD_IDS.join(",")}>] [--route-pattern <route-pattern>] [--permission-callback <callback>] [--controller-class <ClassName>] [--controller-extends <BaseClass>] [--dry-run]
  wp-typia add rest-resource <name> --manual [--namespace <vendor/v1>] [--method <GET|POST|PUT|PATCH|DELETE>] [--auth <public|authenticated|public-write-protected>] [--path <route-pattern>] [--query-type <Type>] [--body-type <Type>] [--response-type <Type>] [--dry-run]
  wp-typia add ability <name> [--dry-run]
  wp-typia add ai-feature <name> [--namespace <vendor/v1>] [--dry-run]
  wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <${HOOKED_BLOCK_POSITION_IDS.join("|")}> [--dry-run]
  wp-typia add editor-plugin <name> [--slot <${EDITOR_PLUGIN_SLOT_IDS.join("|")}>] [--dry-run]

Notes:
  \`wp-typia add\` runs only inside official ${WORKSPACE_TEMPLATE_PACKAGE} workspaces scaffolded via \`wp-typia create <project-dir> --template workspace\`.
  Pass \`--dry-run\` to preview the workspace files that would change without writing them.
  Interactive add flows let you choose a template when \`--template\` is omitted; non-interactive runs default to \`basic\`.
  \`add admin-view\` scaffolds an opt-in DataViews-powered WordPress admin screen under \`src/admin-views/\`.
  Pass \`--source rest-resource:<slug>\` to reuse a list-capable REST resource.
  Pass \`--source core-data:postType/post\` or \`--source core-data:taxonomy/category\` to bind a WordPress-owned entity collection.
  Generated admin-view workspaces add \`@wp-typia/dataviews\` and the needed WordPress DataViews packages as opt-in dependencies.
  \`add integration-env\` generates an opt-in local smoke starter under \`scripts/integration-smoke/\`, updates \`.env.example\`, and can add \`@wordpress/env\` plus \`.wp-env.json\` when \`--wp-env\` is passed.
  Pass \`--service docker-compose\` to include a placeholder local service stack that can be adapted to project-specific dependencies.
  \`query-loop\` is a create-time scaffold family. Use \`wp-typia create <project-dir> --template query-loop\` instead of \`wp-typia add block\`.
  \`add variation\` targets an existing block slug from \`scripts/block-config.ts\`.
  \`add style\` registers a Block Styles option for an existing generated block.
  \`add transform\` adds a block-to-block transform into an existing generated block.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`; pass \`--block\` and \`--attribute\` together to declare an end-to-end bindable attribute on an existing generated block.
  \`add contract\` registers a standalone TypeScript wire contract under \`src/contracts/\` and generates a stable JSON Schema artifact without creating PHP route glue.
  \`add rest-resource\` scaffolds plugin-level TypeScript REST contracts under \`src/rest/\` and PHP route glue under \`inc/rest/\`. Use \`--route-pattern\`, \`--permission-callback\`, \`--controller-class\`, and \`--controller-extends\` when an existing WordPress controller or permission model needs to own part of the generated route surface.
  Pass \`--manual\` with \`add rest-resource\` to track an external REST route with typed schemas, OpenAPI, clients, and drift checks without generating PHP route/controller files.
  \`add ability\` scaffolds typed workflow abilities under \`src/abilities/\` and server registration under \`inc/abilities/\`.
  \`add ai-feature\` scaffolds server-owned AI feature endpoints under \`src/ai-features/\` and PHP route glue under \`inc/ai-features/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.
  \`add editor-plugin\` scaffolds a document-level editor extension under \`src/editor-plugins/\`; legacy aliases \`PluginSidebar\` and \`PluginDocumentSettingPanel\` resolve to \`sidebar\` and \`document-setting-panel\`.`;
}
