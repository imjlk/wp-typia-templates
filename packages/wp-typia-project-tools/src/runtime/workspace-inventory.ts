import { readFileSync } from "node:fs";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

import ts from "typescript";

import { REST_RESOURCE_METHOD_IDS } from "./cli-add-shared.js";
import { escapeRegex } from "./php-utils.js";
import { getPropertyNameText } from "./ts-property-names.js";

export interface WorkspaceBlockInventoryEntry {
	apiTypesFile?: string;
	attributeTypeName?: string;
	openApiFile?: string;
	slug: string;
	typesFile: string;
}

export interface WorkspaceVariationInventoryEntry {
	block: string;
	file: string;
	slug: string;
}

export interface WorkspaceBlockStyleInventoryEntry {
	block: string;
	file: string;
	slug: string;
}

export interface WorkspaceBlockTransformInventoryEntry {
	block: string;
	file: string;
	from: string;
	slug: string;
	to: string;
}

export interface WorkspacePatternInventoryEntry {
	file: string;
	slug: string;
}

export interface WorkspaceBindingSourceInventoryEntry {
	attribute?: string;
	block?: string;
	editorFile: string;
	serverFile: string;
	slug: string;
}

/**
 * REST-resource entry parsed from `scripts/block-config.ts`.
 *
 * Each file path is stored relative to the workspace root so doctor checks and
 * workspace mutation helpers can resolve the generated TypeScript, OpenAPI, and
 * PHP route artifacts without guessing their locations.
 */
export interface WorkspaceRestResourceInventoryEntry {
	apiFile: string;
	clientFile: string;
	dataFile: string;
	methods: string[];
	namespace: string;
	openApiFile: string;
	phpFile: string;
	slug: string;
	typesFile: string;
	validatorsFile: string;
}

/**
 * Ability entry parsed from `scripts/block-config.ts`.
 *
 * Each file path stays relative to the workspace root so doctor checks, schema
 * sync scripts, and generated admin/editor helpers can resolve typed workflow
 * artifacts without guessing their locations.
 */
export interface WorkspaceAbilityInventoryEntry {
	clientFile: string;
	configFile: string;
	dataFile: string;
	inputSchemaFile: string;
	inputTypeName: string;
	outputSchemaFile: string;
	outputTypeName: string;
	phpFile: string;
	slug: string;
	typesFile: string;
}

/**
 * AI-feature entry parsed from `scripts/block-config.ts`.
 *
 * Each file path stays relative to the workspace root so doctor checks, add
 * workflows, and split sync scripts can reason about the REST and AI-safe
 * artifacts without guessing their locations.
 */
export interface WorkspaceAiFeatureInventoryEntry {
	aiSchemaFile: string;
	apiFile: string;
	clientFile: string;
	dataFile: string;
	namespace: string;
	openApiFile: string;
	phpFile: string;
	slug: string;
	typesFile: string;
	validatorsFile: string;
}

/**
 * DataViews admin-screen entry parsed from `scripts/block-config.ts`.
 *
 * @property file Relative path to the generated admin view shared entry file.
 * @property phpFile Relative path to the generated WordPress admin page glue.
 * @property slug Normalized admin view slug.
 * @property source Optional source locator such as `rest-resource:products` or
 * `core-data:postType/post`.
 */
export interface WorkspaceAdminViewInventoryEntry {
	file: string;
	phpFile: string;
	slug: string;
	source?: string;
}

/**
 * Editor-plugin entry parsed from `scripts/block-config.ts`.
 *
 * @property file Relative path to the generated editor plugin entry file.
 * @property slug Normalized editor plugin slug.
 * @property slot Canonical editor shell slot for the plugin scaffold.
 */
export interface WorkspaceEditorPluginInventoryEntry {
	file: string;
	slug: string;
	slot: string;
}

export interface WorkspaceInventory {
	adminViews: WorkspaceAdminViewInventoryEntry[];
	bindingSources: WorkspaceBindingSourceInventoryEntry[];
	blockConfigPath: string;
	blocks: WorkspaceBlockInventoryEntry[];
	blockStyles: WorkspaceBlockStyleInventoryEntry[];
	blockTransforms: WorkspaceBlockTransformInventoryEntry[];
	abilities: WorkspaceAbilityInventoryEntry[];
	aiFeatures: WorkspaceAiFeatureInventoryEntry[];
	hasAbilitiesSection: boolean;
	hasAdminViewsSection: boolean;
	hasBindingSourcesSection: boolean;
	hasAiFeaturesSection: boolean;
	hasBlockStylesSection: boolean;
	hasBlockTransformsSection: boolean;
	hasEditorPluginsSection: boolean;
	hasPatternsSection: boolean;
	hasRestResourcesSection: boolean;
	hasVariationsSection: boolean;
	editorPlugins: WorkspaceEditorPluginInventoryEntry[];
	patterns: WorkspacePatternInventoryEntry[];
	restResources: WorkspaceRestResourceInventoryEntry[];
	source: string;
	variations: WorkspaceVariationInventoryEntry[];
}

type WorkspaceInventoryParseResult = Omit<WorkspaceInventory, "blockConfigPath">;

type WorkspaceInventoryEntriesKey = {
	[Key in keyof WorkspaceInventoryParseResult]: WorkspaceInventoryParseResult[Key] extends unknown[]
		? Key
		: never;
}[keyof WorkspaceInventoryParseResult];

