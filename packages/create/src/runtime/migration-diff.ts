import fs from "node:fs";
import path from "node:path";

import { ROOT_MANIFEST, SNAPSHOT_DIR } from "./migration-constants.js";
import {
	flattenManifestLeafAttributes,
	getAttributeByCurrentPath,
	getManifestDefaultValue,
	hasManifestDefault,
} from "./migration-manifest.js";
import { isNumber, readJson } from "./migration-utils.js";
import type {
	DiffOutcome,
	FlattenedAttributeDescriptor,
	ManifestAttribute,
	ManifestDocument,
	MigrationDiff,
	MigrationProjectState,
	RenameCandidate,
	TransformSuggestion,
} from "./migration-types.js";

interface CreateTransformSuggestionsOptions {
	addedKeys: string[];
	manualItems: DiffOutcome[];
	newAttributes: Record<string, ManifestAttribute>;
	newLeafAttributes: FlattenedAttributeDescriptor[];
	oldAttributes: Record<string, ManifestAttribute>;
	oldLeafAttributes: FlattenedAttributeDescriptor[];
	removedKeys: string[];
	renameCandidates: RenameCandidate[];
}

export function createMigrationDiff(
	state: MigrationProjectState,
	fromVersion: string,
	toVersion: string,
): MigrationDiff {
	const snapshotManifestPath = path.join(state.projectDir, SNAPSHOT_DIR, fromVersion, ROOT_MANIFEST);
	if (!fs.existsSync(snapshotManifestPath)) {
		throw new Error(
			`Snapshot manifest for ${fromVersion} does not exist. Run \`migrations snapshot --version ${fromVersion}\` first.`,
		);
	}

	const targetManifest: ManifestDocument =
		toVersion === state.config.currentVersion
			? state.currentManifest
			: readJson<ManifestDocument>(path.join(state.projectDir, SNAPSHOT_DIR, toVersion, ROOT_MANIFEST));

	const oldManifest = readJson<ManifestDocument>(snapshotManifestPath);
	const oldAttributes = oldManifest.attributes ?? {};
	const newAttributes = targetManifest.attributes ?? {};
	const oldLeafAttributes = flattenManifestLeafAttributes(oldAttributes);
	const newLeafAttributes = flattenManifestLeafAttributes(newAttributes);
	const autoItems: DiffOutcome[] = [];
	const manualItems: DiffOutcome[] = [];
	const addedKeys: string[] = [];
	const removedKeys: string[] = [];

	for (const [key, newAttribute] of Object.entries(newAttributes)) {
		const oldAttribute = oldAttributes[key];

		if (!oldAttribute) {
			addedKeys.push(key);
			if (newAttribute.ts.required && !hasManifestDefault(newAttribute)) {
				manualItems.push({
					detail: "required field has no default in current schema",
					kind: "required-addition",
					path: key,
					status: "manual",
				});
			} else {
				autoItems.push({
					detail: hasManifestDefault(newAttribute)
						? `default ${JSON.stringify(getManifestDefaultValue(newAttribute))}`
						: "optional addition",
					kind: hasManifestDefault(newAttribute) ? "add-default" : "add-optional",
					path: key,
					status: "auto",
				});
			}
			continue;
		}

		const outcome = compareManifestAttribute(oldAttribute, newAttribute, key);
		if (outcome.status === "manual") {
			manualItems.push(outcome);
		} else {
			autoItems.push(outcome);
		}
	}

	for (const key of Object.keys(oldAttributes)) {
		if (!(key in newAttributes)) {
			removedKeys.push(key);
			autoItems.push({
				detail: "field removed from current schema",
				kind: "drop",
				path: key,
				status: "auto",
			});
		}
	}

	const renameCandidates = createRenameCandidates(
		oldAttributes,
		newAttributes,
		removedKeys,
		addedKeys,
		oldLeafAttributes,
		newLeafAttributes,
	);
	const activeRenameCandidates = renameCandidates.filter((candidate) => candidate.autoApply);

	for (const candidate of activeRenameCandidates) {
		removeOutcomeByPath(autoItems, candidate.legacyPath, "drop");
		removeOutcomeByPath(autoItems, candidate.currentPath, "add-default");
		removeOutcomeByPath(autoItems, candidate.currentPath, "add-optional");
		removeOutcomeByPath(manualItems, candidate.currentPath, "required-addition");
		removeOutcomesByPath(manualItems, candidate.currentPath);
		autoItems.push({
			detail: `legacy field ${candidate.legacyPath}`,
			kind: "rename",
			path: candidate.currentPath,
			status: "auto",
		});
	}

	const transformSuggestions = createTransformSuggestions({
		addedKeys,
		manualItems,
		newAttributes,
		newLeafAttributes,
		oldAttributes,
		oldLeafAttributes,
		renameCandidates,
		removedKeys,
	});

	return {
		currentTypeName: targetManifest.sourceType ?? state.currentManifest.sourceType,
		fromVersion,
		summary: {
			auto: autoItems.length,
			autoItems,
			manual: manualItems.length,
			manualItems,
			renameCandidates,
			transformSuggestions,
		},
		toVersion,
	};
}

