import type {
	JsonValue,
	ManifestAttribute,
	ManifestConstraints,
	ManifestDocument,
} from "./migration-types.js";
import type {
	ScaffoldTemplateVariables,
} from "./scaffold.js";
import type {
	BuiltInTemplateId,
} from "./template-registry.js";

const ALIGNMENT_VALUES = ["left", "center", "right"] as const;
const BASIC_ALIGNMENT_VALUES = ["left", "center", "right", "justify"] as const;
const INTERACTIVE_MODE_VALUES = ["click", "hover"] as const;
const ANIMATION_VALUES = ["none", "bounce", "pulse", "shake", "flip"] as const;
const DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER =
	"Add supporting details for this internal item.";

type StarterManifestSourceType = NonNullable<ManifestAttribute["wp"]["type"]>;
type WordPressAttributeSource = NonNullable<ManifestAttribute["wp"]["source"]>;

interface StarterManifestAttributeDefinition {
	constraints?: Partial<ManifestConstraints>;
	defaultValue?: JsonValue;
	enumValues?: Array<string | number | boolean> | null;
	kind: ManifestAttribute["ts"]["kind"];
	required: boolean;
	selector?: string | null;
	source?: WordPressAttributeSource | null;
	sourceType: StarterManifestSourceType;
}

interface BlockJsonAttributeDefinition {
	defaultValue?: JsonValue;
	enumValues?: Array<string | number | boolean> | null;
	selector?: string;
	source?: WordPressAttributeSource;
	type: StarterManifestSourceType;
}

interface AttributeDescription {
	lines: string[];
}

interface EmittedAttributeDefinition {
	blockJson: BlockJsonAttributeDefinition;
	description?: AttributeDescription;
	manifest: StarterManifestAttributeDefinition;
	name: string;
	optional: boolean;
	typeExpression: string;
}

interface InterfaceMemberDefinition {
	description?: AttributeDescription;
	name: string;
	optional?: boolean;
	typeExpression: string;
}

interface InterfaceDefinition {
	description?: AttributeDescription;
	members: InterfaceMemberDefinition[];
	name: string;
}

interface TypeAliasDefinition {
	name: string;
	value: string;
}

export interface BuiltInBlockArtifact {
	blockJsonDocument: Record<string, unknown>;
	manifestDocument: ManifestDocument;
	relativeDir: string;
	typesSource: string;
}

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

function createManifestAttribute({
	constraints,
	defaultValue,
	enumValues = null,
	kind,
	required,
	selector = null,
	source = null,
	sourceType,
}: StarterManifestAttributeDefinition): ManifestAttribute {
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
			...(selector ? { selector } : {}),
			...(source ? { source } : {}),
			type: sourceType,
		},
	};
}

function createBlockJsonAttribute({
	defaultValue,
	enumValues = null,
	selector,
	source,
	type,
}: BlockJsonAttributeDefinition): Record<string, unknown> {
	const attribute: Record<string, unknown> = {
		type,
	};

	if (defaultValue !== undefined) {
		attribute.default = defaultValue;
	}
	if (enumValues !== null && enumValues.length > 0) {
		attribute.enum = enumValues;
	}
	if (source) {
		attribute.source = source;
	}
	if (selector) {
		attribute.selector = selector;
	}

	return attribute;
}

function createAttributeDefinition({
	blockJson,
	description,
	manifest,
	name,
	optional,
	typeExpression,
}: EmittedAttributeDefinition): EmittedAttributeDefinition {
	return {
		blockJson,
		description,
		manifest,
		name,
		optional,
		typeExpression,
	};
}

function buildManifestDocument(
	sourceType: string,
	attributes: readonly EmittedAttributeDefinition[],
): ManifestDocument {
	return {
		attributes: Object.fromEntries(
			attributes.map((attribute) => [
				attribute.name,
				createManifestAttribute(attribute.manifest),
			]),
		),
		manifestVersion: 2,
		sourceType,
	};
}

