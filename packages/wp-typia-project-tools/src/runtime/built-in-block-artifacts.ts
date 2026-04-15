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

interface BuiltInAttributeSpec {
	blockJsonDefaultValue?: JsonValue;
	constraints?: Partial<ManifestConstraints>;
	defaultValue?: JsonValue;
	description?: AttributeDescription;
	enumValues?: Array<string | number | boolean> | null;
	kind: ManifestAttribute["ts"]["kind"];
	manifestDefaultValue?: JsonValue;
	name: string;
	optional: boolean;
	selector?: string | null;
	source?: WordPressAttributeSource | null;
	sourceType: StarterManifestSourceType;
	typeExpression: string;
}

type BuiltInAttributeValueResolver<TContext, TValue> =
	| TValue
	| ((context: TContext) => TValue);

interface BuiltInAttributeTemplateSpec<TContext> {
	attributeType: "boolean" | "number" | "string";
	blockJsonDefaultValue?: BuiltInAttributeValueResolver<
		TContext,
		JsonValue | undefined
	>;
	constraints?: BuiltInAttributeValueResolver<
		TContext,
		Partial<ManifestConstraints> | undefined
	>;
	defaultValue?: BuiltInAttributeValueResolver<TContext, JsonValue | undefined>;
	description?: BuiltInAttributeValueResolver<
		TContext,
		AttributeDescription | undefined
	>;
	enumValues?: BuiltInAttributeValueResolver<
		TContext,
		Array<string | number | boolean> | null | undefined
	>;
	manifestDefaultValue?: BuiltInAttributeValueResolver<
		TContext,
		JsonValue | undefined
	>;
	name: string;
	optional: boolean;
	selector?: BuiltInAttributeValueResolver<TContext, string | null | undefined>;
	source?: BuiltInAttributeValueResolver<
		TContext,
		WordPressAttributeSource | null | undefined
	>;
	typeExpression: BuiltInAttributeValueResolver<TContext, string>;
}