function removeOutcomeByPath(items: DiffOutcome[], pathLabel: string, kind: string): void {
	const index = items.findIndex((item) => item.path === pathLabel && item.kind === kind);
	if (index >= 0) {
		items.splice(index, 1);
	}
}

function removeOutcomesByPath(items: DiffOutcome[], pathLabel: string): void {
	for (let index = items.length - 1; index >= 0; index -= 1) {
		if (items[index]?.path === pathLabel) {
			items.splice(index, 1);
		}
	}
}

function compareManifestAttribute(
	oldAttribute: ManifestAttribute,
	newAttribute: ManifestAttribute,
	attributePath: string,
): DiffOutcome {
	if (oldAttribute.ts.kind !== newAttribute.ts.kind) {
		return manualOutcome(attributePath, "type-change", `${oldAttribute.ts.kind} -> ${newAttribute.ts.kind}`);
	}

	if (oldAttribute.ts.kind === "union") {
		return compareUnionAttribute(oldAttribute, newAttribute, attributePath);
	}

	if (oldAttribute.ts.kind === "object") {
		return compareObjectAttribute(oldAttribute, newAttribute, attributePath);
	}

	if (oldAttribute.ts.kind === "array") {
		if (!oldAttribute.ts.items || !newAttribute.ts.items) {
			return autoOutcome(attributePath, "copy", "array shape unchanged");
		}
		const nested = compareManifestAttribute(oldAttribute.ts.items, newAttribute.ts.items, `${attributePath}[]`);
		return nested.status === "manual"
			? nested
			: autoOutcome(attributePath, "hydrate", "array items can be normalized");
	}

	if (hasStricterConstraints(oldAttribute, newAttribute)) {
		return manualOutcome(
			attributePath,
			"stricter-constraints",
			describeConstraintChange(oldAttribute, newAttribute),
		);
	}

	return autoOutcome(attributePath, "copy", "compatible primitive field");
}

function compareObjectAttribute(
	oldAttribute: ManifestAttribute,
	newAttribute: ManifestAttribute,
	attributePath: string,
): DiffOutcome {
	const oldProperties = oldAttribute.ts.properties ?? {};
	const newProperties = newAttribute.ts.properties ?? {};

	for (const [key, nextProperty] of Object.entries(newProperties)) {
		const previousProperty = oldProperties[key];
		if (!previousProperty) {
			if (nextProperty.ts.required && !hasManifestDefault(nextProperty)) {
				return manualOutcome(
					`${attributePath}.${key}`,
					"object-change",
					"required field has no default in current schema",
				);
			}
			continue;
		}

		const nested = compareManifestAttribute(previousProperty, nextProperty, `${attributePath}.${key}`);
		if (nested.status === "manual") {
			return nested;
		}
	}

	return autoOutcome(attributePath, "hydrate", "object can be normalized with current manifest defaults");
}

