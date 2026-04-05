import { getBuiltInTemplateLayerDirs } from "./template-builtins.js";
import {
	getTemplateById,
	getTemplateSelectOptions,
	isBuiltInTemplateId,
	listTemplates,
} from "./template-registry.js";
import type { TemplateDefinition } from "./template-registry.js";

/**
 * Format one line of template list output for a built-in template.
 *
 * @param template Template metadata including `id` and `description`.
 * @returns One-line summary text for `templates list`.
 */
export function formatTemplateSummary(template: TemplateDefinition): string {
	return `${template.id.padEnd(14)} ${template.description}`;
}

/**
 * Format the feature hint line shown under a template summary.
 *
 * @param template Template metadata including the `features` list.
 * @returns Indented feature text for CLI list output.
 */
export function formatTemplateFeatures(template: TemplateDefinition): string {
	return `  ${template.features.join(" • ")}`;
}

/**
 * Format the detailed template description for `templates inspect`.
 *
 * This expands special layer combinations for the `persistence` and `compound`
 * templates and returns a multi-line block including category, overlay path,
 * resolved layers, and feature labels.
 *
 * @param template Template metadata including `id`, `defaultCategory`,
 * `templateDir`, and `features`.
 * @returns Multi-line template details text for CLI output.
 */
export function formatTemplateDetails(template: TemplateDefinition): string {
	const layers =
		template.id === "persistence"
			? [
					`authenticated: ${getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "authenticated" }).join(" -> ")}`,
					`public: ${getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "public" }).join(" -> ")}`,
				]
			: template.id === "compound"
				? [
						`pure: ${getBuiltInTemplateLayerDirs(template.id).join(" -> ")}`,
						`authenticated+persistence: ${getBuiltInTemplateLayerDirs(template.id, {
							persistenceEnabled: true,
							persistencePolicy: "authenticated",
						}).join(" -> ")}`,
						`public+persistence: ${getBuiltInTemplateLayerDirs(template.id, {
							persistenceEnabled: true,
							persistencePolicy: "public",
						}).join(" -> ")}`,
					]
				: [getBuiltInTemplateLayerDirs(template.id).join(" -> ")];
	return [
		template.id,
		template.description,
		`Category: ${template.defaultCategory}`,
		`Overlay path: ${template.templateDir}`,
		`Layers: ${layers.join("\n")}`,
		`Features: ${template.features.join(", ")}`,
	].join("\n");
}

export { getTemplateById, getTemplateSelectOptions, listTemplates };
export { isBuiltInTemplateId };
