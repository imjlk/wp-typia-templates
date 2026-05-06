import path from "node:path";

import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "./cli-diagnostics.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_ALIAS,
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	TEMPLATE_IDS,
	getTemplateById,
	isBuiltInTemplateId,
} from "./template-registry.js";
import {
	getRemovedBuiltInTemplateMessage,
	isRemovedBuiltInTemplateId,
} from "./template-defaults.js";
import { parseNpmTemplateLocator } from "./template-source-locators.js";

export const CREATE_TEMPLATE_SELECTION_HINT = `--template <${[
	...TEMPLATE_IDS,
	OFFICIAL_WORKSPACE_TEMPLATE_ALIAS,
].join("|")}|./path|github:owner/repo/path[#ref]|npm-package>`;

const TEMPLATE_SUGGESTION_IDS = [
	...TEMPLATE_IDS,
	OFFICIAL_WORKSPACE_TEMPLATE_ALIAS,
] as const;
const USER_FACING_TEMPLATE_IDS = [
	...TEMPLATE_IDS,
	OFFICIAL_WORKSPACE_TEMPLATE_ALIAS,
] as const;

function normalizeCreateTemplateSelection(templateId: string): string {
	return templateId === OFFICIAL_WORKSPACE_TEMPLATE_ALIAS
		? OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
		: templateId;
}

function looksLikeWindowsAbsoluteTemplatePath(templateId: string): boolean {
	return /^[a-z]:[\\/]/iu.test(templateId) || /^\\\\[^\\]+\\[^\\]+/u.test(templateId);
}

function looksLikeExplicitNonNpmExternalTemplateLocator(
	templateId: string,
): boolean {
	return (
		path.isAbsolute(templateId) ||
		looksLikeWindowsAbsoluteTemplatePath(templateId) ||
		templateId.startsWith("./") ||
		templateId.startsWith(".\\") ||
		templateId.startsWith("../") ||
		templateId.startsWith("..\\") ||
		templateId.startsWith("@") ||
		templateId.startsWith("github:") ||
		templateId.includes("/") ||
		templateId.includes("\\")
	);
}

function looksLikeExplicitCreateExternalTemplateLocator(
	templateId: string,
): boolean {
	return (
		looksLikeExplicitNonNpmExternalTemplateLocator(templateId) ||
		parseNpmTemplateLocator(templateId) !== null
	);
}

function getEditDistance(left: string, right: string): number {
	const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
	const current = new Array<number>(right.length + 1);

	for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
		current[0] = leftIndex + 1;

		for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
			const substitutionCost = left[leftIndex] === right[rightIndex] ? 0 : 1;
			current[rightIndex + 1] = Math.min(
				current[rightIndex] + 1,
				previous[rightIndex + 1] + 1,
				previous[rightIndex] + substitutionCost,
			);
		}

		for (let index = 0; index < current.length; index += 1) {
			previous[index] = current[index] as number;
		}
	}

	return previous[right.length] as number;
}

function findMistypedBuiltInTemplateSuggestion(templateId: string): string | null {
	const normalizedTemplateId = templateId.trim().toLowerCase();
	if (
		normalizedTemplateId.length === 0 ||
		looksLikeExplicitNonNpmExternalTemplateLocator(normalizedTemplateId)
	) {
		return null;
	}

	let bestCandidate: { distance: number; id: string } | null = null;

	for (const candidateId of TEMPLATE_SUGGESTION_IDS) {
		const distance = getEditDistance(normalizedTemplateId, candidateId);
		if (bestCandidate === null || distance < bestCandidate.distance) {
			bestCandidate = {
				distance,
				id: candidateId,
			};
		}
	}

	return bestCandidate && bestCandidate.distance <= 2
		? bestCandidate.id
		: null;
}

function getMistypedBuiltInTemplateMessage(templateId: string): string | null {
	const suggestion = findMistypedBuiltInTemplateSuggestion(templateId);
	if (!suggestion) {
		return null;
	}

	const suggestionDescription =
		suggestion === OFFICIAL_WORKSPACE_TEMPLATE_ALIAS
			? "official workspace scaffold"
			: "built-in scaffold";

	return `Unknown template "${templateId}". Did you mean "${suggestion}"? Use \`--template ${suggestion}\` for the ${suggestionDescription}, or pass a local path, \`github:owner/repo/path[#ref]\`, or an npm package spec for an external template.`;
}

function getUnknownTemplateMessage(templateId: string): string {
	return [
		`Unknown template "${templateId}". Expected one of: ${USER_FACING_TEMPLATE_IDS.join(", ")}.`,
		"Run `wp-typia templates list` to inspect available templates.",
		"Pass an explicit external template locator such as `./path`, `github:owner/repo/path[#ref]`, or `@scope/template` for custom templates.",
	].join(" ");
}

/**
 * Validate an explicitly supplied create template id before entering the full
 * scaffold flow.
 *
 * Built-in template ids and the workspace alias resolve immediately, common
 * built-in typos keep suggestion diagnostics, and explicit external template
 * locators remain deferred to the external template resolver.
 */
export function validateExplicitCreateTemplateId(templateId: string): string {
	const normalizedTemplateId = normalizeCreateTemplateSelection(templateId);
	if (isRemovedBuiltInTemplateId(templateId)) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
			getRemovedBuiltInTemplateMessage(templateId),
		);
	}
	if (normalizedTemplateId === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE) {
		return normalizedTemplateId;
	}
	if (isBuiltInTemplateId(normalizedTemplateId)) {
		return getTemplateById(normalizedTemplateId).id;
	}
	const mistypedBuiltInTemplateMessage =
		getMistypedBuiltInTemplateMessage(templateId);
	if (mistypedBuiltInTemplateMessage) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
			mistypedBuiltInTemplateMessage,
		);
	}
	if (!looksLikeExplicitCreateExternalTemplateLocator(normalizedTemplateId)) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.UNKNOWN_TEMPLATE,
			getUnknownTemplateMessage(templateId),
		);
	}
	return normalizedTemplateId;
}