type WorkspaceInventorySectionFlagKey = {
	[Key in keyof WorkspaceInventoryParseResult]: WorkspaceInventoryParseResult[Key] extends boolean
		? Key
		: never;
}[keyof WorkspaceInventoryParseResult];

type InventoryEntryFieldValidationContext = {
	elementIndex: number;
	entryName: string;
	key: string;
};

type InventoryEntryFieldDescriptor = {
	key: string;
	kind?: "string" | "stringArray";
	required?: boolean;
	validate?: (
		value: string | string[] | undefined,
		context: InventoryEntryFieldValidationContext,
	) => void;
};

type InventoryEntryParserDescriptor = {
	entryName: string;
	fields: readonly InventoryEntryFieldDescriptor[];
};

type RequiredInventoryEntryKey<T extends object> = Extract<
	{
		[Key in keyof T]-?: undefined extends T[Key] ? never : Key;
	}[keyof T],
	string
>;

type TypedInventoryEntryFieldDescriptor<
	T extends object,
	TKey extends Extract<keyof T, string> = Extract<keyof T, string>,
> = TKey extends Extract<keyof T, string>
	? Omit<InventoryEntryFieldDescriptor, "key" | "required"> & {
			key: TKey;
		} & (TKey extends RequiredInventoryEntryKey<T>
				? { required: true }
				: { required?: boolean })
	: never;

type RequiredInventoryEntryFieldDescriptor<T extends object> = Omit<
	InventoryEntryFieldDescriptor,
	"key" | "required"
> & {
	key: RequiredInventoryEntryKey<T>;
	required: true;
};

type MissingRequiredInventoryEntryKeys<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> = Exclude<RequiredInventoryEntryKey<T>, TFields[number]["key"]>;

type RequiredInventoryEntryFieldsPresent<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> = MissingRequiredInventoryEntryKeys<T, TFields> extends never
	? unknown
	: {
			missingRequiredInventoryEntryFields: MissingRequiredInventoryEntryKeys<T, TFields>;
		};

type RequiredInventoryEntryFieldsMarkedRequired<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> = Extract<
	TFields[number],
	{ key: RequiredInventoryEntryKey<T> }
> extends RequiredInventoryEntryFieldDescriptor<T>
	? unknown
	: {
			requiredInventoryEntryFieldsMustSetRequiredTrue: RequiredInventoryEntryKey<T>;
		};

function defineInventoryEntryParser<T extends object>() {
	return <
		const TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
	>(descriptor: {
		entryName: string;
		fields: TFields;
	} & RequiredInventoryEntryFieldsPresent<T, TFields> &
		RequiredInventoryEntryFieldsMarkedRequired<
			T,
			TFields
		>): InventoryEntryParserDescriptor => descriptor;
}

export const BLOCK_CONFIG_ENTRY_MARKER = "\t// wp-typia add block entries";
export const VARIATION_CONFIG_ENTRY_MARKER = "\t// wp-typia add variation entries";
export const BLOCK_STYLE_CONFIG_ENTRY_MARKER = "\t// wp-typia add style entries";
export const BLOCK_TRANSFORM_CONFIG_ENTRY_MARKER = "\t// wp-typia add transform entries";
export const PATTERN_CONFIG_ENTRY_MARKER = "\t// wp-typia add pattern entries";
export const BINDING_SOURCE_CONFIG_ENTRY_MARKER = "\t// wp-typia add binding-source entries";
export const REST_RESOURCE_CONFIG_ENTRY_MARKER = "\t// wp-typia add rest-resource entries";
export const ABILITY_CONFIG_ENTRY_MARKER = "\t// wp-typia add ability entries";
export const AI_FEATURE_CONFIG_ENTRY_MARKER = "\t// wp-typia add ai-feature entries";
export const ADMIN_VIEW_CONFIG_ENTRY_MARKER = "\t// wp-typia add admin-view entries";
/**
 * Marker used to append generated editor-plugin entries into `EDITOR_PLUGINS`.
 */
export const EDITOR_PLUGIN_CONFIG_ENTRY_MARKER = "\t// wp-typia add editor-plugin entries";

const VARIATIONS_INTERFACE_SECTION = `

export interface WorkspaceVariationConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}
`;

const VARIATIONS_CONST_SECTION = `

export const VARIATIONS: WorkspaceVariationConfig[] = [
\t// wp-typia add variation entries
];
`;

const BLOCK_STYLES_INTERFACE_SECTION = `

export interface WorkspaceBlockStyleConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}
`;

const BLOCK_STYLES_CONST_SECTION = `

export const BLOCK_STYLES: WorkspaceBlockStyleConfig[] = [
\t// wp-typia add style entries
];
`;

const BLOCK_TRANSFORMS_INTERFACE_SECTION = `

export interface WorkspaceBlockTransformConfig {
\tblock: string;
\tfile: string;
\tfrom: string;
\tslug: string;
\tto: string;
}
`;

const BLOCK_TRANSFORMS_CONST_SECTION = `

export const BLOCK_TRANSFORMS: WorkspaceBlockTransformConfig[] = [
\t// wp-typia add transform entries
];
`;

const PATTERNS_INTERFACE_SECTION = `

export interface WorkspacePatternConfig {
\tfile: string;
\tslug: string;
}
`;