function compareUnionAttribute(
	oldAttribute: ManifestAttribute,
	newAttribute: ManifestAttribute,
	attributePath: string,
): DiffOutcome {
	const oldUnion = oldAttribute.ts.union;
	const newUnion = newAttribute.ts.union;

	if (!oldUnion || !newUnion) {
		return manualOutcome(attributePath, "union-change", "missing union metadata");
	}
	if (oldUnion.discriminator !== newUnion.discriminator) {
		return manualOutcome(
			attributePath,
			"union-discriminator-change",
			`${oldUnion.discriminator} -> ${newUnion.discriminator}`,
		);
	}

	const oldBranchKeys = Object.keys(oldUnion.branches);
	const newBranchKeys = Object.keys(newUnion.branches);

	for (const branchKey of oldBranchKeys) {
		if (!(branchKey in newUnion.branches)) {
			return manualOutcome(attributePath, "union-branch-removal", `branch ${branchKey} was removed`);
		}

		const nested = compareManifestAttribute(
			oldUnion.branches[branchKey]!,
			newUnion.branches[branchKey]!,
			`${attributePath}.${branchKey}`,
		);
		if (nested.status === "manual") {
			return nested;
		}
	}

	const addedBranches = newBranchKeys.filter((branchKey) => !(branchKey in oldUnion.branches));
	if (addedBranches.length > 0) {
		return autoOutcome(attributePath, "union-branch-addition", `branches added: ${addedBranches.join(", ")}`);
	}

	return autoOutcome(attributePath, "copy", "compatible discriminated union");
}

function hasStricterConstraints(oldAttribute: ManifestAttribute, newAttribute: ManifestAttribute): boolean {
	const oldConstraints = oldAttribute.typia.constraints;
	const nextConstraints = newAttribute.typia.constraints;
	const oldEnum = oldAttribute.wp.enum ?? null;
	const nextEnum = newAttribute.wp.enum ?? null;

	if (nextEnum && (!oldEnum || !oldEnum.every((value) => nextEnum.includes(value)))) {
		return true;
	}
	if (
		isNumber(nextConstraints.minLength) &&
		(!isNumber(oldConstraints.minLength) || nextConstraints.minLength > oldConstraints.minLength)
	) {
		return true;
	}
	if (
		isNumber(nextConstraints.maxLength) &&
		(!isNumber(oldConstraints.maxLength) || nextConstraints.maxLength < oldConstraints.maxLength)
	) {
		return true;
	}
	if (
		isNumber(nextConstraints.minimum) &&
		(!isNumber(oldConstraints.minimum) || nextConstraints.minimum > oldConstraints.minimum)
	) {
		return true;
	}
	if (
		isNumber(nextConstraints.maximum) &&
		(!isNumber(oldConstraints.maximum) || nextConstraints.maximum < oldConstraints.maximum)
	) {
		return true;
	}
	if (nextConstraints.pattern && nextConstraints.pattern !== oldConstraints.pattern) {
		return true;
	}
	if (nextConstraints.format && nextConstraints.format !== oldConstraints.format) {
		return true;
	}
	if (nextConstraints.typeTag && nextConstraints.typeTag !== oldConstraints.typeTag) {
		return true;
	}

	return false;
}

