import ts from "typescript";

import {
	MANUAL_REST_CONTRACT_AUTH_IDS,
	MANUAL_REST_CONTRACT_HTTP_METHOD_IDS,
	REST_RESOURCE_METHOD_IDS,
} from "./cli-add-shared.js";
import { getPropertyNameText } from "./ts-property-names.js";
import {
	ABILITY_CONFIG_ENTRY_MARKER,
	ABILITIES_CONST_SECTION,
	ABILITIES_INTERFACE_SECTION,
	ADMIN_VIEW_CONFIG_ENTRY_MARKER,
	ADMIN_VIEWS_CONST_SECTION,
	ADMIN_VIEWS_INTERFACE_SECTION,
	AI_FEATURES_CONST_SECTION,
	AI_FEATURES_INTERFACE_SECTION,
	AI_FEATURE_CONFIG_ENTRY_MARKER,
	BINDING_SOURCES_CONST_SECTION,
	BINDING_SOURCES_INTERFACE_SECTION,
	BINDING_SOURCE_CONFIG_ENTRY_MARKER,
	CONTRACTS_CONST_SECTION,
	CONTRACTS_INTERFACE_SECTION,
	CONTRACT_CONFIG_ENTRY_MARKER,
	BLOCK_CONFIG_ENTRY_MARKER,
	BLOCK_STYLES_CONST_SECTION,
	BLOCK_STYLES_INTERFACE_SECTION,
	BLOCK_STYLE_CONFIG_ENTRY_MARKER,
	BLOCK_TRANSFORMS_CONST_SECTION,
	BLOCK_TRANSFORMS_INTERFACE_SECTION,
	BLOCK_TRANSFORM_CONFIG_ENTRY_MARKER,
	EDITOR_PLUGINS_CONST_SECTION,
	EDITOR_PLUGINS_INTERFACE_SECTION,
	EDITOR_PLUGIN_CONFIG_ENTRY_MARKER,
	PATTERNS_CONST_SECTION,
	PATTERNS_INTERFACE_SECTION,
	PATTERN_CONFIG_ENTRY_MARKER,
	REST_RESOURCES_CONST_SECTION,
	REST_RESOURCES_INTERFACE_SECTION,
	REST_RESOURCE_CONFIG_ENTRY_MARKER,
	VARIATIONS_CONST_SECTION,
	VARIATIONS_INTERFACE_SECTION,
	VARIATION_CONFIG_ENTRY_MARKER,
} from "./workspace-inventory-templates.js";
import type {
	WorkspaceAbilityInventoryEntry,
	WorkspaceAdminViewInventoryEntry,
	WorkspaceAiFeatureInventoryEntry,
	WorkspaceBindingSourceInventoryEntry,
	WorkspaceBlockInventoryEntry,
	WorkspaceBlockStyleInventoryEntry,
	WorkspaceBlockTransformInventoryEntry,
	WorkspaceContractInventoryEntry,
	WorkspaceEditorPluginInventoryEntry,
	WorkspaceInventory,
	WorkspaceInventoryAppendOptionKey,
	WorkspaceInventoryEntriesKey,
	WorkspaceInventoryParseResult,
	WorkspaceInventorySectionFlagKey,
	WorkspacePatternInventoryEntry,
	WorkspaceRestResourceInventoryEntry,
	WorkspaceVariationInventoryEntry,
} from "./workspace-inventory-types.js";

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
> =
	TKey extends Extract<keyof T, string>
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
> =
	MissingRequiredInventoryEntryKeys<T, TFields> extends never
		? unknown
		: {
				missingRequiredInventoryEntryFields: MissingRequiredInventoryEntryKeys<
					T,
					TFields
				>;
			};

type RequiredInventoryEntryFieldsMarkedRequired<
	T extends object,
	TFields extends readonly TypedInventoryEntryFieldDescriptor<T>[],
> =
	Extract<
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
	>(
		descriptor: {
			entryName: string;
			fields: TFields;
		} & RequiredInventoryEntryFieldsPresent<T, TFields> &
			RequiredInventoryEntryFieldsMarkedRequired<T, TFields>,
	): InventoryEntryParserDescriptor => descriptor;
}

