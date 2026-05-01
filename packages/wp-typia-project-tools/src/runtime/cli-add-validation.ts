import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_IDS,
	type HookedBlockPositionId,
} from "./hooked-blocks.js";
import {
	toSnakeCase,
} from "./string-case.js";
import {
	ADD_BLOCK_TEMPLATE_IDS,
	type AddBlockTemplateId,
	EDITOR_PLUGIN_SLOT_IDS,
	type EditorPluginSlotId,
	REST_RESOURCE_METHOD_IDS,
	type RestResourceMethodId,
	resolveEditorPluginSlotAlias,
} from "./cli-add-types.js";

const WORKSPACE_GENERATED_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
export const REST_RESOURCE_NAMESPACE_PATTERN = /^[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)+$/u;

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

export function buildWorkspacePhpPrefix(workspacePhpPrefix: string, slug: string): string {
	return toSnakeCase(`${workspacePhpPrefix}_${slug}`);
}

export function isAddBlockTemplateId(value: string): value is AddBlockTemplateId {
	return (ADD_BLOCK_TEMPLATE_IDS as readonly string[]).includes(value);
}

export function quoteTsString(value: string): string {
	return JSON.stringify(value);
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
