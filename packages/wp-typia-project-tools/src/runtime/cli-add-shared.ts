import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";

import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_IDS,
	type HookedBlockPositionId,
} from "./hooked-blocks.js";
import {
	toKebabCase,
	toSnakeCase,
} from "./string-case.js";
import {
	type WorkspaceInventory,
} from "./workspace-inventory.js";
import {
	WORKSPACE_TEMPLATE_PACKAGE,
	type WorkspaceProject,
} from "./workspace-project.js";

/**
 * Supported top-level `wp-typia add` kinds exposed by the canonical CLI.
 */
export const ADD_KIND_IDS = [
	"block",
	"variation",
	"pattern",
	"binding-source",
	"rest-resource",
	"hooked-block",
	"editor-plugin",
] as const;
export type AddKindId = (typeof ADD_KIND_IDS)[number];

/**
 * Supported plugin-level REST resource methods accepted by
 * `wp-typia add rest-resource --methods`.
 */
export const REST_RESOURCE_METHOD_IDS = [
	"list",
	"read",
	"create",
	"update",
	"delete",
] as const;
export type RestResourceMethodId = (typeof REST_RESOURCE_METHOD_IDS)[number];

/**
 * Supported editor-plugin shell slots accepted by `wp-typia add editor-plugin --slot`.
 */
export const EDITOR_PLUGIN_SLOT_IDS = ["PluginSidebar"] as const;
export type EditorPluginSlotId = (typeof EDITOR_PLUGIN_SLOT_IDS)[number];

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

const WORKSPACE_GENERATED_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const REST_RESOURCE_NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)+$/u;

export interface RunAddVariationCommandOptions {
	blockName: string;
	cwd?: string;
	variationName: string;
}

export interface RunAddPatternCommandOptions {
	cwd?: string;
	patternName: string;
}

export interface RunAddBindingSourceCommandOptions {
	bindingSourceName: string;
	cwd?: string;
}

export interface RunAddRestResourceCommandOptions {
	cwd?: string;
	methods?: string;
	namespace?: string;
	restResourceName: string;
}

export interface RunAddHookedBlockCommandOptions {
	anchorBlockName: string;
	blockName: string;
	cwd?: string;
	position: string;
}

/**
 * Options for `wp-typia add editor-plugin`.
 *
 * @property cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @property editorPluginName Human-entered editor plugin name that will be
 * normalized into the generated slug.
 * @property slot Optional editor shell slot. Defaults to `PluginSidebar`.
 */
export interface RunAddEditorPluginCommandOptions {
	cwd?: string;
	editorPluginName: string;
	slot?: string;
}

export interface RunAddBlockCommandOptions {
	blockName: string;
	cwd?: string;
	dataStorageMode?: string;
	externalLayerId?: string;
	externalLayerSource?: string;
	persistencePolicy?: string;
	selectExternalLayerId?: (
		options: Array<{
			description?: string;
			extends: string[];
			id: string;
		}>,
	) => Promise<string>;
	templateId?: string;
}

export interface WorkspaceMutationSnapshot {
	/** Snapshots of file contents taken before the mutation starts. */
	fileSources: Array<{
		/** Absolute file path recorded for rollback. */
		filePath: string;
		/** Previous file contents, or `null` when the file did not exist. */
		source: string | null;
	}>;
	/** Snapshot directories created while seeding migration history. */
	snapshotDirs: string[];
	/** Files or directories created by the mutation that should be removed on rollback. */
	targetPaths: string[];
}

export function normalizeBlockSlug(input: string): string {
	return toKebabCase(input);
}

export function assertValidGeneratedSlug(label: string, slug: string, usage: string): string {
	if (!slug) {
		throw new Error(`${label} is required. Use \`${usage}\`.`);
	}
	if (!WORKSPACE_GENERATED_SLUG_PATTERN.test(slug)) {
		throw new Error(
			`${label} must start with a letter and contain only lowercase letters, numbers, and hyphens.`,
		);
	}

	return slug;
}