function buildBlockJsonAttributes(
	attributes: readonly EmittedAttributeDefinition[],
): Record<string, Record<string, unknown>> {
	return Object.fromEntries(
		attributes.map((attribute) => [
			attribute.name,
			createBlockJsonAttribute(attribute.blockJson),
		]),
	);
}

function quote(value: string): string {
	return JSON.stringify(value);
}

function emitDocComment(
	description: AttributeDescription | undefined,
	indent = "",
): string[] {
	if (!description) {
		return [];
	}

	return [
		`${indent}/**`,
		...description.lines.map((line) =>
			line.length === 0 ? `${indent} *` : `${indent} * ${line}`,
		),
		`${indent} */`,
	];
}

function emitInterface(definition: InterfaceDefinition): string[] {
	const lines = [
		...emitDocComment(definition.description),
		`export interface ${definition.name} {`,
	];

	for (const member of definition.members) {
		lines.push(...emitDocComment(member.description, "\t"));
		lines.push(
			`\t${member.name}${member.optional ? "?" : ""}: ${member.typeExpression};`,
		);
	}

	lines.push("}");
	return lines;
}

function emitTypesModule({
	preambleLines,
	interfaces,
	typeAliases,
}: {
	preambleLines: string[];
	interfaces: InterfaceDefinition[];
	typeAliases: TypeAliasDefinition[];
}): string {
	const sections: string[] = [];

	if (preambleLines.length > 0) {
		sections.push(preambleLines.join("\n"));
	}

	for (const definition of interfaces) {
		sections.push(emitInterface(definition).join("\n"));
	}

	if (typeAliases.length > 0) {
		sections.push(
			typeAliases
				.map((alias) => `export type ${alias.name} = ${alias.value};`)
				.join("\n"),
		);
	}

	return `${sections.join("\n\n")}\n`;
}

function stringifyBlockJsonDocument(document: Record<string, unknown>): string {
	return `${JSON.stringify(document, null, "\t")}\n`;
}

function buildBasicAttributes(): EmittedAttributeDefinition[] {
	return [
		createAttributeDefinition({
			blockJson: {
				defaultValue: "",
				type: "string",
			},
			description: {
				lines: ["Main block content"],
			},
			manifest: {
				constraints: {
					maxLength: 1000,
				},
				defaultValue: "",
				kind: "string",
				required: true,
				sourceType: "string",
			},
			name: "content",
			optional: false,
			typeExpression:
				'string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "left",
				enumValues: [...BASIC_ALIGNMENT_VALUES],
				type: "string",
			},
			description: {
				lines: ["Alignment"],
			},
			manifest: {
				defaultValue: "left",
				enumValues: [...BASIC_ALIGNMENT_VALUES],
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "alignment",
			optional: true,
			typeExpression: 'TextAlignment & tags.Default<"left">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			description: {
				lines: ["Visibility toggle"],
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "isVisible",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "",
				type: "string",
			},
			description: {
				lines: ["Custom CSS class"],
			},
			manifest: {
				constraints: {
					maxLength: 100,
				},
				defaultValue: "",
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "className",
			optional: true,
			typeExpression: 'string & tags.MaxLength<100> & tags.Default<"">',
		}),
		createAttributeDefinition({
			blockJson: {
				type: "string",
			},
			description: {
				lines: ["Generated runtime ID"],
			},
			manifest: {
				constraints: {
					format: "uuid",
				},
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "id",
			optional: true,
			typeExpression: 'string & tags.Format<"uuid">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: 1,
				type: "number",
			},
			description: {
				lines: ["Block version for migrations"],
			},
			manifest: {
				constraints: {
					typeTag: "uint32",
				},
				defaultValue: 1,
				kind: "number",
				required: false,
				sourceType: "number",
			},
			name: "schemaVersion",
			optional: true,
			typeExpression: 'number & tags.Type<"uint32"> & tags.Default<1>',
		}),
	];
}

function buildInteractivityAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	return [
		createAttributeDefinition({
			blockJson: {
				defaultValue: "",
				selector: `.${variables.cssClassName}__content`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 1000,
				},
				defaultValue: "",
				kind: "string",
				required: true,
				selector: `.${variables.cssClassName}__content`,
				source: "html",
				sourceType: "string",
			},
			name: "content",
			optional: false,
			typeExpression:
				'string & tags.MinLength<1> & tags.MaxLength<1000> & tags.Default<"">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "left",
				enumValues: [...ALIGNMENT_VALUES],
				type: "string",
			},
			manifest: {
				defaultValue: "left",
				enumValues: [...ALIGNMENT_VALUES],
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "alignment",
			optional: true,
			typeExpression: 'TextAlignment & tags.Default<"left">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "isVisible",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "click",
				enumValues: [...INTERACTIVE_MODE_VALUES],
				type: "string",
			},
			manifest: {
				defaultValue: "click",
				enumValues: [...INTERACTIVE_MODE_VALUES],
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "interactiveMode",
			optional: true,
			typeExpression: '("click" | "hover") & tags.Default<"click">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "none",
				enumValues: [...ANIMATION_VALUES],
				type: "string",
			},
			manifest: {
				defaultValue: "none",
				enumValues: [...ANIMATION_VALUES],
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "animation",
			optional: true,
			typeExpression:
				'("none" | "bounce" | "pulse" | "shake" | "flip") & tags.Default<"none">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: 0,
				type: "number",
			},
			manifest: {
				constraints: {
					minimum: 0,
					typeTag: "uint32",
				},
				defaultValue: 0,
				kind: "number",
				required: false,
				sourceType: "number",
			},
			name: "clickCount",
			optional: true,
			typeExpression: 'number & tags.Minimum<0> & tags.Type<"uint32"> & tags.Default<0>',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: false,
				type: "boolean",
			},
			manifest: {
				defaultValue: false,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "isAnimating",
			optional: true,
			typeExpression: "boolean & tags.Default<false>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "showCounter",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: 10,
				type: "number",
			},
			manifest: {
				constraints: {
					minimum: 0,
					typeTag: "uint32",
				},
				defaultValue: 10,
				kind: "number",
				required: false,
				sourceType: "number",
			},
			name: "maxClicks",
			optional: true,
			typeExpression: 'number & tags.Minimum<0> & tags.Type<"uint32"> & tags.Default<10>',
		}),
	];
}

function buildPersistenceAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	return [
		createAttributeDefinition({
			blockJson: {
				defaultValue: `${variables.title} persistence block`,
				selector: `.${variables.cssClassName}__content`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 250,
					minLength: 1,
				},
				defaultValue: `${variables.title} persistence block`,
				kind: "string",
				required: true,
				selector: `.${variables.cssClassName}__content`,
				source: "html",
				sourceType: "string",
			},
			name: "content",
			optional: false,
			typeExpression:
				`string & tags.MinLength<1> & tags.MaxLength<250> & tags.Default<${quote(`${variables.title} persistence block`)}>`,
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "left",
				enumValues: [...ALIGNMENT_VALUES],
				type: "string",
			},
			manifest: {
				defaultValue: "left",
				enumValues: [...ALIGNMENT_VALUES],
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "alignment",
			optional: true,
			typeExpression: 'TextAlignment & tags.Default<"left">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "isVisible",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "showCount",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "Persist Count",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 40,
					minLength: 1,
				},
				defaultValue: "Persist Count",
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "buttonLabel",
			optional: true,
			typeExpression:
				'string & tags.MinLength<1> & tags.MaxLength<40> & tags.Default<"Persist Count">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 100,
					minLength: 1,
				},
				defaultValue: "primary",
				kind: "string",
				required: false,
				sourceType: "string",
			},
			name: "resourceKey",
			optional: true,
			typeExpression:
				'string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"primary">',
		}),
	];
}

function buildCompoundParentAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	const attributes: EmittedAttributeDefinition[] = [
		createAttributeDefinition({
			blockJson: {
				defaultValue: variables.title,
				selector: `.${variables.cssClassName}__heading`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 80,
					minLength: 1,
				},
				defaultValue: variables.title,
				kind: "string",
				required: true,
				selector: `.${variables.cssClassName}__heading`,
				source: "html",
				sourceType: "string",
			},
			name: "heading",
			optional: false,
			typeExpression:
				`string & tags.MinLength<1> & tags.MaxLength<80> & tags.Default<${quote(variables.title)}>`,
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: "Add and reorder internal items inside this compound block.",
				selector: `.${variables.cssClassName}__intro`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 180,
					minLength: 1,
				},
				defaultValue: "Add and reorder internal items inside this compound block.",
				kind: "string",
				required: false,
				selector: `.${variables.cssClassName}__intro`,
				source: "html",
				sourceType: "string",
			},
			name: "intro",
			optional: true,
			typeExpression:
				'string & tags.MinLength<1> & tags.MaxLength<180> & tags.Default<"Add and reorder internal items inside this compound block.">',
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: true,
				type: "boolean",
			},
			manifest: {
				defaultValue: true,
				kind: "boolean",
				required: false,
				sourceType: "boolean",
			},
			name: "showDividers",
			optional: true,
			typeExpression: "boolean & tags.Default<true>",
		}),
	];

	if (variables.compoundPersistenceEnabled === "true") {
		attributes.push(
			createAttributeDefinition({
				blockJson: {
					defaultValue: true,
					type: "boolean",
				},
				manifest: {
					defaultValue: true,
					kind: "boolean",
					required: false,
					sourceType: "boolean",
				},
				name: "showCount",
				optional: true,
				typeExpression: "boolean & tags.Default<true>",
			}),
			createAttributeDefinition({
				blockJson: {
					defaultValue: "Persist Count",
					type: "string",
				},
				manifest: {
					constraints: {
						maxLength: 40,
						minLength: 1,
					},
					defaultValue: "Persist Count",
					kind: "string",
					required: false,
					sourceType: "string",
				},
				name: "buttonLabel",
				optional: true,
				typeExpression:
					'string & tags.MinLength<1> & tags.MaxLength<40> & tags.Default<"Persist Count">',
			}),
			createAttributeDefinition({
				blockJson: {
					defaultValue: "",
					type: "string",
				},
				manifest: {
					constraints: {
						maxLength: 100,
						minLength: 1,
					},
					defaultValue: "primary",
					kind: "string",
					required: false,
					sourceType: "string",
				},
				name: "resourceKey",
				optional: true,
				typeExpression:
					'string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"primary">',
			}),
		);
	}

	return attributes;
}

function buildCompoundChildAttributes(
	bodyPlaceholder = DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER,
	childTitle: string,
	childCssClassName: string,
): EmittedAttributeDefinition[] {
	return [
		createAttributeDefinition({
			blockJson: {
				defaultValue: childTitle,
				selector: `.${childCssClassName}__title`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 80,
					minLength: 1,
				},
				defaultValue: childTitle,
				kind: "string",
				required: true,
				selector: `.${childCssClassName}__title`,
				source: "html",
				sourceType: "string",
			},
			name: "title",
			optional: false,
			typeExpression:
				`string & tags.MinLength<1> & tags.MaxLength<80> & tags.Default<${quote(childTitle)}>`,
		}),
		createAttributeDefinition({
			blockJson: {
				defaultValue: bodyPlaceholder,
				selector: `.${childCssClassName}__body`,
				source: "html",
				type: "string",
			},
			manifest: {
				constraints: {
					maxLength: 280,
					minLength: 1,
				},
				defaultValue: bodyPlaceholder,
				kind: "string",
				required: true,
				selector: `.${childCssClassName}__body`,
				source: "html",
				sourceType: "string",
			},
			name: "body",
			optional: false,
			typeExpression:
				`string & tags.MinLength<1> & tags.MaxLength<280> & tags.Default<${quote(bodyPlaceholder)}>`,
		}),
	];
}

