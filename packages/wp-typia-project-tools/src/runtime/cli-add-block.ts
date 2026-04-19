import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	syncBlockMetadata,
} from "@wp-typia/block-runtime/metadata-core";

import {
	ensureMigrationDirectories,
	parseMigrationConfig,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import {
	syncPersistenceRestArtifacts,
} from "./persistence-rest-artifacts.js";
import { snapshotProjectVersion } from "./migrations.js";
import { getDefaultAnswers, scaffoldProject } from "./scaffold.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import {
	copyInterpolatedDirectory,
	listInterpolatedDirectoryOutputs,
} from "./template-render.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import {
	appendWorkspaceInventoryEntries,
} from "./workspace-inventory.js";
import {
	resolveWorkspaceProject,
} from "./workspace-project.js";
import {
	ADD_BLOCK_TEMPLATE_IDS,
	type AddBlockTemplateId,
	buildWorkspacePhpPrefix,
	isAddBlockTemplateId,
	normalizeBlockSlug,
	patchFile,
	readOptionalFile,
	type RunAddBlockCommandOptions,
	rollbackWorkspaceMutation,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	buildConfigEntries,
	buildMigrationBlocks,
	buildServerTemplateRoot,
} from "./cli-add-block-config.js";
import {
	COMPOUND_SHARED_SUPPORT_FILES,
	collectLegacyCompoundValidatorPaths,
	ensureBlockConfigCanAddRestManifests,
	ensureCompoundWorkspaceSupportFiles,
} from "./cli-add-block-legacy-validator.js";
import {
	parseTemplateLocator,
	resolveTemplateSeed,
} from "./template-source.js";
import {
	resolveExternalTemplateLayers,
} from "./template-layers.js";
import {
	formatInstallCommand,
} from "./package-managers.js";
import {
	resolveOptionalInteractiveExternalLayerId,
} from "./external-layer-selection.js";

const COLLECTION_IMPORT_LINE = "import '../../collection';";
const WORKSPACE_INSTALL_MARKERS = ["node_modules", ".pnp.cjs", ".pnp.loader.mjs"] as const;

async function ensureCollectionImport(filePath: string): Promise<void> {
	await patchFile(filePath, (source) => {
		if (source.includes(COLLECTION_IMPORT_LINE)) {
			return source;
		}
		if (source.includes("import metadata from './block-metadata';")) {
			return source.replace(
				"import metadata from './block-metadata';",
				`${COLLECTION_IMPORT_LINE}\nimport metadata from './block-metadata';`,
			);
		}
		if (source.includes("import metadata from './block.json';")) {
			return source.replace(
				"import metadata from './block.json';",
				`${COLLECTION_IMPORT_LINE}\nimport metadata from './block.json';`,
			);
		}
		return `${COLLECTION_IMPORT_LINE}\n${source}`;
	});
}

async function copyTempDirectory(sourceDir: string, targetDir: string): Promise<void> {
	await fsp.mkdir(path.dirname(targetDir), { recursive: true });
	await fsp.cp(sourceDir, targetDir, { recursive: true });
}