const PATTERNS_CONST_SECTION = `

export const PATTERNS: WorkspacePatternConfig[] = [
\t// wp-typia add pattern entries
];
`;

const BINDING_SOURCES_INTERFACE_SECTION = `

export interface WorkspaceBindingSourceConfig {
\tattribute?: string;
\tblock?: string;
\teditorFile: string;
\tserverFile: string;
\tslug: string;
}
`;

const BINDING_SOURCES_CONST_SECTION = `

export const BINDING_SOURCES: WorkspaceBindingSourceConfig[] = [
\t// wp-typia add binding-source entries
];
`;

const REST_RESOURCES_INTERFACE_SECTION = `

export interface WorkspaceRestResourceConfig {
\tapiFile: string;
\tclientFile: string;
\tdataFile: string;
\tmethods: Array< 'list' | 'read' | 'create' | 'update' | 'delete' >;
\tnamespace: string;
\topenApiFile: string;
\tphpFile: string;
\trestManifest?: ReturnType<
\t\ttypeof import( '@wp-typia/block-runtime/metadata-core' ).defineEndpointManifest
\t>;
\tslug: string;
\ttypesFile: string;
\tvalidatorsFile: string;
}
`;

const REST_RESOURCES_CONST_SECTION = `

export const REST_RESOURCES: WorkspaceRestResourceConfig[] = [
\t// wp-typia add rest-resource entries
];
`;

const WORKSPACE_COMPATIBILITY_CONFIG_FIELD = `\tcompatibility?: {
\t\thardMinimums: {
\t\t\tphp?: string;
\t\t\twordpress?: string;
\t\t};
\t\tmode: 'baseline' | 'optional' | 'required';
\t\toptionalFeatureIds: string[];
\t\toptionalFeatures: string[];
\t\trequiredFeatureIds: string[];
\t\trequiredFeatures: string[];
\t\truntimeGates: string[];
\t};
`;

const ABILITIES_INTERFACE_SECTION = `

export interface WorkspaceAbilityConfig {
\tclientFile: string;
${WORKSPACE_COMPATIBILITY_CONFIG_FIELD}\tconfigFile: string;
\tdataFile: string;
\tinputSchemaFile: string;
\tinputTypeName: string;
\toutputSchemaFile: string;
\toutputTypeName: string;
\tphpFile: string;
\tslug: string;
\ttypesFile: string;
}
`;

const ABILITIES_CONST_SECTION = `

export const ABILITIES: WorkspaceAbilityConfig[] = [
\t// wp-typia add ability entries
];
`;

const AI_FEATURES_INTERFACE_SECTION = `

export interface WorkspaceAiFeatureConfig {
\taiSchemaFile: string;
\tapiFile: string;
\tclientFile: string;
${WORKSPACE_COMPATIBILITY_CONFIG_FIELD}\tdataFile: string;
\tnamespace: string;
\topenApiFile: string;
\tphpFile: string;
\trestManifest?: ReturnType<
\t\ttypeof import( '@wp-typia/block-runtime/metadata-core' ).defineEndpointManifest
\t>;
\tslug: string;
\ttypesFile: string;
\tvalidatorsFile: string;
}
`;

const AI_FEATURES_CONST_SECTION = `

export const AI_FEATURES: WorkspaceAiFeatureConfig[] = [
\t// wp-typia add ai-feature entries
];
`;

const ADMIN_VIEWS_INTERFACE_SECTION = `

export interface WorkspaceAdminViewConfig {
\tfile: string;
\tphpFile: string;
\tslug: string;
\tsource?: string;
}
`;

const ADMIN_VIEWS_CONST_SECTION = `

export const ADMIN_VIEWS: WorkspaceAdminViewConfig[] = [
\t// wp-typia add admin-view entries
];
`;

const EDITOR_PLUGINS_INTERFACE_SECTION = `

export interface WorkspaceEditorPluginConfig {
\tfile: string;
\tslug: string;
\tslot: string;
}
`;

const EDITOR_PLUGINS_CONST_SECTION = `

export const EDITOR_PLUGINS: WorkspaceEditorPluginConfig[] = [
\t// wp-typia add editor-plugin entries
];
`;

type WorkspaceInventoryUpdateOptions = {
	abilityEntries?: string[];
	adminViewEntries?: string[];
	aiFeatureEntries?: string[];
	blockEntries?: string[];
	blockStyleEntries?: string[];
	blockTransformEntries?: string[];
	bindingSourceEntries?: string[];
	editorPluginEntries?: string[];
	patternEntries?: string[];
	restResourceEntries?: string[];
	transformSource?: (source: string) => string;
	variationEntries?: string[];
};

type WorkspaceInventoryAppendOptionKey = Exclude<
	keyof WorkspaceInventoryUpdateOptions,
	"transformSource"
>;

type InventorySectionDescriptor = {
	/** Optional marker metadata used when appending generated entries. */
	append?: {
		marker: string;
		optionKey: WorkspaceInventoryAppendOptionKey;
	};
	/** Optional exported interface that backs the inventory section entries. */
	interface?: {
		name: string;
		section: string;
	};
	/** Optional parser metadata for descriptor-driven inventory reads. */
	parse?: {
		entriesKey: WorkspaceInventoryEntriesKey;
		entry: InventoryEntryParserDescriptor;
		exportName?: string;
		hasSectionKey?: WorkspaceInventorySectionFlagKey;
		required?: boolean;
	};
	/** Optional exported const array that stores the inventory section entries. */
	value?: {
		name: string;
		section: string;
	};
};