function createRenameCandidates(
	oldAttributes: Record<string, ManifestAttribute>,
	newAttributes: Record<string, ManifestAttribute>,
	removedKeys: string[],
	addedKeys: string[],
	oldLeafAttributes: FlattenedAttributeDescriptor[],
	newLeafAttributes: FlattenedAttributeDescriptor[],
): RenameCandidate[] {
	const assessments: RenameCandidate[] = [];

	for (const currentPath of addedKeys) {
		const nextAttribute = newAttributes[currentPath];
		if (!nextAttribute) continue;
		for (const legacyPath of removedKeys) {
			const previous = oldAttributes[legacyPath];
			if (!previous) continue;
			const candidate = assessRenameCandidate(previous, nextAttribute, legacyPath, currentPath);
			if (candidate) {
				assessments.push(candidate);
			}
		}
	}

	const oldLeafMap = new Map(oldLeafAttributes.map((descriptor) => [descriptor.currentPath, descriptor] as const));
	const newLeafMap = new Map(newLeafAttributes.map((descriptor) => [descriptor.currentPath, descriptor] as const));
	const removedLeafDescriptors = oldLeafAttributes.filter((descriptor) => !newLeafMap.has(descriptor.currentPath));
	const addedLeafDescriptors = newLeafAttributes.filter((descriptor) => !oldLeafMap.has(descriptor.currentPath));

	for (const nextDescriptor of addedLeafDescriptors) {
		if (!nextDescriptor.currentPath.includes(".")) {
			continue;
		}
		for (const previousDescriptor of removedLeafDescriptors) {
			if (!previousDescriptor.currentPath.includes(".")) {
				continue;
			}
			const candidate = assessRenameCandidate(
				previousDescriptor.attribute,
				nextDescriptor.attribute,
				previousDescriptor.currentPath,
				nextDescriptor.currentPath,
			);
			if (candidate) {
				assessments.push(candidate);
			}
		}
	}

	return assessments
		.map((candidate) => {
			const currentMatches = assessments
				.filter((item) => item.currentPath === candidate.currentPath)
				.sort((left, right) => right.score - left.score);
			const legacyMatches = assessments
				.filter((item) => item.legacyPath === candidate.legacyPath)
				.sort((left, right) => right.score - left.score);
			const currentLeader = currentMatches[0]!;
			const legacyLeader = legacyMatches[0]!;
			const currentHasTie =
				currentMatches.length > 1 && Math.abs((currentMatches[1]?.score ?? 0) - currentLeader.score) < 0.05;
			const legacyHasTie =
				legacyMatches.length > 1 && Math.abs((legacyMatches[1]?.score ?? 0) - legacyLeader.score) < 0.05;

			return {
				...candidate,
				autoApply:
					currentLeader.legacyPath === candidate.legacyPath &&
					legacyLeader.currentPath === candidate.currentPath &&
					!currentHasTie &&
					!legacyHasTie &&
					candidate.score >= 0.6,
			};
		})
		.filter((candidate, index, list) => {
			const firstMatch = list.findIndex(
				(item) => item.currentPath === candidate.currentPath && item.legacyPath === candidate.legacyPath,
			);
			return firstMatch === index;
		})
		.sort((left, right) => right.score - left.score);
}

function createTransformSuggestions({
	oldAttributes,
	newAttributes,
	addedKeys,
	removedKeys,
	manualItems,
	renameCandidates,
	oldLeafAttributes,
	newLeafAttributes,
}: CreateTransformSuggestionsOptions): TransformSuggestion[] {
	const suggestions: TransformSuggestion[] = [];
	const activeRenameTargets = new Set(
		renameCandidates.filter((candidate) => candidate.autoApply).map((candidate) => candidate.currentPath),
	);
	const oldLeafMap = new Map(oldLeafAttributes.map((descriptor) => [descriptor.currentPath, descriptor] as const));
	const newLeafMap = new Map(newLeafAttributes.map((descriptor) => [descriptor.currentPath, descriptor] as const));

	for (const currentPath of [
		...new Set([
			...Object.keys(newAttributes),
			...manualItems.map((item) => item.path),
			...newLeafAttributes.map((item) => item.currentPath),
		]),
	]) {
		if (activeRenameTargets.has(currentPath)) {
			continue;
		}

		const manualItem = manualItems.find(
			(item) => item.path === currentPath || item.path.startsWith(`${currentPath}.`),
		);
		const currentAttribute =
			newLeafMap.get(currentPath)?.attribute ??
			getAttributeByCurrentPath(newAttributes, currentPath) ??
			null;
		if (!manualItem || !currentAttribute) {
			continue;
		}

		const exactLegacy =
			oldLeafMap.get(currentPath)?.attribute ??
			getAttributeByCurrentPath(oldAttributes, currentPath) ??
			null;
		if (exactLegacy && exactLegacy.ts.kind !== currentAttribute.ts.kind) {
			suggestions.push({
				bodyLines: buildTransformBodyLines(currentAttribute, currentPath),
				attribute: currentAttribute,
				currentPath,
				legacyPath: currentPath,
				reason: `semantic coercion suggested for ${manualItem.kind}`,
			});
			continue;
		}

		const bestRenameCandidate = renameCandidates.find((candidate) => candidate.currentPath === currentPath);
		if (bestRenameCandidate && !bestRenameCandidate.autoApply) {
			suggestions.push({
				bodyLines: buildTransformBodyLines(currentAttribute, bestRenameCandidate.legacyPath),
				attribute: currentAttribute,
				currentPath,
				legacyPath: bestRenameCandidate.legacyPath,
				reason: `review coercion from ${bestRenameCandidate.legacyPath}`,
			});
			continue;
		}

		const addedCurrent =
			addedKeys.includes(currentPath) ||
			(newLeafMap.has(currentPath) && !oldLeafMap.has(currentPath));
		if (!addedCurrent) {
			continue;
		}

		const compatibleLegacyPath = [
			...removedKeys,
			...oldLeafAttributes
				.filter((descriptor) => !newLeafMap.has(descriptor.currentPath))
				.map((descriptor) => descriptor.currentPath),
		].find((legacyPath) => passesNameSimilarityRule(legacyPath, currentPath));
		if (compatibleLegacyPath) {
			suggestions.push({
				bodyLines: buildTransformBodyLines(currentAttribute, compatibleLegacyPath),
				attribute: currentAttribute,
				currentPath,
				legacyPath: compatibleLegacyPath,
				reason: `review coercion from ${compatibleLegacyPath}`,
			});
		}
	}

	return suggestions;
}

