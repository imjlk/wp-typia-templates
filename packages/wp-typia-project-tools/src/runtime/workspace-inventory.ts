import fs from "node:fs";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

import ts from "typescript";

import { REST_RESOURCE_METHOD_IDS } from "./cli-add-shared.js";
import { escapeRegex } from "./php-utils.js";

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

type InventorySectionDescriptor = {
	/** Optional exported interface that backs the inventory section entries. */
	interface?: {
		name: string;
		section: string;
	};
	/** Optional exported const array that stores the inventory section entries. */
	value?: {
		name: string;
		section: string;
	};
};

const INVENTORY_SECTIONS: readonly InventorySectionDescriptor[] = [
	{
		interface: {
			name: "WorkspaceVariationConfig",
			section: VARIATIONS_INTERFACE_SECTION,
		},
		value: {
			name: "VARIATIONS",
			section: VARIATIONS_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceBlockStyleConfig",
			section: BLOCK_STYLES_INTERFACE_SECTION,
		},
		value: {
			name: "BLOCK_STYLES",
			section: BLOCK_STYLES_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceBlockTransformConfig",
			section: BLOCK_TRANSFORMS_INTERFACE_SECTION,
		},
		value: {
			name: "BLOCK_TRANSFORMS",
			section: BLOCK_TRANSFORMS_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspacePatternConfig",
			section: PATTERNS_INTERFACE_SECTION,
		},
		value: {
			name: "PATTERNS",
			section: PATTERNS_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceBindingSourceConfig",
			section: BINDING_SOURCES_INTERFACE_SECTION,
		},
		value: {
			name: "BINDING_SOURCES",
			section: BINDING_SOURCES_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceRestResourceConfig",
			section: REST_RESOURCES_INTERFACE_SECTION,
		},
		value: {
			name: "REST_RESOURCES",
			section: REST_RESOURCES_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceAbilityConfig",
			section: ABILITIES_INTERFACE_SECTION,
		},
		value: {
			name: "ABILITIES",
			section: ABILITIES_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceAiFeatureConfig",
			section: AI_FEATURES_INTERFACE_SECTION,
		},
		value: {
			name: "AI_FEATURES",
			section: AI_FEATURES_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceAdminViewConfig",
			section: ADMIN_VIEWS_INTERFACE_SECTION,
		},
		value: {
			name: "ADMIN_VIEWS",
			section: ADMIN_VIEWS_CONST_SECTION,
		},
	},
	{
		interface: {
			name: "WorkspaceEditorPluginConfig",
			section: EDITOR_PLUGINS_INTERFACE_SECTION,
		},
		value: {
			name: "EDITOR_PLUGINS",
			section: EDITOR_PLUGINS_CONST_SECTION,
		},
	},
];

function getPropertyNameText(name: ts.PropertyName): string | null {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
		return name.text;
	}

	return null;
}

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

function getRequiredStringProperty(
	entryName: string,
	elementIndex: number,
	objectLiteral: ts.ObjectLiteralExpression,
	key: string,
): string {
	const value = getOptionalStringProperty(entryName, elementIndex, objectLiteral, key);
	if (!value) {
		throw new Error(
			`${entryName}[${elementIndex}] is missing required "${key}" in scripts/block-config.ts.`,
		);
	}
	return value;
}

function getRequiredStringArrayProperty(
	entryName: string,
	elementIndex: number,
	objectLiteral: ts.ObjectLiteralExpression,
	key: string,
): string[] {
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

	throw new Error(
		`${entryName}[${elementIndex}] is missing required "${key}" in scripts/block-config.ts.`,
	);
}

function parseBlockEntries(arrayLiteral: ts.ArrayLiteralExpression): WorkspaceBlockInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`BLOCKS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			apiTypesFile: getOptionalStringProperty("BLOCKS", elementIndex, element, "apiTypesFile"),
			attributeTypeName: getOptionalStringProperty(
				"BLOCKS",
				elementIndex,
				element,
				"attributeTypeName",
			),
			openApiFile: getOptionalStringProperty("BLOCKS", elementIndex, element, "openApiFile"),
			slug: getRequiredStringProperty("BLOCKS", elementIndex, element, "slug"),
			typesFile: getRequiredStringProperty("BLOCKS", elementIndex, element, "typesFile"),
		};
	});
}

function parseVariationEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceVariationInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`VARIATIONS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			block: getRequiredStringProperty("VARIATIONS", elementIndex, element, "block"),
			file: getRequiredStringProperty("VARIATIONS", elementIndex, element, "file"),
			slug: getRequiredStringProperty("VARIATIONS", elementIndex, element, "slug"),
		};
	});
}

function parseBlockStyleEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceBlockStyleInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`BLOCK_STYLES[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			block: getRequiredStringProperty("BLOCK_STYLES", elementIndex, element, "block"),
			file: getRequiredStringProperty("BLOCK_STYLES", elementIndex, element, "file"),
			slug: getRequiredStringProperty("BLOCK_STYLES", elementIndex, element, "slug"),
		};
	});
}

function parseBlockTransformEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceBlockTransformInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`BLOCK_TRANSFORMS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			block: getRequiredStringProperty("BLOCK_TRANSFORMS", elementIndex, element, "block"),
			file: getRequiredStringProperty("BLOCK_TRANSFORMS", elementIndex, element, "file"),
			from: getRequiredStringProperty("BLOCK_TRANSFORMS", elementIndex, element, "from"),
			slug: getRequiredStringProperty("BLOCK_TRANSFORMS", elementIndex, element, "slug"),
			to: getRequiredStringProperty("BLOCK_TRANSFORMS", elementIndex, element, "to"),
		};
	});
}

function parsePatternEntries(arrayLiteral: ts.ArrayLiteralExpression): WorkspacePatternInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`PATTERNS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			file: getRequiredStringProperty("PATTERNS", elementIndex, element, "file"),
			slug: getRequiredStringProperty("PATTERNS", elementIndex, element, "slug"),
		};
	});
}

function parseBindingSourceEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceBindingSourceInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`BINDING_SOURCES[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			attribute: getOptionalStringProperty(
				"BINDING_SOURCES",
				elementIndex,
				element,
				"attribute",
			),
			block: getOptionalStringProperty("BINDING_SOURCES", elementIndex, element, "block"),
			editorFile: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "editorFile"),
			serverFile: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "serverFile"),
			slug: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "slug"),
		};
	});
}

function parseRestResourceEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceRestResourceInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`REST_RESOURCES[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		const methods = getRequiredStringArrayProperty(
			"REST_RESOURCES",
			elementIndex,
			element,
			"methods",
		);
		const invalidMethods = methods.filter(
			(method) => !(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(method),
		);
		if (invalidMethods.length > 0) {
			throw new Error(
				`REST_RESOURCES[${elementIndex}].methods includes unsupported values: ${invalidMethods.join(", ")}.`,
			);
		}

		return {
			apiFile: getRequiredStringProperty("REST_RESOURCES", elementIndex, element, "apiFile"),
			clientFile: getRequiredStringProperty(
				"REST_RESOURCES",
				elementIndex,
				element,
				"clientFile",
			),
			dataFile: getRequiredStringProperty("REST_RESOURCES", elementIndex, element, "dataFile"),
			methods,
			namespace: getRequiredStringProperty(
				"REST_RESOURCES",
				elementIndex,
				element,
				"namespace",
			),
			openApiFile: getRequiredStringProperty(
				"REST_RESOURCES",
				elementIndex,
				element,
				"openApiFile",
			),
			phpFile: getRequiredStringProperty("REST_RESOURCES", elementIndex, element, "phpFile"),
			slug: getRequiredStringProperty("REST_RESOURCES", elementIndex, element, "slug"),
			typesFile: getRequiredStringProperty(
				"REST_RESOURCES",
				elementIndex,
				element,
				"typesFile",
			),
			validatorsFile: getRequiredStringProperty(
				"REST_RESOURCES",
				elementIndex,
				element,
				"validatorsFile",
			),
		};
	});
}

function parseAiFeatureEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceAiFeatureInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`AI_FEATURES[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			aiSchemaFile: getRequiredStringProperty(
				"AI_FEATURES",
				elementIndex,
				element,
				"aiSchemaFile",
			),
			apiFile: getRequiredStringProperty("AI_FEATURES", elementIndex, element, "apiFile"),
			clientFile: getRequiredStringProperty(
				"AI_FEATURES",
				elementIndex,
				element,
				"clientFile",
			),
			dataFile: getRequiredStringProperty("AI_FEATURES", elementIndex, element, "dataFile"),
			namespace: getRequiredStringProperty(
				"AI_FEATURES",
				elementIndex,
				element,
				"namespace",
			),
			openApiFile: getRequiredStringProperty(
				"AI_FEATURES",
				elementIndex,
				element,
				"openApiFile",
			),
			phpFile: getRequiredStringProperty("AI_FEATURES", elementIndex, element, "phpFile"),
			slug: getRequiredStringProperty("AI_FEATURES", elementIndex, element, "slug"),
			typesFile: getRequiredStringProperty("AI_FEATURES", elementIndex, element, "typesFile"),
			validatorsFile: getRequiredStringProperty(
				"AI_FEATURES",
				elementIndex,
				element,
				"validatorsFile",
			),
		};
	});
}

function parseAbilityEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceAbilityInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`ABILITIES[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			clientFile: getRequiredStringProperty("ABILITIES", elementIndex, element, "clientFile"),
			configFile: getRequiredStringProperty("ABILITIES", elementIndex, element, "configFile"),
			dataFile: getRequiredStringProperty("ABILITIES", elementIndex, element, "dataFile"),
			inputSchemaFile: getRequiredStringProperty(
				"ABILITIES",
				elementIndex,
				element,
				"inputSchemaFile",
			),
			inputTypeName: getRequiredStringProperty(
				"ABILITIES",
				elementIndex,
				element,
				"inputTypeName",
			),
			outputSchemaFile: getRequiredStringProperty(
				"ABILITIES",
				elementIndex,
				element,
				"outputSchemaFile",
			),
			outputTypeName: getRequiredStringProperty(
				"ABILITIES",
				elementIndex,
				element,
				"outputTypeName",
			),
			phpFile: getRequiredStringProperty("ABILITIES", elementIndex, element, "phpFile"),
			slug: getRequiredStringProperty("ABILITIES", elementIndex, element, "slug"),
			typesFile: getRequiredStringProperty("ABILITIES", elementIndex, element, "typesFile"),
		};
	});
}

function parseEditorPluginEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceEditorPluginInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`EDITOR_PLUGINS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			file: getRequiredStringProperty("EDITOR_PLUGINS", elementIndex, element, "file"),
			slug: getRequiredStringProperty("EDITOR_PLUGINS", elementIndex, element, "slug"),
			slot: getRequiredStringProperty("EDITOR_PLUGINS", elementIndex, element, "slot"),
		};
	});
}

function parseAdminViewEntries(
	arrayLiteral: ts.ArrayLiteralExpression,
): WorkspaceAdminViewInventoryEntry[] {
	return arrayLiteral.elements.map((element, elementIndex) => {
		if (!ts.isObjectLiteralExpression(element)) {
			throw new Error(
				`ADMIN_VIEWS[${elementIndex}] must be an object literal in scripts/block-config.ts.`,
			);
		}

		return {
			file: getRequiredStringProperty("ADMIN_VIEWS", elementIndex, element, "file"),
			phpFile: getRequiredStringProperty("ADMIN_VIEWS", elementIndex, element, "phpFile"),
			slug: getRequiredStringProperty("ADMIN_VIEWS", elementIndex, element, "slug"),
			source: getOptionalStringProperty("ADMIN_VIEWS", elementIndex, element, "source"),
		};
	});
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
	const blockArray = findExportedArrayLiteral(sourceFile, "BLOCKS");
	if (!blockArray.found || !blockArray.array) {
		throw new Error("scripts/block-config.ts must export a BLOCKS array.");
	}
	const variationArray = findExportedArrayLiteral(sourceFile, "VARIATIONS");
	const blockStyleArray = findExportedArrayLiteral(sourceFile, "BLOCK_STYLES");
	const blockTransformArray = findExportedArrayLiteral(sourceFile, "BLOCK_TRANSFORMS");
	const patternArray = findExportedArrayLiteral(sourceFile, "PATTERNS");
	const bindingSourceArray = findExportedArrayLiteral(sourceFile, "BINDING_SOURCES");
	const restResourceArray = findExportedArrayLiteral(sourceFile, "REST_RESOURCES");
	const abilityArray = findExportedArrayLiteral(sourceFile, "ABILITIES");
	const aiFeatureArray = findExportedArrayLiteral(sourceFile, "AI_FEATURES");
	const adminViewArray = findExportedArrayLiteral(sourceFile, "ADMIN_VIEWS");
	const editorPluginArray = findExportedArrayLiteral(sourceFile, "EDITOR_PLUGINS");
	if (variationArray.found && !variationArray.array) {
		throw new Error("scripts/block-config.ts must export VARIATIONS as an array literal.");
	}
	if (blockStyleArray.found && !blockStyleArray.array) {
		throw new Error("scripts/block-config.ts must export BLOCK_STYLES as an array literal.");
	}
	if (blockTransformArray.found && !blockTransformArray.array) {
		throw new Error("scripts/block-config.ts must export BLOCK_TRANSFORMS as an array literal.");
	}
	if (patternArray.found && !patternArray.array) {
		throw new Error("scripts/block-config.ts must export PATTERNS as an array literal.");
	}
	if (bindingSourceArray.found && !bindingSourceArray.array) {
		throw new Error("scripts/block-config.ts must export BINDING_SOURCES as an array literal.");
	}
	if (restResourceArray.found && !restResourceArray.array) {
		throw new Error("scripts/block-config.ts must export REST_RESOURCES as an array literal.");
	}
	if (abilityArray.found && !abilityArray.array) {
		throw new Error("scripts/block-config.ts must export ABILITIES as an array literal.");
	}
	if (aiFeatureArray.found && !aiFeatureArray.array) {
		throw new Error("scripts/block-config.ts must export AI_FEATURES as an array literal.");
	}
	if (adminViewArray.found && !adminViewArray.array) {
		throw new Error("scripts/block-config.ts must export ADMIN_VIEWS as an array literal.");
	}
	if (editorPluginArray.found && !editorPluginArray.array) {
		throw new Error("scripts/block-config.ts must export EDITOR_PLUGINS as an array literal.");
	}

	return {
		abilities: abilityArray.array ? parseAbilityEntries(abilityArray.array) : [],
		adminViews: adminViewArray.array ? parseAdminViewEntries(adminViewArray.array) : [],
		aiFeatures: aiFeatureArray.array ? parseAiFeatureEntries(aiFeatureArray.array) : [],
		bindingSources: bindingSourceArray.array
			? parseBindingSourceEntries(bindingSourceArray.array)
			: [],
		blockStyles: blockStyleArray.array ? parseBlockStyleEntries(blockStyleArray.array) : [],
		blockTransforms: blockTransformArray.array
			? parseBlockTransformEntries(blockTransformArray.array)
			: [],
		blocks: parseBlockEntries(blockArray.array),
		hasAbilitiesSection: abilityArray.found,
		hasAdminViewsSection: adminViewArray.found,
		hasAiFeaturesSection: aiFeatureArray.found,
		hasBindingSourcesSection: bindingSourceArray.found,
		hasBlockStylesSection: blockStyleArray.found,
		hasBlockTransformsSection: blockTransformArray.found,
		hasEditorPluginsSection: editorPluginArray.found,
		hasPatternsSection: patternArray.found,
		hasRestResourcesSection: restResourceArray.found,
		hasVariationsSection: variationArray.found,
		editorPlugins: editorPluginArray.array
			? parseEditorPluginEntries(editorPluginArray.array)
			: [],
		patterns: patternArray.array ? parsePatternEntries(patternArray.array) : [],
		restResources: restResourceArray.array
			? parseRestResourceEntries(restResourceArray.array)
			: [],
		source,
		variations: variationArray.array ? parseVariationEntries(variationArray.array) : [],
	};
}

