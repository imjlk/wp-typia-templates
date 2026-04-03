import type {
	JsonValue,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
} from "./migration-types.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";

interface StarterAttributeDefinition {
	constraints?: Partial<ManifestConstraints>;
	defaultValue?: JsonValue;
	enumValues?: Array<string | number | boolean> | null;
	kind: ManifestAttribute["ts"]["kind"];
	required: boolean;
	sourceType: NonNullable<ManifestAttribute["wp"]["type"]>;
}

const ALIGNMENT_VALUES = ["left", "center", "right", "justify"] as const;
const INTERACTIVE_MODE_VALUES = ["click", "hover", "auto"] as const;
const ANIMATION_VALUES = ["none", "bounce", "pulse", "shake", "flip"] as const;

function createConstraints(
	overrides: Partial<ManifestConstraints> = {},
): ManifestConstraints {
	return {
		exclusiveMaximum: null,
		exclusiveMinimum: null,
		format: null,
		maxLength: null,
		maxItems: null,
		maximum: null,
		minLength: null,
		minItems: null,
		minimum: null,
		multipleOf: null,
		pattern: null,
		typeTag: null,
		...overrides,
	};
}

function createAttribute({
	constraints,
	defaultValue,
	enumValues = null,
	kind,
	required,
	sourceType,
}: StarterAttributeDefinition): ManifestAttribute {
	const hasDefault = defaultValue !== undefined;

	return {
		ts: {
			items: null,
			kind,
			properties: null,
			required,
			union: null,
		},
		typia: {
			constraints: createConstraints(constraints),
			defaultValue: hasDefault ? defaultValue : null,
			hasDefault,
		},
		wp: {
			defaultValue: hasDefault ? defaultValue : null,
			enum: enumValues,
			hasDefault,
			type: sourceType,
		},
	};
}

function createManifest(
	sourceType: string,
	attributes: Record<string, ManifestAttribute>,
): ManifestDocument {
	return {
		attributes,
		manifestVersion: 2,
		sourceType,
	};
}

