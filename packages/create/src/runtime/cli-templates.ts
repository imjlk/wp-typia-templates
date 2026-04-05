import { getBuiltInTemplateLayerDirs } from "./template-builtins.js";
import {
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
} from "./template-registry.js";
import type { TemplateDefinition } from "./template-registry.js";

export function formatTemplateSummary(template: TemplateDefinition): string {
	return `${template.id.padEnd(14)} ${template.description}`;
}

export function formatTemplateFeatures(template: TemplateDefinition): string {
	return `  ${template.features.join(" • ")}`;
}

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
