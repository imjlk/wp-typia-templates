export interface TemplateDefinition {
	id: "basic" | "full" | "interactivity" | "advanced";
	description: string;
	defaultCategory: string;
	features: string[];
	templateDir: string;
}

export const TEMPLATE_REGISTRY: readonly TemplateDefinition[];
export const TEMPLATE_IDS: Array<TemplateDefinition["id"]>;

export function listTemplates(): readonly TemplateDefinition[];
export function getTemplateById(templateId: string): TemplateDefinition;
export function getTemplateSelectOptions(): Array<{
	label: TemplateDefinition["id"];
	value: TemplateDefinition["id"];
	hint: string;
}>;