export type InventorySectionDescriptor = {
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

export const BLOCK_INVENTORY_SECTION: InventorySectionDescriptor = {
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

export const INVENTORY_SECTIONS: readonly InventorySectionDescriptor[] = [
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
			entry:
				defineInventoryEntryParser<WorkspaceBlockTransformInventoryEntry>()({
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
			entry: defineInventoryEntryParser<WorkspaceBindingSourceInventoryEntry>()(
				{
					entryName: "BINDING_SOURCES",
					fields: [
						{ key: "attribute" },
						{ key: "block" },
						{ key: "editorFile", required: true },
						{ key: "serverFile", required: true },
						{ key: "slug", required: true },
					],
				},
			),
			hasSectionKey: "hasBindingSourcesSection",
		},
		value: {
			name: "BINDING_SOURCES",
			section: BINDING_SOURCES_CONST_SECTION,
		},
	},
	{
		append: {
			marker: CONTRACT_CONFIG_ENTRY_MARKER,
			optionKey: "contractEntries",
		},
		interface: {
			name: "WorkspaceContractConfig",
			section: CONTRACTS_INTERFACE_SECTION,
		},
		parse: {
			entriesKey: "contracts",
			entry: defineInventoryEntryParser<WorkspaceContractInventoryEntry>()({
				entryName: "CONTRACTS",
				fields: [
					{ key: "schemaFile", required: true },
					{ key: "slug", required: true },
					{ key: "sourceTypeName", required: true },
					{ key: "typesFile", required: true },
				],
			}),
			hasSectionKey: "hasContractsSection",
		},
		value: {
			name: "CONTRACTS",
			section: CONTRACTS_CONST_SECTION,
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
					{
						key: "auth",
						validate: (value, context) => {
							if (
								typeof value === "string" &&
								!(MANUAL_REST_CONTRACT_AUTH_IDS as readonly string[]).includes(
									value,
								)
							) {
								throw new Error(
									`${context.entryName}[${context.elementIndex}].${context.key} must be one of: ${MANUAL_REST_CONTRACT_AUTH_IDS.join(", ")}.`,
								);
							}
						},
					},
					{ key: "bodyTypeName" },
					{ key: "clientFile", required: true },
					{ key: "controllerClass" },
					{ key: "controllerExtends" },
					{ key: "dataFile" },
					{
						key: "method",
						validate: (value, context) => {
							if (
								typeof value === "string" &&
								!(
									MANUAL_REST_CONTRACT_HTTP_METHOD_IDS as readonly string[]
								).includes(value)
							) {
								throw new Error(
									`${context.entryName}[${context.elementIndex}].${context.key} must be one of: ${MANUAL_REST_CONTRACT_HTTP_METHOD_IDS.join(", ")}.`,
								);
							}
						},
					},
					{
						key: "methods",
						kind: "stringArray",
						required: true,
						validate: (value, context) => {
							const methods = Array.isArray(value) ? value : [];
							const invalidMethods = methods.filter(
								(method) =>
									!(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(
										method,
									),
							);
							if (invalidMethods.length > 0) {
								throw new Error(
									`${context.entryName}[${context.elementIndex}].${context.key} includes unsupported values: ${invalidMethods.join(", ")}.`,
								);
							}
						},
					},
					{
						key: "mode",
						validate: (value, context) => {
							if (
								typeof value === "string" &&
								value !== "generated" &&
								value !== "manual"
							) {
								throw new Error(
									`${context.entryName}[${context.elementIndex}].${context.key} must be generated or manual.`,
								);
							}
						},
					},
					{ key: "namespace", required: true },
					{ key: "openApiFile", required: true },
					{ key: "pathPattern" },
					{ key: "permissionCallback" },
					{ key: "phpFile" },
					{ key: "queryTypeName" },
					{ key: "responseTypeName" },
					{ key: "routePattern" },
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
			!statement.modifiers?.some(
				(modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
			)
		) {
			continue;
		}

		for (const declaration of statement.declarationList.declarations) {
			if (
				!ts.isIdentifier(declaration.name) ||
				declaration.name.text !== exportName
			) {
				continue;
			}
			if (
				declaration.initializer &&
				ts.isArrayLiteralExpression(declaration.initializer)
			) {
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
	return (
		value === undefined || (typeof value === "string" && value.length === 0)
	);
}

function formatMissingRequiredInventoryFields(keys: readonly string[]): string {
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
			throw new Error(
				`scripts/block-config.ts must export a ${exportName} array.`,
			);
		}
		return {
			entries: [],
			found: false,
		};
	}
	if (!exportedArray.array) {
		if (descriptor.parse.required) {
			throw new Error(
				`scripts/block-config.ts must export a ${exportName} array.`,
			);
		}
		throw new Error(
			`scripts/block-config.ts must export ${exportName} as an array literal.`,
		);
	}

	return {
		entries: parseInventoryEntries<T>(
			exportedArray.array,
			descriptor.parse.entry,
		),
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
export function parseWorkspaceInventorySource(
	source: string,
): Omit<WorkspaceInventory, "blockConfigPath"> {
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
		contracts: [],
		editorPlugins: [],
		hasAbilitiesSection: false,
		hasAdminViewsSection: false,
		hasAiFeaturesSection: false,
		hasBindingSourcesSection: false,
		hasBlockStylesSection: false,
		hasBlockTransformsSection: false,
		hasContractsSection: false,
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