export function assertValidRestResourceNamespace(namespace: string): string {
	const trimmed = namespace.trim();
	if (!trimmed) {
		throw new Error(
			"REST resource namespace is required. Use `--namespace <vendor/v1>` or let the workspace default apply.",
		);
	}
	if (!REST_RESOURCE_NAMESPACE_PATTERN.test(trimmed)) {
		throw new Error(
			"REST resource namespace must use lowercase slash-separated segments like `demo-space/v1`.",
		);
	}

	return trimmed;
}

export function resolveRestResourceNamespace(
	workspaceNamespace: string,
	namespace?: string,
): string {
	return assertValidRestResourceNamespace(namespace ?? `${workspaceNamespace}/v1`);
}

export function assertValidRestResourceMethods(
	methods?: string,
): RestResourceMethodId[] {
	const rawMethods =
		typeof methods === "string" && methods.trim().length > 0
			? methods.split(",").map((value) => value.trim()).filter(Boolean)
			: ["list", "read", "create"];
	const normalizedMethods = Array.from(new Set(rawMethods));
	const invalidMethods = normalizedMethods.filter(
		(method) => !(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(method),
	);

	if (invalidMethods.length > 0) {
		throw new Error(
			`REST resource methods must be a comma-separated list of: ${REST_RESOURCE_METHOD_IDS.join(", ")}.`,
		);
	}

	if (normalizedMethods.length === 0) {
		throw new Error(
			"REST resource methods must include at least one of: list, read, create, update, delete.",
		);
	}

	return normalizedMethods as RestResourceMethodId[];
}

export function assertValidHookedBlockPosition(position: string): HookedBlockPositionId {
	if ((HOOKED_BLOCK_POSITION_IDS as readonly string[]).includes(position)) {
		return position as HookedBlockPositionId;
	}

	throw new Error(
		`Hook position must be one of: ${HOOKED_BLOCK_POSITION_IDS.join(", ")}.`,
	);
}

export function getWorkspaceBootstrapPath(workspace: WorkspaceProject): string {
	const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
	return path.join(workspace.projectDir, `${workspaceBaseName}.php`);
}

export function buildWorkspacePhpPrefix(workspacePhpPrefix: string, slug: string): string {
	return toSnakeCase(`${workspacePhpPrefix}_${slug}`);
}

export function isAddBlockTemplateId(value: string): value is AddBlockTemplateId {
	return (ADD_BLOCK_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function quoteTsString(value: string): string {
	return JSON.stringify(value);
}

/**
 * Apply a text transform to an existing file only when the contents change.
 */
export async function patchFile(
	filePath: string,
	transform: (source: string) => string,
): Promise<void> {
	const currentSource = await fsp.readFile(filePath, "utf8");
	const nextSource = transform(currentSource);
	if (nextSource !== currentSource) {
		await fsp.writeFile(filePath, nextSource, "utf8");
	}
}

/**
 * Read a file when it exists and otherwise return `null`.
 */
export async function readOptionalFile(filePath: string): Promise<string | null> {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	return fsp.readFile(filePath, "utf8");
}

/**
 * Restore a file to its captured source, deleting it when the snapshot was `null`.
 */
export async function restoreOptionalFile(filePath: string, source: string | null): Promise<void> {
	if (source === null) {
		await fsp.rm(filePath, { force: true });
		return;
	}

	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(filePath, source, "utf8");
}

/**
 * Capture the current contents of a set of workspace files for rollback.
 */
export async function snapshotWorkspaceFiles(
	filePaths: string[],
): Promise<WorkspaceMutationSnapshot["fileSources"]> {
	const uniquePaths = Array.from(new Set(filePaths));
	return Promise.all(
		uniquePaths.map(async (filePath) => ({
			filePath,
			source: await readOptionalFile(filePath),
		})),
	);
}

/**
 * Undo a partially applied workspace mutation from a captured snapshot.
 */
export async function rollbackWorkspaceMutation(snapshot: WorkspaceMutationSnapshot): Promise<void> {
	for (const targetPath of snapshot.targetPaths) {
		await fsp.rm(targetPath, { force: true, recursive: true });
	}
	for (const snapshotDir of snapshot.snapshotDirs) {
		await fsp.rm(snapshotDir, { force: true, recursive: true });
	}
	for (const { filePath, source } of snapshot.fileSources) {
		await restoreOptionalFile(filePath, source);
	}
}

export function resolveWorkspaceBlock(
	inventory: WorkspaceInventory,
	blockSlug: string,
): WorkspaceInventory["blocks"][number] {
	const block = inventory.blocks.find((entry) => entry.slug === blockSlug);
	if (!block) {
		throw new Error(
			`Unknown workspace block "${blockSlug}". Choose one of: ${inventory.blocks.map((entry) => entry.slug).join(", ")}`,
		);
	}
	return block;
}

export function assertValidHookAnchor(anchorBlockName: string): string {
	const trimmed = anchorBlockName.trim();
	if (!trimmed) {
		throw new Error(
			"`wp-typia add hooked-block` requires --anchor <anchor-block-name>.",
		);
	}
	if (!HOOKED_BLOCK_ANCHOR_PATTERN.test(trimmed)) {
		throw new Error(
			"`wp-typia add hooked-block` requires --anchor <anchor-block-name> to use the full `namespace/slug` block name format.",
		);
	}

	return trimmed;
}

/**
 * Validate and normalize the editor plugin shell slot.
 *
 * @param slot Optional shell slot. Defaults to `PluginSidebar`.
 * @returns The canonical editor plugin slot id.
 * @throws {Error} When the slot is not supported by the workspace scaffold.
 */
export function assertValidEditorPluginSlot(slot = "PluginSidebar"): EditorPluginSlotId {
	if ((EDITOR_PLUGIN_SLOT_IDS as readonly string[]).includes(slot)) {
		return slot as EditorPluginSlotId;
	}

	throw new Error(
		`Editor plugin slot must be one of: ${EDITOR_PLUGIN_SLOT_IDS.join(", ")}.`,
	);
}

export function readWorkspaceBlockJson(
	projectDir: string,
	blockSlug: string,
): {
	blockJson: Record<string, unknown>;
	blockJsonPath: string;
} {
	const blockJsonPath = path.join(projectDir, "src", "blocks", blockSlug, "block.json");
	if (!fs.existsSync(blockJsonPath)) {
		throw new Error(
			`Missing ${path.relative(projectDir, blockJsonPath)} for workspace block "${blockSlug}".`,
		);
	}

	let blockJson: Record<string, unknown>;
	try {
		blockJson = parseScaffoldBlockMetadata<Record<string, unknown>>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Failed to parse ${path.relative(projectDir, blockJsonPath)}: ${error.message}`
				: `Failed to parse ${path.relative(projectDir, blockJsonPath)}.`,
		);
	}

	return {
		blockJson,
		blockJsonPath,
	};
}

export function getMutableBlockHooks(
	blockJson: Record<string, unknown>,
	blockJsonRelativePath: string,
): Record<string, string> {
	const blockHooks = blockJson.blockHooks;
	if (blockHooks === undefined) {
		const nextHooks: Record<string, string> = {};
		blockJson.blockHooks = nextHooks;
		return nextHooks;
	}
	if (!blockHooks || typeof blockHooks !== "object" || Array.isArray(blockHooks)) {
		throw new Error(`${blockJsonRelativePath} must define blockHooks as an object when present.`);
	}

	return blockHooks as Record<string, string>;
}

export function assertVariationDoesNotExist(
	projectDir: string,
	blockSlug: string,
	variationSlug: string,
	inventory: WorkspaceInventory,
): void {
	const variationPath = path.join(
		projectDir,
		"src",
		"blocks",
		blockSlug,
		"variations",
		`${variationSlug}.ts`,
	);
	if (fs.existsSync(variationPath)) {
		throw new Error(
			`A variation already exists at ${path.relative(projectDir, variationPath)}. Choose a different name.`,
		);
	}
	if (
		inventory.variations.some(
			(entry) => entry.block === blockSlug && entry.slug === variationSlug,
		)
	) {
		throw new Error(
			`A variation inventory entry already exists for ${blockSlug}/${variationSlug}. Choose a different name.`,
		);
	}
}

export function assertPatternDoesNotExist(
	projectDir: string,
	patternSlug: string,
	inventory: WorkspaceInventory,
): void {
	const patternPath = path.join(projectDir, "src", "patterns", `${patternSlug}.php`);
	if (fs.existsSync(patternPath)) {
		throw new Error(
			`A pattern already exists at ${path.relative(projectDir, patternPath)}. Choose a different name.`,
		);
	}
	if (inventory.patterns.some((entry) => entry.slug === patternSlug)) {
		throw new Error(
			`A pattern inventory entry already exists for ${patternSlug}. Choose a different name.`,
		);
	}
}

export function assertBindingSourceDoesNotExist(
	projectDir: string,
	bindingSourceSlug: string,
	inventory: WorkspaceInventory,
): void {
	const bindingSourceDir = path.join(projectDir, "src", "bindings", bindingSourceSlug);
	if (fs.existsSync(bindingSourceDir)) {
		throw new Error(
			`A binding source already exists at ${path.relative(projectDir, bindingSourceDir)}. Choose a different name.`,
		);
	}
	if (inventory.bindingSources.some((entry) => entry.slug === bindingSourceSlug)) {
		throw new Error(
			`A binding source inventory entry already exists for ${bindingSourceSlug}. Choose a different name.`,
		);
	}
}

export function assertRestResourceDoesNotExist(
	projectDir: string,
	restResourceSlug: string,
	inventory: WorkspaceInventory,
): void {
	const restResourceDir = path.join(projectDir, "src", "rest", restResourceSlug);
	const restResourcePhpPath = path.join(projectDir, "inc", "rest", `${restResourceSlug}.php`);
	if (fs.existsSync(restResourceDir)) {
		throw new Error(
			`A REST resource already exists at ${path.relative(projectDir, restResourceDir)}. Choose a different name.`,
		);
	}
	if (fs.existsSync(restResourcePhpPath)) {
		throw new Error(
			`A REST resource bootstrap already exists at ${path.relative(projectDir, restResourcePhpPath)}. Choose a different name.`,
		);
	}
	if (inventory.restResources.some((entry) => entry.slug === restResourceSlug)) {
		throw new Error(
			`A REST resource inventory entry already exists for ${restResourceSlug}. Choose a different name.`,
		);
	}
}

/**
 * Ensure an editor plugin scaffold does not already exist on disk or in the
 * workspace inventory.
 *
 * @param projectDir Workspace root directory.
 * @param editorPluginSlug Normalized editor plugin slug.
 * @param inventory Parsed workspace inventory.
 * @throws {Error} When the directory or inventory entry already exists.
 */
export function assertEditorPluginDoesNotExist(projectDir: string, editorPluginSlug: string, inventory: WorkspaceInventory): void {
	const editorPluginDir = path.join(projectDir, "src", "editor-plugins", editorPluginSlug);
	if (fs.existsSync(editorPluginDir)) {
		throw new Error(
			`An editor plugin already exists at ${path.relative(projectDir, editorPluginDir)}. Choose a different name.`,
		);
	}
	if (inventory.editorPlugins.some((entry) => entry.slug === editorPluginSlug)) {
		throw new Error(
			`An editor plugin inventory entry already exists for ${editorPluginSlug}. Choose a different name.`,
		);
	}
}

/**
 * Returns help text for the canonical `wp-typia add` subcommands.
 */
export function formatAddHelpText(): string {
	return `Usage:
  wp-typia add block <name> --template <${ADD_BLOCK_TEMPLATE_IDS.join("|")}> [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>]
  wp-typia add variation <name> --block <block-slug>
  wp-typia add pattern <name>
  wp-typia add binding-source <name>
  wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <${REST_RESOURCE_METHOD_IDS.join("|")}>]
  wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <${HOOKED_BLOCK_POSITION_IDS.join("|")}>
  wp-typia add editor-plugin <name> [--slot <${EDITOR_PLUGIN_SLOT_IDS.join("|")}>]

Notes:
  \`wp-typia add\` runs only inside official ${WORKSPACE_TEMPLATE_PACKAGE} workspaces.
  \`add variation\` targets an existing block slug from \`scripts/block-config.ts\`.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`.
  \`add rest-resource\` scaffolds plugin-level TypeScript REST contracts under \`src/rest/\` and PHP route glue under \`inc/rest/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.
  \`add editor-plugin\` scaffolds a document-level editor extension under \`src/editor-plugins/\`.`;
}
