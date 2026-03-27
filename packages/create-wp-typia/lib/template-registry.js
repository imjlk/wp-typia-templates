import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.join(__dirname, "..", "templates");

export const TEMPLATE_REGISTRY = Object.freeze([
	{
		id: "basic",
		description: "A lightweight WordPress block with Typia validation",
		defaultCategory: "text",
		features: ["Type-safe attributes", "Runtime validation", "Minimal setup"],
		templateDir: path.join(TEMPLATE_ROOT, "basic"),
	},
	{
		id: "full",
		description: "A full-featured WordPress block with Typia validation and utilities",
		defaultCategory: "widgets",
		features: ["Advanced controls", "Custom hooks", "Style options"],
		templateDir: path.join(TEMPLATE_ROOT, "full"),
	},
	{
		id: "interactivity",
		description: "An interactive WordPress block with Typia validation and Interactivity API",
		defaultCategory: "widgets",
		features: ["Interactivity API", "Client-side state", "Event handling"],
		templateDir: path.join(TEMPLATE_ROOT, "interactivity"),
	},
	{
		id: "advanced",
		description: "An advanced WordPress block with Typia validation and migration tooling",
		defaultCategory: "widgets",
		features: ["Migration system", "Version tracking", "Admin dashboard"],
		templateDir: path.join(TEMPLATE_ROOT, "advanced"),
	},
]);

export const TEMPLATE_IDS = TEMPLATE_REGISTRY.map((template) => template.id);

export function listTemplates() {
	return TEMPLATE_REGISTRY;
}

export function getTemplateById(templateId) {
	const template = TEMPLATE_REGISTRY.find((entry) => entry.id === templateId);
	if (!template) {
		throw new Error(`Unknown template "${templateId}". Expected one of: ${TEMPLATE_IDS.join(", ")}`);
	}
	return template;
}

export function getTemplateSelectOptions() {
	return TEMPLATE_REGISTRY.map((template) => ({
		label: template.id,
		value: template.id,
		hint: template.features.join(", "),
	}));
}