function isRenameCandidateShapeCompatible(
	oldAttribute: ManifestAttribute | undefined,
	newAttribute: ManifestAttribute | undefined,
): boolean {
	if (!oldAttribute || !newAttribute || oldAttribute.ts.kind !== newAttribute.ts.kind) {
		return false;
	}

	if (["string", "number", "boolean"].includes(oldAttribute.ts.kind)) {
		return hasRenameCompatibleConstraints(oldAttribute, newAttribute);
	}

	if (oldAttribute.ts.kind === "union") {
		return compareUnionAttribute(oldAttribute, newAttribute, "$rename").status === "auto";
	}

	return false;
}

function assessRenameCandidate(
	oldAttribute: ManifestAttribute | undefined,
	newAttribute: ManifestAttribute | undefined,
	legacyPath: string,
	currentPath: string,
): RenameCandidate | null {
	if (!isRenameCandidateShapeCompatible(oldAttribute, newAttribute)) {
		return null;
	}

	const baseScore = scoreRenameSimilarity(legacyPath, currentPath);
	const score =
		getParentPath(legacyPath) === getParentPath(currentPath) ? Math.max(baseScore, 0.75) : baseScore;
	return {
		autoApply: false,
		currentPath,
		legacyPath,
		reason: describeRenameReason(oldAttribute!, legacyPath, currentPath, score),
		score,
	};
}

function hasRenameCompatibleConstraints(oldAttribute: ManifestAttribute, newAttribute: ManifestAttribute): boolean {
	const oldEnum = oldAttribute.wp.enum ?? null;
	const nextEnum = newAttribute.wp.enum ?? null;

	if (oldEnum && nextEnum) {
		const oldIsSubset = oldEnum.every((value) => nextEnum.includes(value));
		if (!oldIsSubset) {
			return false;
		}
	} else if (oldEnum && !nextEnum) {
		return false;
	}

	const oldConstraints = oldAttribute.typia.constraints ?? {};
	const nextConstraints = newAttribute.typia.constraints ?? {};

	return [
		compareMinimumBound(oldConstraints.minLength, nextConstraints.minLength),
		compareMaximumBound(oldConstraints.maxLength, nextConstraints.maxLength),
		compareMinimumBound(oldConstraints.minimum, nextConstraints.minimum),
		compareMaximumBound(oldConstraints.maximum, nextConstraints.maximum),
		comparePatternBound(oldConstraints.pattern, nextConstraints.pattern),
		comparePatternBound(oldConstraints.format, nextConstraints.format),
		comparePatternBound(oldConstraints.typeTag, nextConstraints.typeTag),
	].every(Boolean);
}

function compareMinimumBound(oldValue: unknown, nextValue: unknown): boolean {
	if (nextValue === null || nextValue === undefined) return true;
	if (oldValue === null || oldValue === undefined) return true;
	return Number(oldValue) <= Number(nextValue);
}

function compareMaximumBound(oldValue: unknown, nextValue: unknown): boolean {
	if (nextValue === null || nextValue === undefined) return true;
	if (oldValue === null || oldValue === undefined) return true;
	return Number(oldValue) >= Number(nextValue);
}

function comparePatternBound(oldValue: unknown, nextValue: unknown): boolean {
	return oldValue === nextValue || oldValue === null || oldValue === undefined;
}

