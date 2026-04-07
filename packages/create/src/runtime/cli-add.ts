import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	defineEndpointManifest,
	syncBlockMetadata,
	syncEndpointClient,
	syncRestOpenApi,
	syncTypeSchemas,
} from "./metadata-core.js";

import {
	ensureMigrationDirectories,
	parseMigrationConfig,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import { snapshotProjectVersion } from "./migrations.js";
import { getDefaultAnswers, scaffoldProject } from "./scaffold.js";
import {
	SHARED_WORKSPACE_TEMPLATE_ROOT,
} from "./template-registry.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import {
	toKebabCase,
	toSnakeCase,
} from "./string-case.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import type { PackageManagerId } from "./package-managers.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";

/**
 * Supported top-level `wp-typia add` kinds exposed by the canonical CLI.
 */
export const ADD_KIND_IDS = ["block", "variation", "pattern"] as const;
export type AddKindId = (typeof ADD_KIND_IDS)[number];

/**
 * Supported built-in block families accepted by `wp-typia add block --template`.
 */
export const ADD_BLOCK_TEMPLATE_IDS = [
	"basic",
	"interactivity",
	"persistence",
	"compound",
] as const;
export type AddBlockTemplateId = (typeof ADD_BLOCK_TEMPLATE_IDS)[number];

const WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";
const BLOCK_CONFIG_ENTRY_MARKER = "\t// wp-typia add block entries";
const COLLECTION_IMPORT_LINE = "import '../../collection';";
const EMPTY_BLOCKS_ARRAY = `${BLOCK_CONFIG_ENTRY_MARKER}\n];`;

interface WorkspacePackageJson {
	author?: string;
	packageManager?: string;
	wpTypia?: {
		namespace?: string;
		phpPrefix?: string;
		projectType?: string;
		templatePackage?: string;
		textDomain?: string;
	};
}

interface WorkspaceProject {
	author: string;
	packageManager: PackageManagerId;
	projectDir: string;
	workspace: Required<NonNullable<WorkspacePackageJson["wpTypia"]>>;
}

interface RunAddBlockCommandOptions {
	blockName: string;
	cwd?: string;
	dataStorageMode?: string;
	persistencePolicy?: string;
	templateId?: string;
}

interface WorkspaceMutationSnapshot {
	blockConfigSource: string | null;
	migrationConfigSource: string | null;
	snapshotDirs: string[];
	targetPaths: string[];
}

function parsePackageManagerId(packageManagerField: string | undefined): PackageManagerId {
	const packageManagerId = packageManagerField?.split("@", 1)[0];
	switch (packageManagerId) {
		case "bun":
		case "npm":
		case "pnpm":
		case "yarn":
			return packageManagerId;
		default:
			return "bun";
	}
}

function normalizeBlockSlug(input: string): string {
	return toKebabCase(input);
}

function buildWorkspacePhpPrefix(workspacePhpPrefix: string, slug: string): string {
	return toSnakeCase(`${workspacePhpPrefix}_${slug}`);
}

function isAddBlockTemplateId(value: string): value is AddBlockTemplateId {
	return (ADD_BLOCK_TEMPLATE_IDS as readonly string[]).includes(value);
}

function quoteTsString(value: string): string {
	return JSON.stringify(value);
}

function buildServerTemplateRoot(persistencePolicy: string | undefined): string {
	return path.join(
		SHARED_WORKSPACE_TEMPLATE_ROOT,
		persistencePolicy === "public" ? "persistence-public" : "persistence-auth",
	);
}

function buildSingleBlockConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tslug: ${quoteTsString(variables.slugKebabCase)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}Attributes`)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildPersistenceBlockConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tapiTypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/api-types.ts`)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}Attributes`)},`,
		"\t\trestManifest: defineEndpointManifest( {",
		"\t\t\tcontracts: {",
		"\t\t\t\t'state-query': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}StateQuery`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'write-state-request': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}WriteStateRequest`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'state-response': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}StateResponse`)},`,
		"\t\t\t\t},",
		"\t\t\t},",
		"\t\t\tendpoints: [",
		"\t\t\t\t{",
		"\t\t\t\t\tauth: 'public',",
		"\t\t\t\t\tmethod: 'GET',",
		`\t\t\t\t\toperationId: ${quoteTsString(`get${variables.pascalCase}State`)},`,
		`\t\t\t\t\tpath: ${quoteTsString(`/${variables.namespace}/v1/${variables.slugKebabCase}/state`)},`,
		"\t\t\t\t\tqueryContract: 'state-query',",
		"\t\t\t\t\tresponseContract: 'state-response',",
		`\t\t\t\t\tsummary: 'Read the current persisted state.',`,
		`\t\t\t\t\ttags: [ ${quoteTsString(variables.title)} ],`,
		"\t\t\t\t},",
		"\t\t\t\t{",
		`\t\t\t\t\tauth: ${quoteTsString(variables.restWriteAuthIntent)},`,
		"\t\t\t\t\tbodyContract: 'write-state-request',",
		"\t\t\t\t\tmethod: 'POST',",
		`\t\t\t\t\toperationId: ${quoteTsString(`write${variables.pascalCase}State`)},`,
		`\t\t\t\t\tpath: ${quoteTsString(`/${variables.namespace}/v1/${variables.slugKebabCase}/state`)},`,
		"\t\t\t\t\tresponseContract: 'state-response',",
		`\t\t\t\t\tsummary: 'Write the current persisted state.',`,
		`\t\t\t\t\ttags: [ ${quoteTsString(variables.title)} ],`,
		"\t\t\t\t\twordpressAuth: {",
		`\t\t\t\t\t\tmechanism: ${quoteTsString(variables.restWriteAuthMechanism)},`,
		"\t\t\t\t\t},",
		"\t\t\t\t},",
		"\t\t\t],",
		"\t\t\tinfo: {",
		`\t\t\t\ttitle: ${quoteTsString(`${variables.title} REST API`)},`,
		"\t\t\t\tversion: '1.0.0',",
		"\t\t\t},",
		"\t\t} ),",
		`\t\topenApiFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/api.openapi.json`)},`,
		`\t\tslug: ${quoteTsString(variables.slugKebabCase)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildPersistenceEndpointManifest(variables: ScaffoldTemplateVariables) {
	return defineEndpointManifest({
		contracts: {
			"state-query": {
				sourceTypeName: `${variables.pascalCase}StateQuery`,
			},
			"write-state-request": {
				sourceTypeName: `${variables.pascalCase}WriteStateRequest`,
			},
			"state-response": {
				sourceTypeName: `${variables.pascalCase}StateResponse`,
			},
		},
		endpoints: [
			{
				auth: "public",
				method: "GET",
				operationId: `get${variables.pascalCase}State`,
				path: `/${variables.namespace}/v1/${variables.slugKebabCase}/state`,
				queryContract: "state-query",
				responseContract: "state-response",
				summary: "Read the current persisted state.",
				tags: [variables.title],
			},
			{
				auth: variables.restWriteAuthIntent,
				bodyContract: "write-state-request",
				method: "POST",
				operationId: `write${variables.pascalCase}State`,
				path: `/${variables.namespace}/v1/${variables.slugKebabCase}/state`,
				responseContract: "state-response",
				summary: "Write the current persisted state.",
				tags: [variables.title],
				wordpressAuth: {
					mechanism: variables.restWriteAuthMechanism,
				},
			},
		],
		info: {
			title: `${variables.title} REST API`,
			version: "1.0.0",
		},
	});
}

function buildCompoundChildConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tslug: ${quoteTsString(`${variables.slugKebabCase}-item`)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}ItemAttributes`)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}-item/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildConfigEntries(
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): string[] {
	if (templateId === "basic" || templateId === "interactivity") {
		return [buildSingleBlockConfigEntry(variables)];
	}

	if (templateId === "persistence") {
		return [buildPersistenceBlockConfigEntry(variables)];
	}

	if (variables.compoundPersistenceEnabled === "true") {
		return [
			buildPersistenceBlockConfigEntry(variables),
			buildCompoundChildConfigEntry(variables),
		];
	}

	return [
		buildSingleBlockConfigEntry(variables),
		buildCompoundChildConfigEntry(variables),
	];
}

function buildMigrationBlocks(
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): MigrationBlockConfig[] {
	if (templateId === "compound") {
		return [
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}`,
				key: variables.slugKebabCase,
				manifestFile: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}/types.ts`,
			},
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}-item/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}-item`,
				key: `${variables.slugKebabCase}-item`,
				manifestFile: `src/blocks/${variables.slugKebabCase}-item/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}-item/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}-item/types.ts`,
			},
		];
	}

	return [
		{
			blockJsonFile: `src/blocks/${variables.slugKebabCase}/block.json`,
			blockName: `${variables.namespace}/${variables.slugKebabCase}`,
			key: variables.slugKebabCase,
			manifestFile: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
			saveFile: `src/blocks/${variables.slugKebabCase}/save.tsx`,
			typesFile: `src/blocks/${variables.slugKebabCase}/types.ts`,
		},
	];
}

async function patchFile(
	filePath: string,
	transform: (source: string) => string,
): Promise<void> {
	const currentSource = await fsp.readFile(filePath, "utf8");
	const nextSource = transform(currentSource);
	if (nextSource !== currentSource) {
		await fsp.writeFile(filePath, nextSource, "utf8");
	}
}

