import { promises as fsp } from "node:fs";
import path from "node:path";

import { syncTypeSchemas } from "@wp-typia/block-runtime/metadata-core";
import semver from "semver";

import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventoryAsync,
} from "./workspace-inventory.js";
import { pathExists, readOptionalUtf8File } from "./fs-async.js";
import { readJsonFile } from "./json-utils.js";
import {
	buildAbilityClientSource,
	buildAbilityConfigEntry,
	buildAbilityConfigSource,
	buildAbilityDataSource,
	buildAbilityPhpSource,
	buildAbilityRegistrySource,
	buildAbilitySyncScriptSource,
	buildAbilityTypesSource,
} from "./cli-add-workspace-ability-templates.js";
import {
	ABILITY_EDITOR_ASSET,
	ABILITY_EDITOR_SCRIPT,
	ABILITY_REGISTRY_END_MARKER,
	ABILITY_REGISTRY_START_MARKER,
	ABILITY_SERVER_GLOB,
	type ScaffoldAbilityWorkspaceOptions,
	WP_ABILITIES_SCRIPT_MODULE_ID,
	WP_CORE_ABILITIES_SCRIPT_MODULE_ID,
} from "./cli-add-workspace-ability-types.js";
import {
	getWorkspaceBootstrapPath,
	patchFile,
} from "./cli-add-shared.js";
import {
	appendPhpSnippetBeforeClosingTag,
	executeWorkspaceMutationPlan,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";
import {
	updatePluginHeaderCompatibility,
} from "./scaffold-compatibility.js";
import {
	DEFAULT_WORDPRESS_ABILITIES_VERSION,
	DEFAULT_WORDPRESS_CORE_ABILITIES_VERSION,
} from "./package-versions.js";
import {
	escapeRegex,
	findPhpFunctionRange,
	hasPhpFunctionCall,
	hasPhpFunctionDefinition,
	replacePhpFunctionDefinition,
} from "./php-utils.js";
import { toPascalCase } from "./string-case.js";
import type { WorkspaceProject } from "./workspace-project.js";

function resolveManagedDependencyVersion(
	existingVersion: string | undefined,
	requiredVersion: string,
): string {
	if (!existingVersion) {
		return requiredVersion;
	}

	const existingMinimum = semver.minVersion(existingVersion);
	const requiredMinimum = semver.minVersion(requiredVersion);
	if (!existingMinimum || !requiredMinimum) {
		return requiredVersion;
	}

	return semver.gte(existingMinimum, requiredMinimum)
		? existingVersion
		: requiredVersion;
}

async function resolveAbilityRegistryPath(projectDir: string): Promise<string> {
	const abilitiesDir = path.join(projectDir, "src", "abilities");
	for (const candidatePath of [
		path.join(abilitiesDir, "index.ts"),
		path.join(abilitiesDir, "index.js"),
	]) {
		if (await pathExists(candidatePath)) {
			return candidatePath;
		}
	}
	return path.join(abilitiesDir, "index.ts");
}

async function readAbilityRegistrySlugs(registryPath: string): Promise<string[]> {
	const source = await readOptionalUtf8File(registryPath);
	if (source === null) {
		return [];
	}

	return Array.from(
		source.matchAll(
			/^\s*export\s+\*\s+from\s+['"]\.\/([^/'"]+)\/client(?:\.[cm]?[jt]sx?)?['"];?\s*$/gmu,
		),
	).map((match) => match[1]);
}

async function writeAbilityRegistry(
	projectDir: string,
	abilitySlug: string,
): Promise<void> {
	const abilitiesDir = path.join(projectDir, "src", "abilities");
	const registryPath = await resolveAbilityRegistryPath(projectDir);
	await fsp.mkdir(abilitiesDir, { recursive: true });

	const existingAbilitySlugs = (
		await readWorkspaceInventoryAsync(projectDir)
	).abilities.map((entry) => entry.slug);
	const existingRegistrySlugs = await readAbilityRegistrySlugs(registryPath);
	const nextAbilitySlugs = Array.from(
		new Set([...existingAbilitySlugs, ...existingRegistrySlugs, abilitySlug]),
	).sort();
	const generatedSection = buildAbilityRegistrySource(nextAbilitySlugs);
	const existingSource = (await readOptionalUtf8File(registryPath)) ?? "";
	const generatedSectionPattern = new RegExp(
		`${escapeRegex(ABILITY_REGISTRY_START_MARKER)}[\\s\\S]*?${escapeRegex(ABILITY_REGISTRY_END_MARKER)}\\n?`,
		"u",
	);
	const nextSource = existingSource
		? generatedSectionPattern.test(existingSource)
			? existingSource.replace(generatedSectionPattern, generatedSection)
			: `${existingSource.trimEnd()}\n\n${generatedSection}`
		: generatedSection;
	await fsp.writeFile(registryPath, nextSource, "utf8");
}

async function ensureAbilityBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const workspaceBaseName =
			workspace.packageName.split("/").pop() ?? workspace.packageName;
		const loadFunctionName = `${workspace.workspace.phpPrefix}_load_workflow_abilities`;
		const enqueueFunctionName =
			`${workspace.workspace.phpPrefix}_enqueue_workflow_abilities`;
		const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
		const adminEnqueueHook = `add_action( 'admin_enqueue_scripts', '${enqueueFunctionName}' );`;
		const editorEnqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
		const loadFunction = `

function ${loadFunctionName}() {
\tforeach ( glob( __DIR__ . '${ABILITY_SERVER_GLOB}' ) ?: array() as $ability_module ) {
\t\trequire_once $ability_module;
\t}
}
`;
		const enqueueFunction = `

function ${enqueueFunctionName}() {
\tif ( ! class_exists( 'WP_Ability' ) ) {
\t\treturn;
\t}

\t$script_path = __DIR__ . '/${ABILITY_EDITOR_SCRIPT}';
\t$asset_path  = __DIR__ . '/${ABILITY_EDITOR_ASSET}';

\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\treturn;
\t}

\t$asset = require $asset_path;
\tif ( ! is_array( $asset ) ) {
\t\t$asset = array();
\t}

\t$dependencies = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] )
\t\t? $asset['dependencies']
\t\t: array();

\tforeach ( array( '${WP_CORE_ABILITIES_SCRIPT_MODULE_ID}', '${WP_ABILITIES_SCRIPT_MODULE_ID}' ) as $ability_dependency ) {
\t\t$has_dependency = false;
\t\tforeach ( $dependencies as $dependency ) {
\t\t\t$dependency_id = is_array( $dependency ) && isset( $dependency['id'] )
\t\t\t\t? $dependency['id']
\t\t\t\t: $dependency;
\t\t\tif ( $dependency_id === $ability_dependency ) {
\t\t\t\t$has_dependency = true;
\t\t\t\tbreak;
\t\t\t}
\t\t}
\t\tif ( ! $has_dependency ) {
\t\t\t$dependencies[] = $ability_dependency;
\t\t}
\t}

\tif ( ! function_exists( 'wp_enqueue_script_module' ) ) {
\t\treturn;
\t}

\twp_enqueue_script_module(
\t\t'${workspaceBaseName}-abilities',
\t\tplugins_url( '${ABILITY_EDITOR_SCRIPT}', __FILE__ ),
\t\t$dependencies,
\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $script_path )
\t);
}
`;
		if (!hasPhpFunctionDefinition(nextSource, loadFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, loadFunction);
		}
		if (!hasPhpFunctionDefinition(nextSource, enqueueFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(
				nextSource,
				enqueueFunction,
			);
		} else {
			const functionRange = findPhpFunctionRange(nextSource, enqueueFunctionName);
			const functionSource = functionRange
				? nextSource.slice(functionRange.start, functionRange.end)
				: "";
			if (!hasPhpFunctionCall(functionSource, "wp_enqueue_script_module")) {
				const replacedSource = replacePhpFunctionDefinition(
					nextSource,
					enqueueFunctionName,
					enqueueFunction,
					{ trimReplacementStart: true },
				);
				if (!replacedSource) {
					throw new Error(
						`Unable to repair ${path.basename(bootstrapPath)} for ${enqueueFunctionName}.`,
					);
				}
				nextSource = replacedSource;
			}
		}

		if (!nextSource.includes(loadHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, loadHook);
		}
		if (!nextSource.includes(adminEnqueueHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, adminEnqueueHook);
		}
		if (!nextSource.includes(editorEnqueueHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, editorEnqueueHook);
		}

		return nextSource;
	});
}

