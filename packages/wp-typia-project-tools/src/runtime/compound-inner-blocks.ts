export const COMPOUND_INNER_BLOCKS_PRESET_IDS = [
	"freeform",
	"ordered",
	"horizontal",
	"locked-structure",
] as const;

export type CompoundInnerBlocksPresetId =
	(typeof COMPOUND_INNER_BLOCKS_PRESET_IDS)[number];

export const DEFAULT_COMPOUND_INNER_BLOCKS_PRESET_ID: CompoundInnerBlocksPresetId =
	"freeform";

export type CompoundInnerBlocksOrientation = "horizontal" | "vertical";
export type CompoundInnerBlocksTemplateLock = false | "insert" | "all";

export interface CompoundInnerBlocksPresetDefinition {
	description: string;
	directInsert: boolean;
	label: string;
	orientation?: CompoundInnerBlocksOrientation;
	templateLock: CompoundInnerBlocksTemplateLock;
}

export const COMPOUND_INNER_BLOCKS_PRESET_REGISTRY = {
	freeform: {
		description:
			"Unlocked nested authoring with the default inserter and starter child template.",
		directInsert: false,
		label: "freeform",
		orientation: "vertical",
		templateLock: false,
	},
	ordered: {
		description:
			"Vertical ordered flow that keeps starter structure fixed while allowing new sibling inserts.",
		directInsert: true,
		label: "ordered",
		orientation: "vertical",
		templateLock: "insert",
	},
	horizontal: {
		description:
			"Horizontal nested layout with one-click direct inserts for row or tab style containers.",
		directInsert: true,
		label: "horizontal",
		orientation: "horizontal",
		templateLock: false,
	},
	"locked-structure": {
		description:
			"Locked starter structure for guided document shells where authors should only edit seeded children.",
		directInsert: false,
		label: "locked-structure",
		orientation: "vertical",
		templateLock: "all",
	},
} as const satisfies Record<
	CompoundInnerBlocksPresetId,
	CompoundInnerBlocksPresetDefinition
>;

export function isCompoundInnerBlocksPresetId(
	value: string,
): value is CompoundInnerBlocksPresetId {
	return (
		COMPOUND_INNER_BLOCKS_PRESET_IDS as readonly string[]
	).includes(value);
}

export function parseCompoundInnerBlocksPreset(
	value?: string,
): CompoundInnerBlocksPresetId | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const normalizedValue = value.trim();
	if (normalizedValue.length === 0) {
		return undefined;
	}

	if (!isCompoundInnerBlocksPresetId(normalizedValue)) {
		throw new Error(
			`Unsupported InnerBlocks preset "${value}". Expected one of: ${COMPOUND_INNER_BLOCKS_PRESET_IDS.join(", ")}.`,
		);
	}

	return normalizedValue;
}

export function resolveCompoundInnerBlocksPreset(
	value?: CompoundInnerBlocksPresetId,
): CompoundInnerBlocksPresetId {
	return value ?? DEFAULT_COMPOUND_INNER_BLOCKS_PRESET_ID;
}

export function getCompoundInnerBlocksPresetDefinition(
	value?: CompoundInnerBlocksPresetId,
): CompoundInnerBlocksPresetDefinition {
	return COMPOUND_INNER_BLOCKS_PRESET_REGISTRY[
		resolveCompoundInnerBlocksPreset(value)
	];
}
