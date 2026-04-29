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
	toSnakeCase,
} from "./string-case.js";
import {
	type WorkspaceInventory,
} from "./workspace-inventory.js";
import {
	WORKSPACE_TEMPLATE_PACKAGE,
	type WorkspaceProject,
} from "./workspace-project.js";
export {
	normalizeBlockSlug,
} from "./scaffold-identifiers.js";

/**
 * Supported top-level `wp-typia add` kinds exposed by the canonical CLI.
 */
export const ADD_KIND_IDS = [
	"admin-view",
	"block",
	"variation",
	"style",
	"transform",
	"pattern",
	"binding-source",
	"rest-resource",
	"ability",
	"ai-feature",
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
 * Supported editor-plugin shell surfaces accepted by
 * `wp-typia add editor-plugin --slot`.
 */
export const EDITOR_PLUGIN_SLOT_IDS = ["sidebar", "document-setting-panel"] as const;
export type EditorPluginSlotId = (typeof EDITOR_PLUGIN_SLOT_IDS)[number];
export const EDITOR_PLUGIN_SLOT_ALIASES = {
	PluginDocumentSettingPanel: "document-setting-panel",
	PluginSidebar: "sidebar",
	"document-setting-panel": "document-setting-panel",
	sidebar: "sidebar",
} as const satisfies Record<string, EditorPluginSlotId>;

export function resolveEditorPluginSlotAlias(
	slot: string,
): EditorPluginSlotId | undefined {
	const trimmed = slot.trim();
	if (
		!Object.prototype.hasOwnProperty.call(EDITOR_PLUGIN_SLOT_ALIASES, trimmed)
	) {
		return undefined;
	}

	return EDITOR_PLUGIN_SLOT_ALIASES[
		trimmed as keyof typeof EDITOR_PLUGIN_SLOT_ALIASES
	];
}

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
export const REST_RESOURCE_NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)+$/u;

export interface RunAddVariationCommandOptions {
	blockName: string;
	cwd?: string;
	variationName: string;
}

/**
 * Options for `wp-typia add style`.
 *
 * @property blockName Existing workspace block slug that owns the style.
 * @property cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @property styleName Human-entered style name that will be normalized into the
 * generated style slug.
 */
export interface RunAddBlockStyleCommandOptions {
	blockName: string;
	cwd?: string;
	styleName: string;
}

/**
 * Options for `wp-typia add transform`.
 *
 * @property cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @property fromBlockName Full `namespace/block` source block name accepted by
 * WordPress block transform definitions.
 * @property toBlockName Existing workspace block slug or full block name that
 * owns the generated transform.
 * @property transformName Human-entered transform name that will be normalized
 * into the generated transform slug.
 */
export interface RunAddBlockTransformCommandOptions {
	cwd?: string;
	fromBlockName: string;
	toBlockName: string;
	transformName: string;
}

export interface RunAddPatternCommandOptions {
	cwd?: string;
	patternName: string;
}

export interface RunAddBindingSourceCommandOptions {
	attributeName?: string;
	blockName?: string;
	bindingSourceName: string;
	cwd?: string;
}

export interface RunAddRestResourceCommandOptions {
	cwd?: string;
	methods?: string;
	namespace?: string;
	restResourceName: string;
}

/**
 * Options for `wp-typia add admin-view`.
 *
 * @property adminViewName Human-entered admin screen name that will be
 * normalized into the generated slug.
 * @property cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @property source Optional data source locator. The first supported source is
 * `rest-resource:<slug>`, which wires the generated screen to an existing
 * list-capable REST resource.
 */
export interface RunAddAdminViewCommandOptions {
	adminViewName: string;
	cwd?: string;
	source?: string;
}

/**
 * Options for `wp-typia add ability`.
 *
 * @property cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @property abilityName Human-entered workflow ability name that will be
 * normalized into the generated slug.
 */
export interface RunAddAbilityCommandOptions {
	abilityName: string;
	cwd?: string;
}