function buildBasicTypesSource(
	variables: ScaffoldTemplateVariables,
	attributes: readonly EmittedAttributeDefinition[],
): string {
	return emitTypesModule({
		preambleLines: [
			'import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";',
			"import type {",
			"\tTypiaValidationError,",
			"\tValidationResult,",
			'} from "@wp-typia/block-runtime/validation";',
			'import { tags } from "typia";',
			"",
			'export type { TypiaValidationError, ValidationResult } from "@wp-typia/block-runtime/validation";',
		],
		interfaces: [
			{
				description: {
					lines: [
						"Block attributes interface",
						"Typia tags define runtime validation rules",
					],
				},
				members: attributes.map((attribute) => ({
					description: attribute.description,
					name: attribute.name,
					optional: attribute.optional,
					typeExpression: attribute.typeExpression,
				})),
				name: `${variables.pascalCase}Attributes`,
			},
		],
		typeAliases: [
			{
				name: `${variables.pascalCase}ValidationResult`,
				value: `ValidationResult<${variables.pascalCase}Attributes>`,
			},
		],
	});
}

function buildInteractivityTypesSource(
	variables: ScaffoldTemplateVariables,
	attributes: readonly EmittedAttributeDefinition[],
): string {
	return emitTypesModule({
		preambleLines: [
			'import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";',
			"import type {",
			"\tTypiaValidationError,",
			"\tValidationResult,",
			'} from "@wp-typia/block-runtime/validation";',
			'import { tags } from "typia";',
			"",
			'export type { TypiaValidationError, ValidationResult } from "@wp-typia/block-runtime/validation";',
		],
		interfaces: [
			{
				members: attributes.map((attribute) => ({
					name: attribute.name,
					optional: attribute.optional,
					typeExpression: attribute.typeExpression,
				})),
				name: `${variables.pascalCase}Attributes`,
			},
			{
				members: [
					{
						name: "clicks",
						typeExpression: "number",
					},
					{
						name: "isAnimating",
						typeExpression: "boolean",
					},
					{
						name: "isVisible",
						typeExpression: "boolean",
					},
					{
						name: "animation",
						typeExpression: '"none" | "bounce" | "pulse" | "shake" | "flip"',
					},
					{
						name: "maxClicks",
						typeExpression: "number",
					},
				],
				name: `${variables.pascalCase}Context`,
			},
		],
		typeAliases: [
			{
				name: `${variables.pascalCase}ValidationResult`,
				value: `ValidationResult<${variables.pascalCase}Attributes>`,
			},
		],
	});
}

function buildPersistenceTypesSource(
	variables: ScaffoldTemplateVariables,
	attributes: readonly EmittedAttributeDefinition[],
): string {
	return emitTypesModule({
		preambleLines: [
			'import type { TextAlignment } from "@wp-typia/block-types/block-editor/alignment";',
			"import type {",
			"\tTypiaValidationError,",
			"\tValidationResult,",
			'} from "@wp-typia/block-runtime/validation";',
			'import { tags } from "typia";',
			"",
			'export type { TypiaValidationError, ValidationResult } from "@wp-typia/block-runtime/validation";',
		],
		interfaces: [
			{
				members: attributes.map((attribute) => ({
					name: attribute.name,
					optional: attribute.optional,
					typeExpression: attribute.typeExpression,
				})),
				name: `${variables.pascalCase}Attributes`,
			},
			{
				members: [
					{ name: "buttonLabel", typeExpression: "string" },
					{ name: "bootstrapReady", typeExpression: "boolean" },
					{ name: "canWrite", typeExpression: "boolean" },
					{ name: "count", typeExpression: "number" },
					{ name: "error", typeExpression: "string" },
					{ name: "isBootstrapping", typeExpression: "boolean" },
					{ name: "isLoading", typeExpression: "boolean" },
					{ name: "isSaving", typeExpression: "boolean" },
					{
						name: "persistencePolicy",
						typeExpression: '"authenticated" | "public"',
					},
					{ name: "postId", typeExpression: "number" },
					{ name: "resourceKey", typeExpression: "string" },
					{
						name: "storage",
						typeExpression: '"post-meta" | "custom-table"',
					},
					{ name: "isVisible", typeExpression: "boolean" },
					{
						name: "client",
						optional: true,
						typeExpression: `${variables.pascalCase}ClientState`,
					},
				],
				name: `${variables.pascalCase}Context`,
			},
			{
				members: [
					{ name: "isHydrated", typeExpression: "boolean" },
				],
				name: `${variables.pascalCase}State`,
			},
			{
				members: [
					{ name: "bootstrapError", typeExpression: "string" },
					{ name: "writeExpiry", typeExpression: "number" },
					{ name: "writeNonce", typeExpression: "string" },
					{ name: "writeToken", typeExpression: "string" },
				],
				name: `${variables.pascalCase}ClientState`,
			},
		],
		typeAliases: [
			{
				name: `${variables.pascalCase}ValidationResult`,
				value: `ValidationResult<${variables.pascalCase}Attributes>`,
			},
		],
	});
}