async function ensureAbilityPackageScripts(
	workspace: WorkspaceProject,
): Promise<void> {
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const packageJson = await readJsonFile<{
		dependencies?: Record<string, string>;
		scripts?: Record<string, string>;
	}>(packageJsonPath, {
		context: "workspace package manifest",
	});

	const nextScripts = {
		...(packageJson.scripts ?? {}),
		"sync-abilities":
			packageJson.scripts?.["sync-abilities"] ?? "tsx scripts/sync-abilities.ts",
	};
	const nextDependencies = {
		...(packageJson.dependencies ?? {}),
		[WP_ABILITIES_SCRIPT_MODULE_ID]: resolveManagedDependencyVersion(
			packageJson.dependencies?.[WP_ABILITIES_SCRIPT_MODULE_ID],
			DEFAULT_WORDPRESS_ABILITIES_VERSION,
		),
		[WP_CORE_ABILITIES_SCRIPT_MODULE_ID]: resolveManagedDependencyVersion(
			packageJson.dependencies?.[WP_CORE_ABILITIES_SCRIPT_MODULE_ID],
			DEFAULT_WORDPRESS_CORE_ABILITIES_VERSION,
		),
	};

	if (
		JSON.stringify(nextScripts) === JSON.stringify(packageJson.scripts ?? {}) &&
		JSON.stringify(nextDependencies) === JSON.stringify(packageJson.dependencies ?? {})
	) {
		return;
	}

	packageJson.scripts = nextScripts;
	packageJson.dependencies = nextDependencies;
	await fsp.writeFile(
		packageJsonPath,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
		"utf8",
	);
}

async function ensureAbilitySyncProjectAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncProjectScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-project.ts",
	);

	await patchFile(syncProjectScriptPath, (source) => {
		let nextSource = source;
		const syncRestConst =
			"const syncRestScriptPath = path.join( 'scripts', 'sync-rest-contracts.ts' );";
		const syncAbilitiesConst =
			"const syncAbilitiesScriptPath = path.join( 'scripts', 'sync-abilities.ts' );";
		const syncRestBlockPattern =
			/if \( fs\.existsSync\( path\.resolve\( process\.cwd\(\), syncRestScriptPath \) \) \) \{\n\s*runSyncScript\( syncRestScriptPath, options \);\n\s*\}/u;
		const syncAbilitiesBlock = [
			"if ( fs.existsSync( path.resolve( process.cwd(), syncAbilitiesScriptPath ) ) ) {",
			"\trunSyncScript( syncAbilitiesScriptPath, options );",
			"}",
		].join("\n");

		if (!nextSource.includes(syncAbilitiesConst)) {
			if (!nextSource.includes(syncRestConst)) {
				throw new Error(
					[
						`ensureAbilitySyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest script constant in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-abilities manually before retrying.",
					].join(" "),
				);
			}
			nextSource = nextSource.replace(
				syncRestConst,
				`${syncRestConst}\n${syncAbilitiesConst}`,
			);
		}

		if (!nextSource.includes("runSyncScript( syncAbilitiesScriptPath, options );")) {
			if (!syncRestBlockPattern.test(nextSource)) {
				throw new Error(
					[
						`ensureAbilitySyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest invocation block in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-abilities manually before retrying.",
					].join(" "),
				);
			}

			nextSource = nextSource.replace(
				syncRestBlockPattern,
				(match) => `${match}\n\n${syncAbilitiesBlock}`,
			);
		}

		return nextSource;
	});
}

