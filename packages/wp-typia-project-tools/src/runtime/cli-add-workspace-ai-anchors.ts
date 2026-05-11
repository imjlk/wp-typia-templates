import { promises as fsp } from "node:fs";
import path from "node:path";

import { getPackageVersions } from "./package-versions.js";
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

const AI_FEATURE_SERVER_GLOB = "/inc/ai-features/*.php";

/**
 * Patch the workspace bootstrap file so it loads generated AI feature PHP modules.
 */
export async function ensureAiFeatureBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const registerFunctionName = `${workspace.workspace.phpPrefix}_register_ai_features`;
		const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
		const registerFunction = `

function ${registerFunctionName}() {
\tforeach ( glob( __DIR__ . '${AI_FEATURE_SERVER_GLOB}' ) ?: array() as $ai_feature_module ) {
\t\trequire_once $ai_feature_module;
\t}
}
`;
		if (!hasPhpFunctionDefinition(nextSource, registerFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, registerFunction);
		} else if (!nextSource.includes(AI_FEATURE_SERVER_GLOB)) {
			throw new Error(
				[
					`Unable to patch ${path.basename(bootstrapPath)} in ensureAiFeatureBootstrapAnchors.`,
					`The existing ${registerFunctionName}() definition does not include ${AI_FEATURE_SERVER_GLOB}.`,
					"Restore the generated bootstrap shape or wire the AI feature loader manually before retrying.",
				].join(" "),
			);
		}

		if (!nextSource.includes(registerHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, registerHook);
		}

		return nextSource;
	});
}

/**
 * Patch `package.json` with `sync-ai` plus the project-tools dependency used by generated AI sync scripts.
 */
export async function ensureAiFeaturePackageScripts(
	workspace: WorkspaceProject,
): Promise<{
	/** True when `@wp-typia/project-tools` was newly added to `devDependencies`. */
	addedProjectToolsDependency: boolean;
	/** True when the workspace did not already define a `sync-ai` script. */
	addedSyncAiScript: boolean;
}> {
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const packageJson = JSON.parse(
		await fsp.readFile(packageJsonPath, "utf8"),
	) as {
		devDependencies?: Record<string, string>;
		scripts?: Record<string, string>;
	};

	const nextScripts = {
		...(packageJson.scripts ?? {}),
		"sync-ai":
			packageJson.scripts?.["sync-ai"] ?? "tsx scripts/sync-ai-features.ts",
	};
	const nextDevDependencies = {
		...(packageJson.devDependencies ?? {}),
		"@wp-typia/project-tools":
			packageJson.devDependencies?.["@wp-typia/project-tools"] ??
			getPackageVersions().projectToolsPackageVersion,
	};
	const addedSyncAiScript = packageJson.scripts?.["sync-ai"] === undefined;
	const addedProjectToolsDependency =
		packageJson.devDependencies?.["@wp-typia/project-tools"] === undefined;

	if (
		JSON.stringify(nextScripts) === JSON.stringify(packageJson.scripts ?? {}) &&
		JSON.stringify(nextDevDependencies) ===
			JSON.stringify(packageJson.devDependencies ?? {})
	) {
		return {
			addedProjectToolsDependency: false,
			addedSyncAiScript: false,
		};
	}

	packageJson.scripts = nextScripts;
	packageJson.devDependencies = nextDevDependencies;
	await fsp.writeFile(
		packageJsonPath,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
		"utf8",
	);

	return {
		addedProjectToolsDependency,
		addedSyncAiScript,
	};
}

/**
 * Patch `scripts/sync-project.ts` after package scripts so generated workspaces invoke `sync-ai` when present.
 */
export async function ensureAiFeatureSyncProjectAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncProjectScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-project.ts",
	);

	await patchFile(syncProjectScriptPath, (source) => {
		let nextSource = source;
		const syncRestConst = "const syncRestScriptPath = path.join( 'scripts', 'sync-rest-contracts.ts' );";
		const syncAiConst = "const syncAiScriptPath = path.join( 'scripts', 'sync-ai-features.ts' );";
		const syncRestBlockPattern =
			/if \( fs\.existsSync\( path\.resolve\( process\.cwd\(\), syncRestScriptPath \) \) \) \{\n\s*runSyncScript\( syncRestScriptPath, options \);\n\s*\}/u;
		const syncAiBlock = [
			"if ( fs.existsSync( path.resolve( process.cwd(), syncAiScriptPath ) ) ) {",
			"\trunSyncScript( syncAiScriptPath, options );",
			"}",
		].join("\n");

		if (!nextSource.includes(syncAiConst)) {
			if (!nextSource.includes(syncRestConst)) {
				throw new Error(
					[
						`ensureAiFeatureSyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest script constant in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-ai manually before retrying.",
					].join(" "),
				);
			}
			nextSource = nextSource.replace(
				syncRestConst,
				`${syncRestConst}\n${syncAiConst}`,
			);
		}

		if (!nextSource.includes("runSyncScript( syncAiScriptPath, options );")) {
			if (!syncRestBlockPattern.test(nextSource)) {
				throw new Error(
					[
						`ensureAiFeatureSyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest invocation block in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-ai manually before retrying.",
					].join(" "),
				);
			}

			nextSource = nextSource.replace(
				syncRestBlockPattern,
				(match) => `${match}\n\n${syncAiBlock}`,
			);
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
				`ensureAiFeatureSyncRestAnchors could not patch ${path.basename(syncRestScriptPath)}.`,
				`Missing expected ${anchorDescription} anchor in scripts/sync-rest-contracts.ts.`,
				"Restore the generated template or add the AI feature wiring manually before retrying.",
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

function replaceBlockConfigImportForAiFeatures(
	nextSource: string,
	syncRestScriptPath: string,
): string {
	const importPatterns = [
		/^import\s*\{\n(?:\t[^\n]*\n)+\} from ["']\.\/block-config["'];?$/mu,
		/^import\s*\{[^\n]*\}\s*from\s*["']\.\/block-config["'];?$/mu,
	];
	const importMatch =
		importPatterns.map((pattern) => pattern.exec(nextSource)).find(Boolean) ??
		null;

	if (!importMatch) {
		throw new Error(
			[
				`ensureAiFeatureSyncRestAnchors could not patch ${path.basename(syncRestScriptPath)}.`,
				"Missing expected workspace inventory import anchor in scripts/sync-rest-contracts.ts.",
				"Restore the generated template or add the AI feature wiring manually before retrying.",
			].join(" "),
		);
	}

	const importSource = importMatch[0];
	if (
		importSource.includes("AI_FEATURES") &&
		importSource.includes("WorkspaceAiFeatureConfig")
	) {
		return nextSource;
	}

	const hasContracts = importSource.includes("CONTRACTS");
	const hasContractConfig = importSource.includes("WorkspaceContractConfig");
	const replacement = [
		"import {",
		"\tAI_FEATURES,",
		"\tBLOCKS,",
		...(hasContracts ? ["\tCONTRACTS,"] : []),
		"\tREST_RESOURCES,",
		"\ttype WorkspaceAiFeatureConfig,",
		"\ttype WorkspaceBlockConfig,",
		...(hasContractConfig ? ["\ttype WorkspaceContractConfig,"] : []),
		"\ttype WorkspaceRestResourceConfig,",
		"} from './block-config';",
	].join("\n");

	return nextSource.replace(importSource, replacement);
}

function replaceAiFeatureSyncSummaryCopy(
	nextSource: string,
	syncRestScriptPath: string,
): string {
	const standaloneSummary =
		"workspace blocks, standalone contracts, and plugin-level resources";
	const standaloneAiSummary =
		"workspace blocks, standalone contracts, plugin-level resources, and AI features";
	const restResourceSummary = "workspace blocks and plugin-level resources";
	const restResourceAiSummary =
		"workspace blocks, plugin-level resources, and AI features";

	if (nextSource.includes(standaloneSummary)) {
		return nextSource.split(standaloneSummary).join(standaloneAiSummary);
	}
	if (nextSource.includes(restResourceSummary)) {
		return nextSource.split(restResourceSummary).join(restResourceAiSummary);
	}
	if (
		nextSource.includes(standaloneAiSummary) ||
		nextSource.includes(restResourceAiSummary)
	) {
		return nextSource;
	}

	throw new Error(
		[
			`ensureAiFeatureSyncRestAnchors could not patch ${path.basename(syncRestScriptPath)}.`,
			"Missing expected sync summary copy anchor in scripts/sync-rest-contracts.ts.",
			"Restore the generated template or add the AI feature wiring manually before retrying.",
		].join(" "),
	);
}

/**
 * Patch `scripts/sync-rest-contracts.ts` after sync-project wiring so AI feature REST artifacts join the split sync flow.
 */
export async function ensureAiFeatureSyncRestAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncRestScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-rest-contracts.ts",
	);

	await patchFile(syncRestScriptPath, (source) => {
		let nextSource = replaceBlockConfigImportForAiFeatures(
			source,
			syncRestScriptPath,
		);
		const helperInsertionAnchor = "async function assertTypeArtifactsCurrent";
		const restResourcesAnchor =
			"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );";
		const consoleLogPattern = /\n\tconsole\.log\(\n\t\toptions\.check/u;

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"function isWorkspaceAiFeature(",
			helperInsertionAnchor,
			[
				"function isWorkspaceAiFeature(",
				"\tfeature: WorkspaceAiFeatureConfig",
				"): feature is WorkspaceAiFeatureConfig & {",
				"\taiSchemaFile: string;",
				"\tclientFile: string;",
				"\topenApiFile: string;",
				"\trestManifest: NonNullable< WorkspaceAiFeatureConfig[ 'restManifest' ] >;",
				"\ttypesFile: string;",
				"\tvalidatorsFile: string;",
				"} {",
				"\treturn (",
				"\t\ttypeof feature.aiSchemaFile === 'string' &&",
				"\t\ttypeof feature.clientFile === 'string' &&",
				"\t\ttypeof feature.openApiFile === 'string' &&",
				"\t\ttypeof feature.typesFile === 'string' &&",
				"\t\ttypeof feature.validatorsFile === 'string' &&",
				"\t\ttypeof feature.restManifest === 'object' &&",
				"\t\tfeature.restManifest !== null",
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
			"const aiFeatures = AI_FEATURES.filter( isWorkspaceAiFeature );",
			restResourcesAnchor,
			[
				"const restResources = REST_RESOURCES.filter( isWorkspaceRestResource );",
				"const aiFeatures = AI_FEATURES.filter( isWorkspaceAiFeature );",
			].join("\n"),
			"rest resource filter",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"aiFeatures.length === 0",
			nextSource.includes("const standaloneContracts = CONTRACTS.filter")
				? /if \(\s*restBlocks\.length === 0 &&\s*standaloneContracts\.length === 0 &&\s*restResources\.length === 0\s*\) \{[\s\S]*?\n\t\treturn;\n\t\}/u
				: /if \( restBlocks.length === 0 && restResources.length === 0 \) \{[\s\S]*?\n\t\treturn;\n\t\}/u,
			nextSource.includes("const standaloneContracts = CONTRACTS.filter")
				? [
						"if (",
						"\t\trestBlocks.length === 0 &&",
						"\t\tstandaloneContracts.length === 0 &&",
						"\t\trestResources.length === 0 &&",
						"\t\taiFeatures.length === 0",
						"\t) {",
						"\t\tconsole.log(",
						"\t\t\toptions.check",
						"\t\t\t\t? 'ℹ️ No REST-enabled workspace blocks, standalone contracts, plugin-level REST resources, or AI features are registered yet. `sync-rest --check` is already clean.'",
						"\t\t\t\t: 'ℹ️ No REST-enabled workspace blocks, standalone contracts, plugin-level REST resources, or AI features are registered yet.'",
						"\t\t);",
						"\t\treturn;",
						"\t}",
					].join("\n")
				: [
						"if ( restBlocks.length === 0 && restResources.length === 0 && aiFeatures.length === 0 ) {",
						"\t\tconsole.log(",
						"\t\t\toptions.check",
						"\t\t\t\t? 'ℹ️ No REST-enabled workspace blocks, plugin-level REST resources, or AI features are registered yet. `sync-rest --check` is already clean.'",
						"\t\t\t\t: 'ℹ️ No REST-enabled workspace blocks, plugin-level REST resources, or AI features are registered yet.'",
						"\t\t);",
						"\t\treturn;",
						"\t}",
					].join("\n"),
			"no-resources guard",
			syncRestScriptPath,
		);

		nextSource = replaceRequiredSyncRestSource(
			nextSource,
			"for ( const feature of aiFeatures ) {",
			consoleLogPattern,
			[
				"",
				"\tfor ( const feature of aiFeatures ) {",
				"\t\tconst contracts = feature.restManifest.contracts;",
				"",
				"\t\tfor ( const [ baseName, contract ] of Object.entries( contracts ) ) {",
				"\t\t\tawait syncTypeSchemas(",
				"\t\t\t\t{",
				"\t\t\t\t\tjsonSchemaFile: path.join(",
				"\t\t\t\t\t\tpath.dirname( feature.typesFile ),",
				"\t\t\t\t\t\t'api-schemas',",
				"\t\t\t\t\t\t`${ baseName }.schema.json`",
				"\t\t\t\t\t),",
				"\t\t\t\t\topenApiFile: path.join(",
				"\t\t\t\t\t\tpath.dirname( feature.typesFile ),",
				"\t\t\t\t\t\t'api-schemas',",
				"\t\t\t\t\t\t`${ baseName }.openapi.json`",
				"\t\t\t\t\t),",
				"\t\t\t\t\tsourceTypeName: contract.sourceTypeName,",
				"\t\t\t\t\ttypesFile: feature.typesFile,",
				"\t\t\t\t},",
				"\t\t\t\t{",
				"\t\t\t\t\tcheck: options.check,",
				"\t\t\t\t}",
				"\t\t\t);",
				"\t\t}",
				"",
				"\t\tawait syncRestOpenApi(",
				"\t\t\t{",
				"\t\t\t\tmanifest: feature.restManifest,",
				"\t\t\t\topenApiFile: feature.openApiFile,",
				"\t\t\t\ttypesFile: feature.typesFile,",
				"\t\t\t},",
				"\t\t\t{",
				"\t\t\t\tcheck: options.check,",
				"\t\t\t}",
				"\t\t);",
				"",
				"\t\tawait syncEndpointClient(",
				"\t\t\t{",
				"\t\t\t\tclientFile: feature.clientFile,",
				"\t\t\t\tmanifest: feature.restManifest,",
				"\t\t\t\ttypesFile: feature.typesFile,",
				"\t\t\t\tvalidatorsFile: feature.validatorsFile,",
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
			"final sync summary",
			syncRestScriptPath,
		);

		nextSource = replaceAiFeatureSyncSummaryCopy(
			nextSource,
			syncRestScriptPath,
		);

		return nextSource;
	});
}