const BLOCK_INVENTORY_SECTION: InventorySectionDescriptor = {
	append: {
		marker: BLOCK_CONFIG_ENTRY_MARKER,
		optionKey: "blockEntries",
	},
	parse: {
		entriesKey: "blocks",
		entry: defineInventoryEntryParser<WorkspaceBlockInventoryEntry>()({
			entryName: "BLOCKS",
			fields: [
				{ key: "apiTypesFile" },
				{ key: "attributeTypeName" },
				{ key: "openApiFile" },
				{ key: "slug", required: true },
				{ key: "typesFile", required: true },
			],
		}),
		exportName: "BLOCKS",
		required: true,
	},
};

const INVENTORY_SECTIONS: readonly InventorySectionDescriptor[] = [
	{
		append: {
			marker: VARIATION_CONFIG_ENTRY_MARKER,
			optionKey: "variationEntries",
		},
		interface: {
			name: "WorkspaceVariationConfig",
			section: VARIATIONS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "variations",
			entry: defineInventoryEntryParser<WorkspaceVariationInventoryEntry>()({
				entryName: "VARIATIONS",
				fields: [
					{ key: "block", required: true },
					{ key: "file", required: true },
					{ key: "slug", required: true },
				],
			}),
			hasSectionKey: "hasVariationsSection",
		},
		value: {
			name: "VARIATIONS",
			section: VARIATIONS_CONST_SECTION,
		},
	},
	{
		append: {
			marker: BLOCK_STYLE_CONFIG_ENTRY_MARKER,
			optionKey: "blockStyleEntries",
		},
		interface: {
			name: "WorkspaceBlockStyleConfig",
			section: BLOCK_STYLES_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "blockStyles",
			entry: defineInventoryEntryParser<WorkspaceBlockStyleInventoryEntry>()({
				entryName: "BLOCK_STYLES",
				fields: [
					{ key: "block", required: true },
					{ key: "file", required: true },
					{ key: "slug", required: true },
				],
			}),
			hasSectionKey: "hasBlockStylesSection",
		},
		value: {
			name: "BLOCK_STYLES",
			section: BLOCK_STYLES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: BLOCK_TRANSFORM_CONFIG_ENTRY_MARKER,
			optionKey: "blockTransformEntries",
		},
		interface: {
			name: "WorkspaceBlockTransformConfig",
			section: BLOCK_TRANSFORMS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "blockTransforms",
			entry: defineInventoryEntryParser<WorkspaceBlockTransformInventoryEntry>()({
				entryName: "BLOCK_TRANSFORMS",
				fields: [
					{ key: "block", required: true },
					{ key: "file", required: true },
					{ key: "from", required: true },
					{ key: "slug", required: true },
					{ key: "to", required: true },
				],
			}),
			hasSectionKey: "hasBlockTransformsSection",
		},
		value: {
			name: "BLOCK_TRANSFORMS",
			section: BLOCK_TRANSFORMS_CONST_SECTION,
		},
	},
	{
		append: {
			marker: PATTERN_CONFIG_ENTRY_MARKER,
			optionKey: "patternEntries",
		},
		interface: {
			name: "WorkspacePatternConfig",
			section: PATTERNS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "patterns",
			entry: defineInventoryEntryParser<WorkspacePatternInventoryEntry>()({
				entryName: "PATTERNS",
				fields: [
					{ key: "file", required: true },
					{ key: "slug", required: true },
				],
			}),
			hasSectionKey: "hasPatternsSection",
		},
		value: {
			name: "PATTERNS",
			section: PATTERNS_CONST_SECTION,
		},
	},
	{
		append: {
			marker: BINDING_SOURCE_CONFIG_ENTRY_MARKER,
			optionKey: "bindingSourceEntries",
		},
		interface: {
			name: "WorkspaceBindingSourceConfig",
			section: BINDING_SOURCES_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "bindingSources",
			entry: defineInventoryEntryParser<WorkspaceBindingSourceInventoryEntry>()({
				entryName: "BINDING_SOURCES",
				fields: [
					{ key: "attribute" },
					{ key: "block" },
					{ key: "editorFile", required: true },
					{ key: "serverFile", required: true },
					{ key: "slug", required: true },
				],
			}),
			hasSectionKey: "hasBindingSourcesSection",
		},
		value: {
			name: "BINDING_SOURCES",
			section: BINDING_SOURCES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: REST_RESOURCE_CONFIG_ENTRY_MARKER,
			optionKey: "restResourceEntries",
		},
		interface: {
			name: "WorkspaceRestResourceConfig",
			section: REST_RESOURCES_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "restResources",
			entry: defineInventoryEntryParser<WorkspaceRestResourceInventoryEntry>()({
				entryName: "REST_RESOURCES",
				fields: [
					{ key: "apiFile", required: true },
					{ key: "clientFile", required: true },
					{ key: "dataFile", required: true },
					{
						key: "methods",
						kind: "stringArray",
						required: true,
						validate: (value, context) => {
							const methods = Array.isArray(value) ? value : [];
							const invalidMethods = methods.filter(
								(method) =>
									!(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(method),
							);
							if (invalidMethods.length > 0) {
								throw new Error(
									`${context.entryName}[${context.elementIndex}].${context.key} includes unsupported values: ${invalidMethods.join(", ")}.`,
								);
							}
						},
					},
					{ key: "namespace", required: true },
					{ key: "openApiFile", required: true },
					{ key: "phpFile", required: true },
					{ key: "slug", required: true },
					{ key: "typesFile", required: true },
					{ key: "validatorsFile", required: true },
				],
			}),
			hasSectionKey: "hasRestResourcesSection",
		},
		value: {
			name: "REST_RESOURCES",
			section: REST_RESOURCES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: ABILITY_CONFIG_ENTRY_MARKER,
			optionKey: "abilityEntries",
		},
		interface: {
			name: "WorkspaceAbilityConfig",
			section: ABILITIES_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "abilities",
			entry: defineInventoryEntryParser<WorkspaceAbilityInventoryEntry>()({
				entryName: "ABILITIES",
				fields: [
					{ key: "clientFile", required: true },
					{ key: "configFile", required: true },
					{ key: "dataFile", required: true },
					{ key: "inputSchemaFile", required: true },
					{ key: "inputTypeName", required: true },
					{ key: "outputSchemaFile", required: true },
					{ key: "outputTypeName", required: true },
					{ key: "phpFile", required: true },
					{ key: "slug", required: true },
					{ key: "typesFile", required: true },
				],
			}),
			hasSectionKey: "hasAbilitiesSection",
		},
		value: {
			name: "ABILITIES",
			section: ABILITIES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: AI_FEATURE_CONFIG_ENTRY_MARKER,
			optionKey: "aiFeatureEntries",
		},
		interface: {
			name: "WorkspaceAiFeatureConfig",
			section: AI_FEATURES_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "aiFeatures",
			entry: defineInventoryEntryParser<WorkspaceAiFeatureInventoryEntry>()({
				entryName: "AI_FEATURES",
				fields: [
					{ key: "aiSchemaFile", required: true },
					{ key: "apiFile", required: true },
					{ key: "clientFile", required: true },
					{ key: "dataFile", required: true },
					{ key: "namespace", required: true },
					{ key: "openApiFile", required: true },
					{ key: "phpFile", required: true },
					{ key: "slug", required: true },
					{ key: "typesFile", required: true },
					{ key: "validatorsFile", required: true },
				],
			}),
			hasSectionKey: "hasAiFeaturesSection",
		},
		value: {
			name: "AI_FEATURES",
			section: AI_FEATURES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: ADMIN_VIEW_CONFIG_ENTRY_MARKER,
			optionKey: "adminViewEntries",
		},
		interface: {
			name: "WorkspaceAdminViewConfig",
			section: ADMIN_VIEWS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "adminViews",
			entry: defineInventoryEntryParser<WorkspaceAdminViewInventoryEntry>()({
				entryName: "ADMIN_VIEWS",
				fields: [
					{ key: "file", required: true },
					{ key: "phpFile", required: true },
					{ key: "slug", required: true },
					{ key: "source" },
				],
			}),
			hasSectionKey: "hasAdminViewsSection",
		},
		value: {
			name: "ADMIN_VIEWS",
			section: ADMIN_VIEWS_CONST_SECTION,
		},
	},
	{
		append: {
			marker: EDITOR_PLUGIN_CONFIG_ENTRY_MARKER,
			optionKey: "editorPluginEntries",
		},
		interface: {
			name: "WorkspaceEditorPluginConfig",
			section: EDITOR_PLUGINS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "editorPlugins",
			entry: defineInventoryEntryParser<WorkspaceEditorPluginInventoryEntry>()({
				entryName: "EDITOR_PLUGINS",
				fields: [
					{ key: "file", required: true },
					{ key: "slug", required: true },
					{ key: "slot", required: true },
				],
			}),
			hasSectionKey: "hasEditorPluginsSection",
		},
		value: {
			name: "EDITOR_PLUGINS",
			section: EDITOR_PLUGINS_CONST_SECTION,
		},
	},
];

function findExportedArrayLiteral(
	sourceFile: ts.SourceFile,
	exportName: string,
): {
	array: ts.ArrayLiteralExpression | null;
	found: boolean;
} {
	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement)) {
			continue;
		}
		if (
			!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
		) {
			continue;
		}

		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) {
				continue;
			}
			if (declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) {
				return {
					array: declaration.initializer,
					found: true,
				};
			}
			return {
				array: null,
				found: true,
			};
		}
	}

	return {
		array: null,
		found: false,
	};
}