export interface RunAddAiFeatureCommandOptions {
	aiFeatureName: string;
	cwd?: string;
	namespace?: string;
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
 * @property slot Optional editor shell slot. Defaults to `sidebar`.
 */
export interface RunAddEditorPluginCommandOptions {
	cwd?: string;
	editorPluginName: string;
	slot?: string;
}

export interface RunAddBlockCommandOptions {
	alternateRenderTargets?: string;
	blockName: string;
	cwd?: string;
	dataStorageMode?: string;
	externalLayerId?: string;
	externalLayerSource?: string;
	innerBlocksPreset?: string;
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
 * @param slot Optional shell slot. Defaults to `sidebar`.
 * @returns The canonical editor plugin slot id.
 * @throws {Error} When the slot is not supported by the workspace scaffold.
 */
export function assertValidEditorPluginSlot(slot = "sidebar"): EditorPluginSlotId {
	const alias = resolveEditorPluginSlotAlias(slot);
	if (alias) {
		return alias;
	}

	throw new Error(
		`Editor plugin slot must be one of: ${EDITOR_PLUGIN_SLOT_IDS.join(", ")}. Legacy aliases: PluginSidebar, PluginDocumentSettingPanel.`,
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
 * Ensure a DataViews admin screen scaffold does not already exist on disk or in
 * the workspace inventory.
 *
 * @param projectDir Workspace root directory.
 * @param adminViewSlug Normalized admin screen slug.
 * @param inventory Parsed workspace inventory.
 * @throws {Error} When the directory, PHP bootstrap, or inventory entry already exists.
 */
export function assertAdminViewDoesNotExist(
	projectDir: string,
	adminViewSlug: string,
	inventory: WorkspaceInventory,
): void {
	const adminViewDir = path.join(projectDir, "src", "admin-views", adminViewSlug);
	const adminViewPhpPath = path.join(projectDir, "inc", "admin-views", `${adminViewSlug}.php`);
	if (fs.existsSync(adminViewDir)) {
		throw new Error(
			`An admin view already exists at ${path.relative(projectDir, adminViewDir)}. Choose a different name.`,
		);
	}
	if (fs.existsSync(adminViewPhpPath)) {
		throw new Error(
			`An admin view bootstrap already exists at ${path.relative(projectDir, adminViewPhpPath)}. Choose a different name.`,
		);
	}
	if (inventory.adminViews.some((entry) => entry.slug === adminViewSlug)) {
		throw new Error(
			`An admin view inventory entry already exists for ${adminViewSlug}. Choose a different name.`,
		);
	}
}

/**
 * Ensure a workflow ability scaffold does not already exist on disk or in the
 * workspace inventory.
 *
 * The check covers the generated `src/abilities/<slug>` directory,
 * `inc/abilities/<slug>.php`, and any matching `inventory.abilities` entry.
 *
 * @param projectDir Workspace root directory.
 * @param abilitySlug Normalized workflow ability slug.
 * @param inventory Parsed workspace inventory.
 * @throws {Error} When the ability directory, PHP bootstrap, or inventory entry already exists.
 */
export function assertAbilityDoesNotExist(
	projectDir: string,
	abilitySlug: string,
	inventory: WorkspaceInventory,
): void {
	const abilityDir = path.join(projectDir, "src", "abilities", abilitySlug);
	const abilityPhpPath = path.join(projectDir, "inc", "abilities", `${abilitySlug}.php`);
	if (fs.existsSync(abilityDir)) {
		throw new Error(
			`An ability scaffold already exists at ${path.relative(projectDir, abilityDir)}. Choose a different name.`,
		);
	}
	if (fs.existsSync(abilityPhpPath)) {
		throw new Error(
			`An ability bootstrap already exists at ${path.relative(projectDir, abilityPhpPath)}. Choose a different name.`,
		);
	}
	if (inventory.abilities.some((entry) => entry.slug === abilitySlug)) {
		throw new Error(
			`An ability inventory entry already exists for ${abilitySlug}. Choose a different name.`,
		);
	}
}

export function assertAiFeatureDoesNotExist(
	projectDir: string,
	aiFeatureSlug: string,
	inventory: WorkspaceInventory,
): void {
	const aiFeatureDir = path.join(projectDir, "src", "ai-features", aiFeatureSlug);
	const aiFeaturePhpPath = path.join(
		projectDir,
		"inc",
		"ai-features",
		`${aiFeatureSlug}.php`,
	);
	if (fs.existsSync(aiFeatureDir)) {
		throw new Error(
			`An AI feature already exists at ${path.relative(projectDir, aiFeatureDir)}. Choose a different name.`,
		);
	}
	if (fs.existsSync(aiFeaturePhpPath)) {
		throw new Error(
			`An AI feature bootstrap already exists at ${path.relative(projectDir, aiFeaturePhpPath)}. Choose a different name.`,
		);
	}
	if (inventory.aiFeatures.some((entry) => entry.slug === aiFeatureSlug)) {
		throw new Error(
			`An AI feature inventory entry already exists for ${aiFeatureSlug}. Choose a different name.`,
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
  wp-typia add admin-view <name> [--source <rest-resource:slug>] [--dry-run]
  wp-typia add block <name> [--template <${ADD_BLOCK_TEMPLATE_IDS.join("|")}>] [--external-layer-source <./path|github:owner/repo/path[#ref]|npm-package>] [--external-layer-id <layer-id>] [--inner-blocks-preset <freeform|ordered|horizontal|locked-structure>] [--alternate-render-targets <email,mjml,plain-text>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--dry-run]
  wp-typia add variation <name> --block <block-slug> [--dry-run]
  wp-typia add style <name> --block <block-slug> [--dry-run]
  wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug> [--dry-run]
  wp-typia add pattern <name> [--dry-run]
  wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--dry-run]
  wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create,update,delete>] [--dry-run]
  wp-typia add ability <name> [--dry-run]
  wp-typia add ai-feature <name> [--namespace <vendor/v1>] [--dry-run]
  wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <${HOOKED_BLOCK_POSITION_IDS.join("|")}> [--dry-run]
  wp-typia add editor-plugin <name> [--slot <${EDITOR_PLUGIN_SLOT_IDS.join("|")}>] [--dry-run]

Notes:
  \`wp-typia add\` runs only inside official ${WORKSPACE_TEMPLATE_PACKAGE} workspaces scaffolded via \`wp-typia create <project-dir> --template workspace\`.
  Pass \`--dry-run\` to preview the workspace files that would change without writing them.
  Interactive add flows let you choose a template when \`--template\` is omitted; non-interactive runs default to \`basic\`.
  \`add admin-view\` scaffolds an opt-in DataViews-powered WordPress admin screen under \`src/admin-views/\`; pass \`--source rest-resource:<slug>\` to reuse a list-capable REST resource. Public installs currently gate this workflow until \`@wp-typia/dataviews\` is published to npm.
  \`query-loop\` is a create-time scaffold family. Use \`wp-typia create <project-dir> --template query-loop\` instead of \`wp-typia add block\`.
  \`add variation\` targets an existing block slug from \`scripts/block-config.ts\`.
  \`add style\` registers a Block Styles option for an existing generated block.
  \`add transform\` adds a block-to-block transform into an existing generated block.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`; pass \`--block\` and \`--attribute\` together to declare an end-to-end bindable attribute on an existing generated block.
  \`add rest-resource\` scaffolds plugin-level TypeScript REST contracts under \`src/rest/\` and PHP route glue under \`inc/rest/\`.
  \`add ability\` scaffolds typed workflow abilities under \`src/abilities/\` and server registration under \`inc/abilities/\`.
  \`add ai-feature\` scaffolds server-owned AI feature endpoints under \`src/ai-features/\` and PHP route glue under \`inc/ai-features/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.
  \`add editor-plugin\` scaffolds a document-level editor extension under \`src/editor-plugins/\`; legacy aliases \`PluginSidebar\` and \`PluginDocumentSettingPanel\` resolve to \`sidebar\` and \`document-setting-panel\`.`;
}
