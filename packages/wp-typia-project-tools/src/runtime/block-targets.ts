import { normalizeBlockSlug } from "./scaffold-identifiers.js";

const FULL_BLOCK_NAME_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/u;

export interface WorkspaceBlockTargetName {
	blockName: string;
	blockSlug: string;
}

export interface WorkspaceBlockTargetDiagnostics {
	empty: () => string;
	emptySegment: (input: string) => string;
	invalidFormat: (input: string) => string;
	namespaceMismatch: (input: string, actualNamespace: string, expectedNamespace: string) => string;
}

/**
 * Validate a full `namespace/block-slug` block name.
 *
 * @param blockName Candidate block name.
 * @param flagName CLI flag name used in diagnostics.
 * @returns The trimmed full block name.
 * @throws {Error} When the block name is empty or not a full block name.
 */
export function assertFullBlockName(blockName: string, flagName: string): string {
	const trimmed = blockName.trim();
	if (!trimmed) {
		throw new Error(`\`${flagName}\` requires a block name.`);
	}
	if (!FULL_BLOCK_NAME_PATTERN.test(trimmed)) {
		throw new Error(`\`${flagName}\` must use <namespace/block-slug> format.`);
	}

	return trimmed;
}

/**
 * Resolve a workspace block target from either `block-slug` or
 * `namespace/block-slug` input while preserving caller-owned diagnostics.
 *
 * @param blockName Candidate block target.
 * @param namespace Expected workspace namespace.
 * @param diagnostics Error message builders for the caller's UX context.
 * @returns The normalized workspace block target.
 * @throws {Error} When the target is empty, malformed, or references another namespace.
 */
export function resolveWorkspaceBlockTargetName(
	blockName: string,
	namespace: string,
	diagnostics: WorkspaceBlockTargetDiagnostics,
): WorkspaceBlockTargetName {
	const trimmed = blockName.trim();
	if (!trimmed) {
		throw new Error(diagnostics.empty());
	}

	const blockNameSegments = trimmed.split("/");
	if (blockNameSegments.length > 2) {
		throw new Error(diagnostics.invalidFormat(trimmed));
	}
	if (blockNameSegments.some((segment) => segment.trim() === "")) {
		throw new Error(diagnostics.emptySegment(trimmed));
	}

	const [maybeNamespace, maybeSlug] =
		blockNameSegments.length === 2
			? blockNameSegments
			: [undefined, blockNameSegments[0]];
	if (maybeNamespace && maybeNamespace !== namespace) {
		throw new Error(diagnostics.namespaceMismatch(trimmed, maybeNamespace, namespace));
	}

	const blockSlug = normalizeBlockSlug(maybeSlug ?? "");
	return {
		blockName: `${namespace}/${blockSlug}`,
		blockSlug,
	};
}

/**
 * Resolve the standard `--to` style workspace block target used by add flows.
 *
 * @param blockName Candidate block target.
 * @param namespace Expected workspace namespace.
 * @param flagName CLI flag name used in diagnostics.
 * @returns The normalized workspace block target.
 * @throws {Error} When the target is empty, malformed, or references another namespace.
 */
export function resolveWorkspaceTargetBlockName(
	blockName: string,
	namespace: string,
	flagName: string,
): WorkspaceBlockTargetName {
	return resolveWorkspaceBlockTargetName(blockName, namespace, {
		empty: () => `\`${flagName}\` requires <block-slug|namespace/block-slug>.`,
		emptySegment: () =>
			`\`${flagName}\` must use <block-slug|namespace/block-slug> format.`,
		invalidFormat: () =>
			`\`${flagName}\` must use <block-slug|namespace/block-slug> format.`,
		namespaceMismatch: (_input, actualNamespace, expectedNamespace) =>
			`\`${flagName}\` references namespace "${actualNamespace}". Expected "${expectedNamespace}".`,
	});
}