function buildCompoundTypesSource(
	variables: ScaffoldTemplateVariables,
	attributes: readonly EmittedAttributeDefinition[],
): string {
	const persistenceEnabled = variables.compoundPersistenceEnabled === "true";

	return emitTypesModule({
		preambleLines: persistenceEnabled
			? [
				"import type {",
				"\tTypiaValidationError,",
				"\tValidationResult,",
				'} from "@wp-typia/block-runtime/validation";',
				'import { tags } from "typia";',
				"",
				'export type { TypiaValidationError, ValidationResult } from "@wp-typia/block-runtime/validation";',
			]
			: [
				'import type { ValidationResult } from "@wp-typia/block-runtime/validation";',
				'import { tags } from "typia";',
				"",
				'export type { ValidationResult } from "@wp-typia/block-runtime/validation";',
			],
		interfaces: [
			{
				members: attributes.map((attribute) => ({
					name: attribute.name,
					optional: attribute.optional,
					typeExpression: attribute.typeExpression,
				})),
				name: `${variables.pascalCase}Attributes`,
			},
			...(persistenceEnabled
				? [
					{
						members: [
							{ name: "buttonLabel", typeExpression: "string" },
							{ name: "bootstrapReady", typeExpression: "boolean" },
							{ name: "canWrite", typeExpression: "boolean" },
							{ name: "count", typeExpression: "number" },
							{ name: "error", typeExpression: "string" },
							{ name: "isBootstrapping", typeExpression: "boolean" },
							{ name: "isLoading", typeExpression: "boolean" },
							{ name: "isSaving", typeExpression: "boolean" },
							{
								name: "persistencePolicy",
								typeExpression: '"authenticated" | "public"',
							},
							{ name: "postId", typeExpression: "number" },
							{ name: "resourceKey", typeExpression: "string" },
							{ name: "showCount", typeExpression: "boolean" },
							{
								name: "storage",
								typeExpression: '"post-meta" | "custom-table"',
							},
							{
								name: "client",
								optional: true,
								typeExpression: `${variables.pascalCase}ClientState`,
							},
						],
						name: `${variables.pascalCase}Context`,
					},
					{
						members: [{ name: "isHydrated", typeExpression: "boolean" }],
						name: `${variables.pascalCase}State`,
					},
					{
						members: [
							{ name: "bootstrapError", typeExpression: "string" },
							{ name: "writeExpiry", typeExpression: "number" },
							{ name: "writeNonce", typeExpression: "string" },
							{ name: "writeToken", typeExpression: "string" },
						],
						name: `${variables.pascalCase}ClientState`,
					},
				]
				: []),
		],
		typeAliases: [
			{
				name: `${variables.pascalCase}ValidationResult`,
				value: `ValidationResult<${variables.pascalCase}Attributes>`,
			},
		],
	});
}

