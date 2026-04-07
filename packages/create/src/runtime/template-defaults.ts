export const BUILTIN_BLOCK_METADATA_VERSION = "0.1.0";

export const BUILTIN_TEMPLATE_METADATA_DEFAULTS = Object.freeze({
	basic: Object.freeze({
		category: "text",
		icon: "smiley",
	}),
	interactivity: Object.freeze({
		category: "widgets",
		icon: "smiley",
	}),
	persistence: Object.freeze({
		category: "widgets",
		icon: "database",
	}),
	compound: Object.freeze({
		category: "widgets",
		icon: "screenoptions",
	}),
});

export const COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS = Object.freeze({
	category: "widgets",
	icon: "excerpt-view",
});

export const REMOVED_BUILTIN_TEMPLATE_IDS = ["data", "persisted"] as const;
export type RemovedBuiltInTemplateId = (typeof REMOVED_BUILTIN_TEMPLATE_IDS)[number];

export function getBuiltInTemplateMetadataDefaults(
	templateId: keyof typeof BUILTIN_TEMPLATE_METADATA_DEFAULTS,
) {
	return BUILTIN_TEMPLATE_METADATA_DEFAULTS[templateId];
}

export function isRemovedBuiltInTemplateId(
	templateId: string,
): templateId is RemovedBuiltInTemplateId {
	return (REMOVED_BUILTIN_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

export function getRemovedBuiltInTemplateMessage(templateId: RemovedBuiltInTemplateId): string {
	return `Built-in template "${templateId}" was removed. Use --template persistence --persistence-policy ${
		templateId === "data" ? "public" : "authenticated"
	} instead.`;
}
