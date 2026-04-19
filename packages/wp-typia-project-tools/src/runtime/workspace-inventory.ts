import fs from "node:fs";
import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";

import ts from "typescript";

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

export interface WorkspacePatternInventoryEntry {
	file: string;
	slug: string;
}

export interface WorkspaceBindingSourceInventoryEntry {
	editorFile: string;
	serverFile: string;
	slug: string;
}

export interface WorkspaceEditorPluginInventoryEntry {
	file: string;
	slug: string;
	slot: string;
}

export interface WorkspaceInventory {
	bindingSources: WorkspaceBindingSourceInventoryEntry[];
	blockConfigPath: string;
	blocks: WorkspaceBlockInventoryEntry[];
	hasBindingSourcesSection: boolean;
	hasEditorPluginsSection: boolean;
	hasPatternsSection: boolean;
	hasVariationsSection: boolean;
	editorPlugins: WorkspaceEditorPluginInventoryEntry[];
	patterns: WorkspacePatternInventoryEntry[];
	source: string;
	variations: WorkspaceVariationInventoryEntry[];
}

export const BLOCK_CONFIG_ENTRY_MARKER = "\t// wp-typia add block entries";
export const VARIATION_CONFIG_ENTRY_MARKER = "\t// wp-typia add variation entries";
export const PATTERN_CONFIG_ENTRY_MARKER = "\t// wp-typia add pattern entries";
export const BINDING_SOURCE_CONFIG_ENTRY_MARKER = "\t// wp-typia add binding-source entries";
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
			editorFile: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "editorFile"),
			serverFile: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "serverFile"),
			slug: getRequiredStringProperty("BINDING_SOURCES", elementIndex, element, "slug"),
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
	const patternArray = findExportedArrayLiteral(sourceFile, "PATTERNS");
	const bindingSourceArray = findExportedArrayLiteral(sourceFile, "BINDING_SOURCES");
	const editorPluginArray = findExportedArrayLiteral(sourceFile, "EDITOR_PLUGINS");
	if (variationArray.found && !variationArray.array) {
		throw new Error("scripts/block-config.ts must export VARIATIONS as an array literal.");
	}
	if (patternArray.found && !patternArray.array) {
		throw new Error("scripts/block-config.ts must export PATTERNS as an array literal.");
	}
	if (bindingSourceArray.found && !bindingSourceArray.array) {
		throw new Error("scripts/block-config.ts must export BINDING_SOURCES as an array literal.");
	}
	if (editorPluginArray.found && !editorPluginArray.array) {
		throw new Error("scripts/block-config.ts must export EDITOR_PLUGINS as an array literal.");
	}

	return {
		bindingSources: bindingSourceArray.array
			? parseBindingSourceEntries(bindingSourceArray.array)
			: [],
		blocks: parseBlockEntries(blockArray.array),
		hasBindingSourcesSection: bindingSourceArray.found,
		hasEditorPluginsSection: editorPluginArray.found,
		hasPatternsSection: patternArray.found,
		hasVariationsSection: variationArray.found,
		editorPlugins: editorPluginArray.array
			? parseEditorPluginEntries(editorPluginArray.array)
			: [],
		patterns: patternArray.array ? parsePatternEntries(patternArray.array) : [],
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

	if (!/export\s+interface\s+WorkspaceVariationConfig\b/u.test(nextSource)) {
		nextSource += VARIATIONS_INTERFACE_SECTION;
	}
	if (!/export\s+const\s+VARIATIONS\b/u.test(nextSource)) {
		nextSource += VARIATIONS_CONST_SECTION;
	}

	if (!/export\s+interface\s+WorkspacePatternConfig\b/u.test(nextSource)) {
		nextSource += PATTERNS_INTERFACE_SECTION;
	}
	if (!/export\s+const\s+PATTERNS\b/u.test(nextSource)) {
		nextSource += PATTERNS_CONST_SECTION;
	}

	if (!/export\s+interface\s+WorkspaceBindingSourceConfig\b/u.test(nextSource)) {
		nextSource += BINDING_SOURCES_INTERFACE_SECTION;
	}
	if (!/export\s+const\s+BINDING_SOURCES\b/u.test(nextSource)) {
		nextSource += BINDING_SOURCES_CONST_SECTION;
	}
	if (!/export\s+interface\s+WorkspaceEditorPluginConfig\b/u.test(nextSource)) {
		nextSource += EDITOR_PLUGINS_INTERFACE_SECTION;
	}
	if (!/export\s+const\s+EDITOR_PLUGINS\b/u.test(nextSource)) {
		nextSource += EDITOR_PLUGINS_CONST_SECTION;
	}

	return `${nextSource}\n`;
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

/**
 * Update `scripts/block-config.ts` source text with additional inventory entries.
 *
 * Missing `VARIATIONS` and `PATTERNS` sections are created automatically before
 * new entries are appended at their marker comments. When provided,
 * `transformSource` runs before any entries are inserted.
 *
 * @param source Existing `scripts/block-config.ts` source.
 * @param options Entry lists plus an optional source transformer.
 * @returns Updated source text with all requested inventory entries appended.
 */
export function updateWorkspaceInventorySource(
	source: string,
	{
		blockEntries = [],
		bindingSourceEntries = [],
		editorPluginEntries = [],
		patternEntries = [],
		variationEntries = [],
		transformSource,
	}: {
		blockEntries?: string[];
		bindingSourceEntries?: string[];
		editorPluginEntries?: string[];
		patternEntries?: string[];
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
	nextSource = appendEntriesAtMarker(nextSource, PATTERN_CONFIG_ENTRY_MARKER, patternEntries);
	nextSource = appendEntriesAtMarker(
		nextSource,
		BINDING_SOURCE_CONFIG_ENTRY_MARKER,
		bindingSourceEntries,
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
