import fs from "node:fs";
import path from "node:path";

import type {
	WorkspaceInventory,
} from "./workspace-inventory.js";

type ScaffoldFilesystemCollision = {
	label: string;
	relativePath: string;
};

type ScaffoldInventoryCollision<TEntry> = {
	entries: readonly TEntry[];
	exists: (entry: TEntry) => boolean;
	message: string;
};

/**
 * Ensure scaffold targets do not already exist on disk or in workspace inventory.
 *
 * @param options Collision checks to run before writing scaffold files.
 * @throws {Error} When a filesystem path or inventory entry already exists.
 */
export function assertScaffoldDoesNotExist<TEntry>(options: {
	projectDir: string;
	filesystemCollisions: readonly ScaffoldFilesystemCollision[];
	inventoryCollision?: ScaffoldInventoryCollision<TEntry>;
}): void {
	for (const collision of options.filesystemCollisions) {
		const targetPath = path.join(options.projectDir, collision.relativePath);
		if (fs.existsSync(targetPath)) {
			throw new Error(
				`${collision.label} already exists at ${path.relative(options.projectDir, targetPath)}. Choose a different name.`,
			);
		}
	}

	if (
		options.inventoryCollision &&
		options.inventoryCollision.entries.some(options.inventoryCollision.exists)
	) {
		throw new Error(options.inventoryCollision.message);
	}
}

/**
 * Ensure a block variation scaffold does not already exist.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param blockSlug Existing workspace block slug that owns the variation.
 * @param variationSlug Normalized variation slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When the variation file or inventory entry already exists.
 */