function getOptionalStringProperty(
	entryName: string,
	elementIndex: number,
	objectLiteral: ts.ObjectLiteralExpression,
	key: string,
): string | undefined {
	for (const property of objectLiteral.properties) {
		if (!ts.isPropertyAssignment(property)) {
			continue;
		}
		const propertyName = getPropertyNameText(property.name);
		if (propertyName !== key) {
			continue;
		}
		if (ts.isStringLiteralLike(property.initializer)) {
			return property.initializer.text;
		}
		throw new Error(
			`${entryName}[${elementIndex}] must use a string literal for "${key}" in scripts/block-config.ts.`,
		);
	}

	return undefined;
}

function getOptionalStringArrayProperty(
	entryName: string,
	elementIndex: number,
	objectLiteral: ts.ObjectLiteralExpression,
	key: string,
): string[] | undefined {
	for (const property of objectLiteral.properties) {
		if (!ts.isPropertyAssignment(property)) {
			continue;
		}
		const propertyName = getPropertyNameText(property.name);
		if (propertyName !== key) {
			continue;
		}
		if (!ts.isArrayLiteralExpression(property.initializer)) {
			throw new Error(
				`${entryName}[${elementIndex}] must use an array literal for "${key}" in scripts/block-config.ts.`,
			);
		}

		return property.initializer.elements.map((element, itemIndex) => {
			if (!ts.isStringLiteralLike(element)) {
				throw new Error(
					`${entryName}[${elementIndex}].${key}[${itemIndex}] must use a string literal in scripts/block-config.ts.`,
				);
			}
			return element.text;
		});
	}

	return undefined;
}

