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

function getSyncRestPatchErrorMessage(
	functionName: string,
	syncRestScriptPath: string,
	anchorDescription: string,
	subject: string,
): string {
	return [
		`${functionName} could not patch ${path.basename(syncRestScriptPath)}.`,
		`Missing expected ${anchorDescription} anchor in scripts/sync-rest-contracts.ts.`,
		`Restore the generated template or add the ${subject} wiring manually before retrying.`,
	].join(" ");
}

const BLOCK_CONFIG_IMPORT_PATTERNS = [
	/^import\s*\{\n(?:\t[^\n]*\n)+\} from ["']\.\/block-config["'];?$/mu,
	/^import\s*\{[^\n]*\}\s*from\s*["']\.\/block-config["'];?$/mu,
] as const;

const BLOCK_CONFIG_VALUE_IMPORT_ORDER = [
	"AI_FEATURES",
	"BLOCKS",
	"CONTRACTS",
	"POST_META",
	"REST_RESOURCES",
] as const;

const BLOCK_CONFIG_TYPE_IMPORT_ORDER = [
	"WorkspaceAiFeatureConfig",
	"WorkspaceBlockConfig",
	"WorkspaceContractConfig",
	"WorkspacePostMetaConfig",
	"WorkspaceRestResourceConfig",
] as const;

function replaceBlockConfigImport({
	functionName,
	nextSource,
	subject,
	syncRestScriptPath,
}: {
	functionName: string;
	nextSource: string;
	subject: {
		configTypeName: string;
		constName: string;
	};
	syncRestScriptPath: string;
}): string {
	const importMatch =
		BLOCK_CONFIG_IMPORT_PATTERNS.map((pattern) => pattern.exec(nextSource)).find(
			Boolean,
		) ?? null;

	if (!importMatch) {
		throw new Error(
			getSyncRestPatchErrorMessage(
				functionName,
				syncRestScriptPath,
				"block-config import",
				subject.constName,
			),
		);
	}

	const importSource = importMatch[0];
	if (
		importSource.includes(subject.constName) &&
		importSource.includes(subject.configTypeName)
	) {
		return nextSource;
	}
	if (
		!importSource.includes("BLOCKS") ||
		!importSource.includes("WorkspaceBlockConfig")
	) {
		throw new Error(
			getSyncRestPatchErrorMessage(
				functionName,
				syncRestScriptPath,
				"BLOCKS import",
				subject.constName,
			),
		);
	}

	const replacement = [
		"import {",
		...BLOCK_CONFIG_VALUE_IMPORT_ORDER.flatMap((constName) =>
			constName === subject.constName || importSource.includes(constName)
				? [`\t${constName},`]
				: [],
		),
		...BLOCK_CONFIG_TYPE_IMPORT_ORDER.flatMap((configTypeName) =>
			configTypeName === subject.configTypeName ||
			importSource.includes(configTypeName)
				? [`\ttype ${configTypeName},`]
				: [],
		),
		"} from './block-config';",
	].join("\n");

	return nextSource.replace(importSource, replacement);
}

function replaceRequiredContractSyncRestSource(
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
	if (!hasAnchor) {
		throw new Error(
			getSyncRestPatchErrorMessage(
				"ensureContractSyncScriptAnchors",
				syncRestScriptPath,
				anchorDescription,
				"CONTRACTS",
			),
		);
	}

	return nextSource.replace(anchor, replacement);
}

function formatNoResourcesSubject(subjects: readonly string[]): string {
	if (subjects.length <= 2) {
		return subjects.join(" or ");
	}

	const lastSubject = subjects[subjects.length - 1];
	return `${subjects.slice(0, -1).join(", ")}, or ${lastSubject}`;
}

function buildNoResourcesGuard({
	subjects,
}: {
	subjects: readonly {
		condition: string;
		include: boolean;
		subject: string;
	}[];
}): string {
	const includedSubjects = subjects.filter((subject) => subject.include);
	const condition = includedSubjects.map(({ condition }, index) =>
		index === includedSubjects.length - 1 ? condition : `${condition} &&`,
	);
	const noResourcesSubject = formatNoResourcesSubject(
		includedSubjects.map(({ subject }) => subject),
	);

	return [
		"if (",
		...condition.map((line) => `\t\t${line}`),
		"\t) {",
		"\t\tconsole.log(",
		"\t\t\toptions.check",
		`\t\t\t\t? 'ℹ️ No ${noResourcesSubject} are registered yet. \`sync-rest --check\` is already clean.'`,
		`\t\t\t\t: 'ℹ️ No ${noResourcesSubject} are registered yet.'`,
		"\t\t);",
		"\t\treturn;",
		"\t}",
	].join("\n");
}

const NO_RESOURCES_GUARD_PATTERN =
	/if \(\s*restBlocks\.length === 0(?:\s*&&\s*standaloneContracts\.length === 0)?(?:\s*&&\s*postMetaContracts\.length === 0)?(?:\s*&&\s*restResources\.length === 0)?(?:\s*&&\s*aiFeatures\.length === 0)?\s*\) \{[\s\S]*?\n\t\treturn;\n\t\}/u;

function replaceNoResourcesGuard(
	nextSource: string,
	replacement: string,
	functionName: string,
	syncRestScriptPath: string,
	subject: string,
): string {
	if (!NO_RESOURCES_GUARD_PATTERN.test(nextSource)) {
		throw new Error(
			getSyncRestPatchErrorMessage(
				functionName,
				syncRestScriptPath,
				"no-resources guard",
				subject,
			),
		);
	}

	return nextSource.replace(NO_RESOURCES_GUARD_PATTERN, replacement);
}

function insertStandaloneContractFilter(nextSource: string, syncRestScriptPath: string): string {
	if (nextSource.includes("const standaloneContracts = CONTRACTS.filter")) {
		return nextSource;
	}

	const restResourcesFilter =
		"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );";
	if (nextSource.includes(restResourcesFilter)) {
		return nextSource.replace(
			restResourcesFilter,
			[
				"const standaloneContracts = CONTRACTS.filter( isWorkspaceStandaloneContract );",
				restResourcesFilter,
			].join("\n\t"),
		);
	}

	const restBlocksFilter = "const restBlocks = BLOCKS.filter( isRestEnabledBlock );";
	return replaceRequiredContractSyncRestSource(
		nextSource,
		"const standaloneContracts = CONTRACTS.filter",
		restBlocksFilter,
		[
			restBlocksFilter,
			"const standaloneContracts = CONTRACTS.filter( isWorkspaceStandaloneContract );",
		].join("\n\t"),
		"restBlocks filter",
		syncRestScriptPath,
	);
}

function insertStandaloneContractNoResourcesGuard(
	nextSource: string,
	syncRestScriptPath: string,
): string {
	const hasRestResources = nextSource.includes(
		"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
	);
	const hasAiFeatures = nextSource.includes(
		"const aiFeatures = AI_FEATURES.filter( isWorkspaceAiFeature );",
	);
	const hasPostMeta = nextSource.includes(
		"const postMetaContracts = POST_META.filter( isWorkspacePostMetaContract );",
	);

	return replaceNoResourcesGuard(
		nextSource,
		buildNoResourcesGuard({
			subjects: [
				{
					condition: "restBlocks.length === 0",
					include: true,
					subject: "REST-enabled workspace blocks",
				},
				{
					condition: "standaloneContracts.length === 0",
					include: true,
					subject: "standalone contracts",
				},
				{
					condition: "postMetaContracts.length === 0",
					include: hasPostMeta,
					subject: "post meta contracts",
				},
				{
					condition: "restResources.length === 0",
					include: hasRestResources,
					subject: "plugin-level REST resources",
				},
				{
					condition: "aiFeatures.length === 0",
					include: hasAiFeatures,
					subject: "AI features",
				},
			],
		}),
		"ensureContractSyncScriptAnchors",
		syncRestScriptPath,
		"CONTRACTS",
	);
}

function insertRestResourceNoResourcesGuard(
	nextSource: string,
	syncRestScriptPath: string,
): string {
	const hasStandaloneContracts = nextSource.includes(
		"const standaloneContracts = CONTRACTS.filter( isWorkspaceStandaloneContract );",
	);
	const hasAiFeatures = nextSource.includes(
		"const aiFeatures = AI_FEATURES.filter( isWorkspaceAiFeature );",
	);
	const hasPostMeta = nextSource.includes(
		"const postMetaContracts = POST_META.filter( isWorkspacePostMetaContract );",
	);

	return replaceNoResourcesGuard(
		nextSource,
		buildNoResourcesGuard({
			subjects: [
				{
					condition: "restBlocks.length === 0",
					include: true,
					subject: "REST-enabled workspace blocks",
				},
				{
					condition: "standaloneContracts.length === 0",
					include: hasStandaloneContracts,
					subject: "standalone contracts",
				},
				{
					condition: "postMetaContracts.length === 0",
					include: hasPostMeta,
					subject: "post meta contracts",
				},
				{
					condition: "restResources.length === 0",
					include: true,
					subject: "plugin-level REST resources",
				},
				{
					condition: "aiFeatures.length === 0",
					include: hasAiFeatures,
					subject: "AI features",
				},
			],
		}),
		"ensureRestResourceSyncScriptAnchors",
		syncRestScriptPath,
		"REST_RESOURCES",
	);
}

function insertStandaloneContractSyncLoop(
	nextSource: string,
	syncRestScriptPath: string,
): string {
	if (nextSource.includes("for ( const contract of standaloneContracts )")) {
		return nextSource;
	}

	const loopSource = [
		"\tfor ( const contract of standaloneContracts ) {",
		"\t\tawait syncTypeSchemas(",
		"\t\t\t{",
		"\t\t\t\tjsonSchemaFile: contract.schemaFile,",
		"\t\t\t\tsourceTypeName: contract.sourceTypeName,",
		"\t\t\t\ttypesFile: contract.typesFile,",
		"\t\t\t},",
		"\t\t\t{",
		"\t\t\t\tcheck: options.check,",
		"\t\t\t}",
		"\t\t);",
		"\t}",
	].join("\n");
	const resourceLoopAnchor = "\n\tfor ( const resource of restResources ) {";
	if (nextSource.includes(resourceLoopAnchor)) {
		return nextSource.replace(
			resourceLoopAnchor,
			`\n${loopSource}\n${resourceLoopAnchor}`,
		);
	}

	const consoleLogPattern = /\n\tconsole\.log\(\n\t\toptions\.check/u;
	return replaceRequiredContractSyncRestSource(
		nextSource,
		"for ( const contract of standaloneContracts )",
		consoleLogPattern,
		[
			"",
			loopSource,
			"",
			"\tconsole.log(",
			"\t\toptions.check",
		].join("\n"),
		"success log insertion point",
		syncRestScriptPath,
	);
}

export async function ensureContractSyncScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");

	await patchFile(syncRestScriptPath, (source) => {
		let nextSource = replaceBlockConfigImport({
			functionName: "ensureContractSyncScriptAnchors",
			nextSource: source,
			subject: {
				configTypeName: "WorkspaceContractConfig",
				constName: "CONTRACTS",
			},
			syncRestScriptPath,
		});
		const helperInsertionAnchor = "async function assertTypeArtifactsCurrent";

		nextSource = replaceRequiredContractSyncRestSource(
			nextSource,
			"function isWorkspaceStandaloneContract(",
			helperInsertionAnchor,
			[
				"function isWorkspaceStandaloneContract(",
				"\tcontract: WorkspaceContractConfig",
				"): contract is WorkspaceContractConfig & {",
				"\tschemaFile: string;",
				"\tsourceTypeName: string;",
				"\ttypesFile: string;",
				"} {",
				"\treturn (",
				"\t\ttypeof contract.schemaFile === 'string' &&",
				"\t\ttypeof contract.sourceTypeName === 'string' &&",
				"\t\ttypeof contract.typesFile === 'string'",
				"\t);",
				"}",
				"",
				"async function assertTypeArtifactsCurrent",
			].join("\n"),
			"type artifact assertion helper",
			syncRestScriptPath,
		);
		nextSource = insertStandaloneContractFilter(nextSource, syncRestScriptPath);
		nextSource = insertStandaloneContractNoResourcesGuard(
			nextSource,
			syncRestScriptPath,
		);
		nextSource = insertStandaloneContractSyncLoop(nextSource, syncRestScriptPath);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date for workspace blocks and plugin-level resources!",
			"✅ REST contract schemas, standalone schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date for workspace blocks, standalone contracts, and plugin-level resources!",
		);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated for workspace blocks and plugin-level resources!",
			"✅ REST contract schemas, standalone schemas, portable API clients, and endpoint-aware OpenAPI documents generated for workspace blocks, standalone contracts, and plugin-level resources!",
		);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date with the TypeScript types!",
			"✅ REST contract schemas, standalone schemas, portable API clients, and endpoint-aware OpenAPI documents are already up to date with the TypeScript types!",
		);
		nextSource = nextSource.replace(
			"✅ REST contract schemas, portable API clients, and endpoint-aware OpenAPI documents generated from TypeScript types!",
			"✅ REST contract schemas, standalone schemas, portable API clients, and endpoint-aware OpenAPI documents generated from TypeScript types!",
		);

		return nextSource;
	});
}

export async function ensureRestResourceSyncScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncRestScriptPath = path.join(workspace.projectDir, "scripts", "sync-rest-contracts.ts");

	await patchFile(syncRestScriptPath, (source) => {
		let nextSource = replaceBlockConfigImport({
			functionName: "ensureRestResourceSyncScriptAnchors",
			nextSource: source,
			subject: {
				configTypeName: "WorkspaceRestResourceConfig",
				constName: "REST_RESOURCES",
			},
			syncRestScriptPath,
		});
		const helperInsertionAnchor = "async function assertTypeArtifactsCurrent";
		const restBlocksAnchor = "const restBlocks = BLOCKS.filter( isRestEnabledBlock );";
		const consoleLogPattern = /\n\tconsole\.log\(\n\t\toptions\.check/u;

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

		nextSource = insertRestResourceNoResourcesGuard(
			nextSource,
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
