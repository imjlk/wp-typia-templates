import fs from "node:fs";
import path from "node:path";

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

export interface WorkspaceInventory {
	blockConfigPath: string;
	blocks: WorkspaceBlockInventoryEntry[];
	hasPatternsSection: boolean;
	hasVariationsSection: boolean;
	patterns: WorkspacePatternInventoryEntry[];
	source: string;
	variations: WorkspaceVariationInventoryEntry[];
}

export const BLOCK_CONFIG_ENTRY_MARKER = "\t// wp-typia add block entries";
export const VARIATION_CONFIG_ENTRY_MARKER = "\t// wp-typia add variation entries";
export const PATTERN_CONFIG_ENTRY_MARKER = "\t// wp-typia add pattern entries";

const VARIATIONS_SECTION = `

export interface WorkspaceVariationConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}

export const VARIATIONS: WorkspaceVariationConfig[] = [
\t// wp-typia add variation entries
];
`;

const PATTERNS_SECTION = `

export interface WorkspacePatternConfig {
\tfile: string;
\tslug: string;
}

export const PATTERNS: WorkspacePatternConfig[] = [
\t// wp-typia add pattern entries
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
): ts.ArrayLiteralExpression | null {
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
				return declaration.initializer;
			}
			return null;
		}
	}

	return null;
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

export function parseWorkspaceInventorySource(source: string): Omit<WorkspaceInventory, "blockConfigPath"> {
	const sourceFile = ts.createSourceFile(
		"block-config.ts",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	const blockArray = findExportedArrayLiteral(sourceFile, "BLOCKS");
	if (!blockArray) {
		throw new Error("scripts/block-config.ts must export a BLOCKS array.");
	}
	const variationArray = findExportedArrayLiteral(sourceFile, "VARIATIONS");
	const patternArray = findExportedArrayLiteral(sourceFile, "PATTERNS");

	return {
		blocks: parseBlockEntries(blockArray),
		hasPatternsSection: patternArray !== null,
		hasVariationsSection: variationArray !== null,
		patterns: patternArray ? parsePatternEntries(patternArray) : [],
		source,
		variations: variationArray ? parseVariationEntries(variationArray) : [],
	};
}

export function readWorkspaceInventory(projectDir: string): WorkspaceInventory {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	const source = fs.readFileSync(blockConfigPath, "utf8");
	return {
		blockConfigPath,
		...parseWorkspaceInventorySource(source),
	};
}

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
		nextSource += VARIATIONS_SECTION;
	} else if (!/export\s+const\s+VARIATIONS\b/u.test(nextSource)) {
		nextSource += `

export const VARIATIONS: WorkspaceVariationConfig[] = [
\t// wp-typia add variation entries
];
`;
	}

	if (!/export\s+interface\s+WorkspacePatternConfig\b/u.test(nextSource)) {
		nextSource += PATTERNS_SECTION;
	} else if (!/export\s+const\s+PATTERNS\b/u.test(nextSource)) {
		nextSource += `

export const PATTERNS: WorkspacePatternConfig[] = [
\t// wp-typia add pattern entries
];
`;
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

export function updateWorkspaceInventorySource(
	source: string,
	{
		blockEntries = [],
		patternEntries = [],
		variationEntries = [],
		transformSource,
	}: {
		blockEntries?: string[];
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
	return nextSource;
}

export async function appendWorkspaceInventoryEntries(
	projectDir: string,
	options: Parameters<typeof updateWorkspaceInventorySource>[1],
): Promise<void> {
	const blockConfigPath = path.join(projectDir, "scripts", "block-config.ts");
	const source = fs.readFileSync(blockConfigPath, "utf8");
	const nextSource = updateWorkspaceInventorySource(source, options);
	if (nextSource !== source) {
		fs.writeFileSync(blockConfigPath, nextSource, "utf8");
	}
}
