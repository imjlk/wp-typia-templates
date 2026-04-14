import fs from "node:fs";
import path from "node:path";

import {
	MIGRATION_TODO_PREFIX,
} from "./migration-constants.js";
import { summarizeManifest, summarizeUnionBranches } from "./migration-manifest.js";
import {
	getSnapshotBlockJsonPath,
	getSnapshotManifestPath,
	getSnapshotSavePath,
	readRuleMetadata,
} from "./migration-project.js";
import {
	createMigrationRiskSummary,
	formatMigrationRiskSummary,
} from "./migration-risk.js";
import { escapeForCode, readJson, renderObjectKey, renderPhpValue } from "./migration-utils.js";
import type {
	GeneratedMigrationEntry,
	ManifestDocument,
	MigrationDiff,
	MigrationEntry,
	MigrationProjectState,
	MigrationRuleFileInput,
} from "./migration-types.js";

export function formatDiffReport(
	diff: MigrationDiff,
	{ includeRiskSummary = true }: { includeRiskSummary?: boolean } = {},
): string {
	const lines = [
		`Migration diff: ${diff.fromVersion} -> ${diff.toVersion}`,
		`Current type: ${diff.currentTypeName}`,
		`Safe changes: ${diff.summary.auto}`,
		`Manual changes: ${diff.summary.manual}`,
	];

	if (diff.summary.autoItems.length > 0) {
		lines.push("", "Safe changes:");
		for (const item of diff.summary.autoItems) {
			lines.push(`  - ${item.path}: ${item.kind}${item.detail ? ` (${item.detail})` : ""}`);
		}
	}

	if (diff.summary.manualItems.length > 0) {
		lines.push("", "Manual review required:");
		for (const item of diff.summary.manualItems) {
			lines.push(`  - ${item.path}: ${item.kind}${item.detail ? ` (${item.detail})` : ""}`);
		}
	}

	if (diff.summary.renameCandidates.length > 0) {
		const autoApplied = diff.summary.renameCandidates.filter((item) => item.autoApply);
		const suggested = diff.summary.renameCandidates.filter((item) => !item.autoApply);

		if (autoApplied.length > 0) {
			lines.push("", "Auto-applied renames:");
			for (const item of autoApplied) {
				lines.push(
					`  - ${item.currentPath} <- ${item.legacyPath} (${item.reason}, score ${item.score.toFixed(2)})`,
				);
			}
		}
		if (suggested.length > 0) {
			lines.push("", "Suggested renames:");
			for (const item of suggested) {
				lines.push(
					`  - ${item.currentPath} <- ${item.legacyPath} (${item.reason}, score ${item.score.toFixed(2)})`,
				);
			}
		}
	}

	if (diff.summary.transformSuggestions.length > 0) {
		lines.push("", "Suggested transforms:");
		for (const item of diff.summary.transformSuggestions) {
			lines.push(`  - ${item.currentPath}${item.legacyPath ? ` <- ${item.legacyPath}` : ""} (${item.reason})`);
		}
	}

	if (includeRiskSummary) {
		lines.push("", `Risk summary: ${formatMigrationRiskSummary(createMigrationRiskSummary(diff))}`);
	}

	return lines.join("\n");
}