function buildCompoundChildTypesSource(
	variables: ScaffoldTemplateVariables,
	attributes: readonly EmittedAttributeDefinition[],
): string {
	return emitTypesModule({
		preambleLines: [
			'import type { ValidationResult } from "@wp-typia/block-runtime/validation";',
			'import { tags } from "typia";',
			"",
			'export type { ValidationResult } from "@wp-typia/block-runtime/validation";',
		],
		interfaces: [
			{
				members: attributes.map((attribute) => ({
					name: attribute.name,
					optional: attribute.optional,
					typeExpression: attribute.typeExpression,
				})),
				name: `${variables.pascalCase}ItemAttributes`,
			},
		],
		typeAliases: [
			{
				name: `${variables.pascalCase}ItemValidationResult`,
				value: `ValidationResult<${variables.pascalCase}ItemAttributes>`,
			},
		],
	});
}

function buildBasicArtifact(
	variables: ScaffoldTemplateVariables,
): BuiltInBlockArtifact {
	const attributes = buildBasicAttributes();
	return {
		blockJsonDocument: {
			$schema: "https://schemas.wp.org/trunk/block.json",
			apiVersion: 3,
			name: `${variables.namespace}/${variables.slug}`,
			version: variables.blockMetadataVersion,
			title: variables.title,
			category: variables.category,
			icon: variables.icon,
			description: variables.description,
			keywords: [variables.keyword, "typia", "block"],
			example: {
				attributes: {
					content: "Example content",
					alignment: "center",
					isVisible: true,
				},
			},
			supports: {
				html: false,
			},
			textdomain: variables.textDomain,
			editorScript: "file:./index.js",
			editorStyle: "file:./index.css",
			style: "file:./style-index.css",
			attributes: buildBlockJsonAttributes(attributes),
		},
		manifestDocument: buildManifestDocument(`${variables.pascalCase}Attributes`, attributes),
		relativeDir: "src",
		typesSource: buildBasicTypesSource(variables, attributes),
	};
}

function buildInteractivityArtifact(
	variables: ScaffoldTemplateVariables,
): BuiltInBlockArtifact {
	const attributes = buildInteractivityAttributes(variables);
	return {
		blockJsonDocument: {
			$schema: "https://schemas.wp.org/trunk/block.json",
			apiVersion: 3,
			name: `${variables.namespace}/${variables.slugKebabCase}`,
			version: variables.blockMetadataVersion,
			title: variables.title,
			category: variables.category,
			icon: variables.icon,
			description: variables.description,
			example: {},
			supports: {
				html: false,
				align: true,
				anchor: true,
				className: true,
				interactivity: true,
			},
			attributes: buildBlockJsonAttributes(attributes),
			textdomain: variables.textDomain,
			editorScript: "file:./index.js",
			editorStyle: "file:./index.css",
			style: "file:./style-index.css",
			viewScriptModule: "file:./interactivity.js",
		},
		manifestDocument: buildManifestDocument(`${variables.pascalCase}Attributes`, attributes),
		relativeDir: "src",
		typesSource: buildInteractivityTypesSource(variables, attributes),
	};
}

function buildPersistenceArtifact(
	variables: ScaffoldTemplateVariables,
): BuiltInBlockArtifact {
	const attributes = buildPersistenceAttributes(variables);
	return {
		blockJsonDocument: {
			$schema: "https://schemas.wp.org/trunk/block.json",
			apiVersion: 3,
			name: `${variables.namespace}/${variables.slugKebabCase}`,
			version: variables.blockMetadataVersion,
			title: variables.title,
			category: variables.category,
			icon: variables.icon,
			description: variables.description,
			example: {},
			supports: {
				html: false,
				align: true,
				anchor: true,
				className: true,
				interactivity: true,
			},
			attributes: buildBlockJsonAttributes(attributes),
			textdomain: variables.textDomain,
			editorScript: "file:./index.js",
			style: "file:./style-index.css",
			viewScriptModule: "file:./interactivity.js",
			render: "file:./render.php",
		},
		manifestDocument: buildManifestDocument(`${variables.pascalCase}Attributes`, attributes),
		relativeDir: "src",
		typesSource: buildPersistenceTypesSource(variables, attributes),
	};
}

