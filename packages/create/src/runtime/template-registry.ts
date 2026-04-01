import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function resolvePackageRoot(startDir: string): string {
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

export const CREATE_PACKAGE_ROOT = resolvePackageRoot(__dirname);
export const TEMPLATE_ROOT = path.join(CREATE_PACKAGE_ROOT, "templates");
export const SHARED_TEMPLATE_ROOT = path.join(TEMPLATE_ROOT, "_shared");
export const SHARED_BASE_TEMPLATE_ROOT = path.join(SHARED_TEMPLATE_ROOT, "base");
export const SHARED_COMPOUND_TEMPLATE_ROOT = path.join(SHARED_TEMPLATE_ROOT, "compound");
export const SHARED_PERSISTENCE_TEMPLATE_ROOT = path.join(SHARED_TEMPLATE_ROOT, "persistence");
export const BUILTIN_TEMPLATE_IDS = ["basic", "interactivity", "persistence", "compound"] as const;
export type BuiltInTemplateId = (typeof BUILTIN_TEMPLATE_IDS)[number];
export type PersistencePolicy = "authenticated" | "public";

export interface TemplateDefinition {
	id: BuiltInTemplateId;
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
		id: "interactivity",
		description: "An interactive WordPress block with Typia validation and Interactivity API",
		defaultCategory: "widgets",
		features: ["Interactivity API", "Client-side state", "Event handling"],
		templateDir: path.join(TEMPLATE_ROOT, "interactivity"),
	},
	{
		id: "persistence",
		description: "A persistence-aware WordPress block with Typia validation, typed REST contracts, and selectable public or authenticated write policies",
		defaultCategory: "widgets",
		features: ["Interactivity API", "Typed REST client", "Schema sync", "Persistence policies"],
		templateDir: path.join(TEMPLATE_ROOT, "persistence"),
	},
	{
		id: "compound",
		description: "A parent-and-child WordPress block scaffold with InnerBlocks, optional persistence wiring, and hidden implementation child blocks",
		defaultCategory: "widgets",
		features: ["InnerBlocks", "Hidden child blocks", "Optional persistence layer"],
		templateDir: path.join(TEMPLATE_ROOT, "compound"),
	},
]);

export const TEMPLATE_IDS = TEMPLATE_REGISTRY.map((template) => template.id) as BuiltInTemplateId[];

export function isBuiltInTemplateId(templateId: string): templateId is BuiltInTemplateId {
	return (BUILTIN_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

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