export function renderMigrationRuleFile({
	block,
	currentAttributes,
	currentTypeName,
	diff,
	fromVersion,
	projectDir,
	rulePath,
	targetVersion,
}: MigrationRuleFileInput): string {
	const activeRenameCandidates = diff.summary.renameCandidates.filter((candidate) => candidate.autoApply);
	const suggestedRenameCandidates = diff.summary.renameCandidates.filter((candidate) => !candidate.autoApply);
	const lines: string[] = [];
	const ruleDir = path.dirname(rulePath);
	const typesImport = normalizeImportPath(path.relative(ruleDir, path.join(projectDir, block.typesFile)));
	const currentManifestImport = normalizeImportPath(
		path.relative(ruleDir, path.join(projectDir, block.manifestFile)),
	);
	const helpersImport = normalizeImportPath(
		path.relative(ruleDir, path.join(projectDir, "src", "migrations", "helpers.ts")),
		true,
	);

	lines.push(`import type { ${currentTypeName} } from "${typesImport}";`);
	lines.push(`import currentManifest from "${currentManifestImport}";`);
	lines.push(`import {`);
	lines.push(`\ttype RenameMap,`);
	lines.push(`\ttype TransformMap,`);
	lines.push(`\tresolveMigrationAttribute,`);
	lines.push(`} from "${helpersImport}";`);
	lines.push("");
	lines.push(`export const fromVersion = "${fromVersion}" as const;`);
	lines.push(`export const toVersion = "${targetVersion}" as const;`);
	lines.push("");
	lines.push("export const renameMap: RenameMap = {");
	for (const candidate of activeRenameCandidates) {
		lines.push(`\t${renderObjectKey(candidate.currentPath)}: "${escapeForCode(candidate.legacyPath)}",`);
	}
	for (const candidate of suggestedRenameCandidates) {
		lines.push(`\t// ${renderObjectKey(candidate.currentPath)}: "${escapeForCode(candidate.legacyPath)}",`);
	}
	lines.push("};");
	lines.push("");
	lines.push("export const transforms: TransformMap = {");
	for (const suggestion of diff.summary.transformSuggestions) {
		lines.push(`\t// ${renderObjectKey(suggestion.currentPath)}: (legacyValue, legacyInput) => {`);
		for (const bodyLine of suggestion.bodyLines) {
			lines.push(`\t${bodyLine}`);
		}
		lines.push(`\t// },`);
	}
	lines.push("};");
	lines.push("");
	lines.push("export const unresolved = [");
	for (const item of diff.summary.manualItems) {
		lines.push(
			`\t"${item.path}: ${item.kind}${item.detail ? ` (${escapeForCode(item.detail)})` : ""}",`,
		);
	}
	for (const candidate of suggestedRenameCandidates) {
		lines.push(`\t"${candidate.currentPath}: rename candidate from ${candidate.legacyPath}",`);
	}
	for (const suggestion of diff.summary.transformSuggestions) {
		lines.push(
			`\t"${suggestion.currentPath}: transform suggested from ${suggestion.legacyPath ?? suggestion.currentPath}",`,
		);
	}
	lines.push("] as const;");
	lines.push("");
	lines.push(`export function migrate(input: Record<string, unknown>): ${currentTypeName} {`);
	lines.push(`\treturn {`);

	for (const key of Object.keys(currentAttributes)) {
		for (const manualItem of diff.summary.manualItems.filter(
			(item) => item.path === key || item.path.startsWith(`${key}.`),
		)) {
			lines.push(
				`\t\t// ${MIGRATION_TODO_PREFIX} ${manualItem.path}: ${manualItem.kind}${manualItem.detail ? ` (${manualItem.detail})` : ""}`,
			);
		}
		for (const renameCandidate of suggestedRenameCandidates.filter(
			(item) => item.currentPath === key || item.currentPath.startsWith(`${key}.`),
		)) {
			lines.push(
				`\t\t// ${MIGRATION_TODO_PREFIX} consider renameMap[${JSON.stringify(renameCandidate.currentPath)}] = "${renameCandidate.legacyPath}"`,
			);
		}
		for (const suggestion of diff.summary.transformSuggestions.filter(
			(item) => item.currentPath === key || item.currentPath.startsWith(`${key}.`),
		)) {
			lines.push(`\t\t// ${MIGRATION_TODO_PREFIX} review transforms[${JSON.stringify(suggestion.currentPath)}]`);
		}
		lines.push(
			`\t\t${key}: resolveMigrationAttribute(currentManifest.attributes.${key}, "${key}", "${key}", input, renameMap, transforms),`,
		);
	}

	lines.push(`\t} as ${currentTypeName};`);
	lines.push("}");
	lines.push("");
	return `${lines.join("\n")}\n`;
}