function isMissingRequiredInventoryValue(
	value: string | string[] | undefined,
): boolean {
	return value === undefined || (typeof value === "string" && value.length === 0);
}

function formatMissingRequiredInventoryFields(
	keys: readonly string[],
): string {
	return keys.length === 1
		? `required "${keys[0]}"`
		: `required fields ${keys.map((key) => `"${key}"`).join(", ")}`;
}

function assertParsedInventoryEntry<T extends object>(
	entry: Record<string, string | string[] | undefined>,
	descriptor: InventoryEntryParserDescriptor,
	elementIndex: number,
): asserts entry is Record<string, string | string[] | undefined> & T {
	const missingRequiredKeys = descriptor.fields
		.filter(
			(field) =>
				field.required === true &&
				isMissingRequiredInventoryValue(entry[field.key]),
		)
		.map((field) => field.key);

	if (missingRequiredKeys.length > 0) {
		throw new Error(
			`${descriptor.entryName}[${elementIndex}] is missing ${formatMissingRequiredInventoryFields(missingRequiredKeys)} in scripts/block-config.ts.`,
		);
	}
}

function parseInventoryEntries<T extends object>(
	arrayLiteral: ts.ArrayLiteralExpression,
	descriptor: InventoryEntryParserDescriptor,
): T[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`${descriptor.entryName}[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		const entry: Record<string, string | string[] | undefined> = {};
		for (const field of descriptor.fields) {
			const kind = field.kind ?? "string";
			const value =
				kind === "stringArray"
					? getOptionalStringArrayProperty(
							descriptor.entryName,
							elementIndex,
							element,
							field.key,
						)
					: getOptionalStringProperty(
							descriptor.entryName,
							elementIndex,
							element,
							field.key,
						);

			field.validate?.(value, {
				elementIndex,
				entryName: descriptor.entryName,
				key: field.key,
			});
			entry[field.key] = value;
		}

		assertParsedInventoryEntry<T>(entry, descriptor, elementIndex);
		return entry;
	});
}

function parseInventorySection<T extends object>(
	sourceFile: ts.SourceFile,
	descriptor: InventorySectionDescriptor,
): {
	entries: T[];
	found: boolean;
} {
	if (!descriptor.parse) {
		return {
			entries: [],
			found: false,
		};
	}

	const exportName = descriptor.parse.exportName ?? descriptor.value?.name;
	if (!exportName) {
		throw new Error("Inventory parser descriptor is missing an export name.");
	}

	const exportedArray = findExportedArrayLiteral(sourceFile, exportName);
	if (!exportedArray.found) {
		if (descriptor.parse.required) {
			throw new Error(`scripts/block-config.ts must export a ${exportName} array.`);
		}
		return {
			entries: [],
			found: false,
		};
	}
	if (!exportedArray.array) {
		if (descriptor.parse.required) {
			throw new Error(`scripts/block-config.ts must export a ${exportName} array.`);
		}
		throw new Error(
			`scripts/block-config.ts must export ${exportName} as an array literal.`,
		);
	}

	return {
		entries: parseInventoryEntries<T>(exportedArray.array, descriptor.parse.entry),
		found: true,
	};
}

/**
 * Parse workspace inventory entries from the source of `scripts/block-config.ts`.
 *
 * @param source Raw TypeScript source from `scripts/block-config.ts`.
 * @returns Parsed inventory sections without the resolved `blockConfigPath`.
 * @throws {Error} When `BLOCKS` is missing or any inventory entry is malformed.
 */
export function parseWorkspaceInventorySource(source: string): Omit<WorkspaceInventory, "blockConfigPath"> {
	const sourceFile = ts.createSourceFile(
		"block-config.ts",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const parsedInventory: WorkspaceInventoryParseResult = {
		abilities: [],
		adminViews: [],
		aiFeatures: [],
		bindingSources: [],
		blockStyles: [],
		blockTransforms: [],
		blocks: parseInventorySection<WorkspaceBlockInventoryEntry>(
			sourceFile,
			BLOCK_INVENTORY_SECTION,
		).entries,
		editorPlugins: [],
		hasAbilitiesSection: false,
		hasAdminViewsSection: false,
		hasAiFeaturesSection: false,
		hasBindingSourcesSection: false,
		hasBlockStylesSection: false,
		hasBlockTransformsSection: false,
		hasEditorPluginsSection: false,
		hasPatternsSection: false,
		hasRestResourcesSection: false,
		hasVariationsSection: false,
		patterns: [],
		restResources: [],
		source,
		variations: [],
	};

	const mutableInventory = parsedInventory as Record<string, unknown>;
	for (const section of INVENTORY_SECTIONS) {
		if (!section.parse) {
			continue;
		}

		const parsedSection = parseInventorySection(sourceFile, section);
		mutableInventory[section.parse.entriesKey] = parsedSection.entries;
		if (section.parse.hasSectionKey) {
			mutableInventory[section.parse.hasSectionKey] = parsedSection.found;
		}
	}

	return parsedInventory;
}

/**
 * Synchronously read and parse the canonical workspace inventory file.
 *
 * This compatibility helper is intentionally sync-only for callers that expose
 * synchronous APIs. Prefer `readWorkspaceInventoryAsync()` from async command
 * paths so workspace reads do not block the event loop.
 *
 * @param projectDir Workspace root directory.
 * @returns Parsed `WorkspaceInventory` including the resolved `blockConfigPath`.
 * @throws {Error} When `scripts/block-config.ts` is missing or invalid.
 */
export function readWorkspaceInventory(projectDir: string): WorkspaceInventory {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	let source: string;
	try {
		source = readFileSync(blockConfigPath, "utf8");
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			throw new Error(
				`Workspace inventory file is missing at ${blockConfigPath}. Expected scripts/block-config.ts to exist.`,
			);
		}
		throw error;
	}

	return {
		blockConfigPath,
		...parseWorkspaceInventorySource(source),
	};
}

/**
 * Asynchronously read and parse the canonical workspace inventory file.
 *
 * @param projectDir Workspace root directory.
 * @returns Parsed `WorkspaceInventory` including the resolved `blockConfigPath`.
 * @throws {Error} When `scripts/block-config.ts` is missing or invalid.
 */
export async function readWorkspaceInventoryAsync(
	projectDir: string,
): Promise<WorkspaceInventory> {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	let source: string;
	try {
		source = await readFile(blockConfigPath, "utf8");
	} catch (error) {
		if (
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "ENOENT"
		) {
			throw new Error(
				`Workspace inventory file is missing at ${blockConfigPath}. Expected scripts/block-config.ts to exist.`,
			);
		}
		throw error;
	}

	return {
		blockConfigPath,
		...parseWorkspaceInventorySource(source),
	};
}

/**
 * Return select options for the current workspace block inventory.
 *
 * The `description` field mirrors `block.typesFile`, while `name` and `value`
 * both map to the block slug for use in interactive add flows.
 *
 * @param projectDir Workspace root directory.
 * @returns Block options for variation-target selection.
 */
export function getWorkspaceBlockSelectOptions(projectDir: string): Array<{
	description: string;
	name: string;
	value: string;
}> {
	return readWorkspaceInventory(projectDir).blocks.map((block) => ({
		description: block.typesFile,
		name: block.slug,
		value: block.slug,
	}));
}

function ensureWorkspaceInventorySections(source: string): string {
	let nextSource = source.trimEnd();

	for (const section of INVENTORY_SECTIONS) {
		if (
			section.interface &&
			!hasExportedInterface(nextSource, section.interface.name)
		) {
			nextSource += section.interface.section;
		}
		if (section.value && !hasExportedConst(nextSource, section.value.name)) {
			nextSource += section.value.section;
		}
	}

	return `${nextSource}\n`;
}

function hasExportedInterface(source: string, interfaceName: string): boolean {
	return new RegExp(
		`export\\s+interface\\s+${escapeRegex(interfaceName)}\\b`,
		"u",
	).test(source);
}

function hasExportedConst(source: string, constName: string): boolean {
	return new RegExp(`export\\s+const\\s+${escapeRegex(constName)}\\b`, "u").test(
		source,
	);
}

function appendEntriesAtMarker(source: string, marker: string, entries: string[]): string {
	if (entries.length === 0) {
		return source;
	}
	if (!source.includes(marker)) {
		throw new Error(`Workspace inventory marker "${marker}" is missing in scripts/block-config.ts.`);
	}

	return source.replace(marker, `${entries.join("\n")}\n${marker}`);
}

function appendInventorySectionEntries(
	source: string,
	options: WorkspaceInventoryUpdateOptions,
): string {
	let nextSource = source;
	for (const section of [BLOCK_INVENTORY_SECTION, ...INVENTORY_SECTIONS]) {
		if (!section.append) {
			continue;
		}
		nextSource = appendEntriesAtMarker(
			nextSource,
			section.append.marker,
			options[section.append.optionKey] ?? [],
		);
	}
	return nextSource;
}

function ensureInterfaceField(
	source: string,
	interfaceName: string,
	fieldName: string,
	fieldSource: string,
): string {
	const interfacePattern = new RegExp(
		`(export\\s+interface\\s+${escapeRegex(
			interfaceName,
		)}\\s*\\{\\r?\\n)([\\s\\S]*?)(\\r?\\n\\})`,
		"u",
	);

	return source.replace(
		interfacePattern,
		(match, start: string, body: string, end: string) => {
			if (new RegExp(`^[ \t]*${escapeRegex(fieldName)}\\??:`, "mu").test(body)) {
				return match;
			}

			const lineEnding = start.endsWith("\r\n") ? "\r\n" : "\n";
			const formattedFieldSource = `${fieldSource
				.replace(/\r?\n$/u, "")
				.split("\n")
				.join(lineEnding)}${lineEnding}`;
			const memberPattern = /^[ \t]*([A-Za-z_$][\w$]*)\??:/gmu;

			for (const member of body.matchAll(memberPattern)) {
				const memberIndex = member.index;
				const memberName = member[1];
				if (memberIndex === undefined || !memberName) {
					continue;
				}
				if (memberName.localeCompare(fieldName) > 0) {
					return `${start}${body.slice(
						0,
						memberIndex,
					)}${formattedFieldSource}${body.slice(memberIndex)}${end}`;
				}
			}

			return `${start}${body}${
				body.length > 0 && !body.endsWith(lineEnding) ? lineEnding : ""
			}${formattedFieldSource}${end}`;
		},
	);
}

function normalizeInterfaceFieldBlock(
	source: string,
	interfaceName: string,
	fieldName: string,
	fieldSource: string,
	requiredFragments: string[],
): string {
	const interfacePattern = new RegExp(
		`(export\\s+interface\\s+${escapeRegex(
			interfaceName,
		)}\\s*\\{\\r?\\n)([\\s\\S]*?)(\\r?\\n\\})`,
		"u",
	);

	return source.replace(
		interfacePattern,
		(match, start: string, body: string, end: string) => {
			const fieldPattern = new RegExp(
				`(^([ \\t]*)${escapeRegex(
					fieldName,
				)}\\??:\\s*\\{[ \\t]*\\r?\\n)([\\s\\S]*?)(^\\2\\};\\r?\\n?)`,
				"mu",
			);
			const fieldMatch = fieldPattern.exec(body);
			if (!fieldMatch) {
				return match;
			}

			const existingFieldSource = fieldMatch[0];
			if (
				requiredFragments.every((fragment) =>
					existingFieldSource.includes(fragment),
				)
			) {
				return match;
			}

			const lineEnding = start.endsWith("\r\n") ? "\r\n" : "\n";
			const formattedFieldSource = `${fieldSource
				.replace(/\r?\n$/u, "")
				.split("\n")
				.join(lineEnding)}${lineEnding}`;

			return `${start}${body.slice(
				0,
				fieldMatch.index,
			)}${formattedFieldSource}${body.slice(fieldMatch.index + existingFieldSource.length)}${end}`;
		},
	);
}

/**
 * Update `scripts/block-config.ts` source text with additional inventory entries.
 *
 * Missing inventory sections for variations, patterns, binding sources, REST
 * resources, workflow abilities, AI features, editor plugins, block styles, and
 * block transforms are created
 * automatically before new entries are appended at their marker comments.
 * When provided, `transformSource` runs before any entries are inserted.
 *
 * @param source Existing `scripts/block-config.ts` source.
 * @param options Entry lists plus an optional source transformer.
 * @returns Updated source text with all requested inventory entries appended.
 */
export function updateWorkspaceInventorySource(
	source: string,
	options: WorkspaceInventoryUpdateOptions = {},
): string {
	let nextSource = ensureWorkspaceInventorySections(source);
	if (options.transformSource) {
		nextSource = options.transformSource(nextSource);
	}
	nextSource = appendInventorySectionEntries(nextSource, options);
	nextSource = ensureInterfaceField(
		nextSource,
		"WorkspaceBindingSourceConfig",
		"attribute",
		"\tattribute?: string;",
	);
	nextSource = ensureInterfaceField(
		nextSource,
		"WorkspaceBindingSourceConfig",
		"block",
		"\tblock?: string;",
	);
	nextSource = ensureInterfaceField(
		nextSource,
		"WorkspaceAbilityConfig",
		"compatibility",
		WORKSPACE_COMPATIBILITY_CONFIG_FIELD,
	);
	nextSource = normalizeInterfaceFieldBlock(
		nextSource,
		"WorkspaceAbilityConfig",
		"compatibility",
		WORKSPACE_COMPATIBILITY_CONFIG_FIELD,
		["optionalFeatureIds: string[];", "requiredFeatureIds: string[];"],
	);
	nextSource = ensureInterfaceField(
		nextSource,
		"WorkspaceAiFeatureConfig",
		"compatibility",
		WORKSPACE_COMPATIBILITY_CONFIG_FIELD,
	);
	nextSource = normalizeInterfaceFieldBlock(
		nextSource,
		"WorkspaceAiFeatureConfig",
		"compatibility",
		WORKSPACE_COMPATIBILITY_CONFIG_FIELD,
		["optionalFeatureIds: string[];", "requiredFeatureIds: string[];"],
	);
	return nextSource;
}

/**
 * Append new entries to the canonical workspace inventory file on disk.
 *
 * @param projectDir Workspace root directory.
 * @param options Entry lists and optional source transform passed through to
 * `updateWorkspaceInventorySource`.
 * @returns Resolves once `scripts/block-config.ts` has been updated if needed.
 */
export async function appendWorkspaceInventoryEntries(
	projectDir: string,
	options: Parameters<typeof updateWorkspaceInventorySource>[1],
): Promise<void> {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	const source = await readFile(blockConfigPath, "utf8");
	const nextSource = updateWorkspaceInventorySource(source, options);
	if (nextSource !== source) {
		await writeFile(blockConfigPath, nextSource, "utf8");
	}
}
