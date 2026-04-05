import { PACKAGE_MANAGER_IDS } from "./package-managers.js";
import { TEMPLATE_IDS } from "./template-registry.js";

export function formatHelpText(): string {
	return `Usage:
  wp-typia <project-dir> [--template <basic|interactivity>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template <./path|github:owner/repo/path[#ref]>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template <npm-package>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template persistence] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template compound] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia templates list
  wp-typia templates inspect <id>
  wp-typia migrations <init|snapshot|diff|scaffold|verify|doctor|fixtures|fuzz> [...]
  wp-typia doctor

Built-in templates: ${TEMPLATE_IDS.join(", ")}
Package managers: ${PACKAGE_MANAGER_IDS.join(", ")}`;
}