async function readOptionalFile(filePath: string): Promise<string | null> {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	return fsp.readFile(filePath, "utf8");
}

async function restoreOptionalFile(filePath: string, source: string | null): Promise<void> {
	if (source === null) {
		await fsp.rm(filePath, { force: true });
		return;
	}

	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(filePath, source, "utf8");
}

async function ensureCollectionImport(filePath: string): Promise<void> {
	await patchFile(filePath, (source) => {
		if (source.includes(COLLECTION_IMPORT_LINE)) {
			return source;
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

function ensureBlockConfigCanAddRestManifests(source: string): string {
	const importLine =
		"import { defineEndpointManifest } from '@wp-typia/block-runtime/metadata-core';";
	if (source.includes(importLine)) {
		return source;
	}
	return `${importLine}\n\n${source}`;
}

async function appendBlockConfigEntries(
	projectDir: string,
	entries: string[],
	needsRestManifestImport: boolean,
): Promise<void> {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	await patchFile(blockConfigPath, (source) => {
		let nextSource = source;
		if (needsRestManifestImport) {
			nextSource = ensureBlockConfigCanAddRestManifests(nextSource);
		}

		if (nextSource.includes(BLOCK_CONFIG_ENTRY_MARKER)) {
			return nextSource.replace(
				BLOCK_CONFIG_ENTRY_MARKER,
				`${entries.join("\n")}\n${BLOCK_CONFIG_ENTRY_MARKER}`,
			);
		}

		if (nextSource.includes(EMPTY_BLOCKS_ARRAY)) {
			return nextSource.replace(
				EMPTY_BLOCKS_ARRAY,
				`${entries.join("\n")}\n];`,
			);
		}

		return nextSource.replace(
			"];",
			`${entries.join("\n")}\n];`,
		);
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

async function copyScaffoldedBlockSlice(
	projectDir: string,
	templateId: AddBlockTemplateId,
	tempProjectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	if (templateId === "compound") {
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
	const manifest = buildPersistenceEndpointManifest(variables);
	const apiTypesFile = path.join("src", "blocks", variables.slugKebabCase, "api-types.ts");

	for (const [baseName, contract] of Object.entries(manifest.contracts) as Array<
		[string, { sourceTypeName: string }]
	>) {
		await syncTypeSchemas(
			{
				jsonSchemaFile: path.join(
					"src",
					"blocks",
					variables.slugKebabCase,
					"api-schemas",
					`${baseName}.schema.json`,
				),
				openApiFile: path.join(
					"src",
					"blocks",
					variables.slugKebabCase,
					"api-schemas",
					`${baseName}.openapi.json`,
				),
				projectRoot: projectDir,
				sourceTypeName: contract.sourceTypeName,
				typesFile: apiTypesFile,
			},
		);
	}

	await syncRestOpenApi(
		{
			manifest,
			openApiFile: path.join("src", "blocks", variables.slugKebabCase, "api.openapi.json"),
			projectRoot: projectDir,
			typesFile: apiTypesFile,
		},
	);

	await syncEndpointClient(
		{
			clientFile: path.join("src", "blocks", variables.slugKebabCase, "api-client.ts"),
			manifest,
			projectRoot: projectDir,
			typesFile: apiTypesFile,
		},
	);
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

function resolveWorkspaceProject(startDir: string): WorkspaceProject {
	let currentDir = path.resolve(startDir);

	while (true) {
		const packageJsonPath = path.join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = JSON.parse(
				fs.readFileSync(packageJsonPath, "utf8"),
			) as WorkspacePackageJson;
			if (
				packageJson.wpTypia?.projectType === "workspace" &&
				packageJson.wpTypia?.templatePackage === WORKSPACE_TEMPLATE_PACKAGE &&
				typeof packageJson.wpTypia.namespace === "string" &&
				typeof packageJson.wpTypia.textDomain === "string" &&
				typeof packageJson.wpTypia.phpPrefix === "string"
			) {
				return {
					author: typeof packageJson.author === "string" ? packageJson.author : "Your Name",
					packageManager: parsePackageManagerId(packageJson.packageManager),
					projectDir: currentDir,
					workspace: {
						namespace: packageJson.wpTypia.namespace,
						phpPrefix: packageJson.wpTypia.phpPrefix,
						projectType: "workspace",
						templatePackage: WORKSPACE_TEMPLATE_PACKAGE,
						textDomain: packageJson.wpTypia.textDomain,
					},
				};
			}
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break;
		}
		currentDir = parentDir;
	}

	throw new Error(
		`This command must run inside a ${WORKSPACE_TEMPLATE_PACKAGE} project. Create one with \`wp-typia create my-plugin --template ${WORKSPACE_TEMPLATE_PACKAGE}\` first.`,
	);
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

export function formatAddHelpText(): string {
	return `Usage:
  wp-typia add block <name> --template <${ADD_BLOCK_TEMPLATE_IDS.join("|")}> [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>]
  wp-typia add variation
  wp-typia add pattern

Notes:
  \`wp-typia add block\` runs only inside official ${WORKSPACE_TEMPLATE_PACKAGE} workspaces.
  \`wp-typia add variation\` and \`wp-typia add pattern\` are reserved placeholders for follow-up workflows.`;
}

/**
 * Seeds an empty official workspace migration project before any blocks are added.
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

async function rollbackWorkspaceMutation(
	projectDir: string,
	snapshot: WorkspaceMutationSnapshot,
): Promise<void> {
	for (const targetPath of snapshot.targetPaths) {
		await fsp.rm(targetPath, { force: true, recursive: true });
	}
	for (const snapshotDir of snapshot.snapshotDirs) {
		await fsp.rm(snapshotDir, { force: true, recursive: true });
	}
	await restoreOptionalFile(
		path.join(projectDir, "scripts", "block-config.ts"),
		snapshot.blockConfigSource,
	);
	await restoreOptionalFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		snapshot.migrationConfigSource,
	);
}

/**
 * Adds one built-in block slice to an official workspace project.
 */
export async function runAddBlockCommand({
	blockName,
	cwd = process.cwd(),
	dataStorageMode,
	persistencePolicy,
	templateId = "basic",
}: RunAddBlockCommandOptions): Promise<{
	blockSlugs: string[];
	projectDir: string;
	templateId: AddBlockTemplateId;
}> {
	if (!isAddBlockTemplateId(templateId)) {
		throw new Error(
			`Unknown add-block template "${templateId}". Expected one of: ${ADD_BLOCK_TEMPLATE_IDS.join(", ")}`,
		);
	}
	const resolvedTemplateId = templateId;

	assertPersistenceFlagsAllowed(resolvedTemplateId, { dataStorageMode, persistencePolicy });

	const workspace = resolveWorkspaceProject(cwd);
	const normalizedSlug = normalizeBlockSlug(blockName);
	if (!normalizedSlug) {
		throw new Error("Block name is required. Use `wp-typia add block <name> --template <family>`.");
	}

	const defaults = getDefaultAnswers(normalizedSlug, resolvedTemplateId);
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-add-block-"));
	const tempProjectDir = path.join(tempRoot, normalizedSlug);
	const blockPhpPrefix = buildWorkspacePhpPrefix(
		workspace.workspace.phpPrefix,
		normalizedSlug,
	);
	const blockConfigSource = await readOptionalFile(
		path.join(workspace.projectDir, "scripts", "block-config.ts"),
	);
	const migrationConfigSource = await readOptionalFile(
		path.join(workspace.projectDir, "src", "migrations", "config.ts"),
	);

	try {
		const result = await scaffoldProject({
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
			noInstall: true,
			packageManager: workspace.packageManager,
			persistencePolicy: persistencePolicy as "authenticated" | "public" | undefined,
			projectDir: tempProjectDir,
			templateId: resolvedTemplateId,
		});
		const mutationSnapshot: WorkspaceMutationSnapshot = {
			blockConfigSource,
			migrationConfigSource,
			snapshotDirs:
				migrationConfigSource === null
					? []
					: buildMigrationBlocks(resolvedTemplateId, result.variables).map((block) =>
						path.join(
							workspace.projectDir,
							"src",
							"migrations",
							"versions",
							parseMigrationConfig(migrationConfigSource).currentMigrationVersion,
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
			assertBlockTargetsDoNotExist(workspace.projectDir, resolvedTemplateId, result.variables);
			await copyScaffoldedBlockSlice(
				workspace.projectDir,
				resolvedTemplateId,
				tempProjectDir,
				result.variables,
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
			};
		} catch (error) {
			await rollbackWorkspaceMutation(workspace.projectDir, mutationSnapshot);
			throw error;
		}
	} finally {
		await fsp.rm(tempRoot, { force: true, recursive: true });
	}
}

/**
 * Returns the current placeholder guidance for unsupported `wp-typia add` kinds.
 */
export function createAddPlaceholderMessage(kind: Exclude<AddKindId, "block">): string {
	const issueNumber = kind === "variation" ? "#157" : "#158";
	return `\`wp-typia add ${kind}\` is not implemented yet. Track ${issueNumber} for the first supported ${kind} workflow.`;
}