export function renderMigrationRegistryFile(
	state: MigrationProjectState,
	blockKey: string,
	entries: GeneratedMigrationEntry[],
): string {
	const block = state.blocks.find((entry) => entry.key === blockKey);
	if (!block) {
		throw new Error(`Unknown migration block target: ${blockKey}`);
	}
	const generatedDir = getGeneratedDir(block, state);
	const currentManifestWrapperFile = block.manifestFile.replace(
		/typia\.manifest\.json$/u,
		"manifest-document.ts",
	);
	const hasCurrentManifestWrapper =
		currentManifestWrapperFile !== block.manifestFile &&
		fs.existsSync(path.join(state.projectDir, currentManifestWrapperFile));
	const currentManifestSourceFile = hasCurrentManifestWrapper
		? currentManifestWrapperFile
		: block.manifestFile;
	const currentManifestImport = normalizeImportPath(
		path.relative(
			generatedDir,
			path.join(state.projectDir, currentManifestSourceFile),
		),
		hasCurrentManifestWrapper,
	);
	const currentManifestExpression = hasCurrentManifestWrapper
		? "rawCurrentManifest"
		: "parseManifestDocument<ManifestDocument>(rawCurrentManifest)";
	const imports = [
		`import rawCurrentManifest from "${currentManifestImport}";`,
		`import type { ManifestDocument, MigrationRiskSummary } from "${normalizeImportPath(path.relative(getGeneratedDir(block, state), path.join(state.projectDir, "src", "migrations", "helpers.ts")), true)}";`,
		...(entries.length > 0 || !hasCurrentManifestWrapper
			? [`import { parseManifestDocument } from "@wp-typia/block-runtime/editor";`]
			: []),
	];
	const body: string[] = [];

	entries.forEach(({ entry, riskSummary }, index) => {
		imports.push(`import manifest_${index} from "${entry.manifestImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		body.push(`\t{`);
		body.push(`\t\tfromMigrationVersion: "${entry.fromVersion}",`);
		body.push(`\t\tmanifest: parseManifestDocument<ManifestDocument>(manifest_${index}),`);
		body.push(`\t\triskSummary: ${JSON.stringify(riskSummary, null, "\t").replace(/\n/g, "\n\t\t")},`);
		body.push(`\t\trule: rule_${index},`);
		body.push(`\t},`);
	});

	return `/* eslint-disable prettier/prettier, @typescript-eslint/method-signature-style */
${imports.join("\n")}

interface MigrationRegistryEntry {
	fromMigrationVersion: string;
	manifest: ManifestDocument;
	riskSummary: MigrationRiskSummary;
	rule: {
		migrate(input: Record<string, unknown>): Record<string, unknown>;
		unresolved?: readonly string[];
	};
}

export const migrationRegistry: {
	currentMigrationVersion: string;
	currentManifest: ManifestDocument;
	entries: MigrationRegistryEntry[];
} = {
	currentMigrationVersion: "${state.config.currentMigrationVersion}",
	currentManifest: ${currentManifestExpression},
	entries: [
${body.join("\n")}
	],
};

export default migrationRegistry;
`;
}

export function renderGeneratedDeprecatedFile(
	state: MigrationProjectState,
	blockKey: string,
	entries: MigrationEntry[],
): string {
	const block = state.blocks.find((entry) => entry.key === blockKey);
	if (!block) {
		throw new Error(`Unknown migration block target: ${blockKey}`);
	}
	const currentTypeName = block.currentManifest.sourceType;
	if (typeof currentTypeName !== "string" || currentTypeName.length === 0) {
		throw new Error(`Missing current manifest sourceType for migration block ${blockKey}`);
	}
	const generatedDir = getGeneratedDir(block, state);
	const typesImport = normalizeImportPath(
		path.relative(generatedDir, path.join(state.projectDir, block.typesFile)),
		true,
	);

	if (entries.length === 0) {
		return `/* eslint-disable prettier/prettier */
import type { BlockDeprecationList } from "@wp-typia/block-types/blocks/registration";
import type { ${currentTypeName} } from "${typesImport}";

export const deprecated: BlockDeprecationList<${currentTypeName}> = [];
`;
	}

	const imports = [
		`import type { BlockConfiguration, BlockDeprecationList } from "@wp-typia/block-types/blocks/registration";`,
		`import type { ${currentTypeName} } from "${typesImport}";`,
	];
	const definitions: string[] = [];
	const arrayEntries: string[] = [];

	entries.forEach((entry, index) => {
		imports.push(`import block_${index} from "${entry.blockJsonImport}";`);
		imports.push(`import save_${index} from "${entry.saveImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		definitions.push(`const deprecated_${index}: BlockDeprecationList<${currentTypeName}>[number] = {`);
		definitions.push(
			`\tattributes: (block_${index}.attributes ?? {}) as BlockConfiguration["attributes"],`,
		);
		definitions.push(`\tsave: save_${index} as BlockConfiguration["save"],`);
		definitions.push(`\tmigrate(attributes: Record<string, unknown>) {`);
		definitions.push(`\t\treturn rule_${index}.migrate(attributes);`);
		definitions.push(`\t},`);
		definitions.push(`};`);
		arrayEntries.push(`deprecated_${index}`);
	});

	return `/* eslint-disable prettier/prettier */
${imports.join("\n")}

${definitions.join("\n\n")}

export const deprecated: BlockDeprecationList<${currentTypeName}> = [${arrayEntries.join(", ")}];
`;
}

export function renderGeneratedMigrationIndexFile(
	state: MigrationProjectState,
	entries: MigrationEntry[],
): string {
	if (state.blocks.length === 0) {
		return `export const migrationBlocks = [] as const;\nexport default migrationBlocks;\n`;
	}

	const generatedDir = state.paths.generatedDir;
	const imports: string[] = [];
	const definitions: string[] = [];

	state.blocks.forEach((block, index) => {
		const scopedEntries = entries.filter((entry) => entry.block.key === block.key);
		const registryImport =
			block.layout === "legacy" ? "./registry" : `./${block.key}/registry`;
		const deprecatedImport =
			block.layout === "legacy" ? "./deprecated" : `./${block.key}/deprecated`;
		const validatorsImport = normalizeImportPath(
			path.relative(
				generatedDir,
				path.join(
					state.projectDir,
					block.typesFile.replace(/types\.ts$/u, "validators.ts"),
				),
			),
			true,
		);
		imports.push(`import registry_${index} from "${registryImport}";`);
		imports.push(`import { deprecated as deprecated_${index} } from "${deprecatedImport}";`);
		imports.push(`import { validators as validators_${index} } from "${validatorsImport}";`);
		definitions.push(`\t{`);
		definitions.push(`\t\tkey: "${block.key}",`);
		definitions.push(`\t\tblockName: "${block.blockName}",`);
		definitions.push(`\t\tregistry: registry_${index},`);
		definitions.push(`\t\tdeprecated: deprecated_${index},`);
		definitions.push(`\t\tvalidators: validators_${index},`);
		definitions.push(`\t\tlegacyMigrationVersions: ${JSON.stringify(scopedEntries.map((entry) => entry.fromVersion))},`);
		definitions.push(`\t},`);
	});

	return `/* eslint-disable prettier/prettier */
${imports.join("\n")}

export const migrationBlocks = [
${definitions.join("\n")}
] as const;

export default migrationBlocks;
`;
}

export function renderPhpMigrationRegistryFile(
	state: MigrationProjectState,
	entries: MigrationEntry[],
): string {
	const blocks = state.blocks.map((block) => {
		const snapshots = Object.fromEntries(
			state.config.supportedMigrationVersions.map((version) => {
				const manifestPath = getSnapshotManifestPath(state.projectDir, block, version);
				const blockJsonPath = getSnapshotBlockJsonPath(state.projectDir, block, version);
				const savePath = getSnapshotSavePath(state.projectDir, block, version);

				return [
					version,
					{
						blockJson: fs.existsSync(blockJsonPath)
							? {
									attributeNames: Object.keys(
										(readJson<{ attributes?: Record<string, unknown> }>(blockJsonPath).attributes ?? {}),
									),
									name: readJson<{ name?: string | null }>(blockJsonPath).name ?? null,
								}
							: null,
						hasSaveSnapshot: fs.existsSync(savePath),
						manifest: fs.existsSync(manifestPath)
							? summarizeManifest(readJson<ManifestDocument>(manifestPath))
							: null,
					},
				] as const;
			}),
		);

		const edgeSummaries = entries
			.filter((entry) => entry.block.key === block.key)
			.map((entry) => {
				const ruleMetadata = readRuleMetadata(entry.rulePath);
				const snapshotManifest = snapshots[entry.fromVersion]?.manifest ?? null;
				return {
					autoAppliedRenameCount: ruleMetadata.renameMap.length,
					autoAppliedRenames: ruleMetadata.renameMap,
					fromMigrationVersion: entry.fromVersion,
					nestedPathRenames: ruleMetadata.renameMap.filter((item) => item.currentPath.includes(".")),
					ruleFile: path.relative(state.projectDir, entry.rulePath).replace(/\\/g, "/"),
					toMigrationVersion: entry.toVersion,
					transformKeys: ruleMetadata.transforms,
					unionBranches: snapshotManifest ? summarizeUnionBranches(snapshotManifest) : [],
					unresolved: ruleMetadata.unresolved,
				};
			});

		return {
			blockName: block.blockName,
			currentManifest: summarizeManifest(block.currentManifest),
			edges: edgeSummaries,
			key: block.key,
			legacyMigrationVersions: state.config.supportedMigrationVersions.filter(
				(version) => version !== state.config.currentMigrationVersion,
			),
			snapshots,
		};
	});

	return `<?php
declare(strict_types=1);

/**
 * Generated from advanced migration snapshots. Do not edit manually.
 */
return ${renderPhpValue(
		{
			currentMigrationVersion: state.config.currentMigrationVersion,
			blocks,
			snapshotDir: state.config.snapshotDir,
			supportedMigrationVersions: state.config.supportedMigrationVersions,
		},
		0,
	)};
`;
}

export function renderVerifyFile(
	state: MigrationProjectState,
	blockKey: string,
	entries: MigrationEntry[],
): string {
	const block = state.blocks.find((entry) => entry.key === blockKey);
	if (!block) {
		throw new Error(`Unknown migration block target: ${blockKey}`);
	}
	if (entries.length === 0) {
		return `/* eslint-disable no-console */
console.log(
\t'Run \`wp-typia migrate scaffold --from-migration-version <label>\` before verify.'
);
`;
	}

	const imports = [
		`import { validators } from "${entries[0]?.validatorImport ?? "./validators"}";`,
		`import { deprecated } from "./deprecated";`,
	];
	const checks: string[] = [];

	entries.forEach((entry, index) => {
		imports.push(`import fixture_${index} from "${entry.fixtureImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		checks.push(`\tif (selectedMigrationVersions.length === 0 || selectedMigrationVersions.includes("${entry.fromVersion}")) {`);
		checks.push(`\t\tif (rule_${index}.unresolved.length > 0) {`);
		checks.push(
			`\t\t\tthrow new Error("Unresolved migration TODOs remain for ${entry.fromVersion} -> ${entry.toVersion}: " + rule_${index}.unresolved.join(", "));`,
		);
		checks.push(`\t\t}`);
		checks.push(`\t\tconst cases_${index} = Array.isArray(fixture_${index}.cases) ? fixture_${index}.cases : [];`);
		checks.push(`\t\tfor (const fixtureCase of cases_${index}) {`);
		checks.push(`\t\t\tconst migrated_${index} = rule_${index}.migrate(fixtureCase.input ?? {});`);
		checks.push(`\t\t\tconst validation_${index} = validators.validate(migrated_${index});`);
		checks.push(`\t\t\tif (!isValidationSuccess(validation_${index})) {`);
		checks.push(
			`\t\t\t\tthrow new Error("Current validator rejected migrated fixture for ${entry.fromVersion} case " + String(fixtureCase.name ?? "unknown") + ": " + JSON.stringify(getValidationErrors(validation_${index})));`,
		);
		checks.push(`\t\t\t}`);
		checks.push(`\t\t}`);
		checks.push(
			`\t\tconsole.log("Verified ${entry.fromVersion} -> ${entry.toVersion} (" + cases_${index}.length + " case(s))");`,
		);
		checks.push(`\t}`);
	});

	return `/* eslint-disable prettier/prettier, no-console, @typescript-eslint/no-unused-vars, no-nested-ternary */
${imports.join("\n")}

function isValidationSuccess(result: unknown): boolean {
	return (
		result !== null &&
		typeof result === "object" &&
		(
			(result as { isValid?: unknown }).isValid === true ||
			(result as { success?: unknown }).success === true
		)
	);
}

function getValidationErrors(result: unknown): unknown[] {
	if (result !== null && typeof result === "object" && Array.isArray((result as { errors?: unknown[] }).errors)) {
		return (result as { errors: unknown[] }).errors;
	}

	return [];
}

const args = process.argv.slice(2);
const selectedMigrationVersions =
	args[0] === "--all"
		? []
		: args[0] === "--from-migration-version" && args[1]
			? [args[1]]
			: [];

if (deprecated.length !== ${entries.length}) {
	throw new Error("Generated deprecated entries are out of sync with migration registry.");
}

${checks.join("\n")}

console.log("Migration verification passed for ${block.blockName}");
`;
}

export function renderFuzzFile(
	state: MigrationProjectState,
	blockKey: string,
	entries: GeneratedMigrationEntry[],
): string {
	const block = state.blocks.find((entry) => entry.key === blockKey);
	if (!block) {
		throw new Error(`Unknown migration block target: ${blockKey}`);
	}
	if (entries.length === 0) {
		return `/* eslint-disable no-console */
console.log(
\t'Run \`wp-typia migrate scaffold --from-migration-version <label>\` before fuzz.'
);
`;
	}

	const imports = [
		`import { validators } from "${entries[0]?.entry.validatorImport ?? "./validators"}";`,
	];
	const edgeDefinitions: string[] = [];

	entries.forEach(({ entry, fuzzPlan }, index) => {
		imports.push(`import fixture_${index} from "${entry.fixtureImport}";`);
		imports.push(`import manifest_${index} from "${entry.manifestImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		edgeDefinitions.push(`{
\tfromMigrationVersion: "${entry.fromVersion}",
\ttoMigrationVersion: "${entry.toVersion}",
\tfixture: fixture_${index},
\tlegacyManifest: manifest_${index},
\trule: rule_${index},
\tplan: ${JSON.stringify(fuzzPlan, null, "\t").replace(/\n/g, "\n\t")},
}`);
	});

	return `/* eslint-disable prettier/prettier, no-console, no-bitwise, @typescript-eslint/no-unused-vars, no-nested-ternary, @typescript-eslint/method-signature-style */
${imports.join("\n")}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ManifestAttribute = {
\ttypia?: {
\t\tdefaultValue?: JsonValue | null;
\t\thasDefault?: boolean;
\t};
\tts?: {
\t\titems?: ManifestAttribute | null;
\t\tkind?: string | null;
\t\tproperties?: Record<string, ManifestAttribute> | null;
\t\tunion?: {
\t\t\tbranches?: Record<string, ManifestAttribute> | null;
\t\t\tdiscriminator?: string | null;
\t\t} | null;
\t} | null;
\twp?: {
\t\tdefaultValue?: JsonValue | null;
\t\tenum?: JsonValue[] | null;
\t\thasDefault?: boolean;
\t} | null;
};

type ManifestDocument = {
\tattributes?: Record<string, ManifestAttribute>;
};

type FixtureDocument = {
\tcases?: Array<{ input?: Record<string, unknown>; name?: string }>;
};

type FuzzEdge = {
\tfixture: FixtureDocument;
\tfromMigrationVersion: string;
\tlegacyManifest: ManifestDocument;
\tplan: {
\t\tblockedPaths: string[];
\t\tcompatibleMappings: Array<{ currentPath: string; legacyPath: string }>;
\t};
\trule: {
\t\tmigrate(input: Record<string, unknown>): Record<string, unknown>;
\t};
\ttoMigrationVersion: string;
};

const edges: FuzzEdge[] = [
${edgeDefinitions.join(",\n")}
];

function cloneJsonValue<T>(value: T): T {
\treturn JSON.parse(JSON.stringify(value));
}

function getValueAtPath(input: Record<string, unknown>, pathLabel: string): unknown {
\treturn String(pathLabel)
\t\t.split(".")
\t\t.reduce<unknown>(
\t\t\t(value, segment) => (value && typeof value === "object" ? (value as Record<string, unknown>)[segment] : undefined),
\t\t\tinput,
\t\t);
}

function setValueAtPath(input: Record<string, unknown>, pathLabel: string, value: unknown): void {
\tconst segments = String(pathLabel).split(".").filter(Boolean);
\tif (segments.length === 0) {
\t\treturn;
\t}

\tlet target: Record<string, unknown> = input;
\twhile (segments.length > 1) {
\t\tconst segment = segments.shift();
\t\tif (!segment) {
\t\t\tcontinue;
\t\t}
\t\tif (!target[segment] || typeof target[segment] !== "object" || Array.isArray(target[segment])) {
\t\t\ttarget[segment] = {};
\t\t}
\t\ttarget = target[segment];
\t}

\ttarget[segments[0]!] = value;
}

function createDefaultValue(attribute: ManifestAttribute): JsonValue | Record<string, JsonValue> | null {
\tif (attribute?.typia?.hasDefault) {
\t\treturn cloneJsonValue(attribute.typia.defaultValue ?? null);
\t}
\tif (attribute?.wp?.hasDefault) {
\t\treturn cloneJsonValue(attribute.wp.defaultValue ?? null);
\t}
\tif (Array.isArray(attribute?.wp?.enum) && attribute.wp.enum.length > 0) {
\t\treturn cloneJsonValue(attribute.wp.enum[0] ?? null);
\t}

\tswitch (attribute?.ts?.kind) {
\t\tcase "string":
\t\t\treturn "";
\t\tcase "number":
\t\t\treturn 0;
\t\tcase "boolean":
\t\t\treturn false;
\t\tcase "array":
\t\t\treturn [];
\t\tcase "object":
\t\t\treturn Object.fromEntries(
\t\t\t\tObject.entries(attribute?.ts?.properties ?? {}).map(([key, property]) => [
\t\t\t\t\tkey,
\t\t\t\t\tcreateDefaultValue(property),
\t\t\t\t]),
\t\t\t);
\t\tcase "union": {
\t\t\tconst firstBranch = Object.values(attribute?.ts?.union?.branches ?? {})[0];
\t\t\treturn firstBranch ? createDefaultValue(firstBranch) : null;
\t\t}
\t\tdefault:
\t\t\treturn null;
\t}
}

function createDefaultInput(manifest: ManifestDocument): Record<string, unknown> {
\treturn Object.fromEntries(
\t\tObject.entries(manifest?.attributes ?? {}).map(([key, attribute]) => [key, createDefaultValue(attribute)]),
\t);
}

function isValidationSuccess(result: unknown): boolean {
\tconst typedResult =
\t\tresult !== null && typeof result === "object"
\t\t\t? (result as { isValid?: unknown; success?: unknown })
\t\t\t: null;

\treturn (
\t\ttypedResult !== null &&
\t\t(
\t\t\ttypedResult.isValid === true ||
\t\t\ttypedResult.success === true
\t\t)
\t);
}

function getValidationErrors(result: unknown): unknown[] {
\tif (
\t\tresult !== null &&
\t\ttypeof result === "object" &&
\t\tArray.isArray((result as { errors?: unknown[] }).errors)
\t) {
\t\treturn (result as { errors: unknown[] }).errors;
\t}

\treturn [];
}

function createSeededRandom(seed: number): () => number {
\tlet state = seed >>> 0;
\treturn () => {
\t\tstate = (state * 1664525 + 1013904223) >>> 0;
\t\treturn state / 4294967296;
\t};
}

function withSeededRandom<T>(seed: number, callback: () => T): T {
\tconst originalRandom = Math.random;
\tMath.random = createSeededRandom(seed);
\ttry {
\t\treturn callback();
\t} finally {
\t\tMath.random = originalRandom;
\t}
}

function parseArgs(argv: string[]): {
\tall: boolean;
\tfromMigrationVersion?: string;
\titerations: number;
\tseed?: number;
} {
\tlet all = false;
\tlet fromMigrationVersion: string | undefined;
\tlet iterations = 25;
\tlet seed: number | undefined;

\tfor (let index = 0; index < argv.length; index += 1) {
\t\tconst arg = argv[index];
\t\tconst next = argv[index + 1];

\t\tif (arg === "--all") {
\t\t\tall = true;
\t\t\tcontinue;
\t\t}
\t\tif (arg === "--from-migration-version") {
\t\t\tfromMigrationVersion = next;
\t\t\tindex += 1;
\t\t\tcontinue;
\t\t}
\t\tif (arg === "--iterations") {
\t\t\titerations = Number.parseInt(next ?? "", 10) || 25;
\t\t\tindex += 1;
\t\t\tcontinue;
\t\t}
\t\tif (arg === "--seed") {
\t\t\tseed = Number.parseInt(next ?? "", 10);
\t\t\tindex += 1;
\t\t}
\t}

\treturn { all, fromMigrationVersion, iterations, seed };
}

function applyCompatibleMappings(
\tbaseInput: Record<string, unknown>,
\tcurrentSample: Record<string, unknown>,
\tmappings: Array<{ currentPath: string; legacyPath: string }>,
): Record<string, unknown> {
\tfor (const mapping of mappings) {
\t\tconst value = getValueAtPath(currentSample, mapping.currentPath);
\t\tif (value !== undefined) {
\t\t\tsetValueAtPath(baseInput, mapping.legacyPath, cloneJsonValue(value));
\t\t}
\t}
\treturn baseInput;
}

function assertValidMigration(
\tedge: FuzzEdge,
\tcandidateInput: Record<string, unknown>,
\tmigratedOutput: Record<string, unknown>,
\tvalidation: unknown,
\titerationSeed: number,
\titeration: number | string,
): void {
\tif (isValidationSuccess(validation)) {
\t\treturn;
\t}

\tthrow new Error(
\t\t"Migration fuzz failed for " +
\t\t\tedge.fromMigrationVersion +
\t\t\t" -> " +
\t\t\tedge.toMigrationVersion +
\t\t\t" (seed " +
\t\t\tString(iterationSeed) +
\t\t\t", iteration " +
\t\t\tString(iteration) +
\t\t\t"): " +
\t\t\tJSON.stringify({
\t\t\t\tinput: candidateInput,
\t\t\t\tmigrated: migratedOutput,
\t\t\t\terrors: getValidationErrors(validation),
\t\t\t}),
\t\t);
}

const parsed = parseArgs(process.argv.slice(2));
const selectedMigrationVersions = parsed.all
\t? []
\t: parsed.fromMigrationVersion
\t\t? [parsed.fromMigrationVersion]
\t\t: edges.map((edge) => edge.fromMigrationVersion);
const baseSeed = typeof parsed.seed === "number" ? parsed.seed : Date.now();

if (!Number.isInteger(parsed.seed)) {
\tconsole.log("Using migration fuzz seed " + String(baseSeed));
}

if (edges.length === 0) {
\tconsole.log("No legacy migration versions configured for migration fuzzing.");
\tprocess.exit(0);
}

let executedEdges = 0;

for (const [edgeIndex, edge] of edges.entries()) {
\tif (selectedMigrationVersions.length > 0 && !selectedMigrationVersions.includes(edge.fromMigrationVersion)) {
\t\tcontinue;
\t}

\texecutedEdges += 1;

\tconst fixtureCases = Array.isArray(edge.fixture?.cases) ? edge.fixture.cases : [];
\tfor (const fixtureCase of fixtureCases) {
\t\tconst migrated = edge.rule.migrate(fixtureCase.input ?? {});
\t\tconst validation = validators.validate(migrated);
\t\tassertValidMigration(edge, fixtureCase.input ?? {}, migrated, validation, baseSeed, fixtureCase.name ?? "fixture");
\t}

\tfor (let iteration = 0; iteration < parsed.iterations; iteration += 1) {
\t\tconst iterationSeed = (baseSeed + edgeIndex * 100003 + iteration) >>> 0;
\t\tconst currentSample = withSeededRandom(iterationSeed, () => validators.random());
\t\tconst baseFixture = fixtureCases.find((fixtureCase) => fixtureCase.name === "default")?.input;
\t\tconst legacyInput = applyCompatibleMappings(
\t\t\tcloneJsonValue(baseFixture ?? createDefaultInput(edge.legacyManifest)),
\t\t\tcurrentSample,
\t\t\tedge.plan.compatibleMappings,
\t\t);
\t\tconst migrated = edge.rule.migrate(legacyInput);
\t\tconst validation = validators.validate(migrated);
\t\tassertValidMigration(edge, legacyInput, migrated, validation, iterationSeed, iteration);
\t}

\tconsole.log(
\t\t"Fuzzed " +
\t\t\tedge.fromMigrationVersion +
\t\t\t" -> " +
\t\t\tedge.toMigrationVersion +
\t\t\t" (" +
\t\t\tString(fixtureCases.length) +
\t\t\t" fixture case(s), " +
\t\t\tString(parsed.iterations) +
\t\t\t" fuzz iteration(s))",
\t);
}

if (selectedMigrationVersions.length > 0 && executedEdges === 0) {
\tthrow new Error(
\t\t"Requested migration version was not exercised by fuzz: " +
\t\t\tselectedMigrationVersions.join(", "),
\t);
}

console.log("Migration fuzzing passed for ${block.blockName}");
`;
}

function normalizeImportPath(relativePath: string, stripExtension = false): string {
	let nextPath = relativePath.replace(/\\/g, "/");
	if (!nextPath.startsWith(".")) {
		nextPath = `./${nextPath}`;
	}
	if (stripExtension) {
		nextPath = nextPath.replace(/\.[^.]+$/u, "");
	}
	return nextPath;
}

function getGeneratedDir(
	block: MigrationProjectState["blocks"][number],
	state: MigrationProjectState,
): string {
	return block.layout === "legacy"
		? state.paths.generatedDir
		: path.join(state.paths.generatedDir, block.key);
}
