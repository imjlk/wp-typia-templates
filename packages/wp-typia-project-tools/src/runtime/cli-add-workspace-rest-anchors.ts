import path from "node:path";

import {
	getWorkspaceBootstrapPath,
	patchFile,
} from "./cli-add-shared.js";
import { hasPhpFunctionDefinition } from "./php-utils.js";
import type { WorkspaceProject } from "./workspace-project.js";

const REST_RESOURCE_SERVER_GLOB = "/inc/rest/*.php";

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
		const insertionAnchors = [
			/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
			/\?>\s*$/u,
		];
		const insertPhpSnippet = (snippet: string): void => {
			for (const anchor of insertionAnchors) {
				const candidate = nextSource.replace(anchor, (match) => `${snippet}\n${match}`);
				if (candidate !== nextSource) {
					nextSource = candidate;
					return;
				}
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};
		const appendPhpSnippet = (snippet: string): void => {
			const closingTagPattern = /\?>\s*$/u;
			if (closingTagPattern.test(nextSource)) {
				nextSource = nextSource.replace(closingTagPattern, `${snippet}\n?>`);
				return;
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};

		if (!hasPhpFunctionDefinition(nextSource, registerFunctionName)) {
			insertPhpSnippet(registerFunction);
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
			appendPhpSnippet(registerHook);
		}

		return nextSource;
	});
}

function assertSyncRestAnchor(
	nextSource: string,
	target: string,
	anchorDescription: string,
	hasAnchor: boolean,
	syncRestScriptPath: string,
): void {
	if (!nextSource.includes(target) && !hasAnchor) {
		throw new Error(
			[
				`ensureRestResourceSyncScriptAnchors could not patch ${path.basename(syncRestScriptPath)}.`,
				`Missing expected ${anchorDescription} anchor in scripts/sync-rest-contracts.ts.`,
				"Restore the generated template or add the REST_RESOURCES wiring manually before retrying.",
			].join(" "),
		);
	}
}

function replaceRequiredSyncRestSource(
	nextSource: string,
	target: string,
	anchor: string | RegExp,
	replacement: string,
	anchorDescription: string,
	syncRestScriptPath: string,
): string {
	if (nextSource.includes(target)) {
		return nextSource;
	}

	const hasAnchor =
		typeof anchor === "string" ? nextSource.includes(anchor) : anchor.test(nextSource);
	assertSyncRestAnchor(
		nextSource,
		target,
		anchorDescription,
		hasAnchor,
		syncRestScriptPath,
	);

	return nextSource.replace(anchor, replacement);
}

