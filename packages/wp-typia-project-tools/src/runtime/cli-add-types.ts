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
 * @property source Optional data source locator. `rest-resource:<slug>` wires
 * the generated screen to an existing list-capable REST resource.
 * `core-data:<kind>/<name>` binds the screen to a supported WordPress-owned
 * entity collection such as `core-data:postType/post`.
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