export function assertVariationDoesNotExist(
	projectDir: string,
	blockSlug: string,
	variationSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A variation",
				relativePath: path.join(
					"src",
					"blocks",
					blockSlug,
					"variations",
					`${variationSlug}.ts`,
				),
			},
		],
		inventoryCollision: {
			entries: inventory.variations,
			exists: (entry) => entry.block === blockSlug && entry.slug === variationSlug,
			message: `A variation inventory entry already exists for ${blockSlug}/${variationSlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure a block style scaffold does not already exist.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param blockSlug Existing workspace block slug that owns the style.
 * @param styleSlug Normalized style slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When the style file or inventory entry already exists.
 */
export function assertBlockStyleDoesNotExist(
	projectDir: string,
	blockSlug: string,
	styleSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A block style",
				relativePath: path.join(
					"src",
					"blocks",
					blockSlug,
					"styles",
					`${styleSlug}.ts`,
				),
			},
		],
		inventoryCollision: {
			entries: inventory.blockStyles,
			exists: (entry) => entry.block === blockSlug && entry.slug === styleSlug,
			message: `A block style inventory entry already exists for ${blockSlug}/${styleSlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure a block transform scaffold does not already exist.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param blockSlug Existing workspace block slug that owns the transform.
 * @param transformSlug Normalized transform slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When the transform file or inventory entry already exists.
 */
export function assertBlockTransformDoesNotExist(
	projectDir: string,
	blockSlug: string,
	transformSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A block transform",
				relativePath: path.join(
					"src",
					"blocks",
					blockSlug,
					"transforms",
					`${transformSlug}.ts`,
				),
			},
		],
		inventoryCollision: {
			entries: inventory.blockTransforms,
			exists: (entry) =>
				entry.block === blockSlug && entry.slug === transformSlug,
			message: `A block transform inventory entry already exists for ${blockSlug}/${transformSlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure a pattern scaffold does not already exist on disk or in inventory.
 *
 * Delegates filesystem and inventory checks to `assertScaffoldDoesNotExist`.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param patternSlug Normalized pattern slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When the pattern file or inventory entry already exists.
 */
export function assertPatternDoesNotExist(
	projectDir: string,
	patternSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A pattern",
				relativePath: path.join("src", "patterns", `${patternSlug}.php`),
			},
		],
		inventoryCollision: {
			entries: inventory.patterns,
			exists: (entry) => entry.slug === patternSlug,
			message: `A pattern inventory entry already exists for ${patternSlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure a binding source scaffold does not already exist on disk or in inventory.
 *
 * Delegates filesystem and inventory checks to `assertScaffoldDoesNotExist`.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param bindingSourceSlug Normalized binding source slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When the binding directory or inventory entry already exists.
 */
export function assertBindingSourceDoesNotExist(
	projectDir: string,
	bindingSourceSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A binding source",
				relativePath: path.join("src", "bindings", bindingSourceSlug),
			},
		],
		inventoryCollision: {
			entries: inventory.bindingSources,
			exists: (entry) => entry.slug === bindingSourceSlug,
			message: `A binding source inventory entry already exists for ${bindingSourceSlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure a REST resource scaffold does not already exist on disk or in inventory.
 *
 * Delegates filesystem and inventory checks to `assertScaffoldDoesNotExist`.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param restResourceSlug Normalized REST resource slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When REST resource files or inventory entry already exist.
 */
export function assertRestResourceDoesNotExist(
	projectDir: string,
	restResourceSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "A REST resource",
				relativePath: path.join("src", "rest", restResourceSlug),
			},
			{
				label: "A REST resource bootstrap",
				relativePath: path.join("inc", "rest", `${restResourceSlug}.php`),
			},
		],
		inventoryCollision: {
			entries: inventory.restResources,
			exists: (entry) => entry.slug === restResourceSlug,
			message: `A REST resource inventory entry already exists for ${restResourceSlug}. Choose a different name.`,
		},
		projectDir,
	});
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
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "An admin view",
				relativePath: path.join("src", "admin-views", adminViewSlug),
			},
			{
				label: "An admin view bootstrap",
				relativePath: path.join("inc", "admin-views", `${adminViewSlug}.php`),
			},
		],
		inventoryCollision: {
			entries: inventory.adminViews,
			exists: (entry) => entry.slug === adminViewSlug,
			message: `An admin view inventory entry already exists for ${adminViewSlug}. Choose a different name.`,
		},
		projectDir,
	});
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
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "An ability scaffold",
				relativePath: path.join("src", "abilities", abilitySlug),
			},
			{
				label: "An ability bootstrap",
				relativePath: path.join("inc", "abilities", `${abilitySlug}.php`),
			},
		],
		inventoryCollision: {
			entries: inventory.abilities,
			exists: (entry) => entry.slug === abilitySlug,
			message: `An ability inventory entry already exists for ${abilitySlug}. Choose a different name.`,
		},
		projectDir,
	});
}

/**
 * Ensure an AI feature scaffold does not already exist on disk or in inventory.
 *
 * Delegates filesystem and inventory checks to `assertScaffoldDoesNotExist`.
 *
 * @param projectDir Absolute workspace root used to resolve scaffold paths.
 * @param aiFeatureSlug Normalized AI feature slug that would be created.
 * @param inventory Current workspace inventory used for duplicate detection.
 * @throws {Error} When AI feature files or inventory entry already exist.
 */
export function assertAiFeatureDoesNotExist(
	projectDir: string,
	aiFeatureSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "An AI feature",
				relativePath: path.join("src", "ai-features", aiFeatureSlug),
			},
			{
				label: "An AI feature bootstrap",
				relativePath: path.join("inc", "ai-features", `${aiFeatureSlug}.php`),
			},
		],
		inventoryCollision: {
			entries: inventory.aiFeatures,
			exists: (entry) => entry.slug === aiFeatureSlug,
			message: `An AI feature inventory entry already exists for ${aiFeatureSlug}. Choose a different name.`,
		},
		projectDir,
	});
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
export function assertEditorPluginDoesNotExist(
	projectDir: string,
	editorPluginSlug: string,
	inventory: WorkspaceInventory,
): void {
	assertScaffoldDoesNotExist({
		filesystemCollisions: [
			{
				label: "An editor plugin",
				relativePath: path.join("src", "editor-plugins", editorPluginSlug),
			},
		],
		inventoryCollision: {
			entries: inventory.editorPlugins,
			exists: (entry) => entry.slug === editorPluginSlug,
			message: `An editor plugin inventory entry already exists for ${editorPluginSlug}. Choose a different name.`,
		},
		projectDir,
	});
}
