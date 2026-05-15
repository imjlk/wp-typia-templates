import path from "node:path";

import {
	getWorkspaceBootstrapPath,
	patchFile,
} from "./cli-add-shared.js";
import {
	appendPhpSnippetBeforeClosingTag,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";
import { hasPhpFunctionDefinition } from "./php-utils.js";
import type { WorkspaceProject } from "./workspace-project.js";

const REST_RESOURCE_SERVER_GLOB = "/inc/rest/*.php";
const REST_SCHEMA_HELPER_PATH = "/inc/rest-schema.php";

/**
 * Ensure the workspace bootstrap loads the shared REST schema helper file.
 *
 * @param workspace Resolved workspace project metadata and PHP prefix.
 * @returns A promise that resolves after the bootstrap is patched.
 * @throws When an existing loader does not reference `inc/rest-schema.php`.
 */
export async function ensureRestSchemaHelperBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const loadFunctionName = `${workspace.workspace.phpPrefix}_load_rest_schema_helpers`;
		const loadCall = `${loadFunctionName}();`;
		const helperFunction = `

function ${loadFunctionName}() {
\t$helper_path = __DIR__ . '${REST_SCHEMA_HELPER_PATH}';
\tif ( is_readable( $helper_path ) ) {
\t\trequire_once $helper_path;
\t}
}

${loadCall}
`;

		if (!hasPhpFunctionDefinition(nextSource, loadFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, helperFunction);
		} else if (!nextSource.includes(REST_SCHEMA_HELPER_PATH)) {
			throw new Error(
				[
					`Unable to patch ${path.basename(bootstrapPath)} in ensureRestSchemaHelperBootstrapAnchors.`,
					`The existing ${loadFunctionName}() definition does not include ${REST_SCHEMA_HELPER_PATH}.`,
					"Restore the generated bootstrap shape or load inc/rest-schema.php manually before retrying.",
				].join(" "),
			);
		} else if (!nextSource.includes(loadCall)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, loadCall);
		}

		return nextSource;
	});
}

/**
 * Ensure the workspace bootstrap loads generated REST resource PHP modules.
 *
 * @param workspace Resolved workspace project metadata and PHP prefix.
 * @returns A promise that resolves after the bootstrap is patched.
 * @throws When an existing loader does not reference generated REST modules.
 */
export async function ensureRestResourceBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const registerFunctionName = `${workspace.workspace.phpPrefix}_register_rest_resources`;
		const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
		const registerFunction = `

function ${registerFunctionName}() {
\tforeach ( glob( __DIR__ . '${REST_RESOURCE_SERVER_GLOB}' ) ?: array() as $rest_resource_module ) {
\t\trequire_once $rest_resource_module;
\t}
}
`;
		if (!hasPhpFunctionDefinition(nextSource, registerFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, registerFunction);
		} else if (!nextSource.includes(REST_RESOURCE_SERVER_GLOB)) {
			throw new Error(
				[
					`Unable to patch ${path.basename(bootstrapPath)} in ensureRestResourceBootstrapAnchors.`,
					`The existing ${registerFunctionName}() definition does not include ${REST_RESOURCE_SERVER_GLOB}.`,
					"Restore the generated bootstrap shape or wire the REST resource loader manually before retrying.",
				].join(" "),
			);
		}

		if (!nextSource.includes(registerHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, registerHook);
		}

		return nextSource;
	});
}