/**
 * Read and parse the canonical workspace inventory file.
 *
 * @param projectDir Workspace root directory.
 * @returns Parsed `WorkspaceInventory` including the resolved `blockConfigPath`.
 * @throws {Error} When `scripts/block-config.ts` is missing or invalid.
 */
export function readWorkspaceInventory(projectDir: string): WorkspaceInventory {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	let source: string;
	try {
		source = fs.readFileSync(blockConfigPath, "utf8");
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
	{
		blockEntries = [],
		blockStyleEntries = [],
		blockTransformEntries = [],
		bindingSourceEntries = [],
		abilityEntries = [],
		adminViewEntries = [],
		aiFeatureEntries = [],
		editorPluginEntries = [],
		patternEntries = [],
		restResourceEntries = [],
		variationEntries = [],
		transformSource,
	}: {
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
	} = {},
): string {
	let nextSource = ensureWorkspaceInventorySections(source);
	if (transformSource) {
		nextSource = transformSource(nextSource);
	}
	nextSource = appendEntriesAtMarker(nextSource, BLOCK_CONFIG_ENTRY_MARKER, blockEntries);
	nextSource = appendEntriesAtMarker(nextSource, VARIATION_CONFIG_ENTRY_MARKER, variationEntries);
	nextSource = appendEntriesAtMarker(
		nextSource,
		BLOCK_STYLE_CONFIG_ENTRY_MARKER,
		blockStyleEntries,
	);
	nextSource = appendEntriesAtMarker(
		nextSource,
		BLOCK_TRANSFORM_CONFIG_ENTRY_MARKER,
		blockTransformEntries,
	);
	nextSource = appendEntriesAtMarker(nextSource, PATTERN_CONFIG_ENTRY_MARKER, patternEntries);
	nextSource = appendEntriesAtMarker(
		nextSource,
		BINDING_SOURCE_CONFIG_ENTRY_MARKER,
		bindingSourceEntries,
	);
	nextSource = appendEntriesAtMarker(
		nextSource,
		REST_RESOURCE_CONFIG_ENTRY_MARKER,
		restResourceEntries,
	);
	nextSource = appendEntriesAtMarker(
		nextSource,
		ABILITY_CONFIG_ENTRY_MARKER,
		abilityEntries,
	);
	nextSource = appendEntriesAtMarker(
		nextSource,
		AI_FEATURE_CONFIG_ENTRY_MARKER,
		aiFeatureEntries,
	);
	nextSource = appendEntriesAtMarker(
		nextSource,
		ADMIN_VIEW_CONFIG_ENTRY_MARKER,
		adminViewEntries,
	);
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
	nextSource = appendEntriesAtMarker(
		nextSource,
		EDITOR_PLUGIN_CONFIG_ENTRY_MARKER,
		editorPluginEntries,
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