function scoreRenameSimilarity(legacyPath: string, currentPath: string): number {
	const legacy = normalizeFieldName(legacyPath);
	const current = normalizeFieldName(currentPath);

	if (legacy === current) return 1;
	if (shareAliasGroup(legacy, current)) return 0.9;

	const legacyTokens = tokenizeFieldName(legacy);
	const currentTokens = tokenizeFieldName(current);
	const overlap = legacyTokens.filter((token) => currentTokens.includes(token));
	const jaccard = overlap.length / new Set([...legacyTokens, ...currentTokens]).size;

	if (legacy.includes(current) || current.includes(legacy)) {
		return Math.max(jaccard, 0.7);
	}
	if (
		legacyTokens.length > 0 &&
		currentTokens.length > 0 &&
		legacyTokens[legacyTokens.length - 1] === currentTokens[currentTokens.length - 1]
	) {
		return Math.max(jaccard, 0.6);
	}

	return jaccard;
}

function passesNameSimilarityRule(legacyPath: string, currentPath: string): boolean {
	return scoreRenameSimilarity(legacyPath, currentPath) >= 0.6;
}

function normalizeFieldName(name: string): string {
	return String(name)
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[^a-zA-Z0-9]+/g, " ")
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "");
}

function tokenizeFieldName(name: string): string[] {
	return String(name)
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
}

function getParentPath(pathLabel: string): string {
	const segments = String(pathLabel).split(".");
	return segments.length <= 1 ? "" : segments.slice(0, -1).join(".");
}

function shareAliasGroup(left: string, right: string): boolean {
	const aliasGroups = [
		["content", "headline", "body", "text", "copy", "message"],
		["id", "uniqueid", "uuid"],
		["visible", "isvisible", "show", "shown", "enabled"],
		["align", "alignment", "textalign"],
		["count", "clickcount", "counter"],
		["url", "href", "link"],
	];

	return aliasGroups.some((group) => group.includes(left) && group.includes(right));
}

function describeRenameReason(
	attribute: ManifestAttribute,
	legacyPath: string,
	currentPath: string,
	score: number,
): string {
	if (attribute.ts.kind === "union") {
		return `compatible discriminated union (${legacyPath} → ${currentPath})`;
	}
	if (score >= 0.9) return "high-confidence compatible field";
	if (score >= 0.6) return "name-similar compatible field";
	return "compatible field requiring review";
}

function buildTransformBodyLines(attribute: ManifestAttribute, legacyPath: string): string[] {
	switch (attribute.ts.kind) {
		case "string":
			return [`// return typeof legacyValue === "string" ? legacyValue : String(legacyValue ?? "");`];
		case "number":
			return [
				`// const numericValue = typeof legacyValue === "number" ? legacyValue : Number(legacyValue ?? 0);`,
				`// return Number.isNaN(numericValue) ? undefined : numericValue;`,
			];
		case "boolean":
			return [`// return typeof legacyValue === "boolean" ? legacyValue : Boolean(legacyValue);`];
		case "union":
			return [
				`// const legacyObject = typeof legacyValue === "object" && legacyValue !== null ? legacyValue : {};`,
				`// return legacyObject; // adjust discriminator / branch fields before verify`,
			];
		default:
			return [`// return legacyValue; // customize migration from ${legacyPath}`];
	}
}

function describeConstraintChange(oldAttribute: ManifestAttribute, newAttribute: ManifestAttribute): string {
	const details: string[] = [];
	const oldConstraints = oldAttribute.typia.constraints;
	const nextConstraints = newAttribute.typia.constraints;

	if (newAttribute.wp.enum && JSON.stringify(newAttribute.wp.enum) !== JSON.stringify(oldAttribute.wp.enum)) {
		details.push("enum changed");
	}
	for (const key of ["minLength", "maxLength", "minimum", "maximum", "pattern", "format", "typeTag"] as const) {
		if (oldConstraints[key] !== nextConstraints[key]) {
			details.push(`${key}: ${oldConstraints[key]} -> ${nextConstraints[key]}`);
		}
	}

	return details.join(", ");
}

function autoOutcome(pathLabel: string, kind: string, detail: string): DiffOutcome {
	return { detail, kind, path: pathLabel, status: "auto" };
}

function manualOutcome(pathLabel: string, kind: string, detail: string): DiffOutcome {
	return { detail, kind, path: pathLabel, status: "manual" };
}