function buildCompoundParentArtifact(
	variables: ScaffoldTemplateVariables,
): BuiltInBlockArtifact {
	const attributes = buildCompoundParentAttributes(variables);
	const persistenceEnabled = variables.compoundPersistenceEnabled === "true";

	return {
		blockJsonDocument: {
			$schema: "https://schemas.wp.org/trunk/block.json",
			apiVersion: 3,
			name: `${variables.namespace}/${variables.slugKebabCase}`,
			version: variables.blockMetadataVersion,
			title: variables.title,
			category: variables.category,
			icon: variables.icon,
			description: variables.description,
			example: {},
			supports: persistenceEnabled
				? {
					html: false,
					anchor: true,
					className: true,
					interactivity: true,
				}
				: {
					html: false,
					anchor: true,
					className: true,
				},
			attributes: buildBlockJsonAttributes(attributes),
			textdomain: variables.textDomain,
			editorScript: "file:./index.js",
			style: "file:./style-index.css",
			...(persistenceEnabled
				? {
					viewScriptModule: "file:./interactivity.js",
					render: "file:./render.php",
				}
				: {}),
		},
		manifestDocument: buildManifestDocument(`${variables.pascalCase}Attributes`, attributes),
		relativeDir: `src/blocks/${variables.slugKebabCase}`,
		typesSource: buildCompoundTypesSource(variables, attributes),
	};
}

function buildCompoundChildArtifact(
	variables: ScaffoldTemplateVariables,
	bodyPlaceholder = DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER,
): BuiltInBlockArtifact {
	const attributes = buildCompoundChildAttributes(
		bodyPlaceholder,
		variables.compoundChildTitle,
		variables.compoundChildCssClassName,
	);
	return {
		blockJsonDocument: {
			$schema: "https://schemas.wp.org/trunk/block.json",
			apiVersion: 3,
			name: `${variables.namespace}/${variables.slugKebabCase}-item`,
			version: variables.blockMetadataVersion,
			title: variables.compoundChildTitle,
			category: variables.compoundChildCategory,
			icon: variables.compoundChildIcon,
			description: `Internal item block used by ${variables.title}.`,
			parent: [`${variables.namespace}/${variables.slugKebabCase}`],
			example: {},
			supports: {
				html: false,
				inserter: false,
				reusable: false,
			},
			attributes: buildBlockJsonAttributes(attributes),
			textdomain: variables.textDomain,
			editorScript: "file:./index.js",
		},
		manifestDocument: buildManifestDocument(`${variables.pascalCase}ItemAttributes`, attributes),
		relativeDir: `src/blocks/${variables.slugKebabCase}-item`,
		typesSource: buildCompoundChildTypesSource(variables, attributes),
	};
}

export function buildCompoundChildStarterManifestDocument(
	childTypeName: string,
	childTitle: string,
	bodyPlaceholder = DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER,
): ManifestDocument {
	const attributes = buildCompoundChildAttributes(
		bodyPlaceholder,
		childTitle,
		"compound-child",
	);
	return buildManifestDocument(childTypeName, attributes);
}

export function buildBuiltInBlockArtifacts({
	templateId,
	variables,
}: {
	templateId: BuiltInTemplateId;
	variables: ScaffoldTemplateVariables;
}): BuiltInBlockArtifact[] {
	if (templateId === "basic") {
		return [buildBasicArtifact(variables)];
	}

	if (templateId === "interactivity") {
		return [buildInteractivityArtifact(variables)];
	}

	if (templateId === "persistence") {
		return [buildPersistenceArtifact(variables)];
	}

	if (templateId === "compound") {
		return [
			buildCompoundParentArtifact(variables),
			buildCompoundChildArtifact(variables),
		];
	}

	return [];
}

export function stringifyBuiltInBlockJsonDocument(
	document: Record<string, unknown>,
): string {
	return stringifyBlockJsonDocument(document);
}