function buildBasicStarterManifest(
	variables: ScaffoldTemplateVariables,
): ManifestDocument {
	return createManifest(`${variables.pascalCase}Attributes`, {
		alignment: createAttribute({
			defaultValue: "left",
			enumValues: [...ALIGNMENT_VALUES],
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		className: createAttribute({
			constraints: {
				maxLength: 100,
			},
			defaultValue: "",
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		content: createAttribute({
			constraints: {
				maxLength: 1000,
				minLength: 1,
			},
			defaultValue: "",
			kind: "string",
			required: true,
			sourceType: "string",
		}),
		id: createAttribute({
			constraints: {
				format: "uuid",
			},
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		isVisible: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
		version: createAttribute({
			constraints: {
				typeTag: "uint32",
			},
			defaultValue: 1,
			kind: "number",
			required: false,
			sourceType: "number",
		}),
	});
}

function buildInteractivityStarterManifest(
	variables: ScaffoldTemplateVariables,
): ManifestDocument {
	return createManifest(`${variables.pascalCase}Attributes`, {
		alignment: createAttribute({
			defaultValue: "left",
			enumValues: [...ALIGNMENT_VALUES],
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		animation: createAttribute({
			defaultValue: "none",
			enumValues: [...ANIMATION_VALUES],
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		autoPlayInterval: createAttribute({
			constraints: {
				minimum: 0,
				typeTag: "uint32",
			},
			defaultValue: 0,
			kind: "number",
			required: false,
			sourceType: "number",
		}),
		clickCount: createAttribute({
			constraints: {
				minimum: 0,
				typeTag: "uint32",
			},
			defaultValue: 0,
			kind: "number",
			required: false,
			sourceType: "number",
		}),
		content: createAttribute({
			constraints: {
				maxLength: 1000,
				minLength: 1,
			},
			defaultValue: "",
			kind: "string",
			required: true,
			sourceType: "string",
		}),
		interactiveMode: createAttribute({
			defaultValue: "click",
			enumValues: [...INTERACTIVE_MODE_VALUES],
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		isAnimating: createAttribute({
			defaultValue: false,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
		isVisible: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
		maxClicks: createAttribute({
			constraints: {
				minimum: 0,
				typeTag: "uint32",
			},
			defaultValue: 10,
			kind: "number",
			required: false,
			sourceType: "number",
		}),
		showCounter: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
		uniqueId: createAttribute({
			defaultValue: "",
			kind: "string",
			required: false,
			sourceType: "string",
		}),
	});
}

function buildPersistenceStarterManifest(
	variables: ScaffoldTemplateVariables,
): ManifestDocument {
	return createManifest(`${variables.pascalCase}Attributes`, {
		alignment: createAttribute({
			defaultValue: "left",
			enumValues: [...ALIGNMENT_VALUES],
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		buttonLabel: createAttribute({
			constraints: {
				maxLength: 40,
				minLength: 1,
			},
			defaultValue: "Persist Count",
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		content: createAttribute({
			constraints: {
				maxLength: 250,
				minLength: 1,
			},
			defaultValue: `${variables.title} persistence block`,
			kind: "string",
			required: true,
			sourceType: "string",
		}),
		isVisible: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
		resourceKey: createAttribute({
			constraints: {
				maxLength: 100,
				minLength: 1,
			},
			defaultValue: "primary",
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		showCount: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
	});
}

function buildCompoundParentStarterManifest(
	variables: ScaffoldTemplateVariables,
): ManifestDocument {
	const attributes: Record<string, ManifestAttribute> = {
		heading: createAttribute({
			constraints: {
				maxLength: 80,
				minLength: 1,
			},
			defaultValue: variables.title,
			kind: "string",
			required: true,
			sourceType: "string",
		}),
		intro: createAttribute({
			constraints: {
				maxLength: 180,
				minLength: 1,
			},
			defaultValue: "Add and reorder internal items inside this compound block.",
			kind: "string",
			required: false,
			sourceType: "string",
		}),
		showDividers: createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		}),
	};

	if (variables.compoundPersistenceEnabled === "true") {
		attributes.showCount = createAttribute({
			defaultValue: true,
			kind: "boolean",
			required: false,
			sourceType: "boolean",
		});
		attributes.buttonLabel = createAttribute({
			constraints: {
				maxLength: 40,
				minLength: 1,
			},
			defaultValue: "Persist Count",
			kind: "string",
			required: false,
			sourceType: "string",
		});
		attributes.resourceKey = createAttribute({
			constraints: {
				maxLength: 100,
				minLength: 1,
			},
			defaultValue: "primary",
			kind: "string",
			required: false,
			sourceType: "string",
		});
	}

	return createManifest(`${variables.pascalCase}Attributes`, attributes);
}

function buildCompoundChildStarterManifest(
	variables: ScaffoldTemplateVariables,
): ManifestDocument {
	return createManifest(`${variables.pascalCase}ItemAttributes`, {
		body: createAttribute({
			constraints: {
				maxLength: 280,
				minLength: 1,
			},
			defaultValue: "Add supporting details for this internal item.",
			kind: "string",
			required: true,
			sourceType: "string",
		}),
		title: createAttribute({
			constraints: {
				maxLength: 80,
				minLength: 1,
			},
			defaultValue: variables.compoundChildTitle,
			kind: "string",
			required: true,
			sourceType: "string",
		}),
	});
}

export function getStarterManifestFiles(
	templateId: string,
	variables: ScaffoldTemplateVariables,
): Array<{
		document: ManifestDocument;
		relativePath: string;
	}> {
	if (templateId === "basic") {
		return [
			{
				document: buildBasicStarterManifest(variables),
				relativePath: "src/typia.manifest.json",
			},
		];
	}

	if (templateId === "interactivity") {
		return [
			{
				document: buildInteractivityStarterManifest(variables),
				relativePath: "src/typia.manifest.json",
			},
		];
	}

	if (templateId === "persistence") {
		return [
			{
				document: buildPersistenceStarterManifest(variables),
				relativePath: "src/typia.manifest.json",
			},
		];
	}

	if (templateId === "compound") {
		return [
			{
				document: buildCompoundParentStarterManifest(variables),
				relativePath: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
			},
			{
				document: buildCompoundChildStarterManifest(variables),
				relativePath: `src/blocks/${variables.slugKebabCase}-item/typia.manifest.json`,
			},
		];
	}

	return [];
}

export function stringifyStarterManifest(document: ManifestDocument): string {
	return `${JSON.stringify(document, null, "\t")}\n`;
}