export async function ensureRestResourceSyncScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");

	await patchFile(syncRestScriptPath, (source) => {
		let nextSource = source;
		const importAnchor = "import { BLOCKS, type WorkspaceBlockConfig } from './block-config';";
		const helperInsertionAnchor = "async function assertTypeArtifactsCurrent";
		const restBlocksAnchor = "const restBlocks = BLOCKS.filter( isRestEnabledBlock );";
		const noResourcesPattern = /if \( restBlocks.length === 0 \) \{[\s\S]*?\n\t\treturn;\n\t\}/u;
		const consoleLogPattern = /\n\tconsole\.log\(\n\t\toptions\.check/u;

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"REST_RESOURCES",
			importAnchor,
			[
				"import {",
				"\tBLOCKS,",
				"\tREST_RESOURCES,",
				"\ttype WorkspaceBlockConfig,",
				"\ttype WorkspaceRestResourceConfig,",
				"} from './block-config';",
			].join("\n"),
			"BLOCKS import",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"function isWorkspaceRestResource(",
			helperInsertionAnchor,
			[
				"function isWorkspaceRestResource(",
				"\tresource: WorkspaceRestResourceConfig",
				"): resource is WorkspaceRestResourceConfig & {",
				"\tclientFile: string;",
				"\topenApiFile: string;",
				"\trestManifest: NonNullable< WorkspaceRestResourceConfig[ 'restManifest' ] >;",
				"\ttypesFile: string;",
				"\tvalidatorsFile: string;",
				"} {",
				"\treturn (",
				"\t\ttypeof resource.clientFile === 'string' &&",
				"\t\ttypeof resource.openApiFile === 'string' &&",
				"\t\ttypeof resource.typesFile === 'string' &&",
				"\t\ttypeof resource.validatorsFile === 'string' &&",
				"\t\ttypeof resource.restManifest === 'object' &&",
				"\t\tresource.restManifest !== null",
				"\t);",
				"}",
				"",
				"async function assertTypeArtifactsCurrent",
			].join("\n"),
			"type artifact assertion helper",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
			restBlocksAnchor,
			[
				"const restBlocks = BLOCKS.filter( isRestEnabledBlock );",
				"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
			].join("\n"),
			"restBlocks filter",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"restBlocks.length === 0 && restResources.length === 0",
			noResourcesPattern,
			[
				"if ( restBlocks.length === 0 && restResources.length === 0 ) {",
				"\t\tconsole.log(",
				"\t\t\toptions.check",
				"\t\t\t\t? 'ℹ️ No REST-enabled workspace blocks or plugin-level REST resources are registered yet. `sync-rest --check` is already clean.'",
				"\t\t\t\t: 'ℹ️ No REST-enabled workspace blocks or plugin-level REST resources are registered yet.'",
				"\t\t);",
				"\t\treturn;",
				"\t}",
			].join("\n"),
			"no-resources guard",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"for ( const resource of restResources ) {",
			consoleLogPattern,
			[
				"",
				"\tfor ( const resource of restResources ) {",
				"\t\tconst contracts = resource.restManifest.contracts;",
				"",
				"\t\tfor ( const [ baseName, contract ] of Object.entries( contracts ) ) {",
				"\t\t\tawait syncTypeSchemas(",
				"\t\t\t\t{",
				"\t\t\t\t\tjsonSchemaFile: path.join(",
				"\t\t\t\t\t\tpath.dirname( resource.typesFile ),",
				"\t\t\t\t\t\t'api-schemas',",
				"\t\t\t\t\t\t`${ baseName }.schema.json`",
				"\t\t\t\t\t),",
				"\t\t\t\t\topenApiFile: path.join(",
				"\t\t\t\t\t\tpath.dirname( resource.typesFile ),",
				"\t\t\t\t\t\t'api-schemas',",
				"\t\t\t\t\t\t`${ baseName }.openapi.json`",
				"\t\t\t\t\t),",
				"\t\t\t\t\tsourceTypeName: contract.sourceTypeName,",
				"\t\t\t\t\ttypesFile: resource.typesFile,",
				"\t\t\t\t},",
				"\t\t\t\t{",
				"\t\t\t\t\tcheck: options.check,",
				"\t\t\t\t}",
				"\t\t\t);",
				"\t\t}",
				"",
				"\t\tawait syncRestOpenApi(",
				"\t\t\t{",
				"\t\t\t\tmanifest: resource.restManifest,",
				"\t\t\t\topenApiFile: resource.openApiFile,",
				"\t\t\t\ttypesFile: resource.typesFile,",
				"\t\t\t},",
				"\t\t\t{",
				"\t\t\t\tcheck: options.check,",
				"\t\t\t}",
				"\t\t);",
				"",
				"\t\tawait syncEndpointClient(",
				"\t\t\t{",
				"\t\t\t\tclientFile: resource.clientFile,",
				"\t\t\t\tmanifest: resource.restManifest,",
				"\t\t\t\ttypesFile: resource.typesFile,",
				"\t\t\t\tvalidatorsFile: resource.validatorsFile,",
				"\t\t\t},",
				"\t\t\t{",
				"\t\t\t\tcheck: options.check,",
				"\t\t\t}",
				"\t\t);",
				"\t}",
				"",
				"\tconsole.log(",
				"\t\toptions.check",
			].join("\n"),
			"success log insertion point",
			syncRestScriptPath,
		);

		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date with the TypeScript types!",
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date for workspace blocks and plugin-level resources!",
		);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated from TypeScript types!",
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated for workspace blocks and plugin-level resources!",
		);

		return nextSource;
	});
}