async function ensureAbilityBuildScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");

	await patchFile(buildScriptPath, (source) => {
		let nextSource = source;
		if (/['"]src\/abilities\/index\.(?:ts|js)['"]/u.test(nextSource)) {
			return nextSource;
		}

		const sharedEntriesPattern =
			/(for\s*\(\s*const\s+relativePath\s+of\s+\[)([\s\S]*?)(\]\s*\)\s*\{)/u;
		const match = nextSource.match(sharedEntriesPattern);
		if (
			!match ||
			!/['"]src\/bindings\/index\.(?:ts|js)['"]/u.test(match[2]) ||
			!/['"]src\/editor-plugins\/index\.(?:tsx|ts|js)['"]/u.test(match[2])
		) {
			throw new Error(
				[
					`ensureAbilityBuildScriptAnchors could not patch ${path.basename(buildScriptPath)}.`,
					"Missing the expected shared editor entries array in scripts/build-workspace.mjs.",
					"Restore the generated template or wire abilities/index manually before retrying.",
				].join(" "),
			);
		}

		nextSource = nextSource.replace(sharedEntriesPattern, (fullMatch, sharedEntries) => {
			const missingAbilityEntries = [
				"'src/abilities/index.ts'",
				"'src/abilities/index.js'",
			].filter((entry) => !sharedEntries.includes(entry));
			if (missingAbilityEntries.length === 0) {
				return fullMatch;
			}

			const itemIndent = sharedEntries.match(/\n([ \t]*)['"]/u)?.[1] ?? "\t\t";
			const trimmedEntries = sharedEntries.replace(/\s*$/u, "");
			const trailingWhitespace = sharedEntries.slice(trimmedEntries.length);
			const separator = trimmedEntries.trimEnd().endsWith(",") ? "" : ",";
			const nextEntries =
				`${trimmedEntries}${separator}` +
				missingAbilityEntries.map((entry) => `\n${itemIndent}${entry},`).join("") +
				trailingWhitespace;

			return fullMatch.replace(sharedEntries, nextEntries);
		});

		return nextSource;
	});
}

async function ensureAbilityWebpackAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");

	await patchFile(webpackConfigPath, (source) => {
		if (/['"]abilities\/index['"]/u.test(source)) {
			return source;
		}

		const optionalModuleReturnPattern =
			/(function\s+getOptionalModuleEntries\s*\(\)\s*\{[\s\S]*?)(\n\treturn Object\.fromEntries\(\s*entries\s*\);\n\})/u;
		if (optionalModuleReturnPattern.test(source)) {
			return source.replace(
				optionalModuleReturnPattern,
				`$1

\tfor ( const [ entryName, candidates ] of [
\t\t[
\t\t\t'abilities/index',
\t\t\t[ 'src/abilities/index.ts', 'src/abilities/index.js' ],
\t\t],
\t] ) {
\t\tfor ( const relativePath of candidates ) {
\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );
\t\t\tif ( ! fs.existsSync( entryPath ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\tentries.push( [ entryName, entryPath ] );
\t\t\tbreak;
\t\t}
\t}$2`,
			);
		}

		const sharedEntriesPattern =
			/for\s*\(\s*const\s+\[\s*entryName\s*,\s*candidates\s*\]\s+of\s+\[([\s\S]*?)\]\s*\)\s*\{/u;
		const match = source.match(sharedEntriesPattern);
		if (
			!match ||
			!match[1].includes("bindings/index") ||
			!match[1].includes("editor-plugins/index")
		) {
			throw new Error(
				[
					`ensureAbilityWebpackAnchors could not patch ${path.basename(webpackConfigPath)}.`,
					"Missing the expected shared editor entries block in webpack.config.js.",
					"Restore the generated template or wire abilities/index manually before retrying.",
				].join(" "),
			);
		}

		return source.replace(sharedEntriesPattern, (fullMatch, sharedEntries) => {
			if (/['"]abilities\/index['"]/u.test(sharedEntries)) {
				return fullMatch;
			}

			const tupleIndent = sharedEntries.match(/\n([ \t]*)\[/u)?.[1] ?? "\t\t";
			const nestedIndent = `${tupleIndent}\t`;
			const trimmedEntries = sharedEntries.replace(/\s*$/u, "");
			const trailingWhitespace = sharedEntries.slice(trimmedEntries.length);
			const separator = trimmedEntries.trimEnd().endsWith(",") ? "" : ",";
			const abilityTuple = [
				`${tupleIndent}[`,
				`${nestedIndent}'abilities/index',`,
				`${nestedIndent}[ 'src/abilities/index.ts', 'src/abilities/index.js' ],`,
				`${tupleIndent}],`,
			].join("\n");
			const nextEntries =
				`${trimmedEntries}${separator}\n${abilityTuple}` + trailingWhitespace;

			return fullMatch.replace(sharedEntries, nextEntries);
		});
	});
}

/**
 * Write generated workflow ability sources and patch shared workspace anchors.
 */
export async function scaffoldAbilityWorkspace({
	abilitySlug,
	compatibilityPolicy,
	workspace,
}: ScaffoldAbilityWorkspaceOptions): Promise<{
	warnings: string[];
}> {
	const compatibilityWarnings: string[] = [];
	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const syncAbilitiesScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-abilities.ts",
	);
	const syncProjectScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-project.ts",
	);
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");
	const abilitiesIndexPath = await resolveAbilityRegistryPath(workspace.projectDir);
	const abilityDir = path.join(workspace.projectDir, "src", "abilities", abilitySlug);
	const configFilePath = path.join(abilityDir, "ability.config.json");
	const typesFilePath = path.join(abilityDir, "types.ts");
	const dataFilePath = path.join(abilityDir, "data.ts");
	const clientFilePath = path.join(abilityDir, "client.ts");
	const phpFilePath = path.join(
		workspace.projectDir,
		"inc",
		"abilities",
		`${abilitySlug}.php`,
	);
	await executeWorkspaceMutationPlan({
		filePaths: [
			blockConfigPath,
			bootstrapPath,
			buildScriptPath,
			packageJsonPath,
			syncAbilitiesScriptPath,
			syncProjectScriptPath,
			webpackConfigPath,
			abilitiesIndexPath,
		],
		targetPaths: [abilityDir, phpFilePath, syncAbilitiesScriptPath],
		run: async () => {
			await fsp.mkdir(abilityDir, { recursive: true });
			await fsp.mkdir(path.dirname(phpFilePath), { recursive: true });
			await ensureAbilityBootstrapAnchors(workspace);
			await patchFile(bootstrapPath, (source) =>
				updatePluginHeaderCompatibility(source, compatibilityPolicy, {
					onWarning: (warning) => {
						compatibilityWarnings.push(warning);
					},
				}),
			);
			await ensureAbilityPackageScripts(workspace);
			await ensureAbilitySyncProjectAnchors(workspace);
			await ensureAbilityBuildScriptAnchors(workspace);
			await ensureAbilityWebpackAnchors(workspace);
			await fsp.writeFile(syncAbilitiesScriptPath, buildAbilitySyncScriptSource(), "utf8");
			await fsp.writeFile(
				configFilePath,
				buildAbilityConfigSource(abilitySlug, workspace.workspace.namespace),
				"utf8",
			);
			await fsp.writeFile(typesFilePath, buildAbilityTypesSource(abilitySlug), "utf8");
			await fsp.writeFile(dataFilePath, buildAbilityDataSource(abilitySlug), "utf8");
			await fsp.writeFile(clientFilePath, buildAbilityClientSource(abilitySlug), "utf8");
			await fsp.writeFile(
				phpFilePath,
				buildAbilityPhpSource(abilitySlug, workspace),
				"utf8",
			);

			const pascalCase = toPascalCase(abilitySlug);
			await syncTypeSchemas({
				jsonSchemaFile: `src/abilities/${abilitySlug}/input.schema.json`,
				projectRoot: workspace.projectDir,
				sourceTypeName: `${pascalCase}AbilityInput`,
				typesFile: `src/abilities/${abilitySlug}/types.ts`,
			});
			await syncTypeSchemas({
				jsonSchemaFile: `src/abilities/${abilitySlug}/output.schema.json`,
				projectRoot: workspace.projectDir,
				sourceTypeName: `${pascalCase}AbilityOutput`,
				typesFile: `src/abilities/${abilitySlug}/types.ts`,
			});
			await writeAbilityRegistry(workspace.projectDir, abilitySlug);
			await appendWorkspaceInventoryEntries(workspace.projectDir, {
				abilityEntries: [
					buildAbilityConfigEntry(abilitySlug, compatibilityPolicy),
				],
			});
		},
	});

	return {
		warnings: compatibilityWarnings,
	};
}
