import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolvePackageRoot(startDir: string): string {
	let currentDir = startDir;

	while (true) {
		const packageJsonPath = path.join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { name?: string };
				if (packageJson.name === "@wp-typia/create") {
					return currentDir;
				}
			} catch {
				// Ignore malformed package.json while walking upward.
			}
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			throw new Error("Unable to resolve the @wp-typia/create package root.");
		}
		currentDir = parentDir;
	}
}

const TEMPLATE_ROOT = path.join(resolvePackageRoot(__dirname), "templates");

export interface TemplateDefinition {
	id: "basic" | "full" | "interactivity" | "advanced";
	description: string;
	defaultCategory: string;
	features: string[];
	templateDir: string;
}

export const TEMPLATE_REGISTRY = Object.freeze<TemplateDefinition[]>([
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

export const TEMPLATE_IDS = TEMPLATE_REGISTRY.map((template) => template.id) as TemplateDefinition["id"][];

export function listTemplates(): readonly TemplateDefinition[] {
	return TEMPLATE_REGISTRY;
}

export function getTemplateById(templateId: string): TemplateDefinition {
	const template = TEMPLATE_REGISTRY.find((entry) => entry.id === templateId);
	if (!template) {
		throw new Error(`Unknown template "${templateId}". Expected one of: ${TEMPLATE_IDS.join(", ")}`);
	}
	return template;
}

export function getTemplateSelectOptions(): Array<{
	label: string;
	value: TemplateDefinition["id"];
	hint: string;
}> {
	return TEMPLATE_REGISTRY.map((template) => ({
		label: template.id,
		value: template.id,
		hint: template.features.join(", "),
	}));
}
