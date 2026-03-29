import fs from "node:fs";
import path from "node:path";

import { FIXTURES_DIR, ROOT_MANIFEST, SNAPSHOT_DIR } from "./migration-constants.js";
import { defaultValueForManifestAttribute } from "./migration-manifest.js";
import {
	cloneJsonValue,
	createFixtureScalarValue,
	createTransformFixtureValue,
	deleteValueAtPath,
	readJson,
	setValueAtPath,
	getValueAtPath,
} from "./migration-utils.js";
import type {
	JsonObject,
	JsonValue,
	ManifestAttribute,
	ManifestDocument,
	MigrationDiff,
	MigrationFixtureCase,
	MigrationFixtureDocument,
	RenameCandidate,
	TransformSuggestion,
} from "./migration-types.js";

export function ensureEdgeFixtureFile(
	projectDir: string,
	fromVersion: string,
	toVersion: string,
	diff: MigrationDiff,
): void {
	const fixturePath = path.join(projectDir, FIXTURES_DIR, `${fromVersion}-to-${toVersion}.json`);
	if (fs.existsSync(fixturePath)) {
		return;
	}

	const manifest = readJson<ManifestDocument>(path.join(projectDir, SNAPSHOT_DIR, fromVersion, ROOT_MANIFEST));
	const attributes: JsonObject = {};
	for (const [key, attribute] of Object.entries(manifest.attributes ?? {})) {
		attributes[key] = defaultValueForManifestAttribute(attribute) ?? null;
	}

	const cases: MigrationFixtureCase[] = [
		{
			input: attributes,
			name: "default",
		},
		...createRenameFixtureCases(attributes, diff.summary.renameCandidates),
		...createTransformFixtureCases(attributes, diff.summary.transformSuggestions),
		...createUnionFixtureCases(attributes, manifest.attributes ?? {}, diff.summary.renameCandidates),
	];

	const fixtureDocument: MigrationFixtureDocument = {
		cases,
		fromVersion,
		toVersion,
	};

	fs.writeFileSync(fixturePath, `${JSON.stringify(fixtureDocument, null, "\t")}\n`, "utf8");
}

function createRenameFixtureCases(
	baseAttributes: JsonObject,
	renameCandidates: RenameCandidate[],
): MigrationFixtureCase[] {
	return renameCandidates
		.filter((candidate) => candidate.autoApply)
		.map((candidate) => {
			const nextInput = cloneJsonValue(baseAttributes) as JsonObject;
			const legacyValue = getValueAtPath(nextInput, candidate.legacyPath);
			deleteValueAtPath(nextInput, candidate.currentPath);
			if (legacyValue === undefined) {
				setValueAtPath(nextInput, candidate.legacyPath, createFixtureScalarValue(candidate.currentPath));
			}

			return {
				input: nextInput,
				name: `rename:${candidate.legacyPath}->${candidate.currentPath}`,
			};
		});
}

function createTransformFixtureCases(
	baseAttributes: JsonObject,
	transformSuggestions: TransformSuggestion[],
): MigrationFixtureCase[] {
	return transformSuggestions.map((suggestion) => {
		const nextInput = cloneJsonValue(baseAttributes) as JsonObject;
		const legacyPath = suggestion.legacyPath ?? suggestion.currentPath;
		setValueAtPath(
			nextInput,
			legacyPath,
			createTransformFixtureValue(suggestion.attribute, suggestion.currentPath),
		);

		return {
			input: nextInput,
			name: `transform:${legacyPath}->${suggestion.currentPath}`,
		};
	});
}

function createUnionFixtureCases(
	baseAttributes: JsonObject,
	manifestAttributes: Record<string, ManifestAttribute>,
	renameCandidates: RenameCandidate[],
): MigrationFixtureCase[] {
	const cases: MigrationFixtureCase[] = [];

	for (const [key, attribute] of Object.entries(manifestAttributes)) {
		if (attribute.ts.kind !== "union" || !attribute.ts.union) {
			continue;
		}

		for (const [branchKey, branch] of Object.entries(attribute.ts.union.branches ?? {})) {
			const nextInput = cloneJsonValue(baseAttributes) as JsonObject;
			const legacyPath =
				renameCandidates.find((candidate) => candidate.autoApply && candidate.currentPath === key)?.legacyPath ??
				key;
			setValueAtPath(
				nextInput,
				legacyPath,
				createUnionBranchFixtureValue(attribute.ts.union.discriminator, branchKey, branch),
			);
			cases.push({
				input: nextInput,
				name: `union:${key}:${branchKey}`,
			});
		}
	}

	return cases;
}

function createUnionBranchFixtureValue(
	discriminator: string,
	branchKey: string,
	branchAttribute: ManifestAttribute,
): Record<string, JsonValue> {
	const branchValue = defaultValueForManifestAttribute(branchAttribute);
	if (typeof branchValue === "object" && branchValue !== null && !Array.isArray(branchValue)) {
		return {
			...(branchValue as Record<string, JsonValue>),
			[discriminator]: branchKey,
		};
	}

	return {
		[discriminator]: branchKey,
	};
}