async function addCollectionImportsForTemplate(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	if (templateId === "compound") {
		await ensureCollectionImport(
			path.join(projectDir, "src", "blocks", variables.slugKebabCase, "index.tsx"),
		);
		await ensureCollectionImport(
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`, "index.tsx"),
		);
		return;
	}

	await ensureCollectionImport(
		path.join(projectDir, "src", "blocks", variables.slugKebabCase, "index.tsx"),
	);
}

async function appendBlockConfigEntries(
	projectDir: string,
	entries: string[],
	needsRestManifestImport: boolean,
): Promise<void> {
	await appendWorkspaceInventoryEntries(projectDir, {
		blockEntries: entries,
		transformSource: needsRestManifestImport ? ensureBlockConfigCanAddRestManifests : undefined,
	});
}

async function renderWorkspacePersistenceServerModule(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const targetDir = path.join(projectDir, "src", "blocks", variables.slugKebabCase);
	const templateDir = buildServerTemplateRoot(variables.persistencePolicy);
	await copyInterpolatedDirectory(templateDir, targetDir, variables);
}

function normalizeExternalLayerOption(value?: string): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function resolveExternalLayerSourceFromCaller(
	source: string | undefined,
	callerCwd: string,
): string | undefined {
	if (
		typeof source !== "string" ||
		source.length === 0 ||
		!(path.isAbsolute(source) || source.startsWith("./") || source.startsWith("../"))
	) {
		return source;
	}

	return path.resolve(callerCwd, source);
}

function hasInstalledWorkspaceDependencies(projectDir: string): boolean {
	return WORKSPACE_INSTALL_MARKERS.some((marker) =>
		fs.existsSync(path.join(projectDir, marker)),
	);
}

function assertWorkspaceDependenciesInstalled(workspace: {
	packageManager: "bun" | "npm" | "pnpm" | "yarn";
	projectDir: string;
}): void {
	if (hasInstalledWorkspaceDependencies(workspace.projectDir)) {
		return;
	}

	throw new Error(
		`Workspace dependencies have not been installed yet. Run \`${formatInstallCommand(workspace.packageManager)}\` from the workspace root before using \`wp-typia add block ...\`.`,
	);
}


async function copyScaffoldedBlockSlice(
	projectDir: string,
	templateId: AddBlockTemplateId,
	tempProjectDir: string,
	variables: ScaffoldTemplateVariables,
	legacyValidatorPaths: readonly string[] = [],
): Promise<void> {
	if (templateId === "compound") {
		await ensureCompoundWorkspaceSupportFiles(
			projectDir,
			tempProjectDir,
			legacyValidatorPaths,
		);
		await copyTempDirectory(
			path.join(tempProjectDir, "src", "blocks", variables.slugKebabCase),
			path.join(projectDir, "src", "blocks", variables.slugKebabCase),
		);
		await copyTempDirectory(
			path.join(tempProjectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
		);
		if (variables.compoundPersistenceEnabled === "true") {
			await renderWorkspacePersistenceServerModule(projectDir, variables);
		}
		return;
	}

	await copyTempDirectory(
		path.join(tempProjectDir, "src"),
		path.join(projectDir, "src", "blocks", variables.slugKebabCase),
	);

	if (templateId === "persistence") {
		await renderWorkspacePersistenceServerModule(projectDir, variables);
	}
}

function isSupportedAddBlockLayerOutput(options: {
	relativePath: string;
	templateId: AddBlockTemplateId;
	variables: ScaffoldTemplateVariables;
}): boolean {
	const { relativePath, templateId, variables } = options;
	if (templateId === "compound") {
		return (
			relativePath === "src/hooks.ts" ||
			relativePath === "src/validator-toolkit.ts" ||
			relativePath.startsWith(`src/blocks/${variables.slugKebabCase}/`) ||
			relativePath.startsWith(`src/blocks/${variables.slugKebabCase}-item/`)
		);
	}

	return relativePath.startsWith("src/");
}

async function assertAddBlockSupportsExternalLayerOutputs(options: {
	callerCwd: string;
	externalLayerId?: string;
	externalLayerSource?: string;
	templateId: AddBlockTemplateId;
	variables: ScaffoldTemplateVariables;
}): Promise<void> {
	const {
		callerCwd,
		externalLayerId,
		externalLayerSource,
		templateId,
		variables,
	} = options;
	if (!externalLayerSource) {
		return;
	}

	const layerSeed = await resolveTemplateSeed(
		parseTemplateLocator(externalLayerSource),
		callerCwd,
	);
	try {
		const resolvedLayers = await resolveExternalTemplateLayers({
			externalLayerId,
			sourceRoot: layerSeed.rootDir,
		});

		for (const entry of resolvedLayers.entries) {
			if (entry.kind !== "external") {
				continue;
			}

			for (const relativePath of await listInterpolatedDirectoryOutputs(
				entry.dir,
				variables,
			)) {
				if (
					isSupportedAddBlockLayerOutput({
						relativePath,
						templateId,
						variables,
					})
				) {
					continue;
				}

				throw new Error(
					`External layer "${entry.id}" writes workspace-level output "${relativePath}", which \`wp-typia add block\` cannot merge safely. Restrict the layer to block-local files or scaffold it through \`wp-typia create\` instead.`,
				);
			}
		}
	} finally {
		await layerSeed.cleanup?.();
	}
}

function collectWorkspaceBlockPaths(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): string[] {
	if (templateId === "compound") {
		return [
			path.join(projectDir, "src", "blocks", variables.slugKebabCase),
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
		];
	}

	return [path.join(projectDir, "src", "blocks", variables.slugKebabCase)];
}

function assertBlockTargetsDoNotExist(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): void {
	for (const targetPath of collectWorkspaceBlockPaths(projectDir, templateId, variables)) {
		if (fs.existsSync(targetPath)) {
			throw new Error(
				`A block already exists at ${path.relative(projectDir, targetPath)}. Choose a different name.`,
			);
		}
	}
}

async function updateWorkspaceMigrationConfigIfPresent(
	projectDir: string,
	newBlocks: MigrationBlockConfig[],
): Promise<void> {
	const configPath = path.join(projectDir, "src", "migrations", "config.ts");
	if (!fs.existsSync(configPath)) {
		return;
	}

	const configSource = await fsp.readFile(configPath, "utf8");
	const config = parseMigrationConfig(configSource);
	const existingBlocks = Array.isArray(config.blocks) ? config.blocks : [];
	const nextBlocks = [
		...existingBlocks,
		...newBlocks.filter(
			(block) => !existingBlocks.some((existing) => existing.key === block.key),
		),
	];

	writeMigrationConfig(projectDir, {
		...config,
		blocks: nextBlocks,
	});

	snapshotProjectVersion(projectDir, config.currentMigrationVersion, {
		skipConfigUpdate: true,
	});
}

async function syncWorkspaceBlockMetadata(
	projectDir: string,
	slug: string,
	sourceTypeName: string,
	typesFile: string,
): Promise<void> {
	await syncBlockMetadata(
		{
			blockJsonFile: path.join("src", "blocks", slug, "block.json"),
			jsonSchemaFile: path.join("src", "blocks", slug, "typia.schema.json"),
			manifestFile: path.join("src", "blocks", slug, "typia.manifest.json"),
			openApiFile: path.join("src", "blocks", slug, "typia.openapi.json"),
			projectRoot: projectDir,
			sourceTypeName,
			typesFile,
		},
	);
}

async function syncWorkspacePersistenceArtifacts(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	await syncPersistenceRestArtifacts({
		apiTypesFile: path.join("src", "blocks", variables.slugKebabCase, "api-types.ts"),
		outputDir: path.join("src", "blocks", variables.slugKebabCase),
		projectDir,
		variables,
	});
}

async function syncWorkspaceAddedBlockArtifacts(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	await syncWorkspaceBlockMetadata(
		projectDir,
		variables.slugKebabCase,
		`${variables.pascalCase}Attributes`,
		path.join("src", "blocks", variables.slugKebabCase, "types.ts"),
	);

	if (templateId === "compound") {
		await syncWorkspaceBlockMetadata(
			projectDir,
			`${variables.slugKebabCase}-item`,
			`${variables.pascalCase}ItemAttributes`,
			path.join("src", "blocks", `${variables.slugKebabCase}-item`, "types.ts"),
		);
	}

	if (
		templateId === "persistence" ||
		(templateId === "compound" && variables.compoundPersistenceEnabled === "true")
	) {
		await syncWorkspacePersistenceArtifacts(projectDir, variables);
	}
}

function assertPersistenceFlagsAllowed(
	templateId: AddBlockTemplateId,
	options: Pick<RunAddBlockCommandOptions, "dataStorageMode" | "persistencePolicy">,
): void {
	const hasPersistenceFlags =
		typeof options.dataStorageMode === "string" ||
		typeof options.persistencePolicy === "string";

	if (!hasPersistenceFlags) {
		return;
	}

	if (templateId === "persistence" || templateId === "compound") {
		if (
			typeof options.dataStorageMode === "string" &&
			options.dataStorageMode !== "custom-table" &&
			options.dataStorageMode !== "post-meta"
		) {
			throw new Error(
				`Unsupported data storage mode "${options.dataStorageMode}". Expected one of: post-meta, custom-table.`,
			);
		}
		if (
			typeof options.persistencePolicy === "string" &&
			options.persistencePolicy !== "authenticated" &&
			options.persistencePolicy !== "public"
		) {
			throw new Error(
				`Unsupported persistence policy "${options.persistencePolicy}". Expected one of: authenticated, public.`,
			);
		}
		return;
	}

	throw new Error(
		`--data-storage and --persistence-policy are supported only for \`wp-typia add block --template persistence\` or \`--template compound\`.`,
	);
}

/**
 * Seeds an empty official workspace migration project before any blocks are added.
 *
 * @param projectDir Absolute path to the workspace root that will own the
 * migration config and generated scaffold files.
 * @param currentMigrationVersion Initial migration label to record as the
 * current version in the seeded workspace.
 */
export async function seedWorkspaceMigrationProject(
	projectDir: string,
	currentMigrationVersion: string,
): Promise<void> {
	writeMigrationConfig(projectDir, {
		blocks: [],
		currentMigrationVersion,
		snapshotDir: "src/migrations/versions",
		supportedMigrationVersions: [currentMigrationVersion],
	});
	ensureMigrationDirectories(projectDir, []);
	writeInitialMigrationScaffold(projectDir, currentMigrationVersion, []);
}

/**
 * Adds one built-in block slice to an official workspace project.
 *
 * @param options Command options for the built-in workspace block scaffold flow.
 * @param options.blockName Human-entered block name that will be normalized
 * into the generated workspace block slug.
 * @param options.cwd Working directory used to resolve the nearest official
 * workspace. Defaults to `process.cwd()`.
 * @param options.dataStorageMode Optional storage mode for persistence-capable
 * templates.
 * @param options.persistencePolicy Optional persistence policy for
 * persistence-capable templates.
 * @param options.templateId Built-in block family to scaffold. Defaults to
 * `"basic"`.
 * @returns A promise that resolves with the created block slugs, the owning
 * project directory, and the resolved template id after workspace mutation
 * succeeds.
 * @throws {Error} When the template id is unknown, persistence flags are used
 * with unsupported templates, the command runs outside an official workspace,
 * or target block paths already exist.
 */
export async function runAddBlockCommand({
	blockName,
	cwd = process.cwd(),
	dataStorageMode,
	externalLayerId,
	externalLayerSource,
	persistencePolicy,
	selectExternalLayerId,
	templateId = "basic",
}: RunAddBlockCommandOptions): Promise<{
	blockSlugs: string[];
	projectDir: string;
	templateId: AddBlockTemplateId;
	warnings: string[];
}> {
	if (!isAddBlockTemplateId(templateId)) {
		throw new Error(
			`Unknown add-block template "${templateId}". Expected one of: ${ADD_BLOCK_TEMPLATE_IDS.join(", ")}`,
		);
	}
	const resolvedTemplateId = templateId;

	assertPersistenceFlagsAllowed(resolvedTemplateId, { dataStorageMode, persistencePolicy });

	const workspace = resolveWorkspaceProject(cwd);
	assertWorkspaceDependenciesInstalled(workspace);
	const normalizedExternalLayerId = normalizeExternalLayerOption(externalLayerId);
	const normalizedExternalLayerSource = resolveExternalLayerSourceFromCaller(
		normalizeExternalLayerOption(externalLayerSource),
		cwd,
	);
	const resolvedExternalLayerSelection =
		await resolveOptionalInteractiveExternalLayerId({
		callerCwd: cwd,
		externalLayerId: normalizedExternalLayerId,
		externalLayerSource: normalizedExternalLayerSource,
		selectExternalLayerId,
	});
	let tempRoot = "";

	try {
		const normalizedSlug = normalizeBlockSlug(blockName);
		if (!normalizedSlug) {
			throw new Error("Block name is required. Use `wp-typia add block <name> --template <family>`.");
		}

		const defaults = getDefaultAnswers(normalizedSlug, resolvedTemplateId);
		tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-add-block-"));
		const tempProjectDir = path.join(tempRoot, normalizedSlug);
		const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
		const migrationConfigPath = path.join(workspace.projectDir, "src", "migrations", "config.ts");
		const blockPhpPrefix = buildWorkspacePhpPrefix(
			workspace.workspace.phpPrefix,
			normalizedSlug,
		);
		const migrationConfigSource = await readOptionalFile(migrationConfigPath);
		const migrationConfig =
			migrationConfigSource === null ? null : parseMigrationConfig(migrationConfigSource);
		const compoundSupportPaths =
			resolvedTemplateId === "compound"
				? COMPOUND_SHARED_SUPPORT_FILES.map((fileName) =>
						path.join(workspace.projectDir, "src", fileName),
					)
				: [];
		const legacyCompoundValidatorPaths =
			resolvedTemplateId === "compound"
				? await collectLegacyCompoundValidatorPaths(workspace.projectDir)
				: [];
		const result = await (async () => {
			const scaffoldResult = await scaffoldProject({
				answers: {
					...defaults,
					author: workspace.author,
					namespace: workspace.workspace.namespace,
					phpPrefix: blockPhpPrefix,
					slug: normalizedSlug,
					textDomain: workspace.workspace.textDomain,
					title: defaults.title,
				},
				cwd: workspace.projectDir,
				dataStorageMode: dataStorageMode as "custom-table" | "post-meta" | undefined,
				externalLayerId:
					resolvedExternalLayerSelection.externalLayerId,
				externalLayerSource:
					resolvedExternalLayerSelection.externalLayerSource,
				externalLayerSourceLabel: normalizedExternalLayerSource,
				noInstall: true,
				packageManager: workspace.packageManager,
				persistencePolicy:
					persistencePolicy as "authenticated" | "public" | undefined,
				projectDir: tempProjectDir,
				templateId: resolvedTemplateId,
			});
			await assertAddBlockSupportsExternalLayerOutputs({
				callerCwd: cwd,
				externalLayerId:
					resolvedExternalLayerSelection.externalLayerId,
				externalLayerSource:
					resolvedExternalLayerSelection.externalLayerSource,
				templateId: resolvedTemplateId,
				variables: scaffoldResult.variables,
			});
			return scaffoldResult;
		})();
		assertBlockTargetsDoNotExist(workspace.projectDir, resolvedTemplateId, result.variables);
		const mutationSnapshot: WorkspaceMutationSnapshot = {
			fileSources: await snapshotWorkspaceFiles([
				blockConfigPath,
				migrationConfigPath,
				...compoundSupportPaths,
				...legacyCompoundValidatorPaths,
			]),
			snapshotDirs:
				migrationConfig === null
					? []
					: buildMigrationBlocks(resolvedTemplateId, result.variables).map((block) =>
						path.join(
							workspace.projectDir,
							...migrationConfig.snapshotDir.split("/"),
							migrationConfig.currentMigrationVersion,
							block.key,
						),
					),
			targetPaths: collectWorkspaceBlockPaths(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			),
		};

		try {
			await copyScaffoldedBlockSlice(
				workspace.projectDir,
				resolvedTemplateId,
				tempProjectDir,
				result.variables,
				legacyCompoundValidatorPaths,
			);
			await addCollectionImportsForTemplate(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			);
			await appendBlockConfigEntries(
				workspace.projectDir,
				buildConfigEntries(resolvedTemplateId, result.variables),
				resolvedTemplateId === "persistence" ||
					(resolvedTemplateId === "compound" &&
						result.variables.compoundPersistenceEnabled === "true"),
			);
			await syncWorkspaceAddedBlockArtifacts(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			);
			await updateWorkspaceMigrationConfigIfPresent(
				workspace.projectDir,
				buildMigrationBlocks(resolvedTemplateId, result.variables),
			);

			return {
				blockSlugs: collectWorkspaceBlockPaths(
					workspace.projectDir,
					resolvedTemplateId,
					result.variables,
				).map((targetPath) => path.basename(targetPath)),
				projectDir: workspace.projectDir,
				templateId: resolvedTemplateId,
				warnings: result.warnings,
			};
		} catch (error) {
			await rollbackWorkspaceMutation(mutationSnapshot);
			throw error;
		}
	} finally {
		await resolvedExternalLayerSelection.cleanup?.();
		if (tempRoot) {
			await fsp.rm(tempRoot, { force: true, recursive: true });
		}
	}
}
