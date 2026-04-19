import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	getTemplateById,
	getTemplateSelectOptions,
	isBuiltInTemplateId,
	listTemplates,
} from "./template-registry.js";
import type { TemplateDefinition } from "./template-registry.js";

const WORKSPACE_TEMPLATE_ALIAS = "workspace";

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
 * Format the feature and capability hint lines shown under a template summary.
 *
 * @param template Template metadata including the `features` list.
 * @returns Indented feature and capability text for CLI list output.
 */
export function formatTemplateFeatures(template: TemplateDefinition): string {
	const lines = [`  Features: ${template.features.join(" • ")}`];
	const capabilityHints = getTemplateCapabilityHints(template);
	if (capabilityHints.length > 0) {
		lines.push(`  Supports: ${capabilityHints.join(" • ")}`);
	}
	if (template.id === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE) {
		lines.push(
			`  Alias: ${WORKSPACE_TEMPLATE_ALIAS} (\`--template ${WORKSPACE_TEMPLATE_ALIAS}\`)`,
		);
	}
	return lines.join("\n");
}

/**
 * Format the detailed template description for `templates inspect`.
 *
 * This expands special layer combinations for the `persistence` and `compound`
 * templates and returns a multi-line block centered on human-facing identity,
 * capabilities, and logical layer composition.
 *
 * @param template Template metadata including `id`, `defaultCategory`,
 * `templateDir`, and `features`.
 * @returns Multi-line template details text for CLI output.
 */
export function formatTemplateDetails(template: TemplateDefinition): string {
	const detailLines = [
		template.id,
		`Summary: ${template.description}`,
		...getTemplateIdentityLines(template),
		`Category: ${template.defaultCategory}`,
	];
	const capabilityHints = getTemplateCapabilityHints(template);
	if (capabilityHints.length > 0) {
		detailLines.push("Capabilities:");
		for (const capabilityHint of capabilityHints) {
			detailLines.push(`  - ${capabilityHint}`);
		}
	}
	detailLines.push("Logical layers:");
	for (const logicalLayer of getTemplateLogicalLayerSummaries(template)) {
		detailLines.push(`  - ${logicalLayer}`);
	}
	detailLines.push(`Features: ${template.features.join(", ")}`);

	return detailLines.join("\n");
}

function getTemplateCapabilityHints(template: TemplateDefinition): string[] {
	if (template.id === "persistence" || template.id === "compound") {
		return ["--data-storage", "--persistence-policy", "external layers"];
	}
	if (template.id === "query-loop") {
		return ["--query-post-type", "external layers"];
	}
	if (isBuiltInTemplateId(template.id)) {
		return ["external layers"];
	}

	return [];
}

function getTemplateIdentityLines(template: TemplateDefinition): string[] {
	if (template.id === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE) {
		return [
			"Identity:",
			`  - Official package: ${OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE}`,
			`  - Alias: ${WORKSPACE_TEMPLATE_ALIAS} (\`--template ${WORKSPACE_TEMPLATE_ALIAS}\`)`,
			"Type: official workspace scaffold",
		];
	}

	return [
		"Identity:",
		`  - Built-in template id: ${template.id}`,
		"Type: built-in block scaffold",
	];
}

function getTemplateLogicalLayerSummaries(template: TemplateDefinition): string[] {
	if (!isBuiltInTemplateId(template.id)) {
		return ["workspace package scaffold"];
	}

	if (template.id === "persistence") {
		return [
			"authenticated write policy: shared/base -> rest helpers (shared) -> persistence core -> authenticated write policy -> persistence overlay",
			"public write policy: shared/base -> rest helpers (shared) -> persistence core -> public write policy -> persistence overlay",
		];
	}

	if (template.id === "compound") {
		return [
			"pure block family: shared/base -> compound core -> compound overlay",
			"authenticated persistence: shared/base -> compound core -> rest helpers (shared) -> compound persistence core -> authenticated write policy -> compound overlay",
			"public persistence: shared/base -> compound core -> rest helpers (shared) -> compound persistence core -> public write policy -> compound overlay",
		];
	}

	const overlayName = template.id === "query-loop" ? "query-loop overlay" : `${template.id} overlay`;
	return [
		`shared/base -> ${overlayName}`,
	];
}

export { getTemplateById, getTemplateSelectOptions, listTemplates };
export { isBuiltInTemplateId };