interface CompoundChildAttributeVariables {
	bodyPlaceholder: string;
	childCssClassName?: string | null;
	childTitle: string;
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

function describe(...lines: string[]): AttributeDescription {
	return {
		lines,
	};
}

function defineAttribute({
	blockJsonDefaultValue,
	constraints,
	defaultValue,
	description,
	enumValues = null,
	kind,
	manifestDefaultValue,
	name,
	optional,
	selector = null,
	source = null,
	sourceType,
	typeExpression,
}: BuiltInAttributeSpec): EmittedAttributeDefinition {
	const resolvedBlockJsonDefaultValue =
		blockJsonDefaultValue !== undefined ? blockJsonDefaultValue : defaultValue;
	const resolvedManifestDefaultValue =
		manifestDefaultValue !== undefined ? manifestDefaultValue : defaultValue;

	return {
		blockJson: {
			defaultValue: resolvedBlockJsonDefaultValue,
			enumValues,
			...(selector ? { selector } : {}),
			...(source ? { source } : {}),
			type: sourceType,
		},
		description,
		manifest: {
			constraints,
			defaultValue: resolvedManifestDefaultValue,
			enumValues,
			kind,
			required: !optional,
			selector,
			source,
			sourceType,
		},
		name,
		optional,
		typeExpression,
	};
}

function defineStringAttribute(
	spec: Omit<BuiltInAttributeSpec, "kind" | "sourceType">,
): EmittedAttributeDefinition {
	return defineAttribute({
		...spec,
		kind: "string",
		sourceType: "string",
	});
}

function defineBooleanAttribute(
	spec: Omit<BuiltInAttributeSpec, "kind" | "sourceType">,
): EmittedAttributeDefinition {
	return defineAttribute({
		...spec,
		kind: "boolean",
		sourceType: "boolean",
	});
}

function defineNumberAttribute(
	spec: Omit<BuiltInAttributeSpec, "kind" | "sourceType">,
): EmittedAttributeDefinition {
	return defineAttribute({
		...spec,
		kind: "number",
		sourceType: "number",
	});
}

function resolveBuiltInAttributeValue<TContext, TValue>(
	value: BuiltInAttributeValueResolver<TContext, TValue> | undefined,
	context: TContext,
): TValue | undefined {
	if (typeof value === "function") {
		return (value as (context: TContext) => TValue)(context);
	}

	return value;
}

function buildAttributesFromSpecs<TContext>(
	specs: readonly BuiltInAttributeTemplateSpec<TContext>[],
	context: TContext,
): EmittedAttributeDefinition[] {
	return specs.map((spec) => {
		const resolvedSpec: Omit<BuiltInAttributeSpec, "kind" | "sourceType"> = {
			blockJsonDefaultValue: resolveBuiltInAttributeValue(
				spec.blockJsonDefaultValue,
				context,
			),
			constraints: resolveBuiltInAttributeValue(spec.constraints, context),
			defaultValue: resolveBuiltInAttributeValue(spec.defaultValue, context),
			description: resolveBuiltInAttributeValue(spec.description, context),
			enumValues: resolveBuiltInAttributeValue(spec.enumValues, context),
			manifestDefaultValue: resolveBuiltInAttributeValue(
				spec.manifestDefaultValue,
				context,
			),
			name: spec.name,
			optional: spec.optional,
			selector: resolveBuiltInAttributeValue(spec.selector, context),
			source: resolveBuiltInAttributeValue(spec.source, context),
			typeExpression: resolveBuiltInAttributeValue(
				spec.typeExpression,
				context,
			) ?? "unknown",
		};

		if (spec.attributeType === "boolean") {
			return defineBooleanAttribute(resolvedSpec);
		}

		if (spec.attributeType === "number") {
			return defineNumberAttribute(resolvedSpec);
		}

		return defineStringAttribute(resolvedSpec);
	});
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

const BASIC_ATTRIBUTE_SPECS = [
	{
		attributeType: "string",
		constraints: {
			maxLength: 1000,
		},
		defaultValue: "",
		description: describe("Main block content"),
		name: "content",
		optional: false,
		typeExpression: 'string & tags.MaxLength<1000> & tags.Default<"">',
	},
	{
		attributeType: "string",
		defaultValue: "left",
		description: describe("Alignment"),
		enumValues: [...BASIC_ALIGNMENT_VALUES],
		name: "alignment",
		optional: true,
		typeExpression: 'TextAlignment & tags.Default<"left">',
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		description: describe("Visibility toggle"),
		name: "isVisible",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "string",
		constraints: {
			maxLength: 100,
		},
		defaultValue: "",
		description: describe("Custom CSS class"),
		name: "className",
		optional: true,
		typeExpression: 'string & tags.MaxLength<100> & tags.Default<"">',
	},
	{
		attributeType: "string",
		constraints: {
			format: "uuid",
		},
		description: describe("Generated runtime ID"),
		name: "id",
		optional: true,
		typeExpression: 'string & tags.Format<"uuid">',
	},
	{
		attributeType: "number",
		constraints: {
			typeTag: "uint32",
		},
		defaultValue: 1,
		description: describe("Block version for migrations"),
		name: "schemaVersion",
		optional: true,
		typeExpression: 'number & tags.Type<"uint32"> & tags.Default<1>',
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<void>[];

const INTERACTIVITY_ATTRIBUTE_SPECS = [
	{
		attributeType: "string",
		constraints: {
			maxLength: 1000,
		},
		defaultValue: "",
		name: "content",
		optional: false,
		selector: (variables: ScaffoldTemplateVariables) =>
			`.${variables.cssClassName}__content`,
		source: "html",
		typeExpression: 'string & tags.MaxLength<1000> & tags.Default<"">',
	},
	{
		attributeType: "string",
		defaultValue: "left",
		enumValues: [...ALIGNMENT_VALUES],
		name: "alignment",
		optional: true,
		typeExpression: 'TextAlignment & tags.Default<"left">',
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "isVisible",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "string",
		defaultValue: "click",
		enumValues: [...INTERACTIVE_MODE_VALUES],
		name: "interactiveMode",
		optional: true,
		typeExpression: '("click" | "hover") & tags.Default<"click">',
	},
	{
		attributeType: "string",
		defaultValue: "none",
		enumValues: [...ANIMATION_VALUES],
		name: "animation",
		optional: true,
		typeExpression:
			'("none" | "bounce" | "pulse" | "shake" | "flip") & tags.Default<"none">',
	},
	{
		attributeType: "number",
		constraints: {
			minimum: 0,
			typeTag: "uint32",
		},
		defaultValue: 0,
		name: "clickCount",
		optional: true,
		typeExpression: 'number & tags.Minimum<0> & tags.Type<"uint32"> & tags.Default<0>',
	},
	{
		attributeType: "boolean",
		defaultValue: false,
		name: "isAnimating",
		optional: true,
		typeExpression: "boolean & tags.Default<false>",
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "showCounter",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "number",
		constraints: {
			minimum: 0,
			typeTag: "uint32",
		},
		defaultValue: 10,
		name: "maxClicks",
		optional: true,
		typeExpression: 'number & tags.Minimum<0> & tags.Type<"uint32"> & tags.Default<10>',
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<ScaffoldTemplateVariables>[];

const PERSISTENCE_ATTRIBUTE_SPECS = [
	{
		attributeType: "string",
		constraints: {
			maxLength: 250,
			minLength: 1,
		},
		defaultValue: (variables: ScaffoldTemplateVariables) =>
			`${variables.title} persistence block`,
		name: "content",
		optional: false,
		selector: (variables: ScaffoldTemplateVariables) =>
			`.${variables.cssClassName}__content`,
		source: "html",
		typeExpression: (variables: ScaffoldTemplateVariables) =>
			`string & tags.MinLength<1> & tags.MaxLength<250> & tags.Default<${quote(`${variables.title} persistence block`)}>`,
	},
	{
		attributeType: "string",
		defaultValue: "left",
		enumValues: [...ALIGNMENT_VALUES],
		name: "alignment",
		optional: true,
		typeExpression: 'TextAlignment & tags.Default<"left">',
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "isVisible",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "showCount",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "string",
		constraints: {
			maxLength: 40,
			minLength: 1,
		},
		defaultValue: "Persist Count",
		name: "buttonLabel",
		optional: true,
		typeExpression:
			'string & tags.MinLength<1> & tags.MaxLength<40> & tags.Default<"Persist Count">',
	},
	{
		attributeType: "string",
		blockJsonDefaultValue: "",
		constraints: {
			maxLength: 100,
			minLength: 1,
		},
		manifestDefaultValue: "primary",
		name: "resourceKey",
		optional: true,
		typeExpression:
			'string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"primary">',
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<ScaffoldTemplateVariables>[];

const COMPOUND_PARENT_BASE_ATTRIBUTE_SPECS = [
	{
		attributeType: "string",
		constraints: {
			maxLength: 80,
			minLength: 1,
		},
		defaultValue: (variables: ScaffoldTemplateVariables) => variables.title,
		name: "heading",
		optional: false,
		selector: (variables: ScaffoldTemplateVariables) =>
			`.${variables.cssClassName}__heading`,
		source: "html",
		typeExpression: (variables: ScaffoldTemplateVariables) =>
			`string & tags.MinLength<1> & tags.MaxLength<80> & tags.Default<${quote(variables.title)}>`,
	},
	{
		attributeType: "string",
		constraints: {
			maxLength: 180,
			minLength: 1,
		},
		defaultValue: "Add and reorder internal items inside this compound block.",
		name: "intro",
		optional: true,
		selector: (variables: ScaffoldTemplateVariables) =>
			`.${variables.cssClassName}__intro`,
		source: "html",
		typeExpression:
			'string & tags.MinLength<1> & tags.MaxLength<180> & tags.Default<"Add and reorder internal items inside this compound block.">',
	},
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "showDividers",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<ScaffoldTemplateVariables>[];

const COMPOUND_PARENT_PERSISTENCE_ATTRIBUTE_SPECS = [
	{
		attributeType: "boolean",
		defaultValue: true,
		name: "showCount",
		optional: true,
		typeExpression: "boolean & tags.Default<true>",
	},
	{
		attributeType: "string",
		constraints: {
			maxLength: 40,
			minLength: 1,
		},
		defaultValue: "Persist Count",
		name: "buttonLabel",
		optional: true,
		typeExpression:
			'string & tags.MinLength<1> & tags.MaxLength<40> & tags.Default<"Persist Count">',
	},
	{
		attributeType: "string",
		blockJsonDefaultValue: "",
		constraints: {
			maxLength: 100,
			minLength: 1,
		},
		manifestDefaultValue: "primary",
		name: "resourceKey",
		optional: true,
		typeExpression:
			'string & tags.MinLength<1> & tags.MaxLength<100> & tags.Default<"primary">',
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<ScaffoldTemplateVariables>[];

const COMPOUND_CHILD_ATTRIBUTE_SPECS = [
	{
		attributeType: "string",
		constraints: {
			maxLength: 80,
			minLength: 1,
		},
		defaultValue: ({ childTitle }: CompoundChildAttributeVariables) => childTitle,
		name: "title",
		optional: false,
		selector: ({ childCssClassName }: CompoundChildAttributeVariables) =>
			childCssClassName ? `.${childCssClassName}__title` : null,
		source: ({ childCssClassName }: CompoundChildAttributeVariables) =>
			childCssClassName ? "html" : null,
		typeExpression: ({ childTitle }: CompoundChildAttributeVariables) =>
			`string & tags.MinLength<1> & tags.MaxLength<80> & tags.Default<${quote(childTitle)}>`,
	},
	{
		attributeType: "string",
		constraints: {
			maxLength: 280,
			minLength: 1,
		},
		defaultValue: ({ bodyPlaceholder }: CompoundChildAttributeVariables) =>
			bodyPlaceholder,
		name: "body",
		optional: false,
		selector: ({ childCssClassName }: CompoundChildAttributeVariables) =>
			childCssClassName ? `.${childCssClassName}__body` : null,
		source: ({ childCssClassName }: CompoundChildAttributeVariables) =>
			childCssClassName ? "html" : null,
		typeExpression: ({ bodyPlaceholder }: CompoundChildAttributeVariables) =>
			`string & tags.MinLength<1> & tags.MaxLength<280> & tags.Default<${quote(bodyPlaceholder)}>`,
	},
] as const satisfies readonly BuiltInAttributeTemplateSpec<CompoundChildAttributeVariables>[];

function buildBasicAttributes(): EmittedAttributeDefinition[] {
	return buildAttributesFromSpecs(BASIC_ATTRIBUTE_SPECS, undefined);
}

function buildInteractivityAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	return buildAttributesFromSpecs(INTERACTIVITY_ATTRIBUTE_SPECS, variables);
}

function buildPersistenceAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	return buildAttributesFromSpecs(PERSISTENCE_ATTRIBUTE_SPECS, variables);
}

function buildCompoundParentAttributes(
	variables: ScaffoldTemplateVariables,
): EmittedAttributeDefinition[] {
	return buildAttributesFromSpecs(
		variables.compoundPersistenceEnabled === "true"
			? [
				...COMPOUND_PARENT_BASE_ATTRIBUTE_SPECS,
				...COMPOUND_PARENT_PERSISTENCE_ATTRIBUTE_SPECS,
			]
			: COMPOUND_PARENT_BASE_ATTRIBUTE_SPECS,
		variables,
	);
}

function buildCompoundChildAttributes(
	bodyPlaceholder = DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER,
	childTitle: string,
	childCssClassName?: string | null,
): EmittedAttributeDefinition[] {
	return buildAttributesFromSpecs(COMPOUND_CHILD_ATTRIBUTE_SPECS, {
		bodyPlaceholder,
		childCssClassName,
		childTitle,
	});
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

/**
 * Builds a starter manifest document for a generated compound child block.
 *
 * @param childTypeName TypeScript source type name for the child manifest.
 * @param childTitle Default title used by the child block.
 * @param bodyPlaceholder Optional placeholder used for the child body field.
 * @returns Starter manifest metadata for the compound child block.
 */
export function buildCompoundChildStarterManifestDocument(
	childTypeName: string,
	childTitle: string,
	bodyPlaceholder = DEFAULT_COMPOUND_CHILD_BODY_PLACEHOLDER,
): ManifestDocument {
	const attributes = buildCompoundChildAttributes(
		bodyPlaceholder,
		childTitle,
		null,
	);
	return buildManifestDocument(childTypeName, attributes);
}

/**
 * Generates typed structural artifacts for a built-in block scaffold.
 *
 * @param options.templateId Built-in template family to emit.
 * @param options.variables Resolved scaffold template variables.
 * @returns Structural artifacts for the built-in block, including compound
 * parent and child outputs when applicable.
 */
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

/**
 * Serializes a generated `block.json` document using scaffold formatting.
 *
 * @param document Structured `block.json` document.
 * @returns Pretty-printed JSON with a trailing newline.
 */
export function stringifyBuiltInBlockJsonDocument(
	document: Record<string, unknown>,
): string {
	return stringifyBlockJsonDocument(document);
}
