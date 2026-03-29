import fs from "node:fs";
import path from "node:path";

import {
	MIGRATION_TODO_PREFIX,
	ROOT_BLOCK_JSON,
	ROOT_MANIFEST,
	SNAPSHOT_DIR,
} from "./migration-constants.js";
import { summarizeManifest, summarizeUnionBranches } from "./migration-manifest.js";
import { readRuleMetadata } from "./migration-project.js";
import { escapeForCode, readJson, renderObjectKey, renderPhpValue } from "./migration-utils.js";
import type {
	ManifestAttribute,
	ManifestDocument,
	MigrationDiff,
	MigrationEntry,
	MigrationProjectState,
	MigrationRuleFileInput,
} from "./migration-types.js";

export function formatDiffReport(diff: MigrationDiff): string {
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

	return lines.join("\n");
}

export function renderMigrationRuleFile({
	currentAttributes,
	currentTypeName,
	diff,
	fromVersion,
	targetVersion,
}: MigrationRuleFileInput): string {
	const activeRenameCandidates = diff.summary.renameCandidates.filter((candidate) => candidate.autoApply);
	const suggestedRenameCandidates = diff.summary.renameCandidates.filter((candidate) => !candidate.autoApply);
	const lines: string[] = [];

	lines.push(`import type { ${currentTypeName} } from "../../types";`);
	lines.push(`import currentManifest from "../../../${ROOT_MANIFEST}";`);
	lines.push(`import {`);
	lines.push(`\ttype RenameMap,`);
	lines.push(`\ttype TransformMap,`);
	lines.push(`\tresolveMigrationAttribute,`);
	lines.push(`} from "../helpers";`);
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
	entries: MigrationEntry[],
): string {
	const imports = [`import currentManifest from "../../../${ROOT_MANIFEST}";`];
	const body: string[] = [];

	entries.forEach((entry, index) => {
		imports.push(`import manifest_${index} from "${entry.manifestImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		body.push(`\t{`);
		body.push(`\t\tfromVersion: "${entry.fromVersion}",`);
		body.push(`\t\tmanifest: manifest_${index},`);
		body.push(`\t\trule: rule_${index},`);
		body.push(`\t},`);
	});

	return `${imports.join("\n")}

export const migrationRegistry = {
	currentVersion: "${state.config.currentVersion}",
	currentManifest,
	entries: [
${body.join("\n")}
	],
} as const;

export default migrationRegistry;
`;
}

export function renderGeneratedDeprecatedFile(entries: MigrationEntry[]): string {
	if (entries.length === 0) {
		return `import type { BlockConfiguration } from "@wordpress/blocks";

export const deprecated: NonNullable<BlockConfiguration["deprecated"]> = [];
`;
	}

	const imports = [`import type { BlockConfiguration } from "@wordpress/blocks";`];
	const definitions: string[] = [];
	const arrayEntries: string[] = [];

	entries.forEach((entry, index) => {
		imports.push(`import block_${index} from "${entry.blockJsonImport}";`);
		imports.push(`import save_${index} from "${entry.saveImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		definitions.push(`const deprecated_${index}: NonNullable<BlockConfiguration["deprecated"]>[number] = {`);
		definitions.push(`\tattributes: (block_${index}.attributes ?? {}) as Record<string, unknown>,`);
		definitions.push(`\tsave: save_${index} as BlockConfiguration["save"],`);
		definitions.push(`\tmigrate(attributes: Record<string, unknown>) {`);
		definitions.push(`\t\treturn rule_${index}.migrate(attributes);`);
		definitions.push(`\t},`);
		definitions.push(`};`);
		arrayEntries.push(`deprecated_${index}`);
	});

	return `${imports.join("\n")}

${definitions.join("\n\n")}

export const deprecated: NonNullable<BlockConfiguration["deprecated"]> = [${arrayEntries.join(", ")}];
`;
}

export function renderPhpMigrationRegistryFile(
	state: MigrationProjectState,
	entries: MigrationEntry[],
): string {
	const snapshots = Object.fromEntries(
		state.config.supportedVersions.map((version) => {
			const snapshotRoot = path.join(state.projectDir, SNAPSHOT_DIR, version);
			const manifestPath = path.join(snapshotRoot, ROOT_MANIFEST);
			const blockJsonPath = path.join(snapshotRoot, ROOT_BLOCK_JSON);
			const savePath = path.join(snapshotRoot, "save.tsx");

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

	const edgeSummaries = entries.map((entry) => {
		const ruleMetadata = readRuleMetadata(entry.rulePath);
		const snapshotManifest = snapshots[entry.fromVersion]?.manifest ?? null;
		return {
			autoAppliedRenameCount: ruleMetadata.renameMap.length,
			autoAppliedRenames: ruleMetadata.renameMap,
			fromVersion: entry.fromVersion,
			nestedPathRenames: ruleMetadata.renameMap.filter((item) => item.currentPath.includes(".")),
			ruleFile: path.relative(state.projectDir, entry.rulePath).replace(/\\/g, "/"),
			toVersion: entry.toVersion,
			transformKeys: ruleMetadata.transforms,
			unionBranches: snapshotManifest ? summarizeUnionBranches(snapshotManifest) : [],
			unresolved: ruleMetadata.unresolved,
		};
	});

	return `<?php
declare(strict_types=1);

/**
 * Generated from advanced migration snapshots. Do not edit manually.
 */
return ${renderPhpValue(
		{
			blockName: state.config.blockName,
			currentManifest: summarizeManifest(state.currentManifest),
			currentVersion: state.config.currentVersion,
			edges: edgeSummaries,
			legacyVersions: state.config.supportedVersions.filter(
				(version) => version !== state.config.currentVersion,
			),
			snapshotDir: state.config.snapshotDir,
			snapshots,
			supportedVersions: state.config.supportedVersions,
		},
		0,
	)};
`;
}

export function renderVerifyFile(
	state: MigrationProjectState,
	entries: MigrationEntry[],
): string {
	const imports = [
		`import { validators } from "../../validators";`,
		`import { deprecated } from "./deprecated";`,
	];
	const checks: string[] = [];

	entries.forEach((entry, index) => {
		imports.push(`import fixture_${index} from "${entry.fixtureImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		checks.push(`\tif (selectedVersions.length === 0 || selectedVersions.includes("${entry.fromVersion}")) {`);
		checks.push(`\t\tif (rule_${index}.unresolved.length > 0) {`);
		checks.push(
			`\t\t\tthrow new Error("Unresolved migration TODOs remain for ${entry.fromVersion} -> ${entry.toVersion}: " + rule_${index}.unresolved.join(", "));`,
		);
		checks.push(`\t\t}`);
		checks.push(`\t\tconst cases_${index} = Array.isArray(fixture_${index}.cases) ? fixture_${index}.cases : [];`);
		checks.push(`\t\tfor (const fixtureCase of cases_${index}) {`);
		checks.push(`\t\t\tconst migrated_${index} = rule_${index}.migrate(fixtureCase.input ?? {});`);
		checks.push(`\t\t\tconst validation_${index} = validators.validate(migrated_${index});`);
		checks.push(`\t\t\tif (!validation_${index}.success) {`);
		checks.push(
			`\t\t\t\tthrow new Error("Current validator rejected migrated fixture for ${entry.fromVersion} case " + String(fixtureCase.name ?? "unknown") + ": " + JSON.stringify(validation_${index}.errors));`,
		);
		checks.push(`\t\t\t}`);
		checks.push(`\t\t}`);
		checks.push(
			`\t\tconsole.log("Verified ${entry.fromVersion} -> ${entry.toVersion} (" + cases_${index}.length + " case(s))");`,
		);
		checks.push(`\t}`);
	});

	return `${imports.join("\n")}

const args = process.argv.slice(2);
const selectedVersions =
	args[0] === "--all"
		? []
		: args[0] === "--from" && args[1]
			? [args[1]]
			: [];

if (deprecated.length !== ${entries.length}) {
	throw new Error("Generated deprecated entries are out of sync with migration registry.");
}

${checks.join("\n")}

console.log("Migration verification passed for ${state.config.blockName}");
`;
}
