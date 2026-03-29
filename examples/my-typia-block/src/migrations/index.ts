import apiFetch from "@wordpress/api-fetch";
import { parse, serialize, type BlockInstance } from "@wordpress/blocks";

import { validators } from "../validators";
import migrationConfig from "./config";
import { deprecated } from "./generated/deprecated";
import migrationRegistry from "./generated/registry";
import {
	type ManifestAttribute,
	type ManifestDocument,
	manifestMatchesDocument,
	summarizeVersionDelta,
} from "./helpers";

export interface MigrationAnalysis {
	needsMigration: boolean;
	currentVersion: string;
	targetVersion: string;
	confidence: number;
	reasons: string[];
	warnings: string[];
	affectedFields: {
		added: string[];
		changed: string[];
		removed: string[];
	};
}

export interface UnionBranchPreview {
	field: string;
	legacyBranch: string | null;
	nextBranch: string | null;
	status: "auto" | "current" | "manual" | "unknown";
}

export interface MigrationPreview {
	after: Record<string, unknown> | null;
	before: Record<string, unknown>;
	changedFields: string[];
	unresolved: string[];
	unionBranches: UnionBranchPreview[];
	validationErrors: string[];
}

export interface BlockScanResult {
	analysis: MigrationAnalysis;
	attributes: Record<string, unknown>;
	blockName: string;
	blockPath: number[];
	postId: number;
	postTitle: string;
	postType: string;
	preview: MigrationPreview;
	rawContent: string;
	restBase: string;
}

export interface BatchMigrationBlockResult {
	blockPath: number[];
	currentVersion: string;
	preview: MigrationPreview;
	reason?: string;
	status: "failed" | "success";
	targetVersion: string;
}

export interface BatchMigrationPostResult {
	postId: number;
	postTitle: string;
	postType: string;
	previews: BatchMigrationBlockResult[];
	reason?: string;
	status: "failed" | "success";
}

export interface BatchMigrationResult {
	errors: Array<{ postId: number; reason: string }>;
	failed: number;
	posts: BatchMigrationPostResult[];
	successful: number;
	total: number;
}

interface EditablePostType {
	rest_base: string;
	slug: string;
}

interface EditablePostRecord {
	content?: {
		raw?: string;
	};
	id: number;
	title?: {
		rendered?: string;
	};
}

interface GroupedScanResult {
	postId: number;
	postTitle: string;
	postType: string;
	rawContent: string;
	restBase: string;
	results: BlockScanResult[];
}

type ParsedBlock = BlockInstance<Record<string, unknown>>;

interface MigrationResolution {
	analysis: MigrationAnalysis;
	preview: MigrationPreview;
}

export function detectBlockMigration(attributes: Record<string, unknown>): MigrationAnalysis {
	return resolveMigrationState(attributes).analysis;
}

export function autoMigrate(attributes: Record<string, unknown>) {
	const resolution = resolveMigrationState(attributes);
	if (!resolution.preview.after) {
		throw new Error(
			resolution.preview.validationErrors[0]
				?? resolution.preview.unresolved[0]
				?? "Unable to migrate block attributes because no supported snapshot matched.",
		);
	}

	return resolution.preview.after;
}

export async function scanSiteForMigrations(
	blockName: string = migrationConfig.blockName,
): Promise<BlockScanResult[]> {
	const postTypes = await fetchEditablePostTypes();
	const results: BlockScanResult[] = [];

	for (const postType of postTypes) {
		const posts = await fetchAllPosts(postType.rest_base);
		for (const post of posts) {
			const content = post?.content?.raw;
			if (typeof content !== "string" || content.length === 0) {
				continue;
			}

			const blocks = parse(content);
			walkBlocks(blocks, [], (block, blockPath) => {
				if (block.name !== blockName) {
					return;
				}

				const attributes = (block.attributes ?? {}) as Record<string, unknown>;
				const resolution = resolveMigrationState(attributes);

				if (
					resolution.analysis.needsMigration || resolution.preview.changedFields.length > 0 || resolution.preview.unresolved.length > 0 || resolution.preview.validationErrors.length > 0
				) {
					results.push({
						analysis: resolution.analysis,
						attributes,
						blockName,
						blockPath,
						postId: post.id,
						postTitle: post?.title?.rendered ?? `Post ${post.id}`,
						postType: postType.slug,
						preview: resolution.preview,
						rawContent: content,
						restBase: postType.rest_base,
					});
				}
			});
		}
	}

	return results;
}

export async function batchMigrateScanResults(
	results: BlockScanResult[],
	{ dryRun = false }: { dryRun?: boolean } = {},
): Promise<BatchMigrationResult> {
	const grouped = groupResultsByPost(results);
	const summary: BatchMigrationResult = {
		errors: [],
		failed: 0,
		posts: [],
		successful: 0,
		total: Object.keys(grouped).length,
	};

	for (const group of Object.values(grouped)) {
		const blockPreviews = group.results.map((result) => {
			const resolution = resolveMigrationState(result.attributes);
			const reason =
				resolution.preview.validationErrors[0]
				?? resolution.preview.unresolved[0]
				?? undefined;

			return {
				blockPath: result.blockPath,
				currentVersion: resolution.analysis.currentVersion,
				preview: resolution.preview,
				reason,
				status: resolution.preview.after ? "success" : "failed",
				targetVersion: resolution.analysis.targetVersion,
			} satisfies BatchMigrationBlockResult;
		});

		const failedPreview = blockPreviews.find((preview) => preview.status === "failed");
		if (failedPreview) {
			summary.failed += 1;
			summary.errors.push({
				postId: group.postId,
				reason: failedPreview.reason ?? "One or more blocks could not be migrated.",
			});
			summary.posts.push({
				postId: group.postId,
				postTitle: group.postTitle,
				postType: group.postType,
				previews: blockPreviews,
				reason: failedPreview.reason,
				status: "failed",
			});
			continue;
		}

			const migratedContent = migratePostContent(blockPreviews, group.rawContent);
			if (!dryRun) {
				await apiFetch({
					body: JSON.stringify({
						content: migratedContent,
					}),
					headers: {
						"Content-Type": "application/json",
					},
					method: "POST",
					path: `/wp/v2/${group.restBase}/${group.postId}`,
				});
		}

		summary.successful += 1;
		summary.posts.push({
			postId: group.postId,
			postTitle: group.postTitle,
			postType: group.postType,
			previews: blockPreviews,
			status: "success",
		});
	}

	return summary;
}

export function generateMigrationReport(scanResults: BlockScanResult[]): string {
	let report = `# ${migrationConfig.blockName} Migration Report\n\n`;
	report += `- Current version: ${migrationRegistry.currentVersion}\n`;
	report += `- Supported deprecated entries: ${deprecated.length}\n`;
	report += `- Scan results needing attention: ${scanResults.length}\n\n`;

	for (const entry of scanResults) {
		report += `## ${entry.postTitle} (#${entry.postId})\n`;
		report += `- Version: ${entry.analysis.currentVersion} -> ${entry.analysis.targetVersion}\n`;
		report += `- Confidence: ${entry.analysis.confidence}\n`;
		if (entry.preview.changedFields.length > 0) {
			report += `- Changed fields: ${entry.preview.changedFields.join(", ")}\n`;
		}
		if (entry.preview.unionBranches.length > 0) {
			report += `- Union branches:\n`;
			for (const branch of entry.preview.unionBranches) {
				report += `  - ${branch.field}: ${branch.legacyBranch ?? "unknown"} -> ${branch.nextBranch ?? "unknown"} (${branch.status})\n`;
			}
		}
		if (entry.preview.unresolved.length > 0) {
			report += `- Unresolved: ${entry.preview.unresolved.join(", ")}\n`;
		}
		if (entry.preview.validationErrors.length > 0) {
			report += `- Validation errors: ${entry.preview.validationErrors.join(", ")}\n`;
		}
		report += "\n### Before\n\n```json\n";
		report += `${JSON.stringify(entry.preview.before, null, 2)}\n`;
		report += "```\n\n";
		report += "### After\n\n```json\n";
		report += `${JSON.stringify(entry.preview.after, null, 2)}\n`;
		report += "```\n\n";
	}

	return report;
}

export const migrationUtils = {
	getStats() {
		return {
			blockName: migrationConfig.blockName,
			currentVersion: migrationRegistry.currentVersion,
			deprecatedEntries: deprecated.length,
			supportedVersions: migrationRegistry.entries.map((entry) => entry.fromVersion),
		};
	},
	testMigration(attributes: Record<string, unknown>): Record<string, unknown> {
		return autoMigrate(attributes);
	},
};

async function fetchEditablePostTypes(): Promise<EditablePostType[]> {
	const response = (await apiFetch({
		parse: false,
		path: "/wp/v2/types?context=edit",
	})) as Response;
	const payload = (await response.json()) as Record<string, { rest_base?: string; slug?: string; viewable?: boolean }>;

	return Object.values(payload)
		.filter((postType) => postType?.viewable && postType?.rest_base)
		.map((postType) => ({
			rest_base: postType.rest_base!,
			slug: postType.slug!,
		}));
}

async function fetchAllPosts(restBase: string): Promise<EditablePostRecord[]> {
	let page = 1;
	let totalPages = 1;
	const entries: EditablePostRecord[] = [];

	do {
		const response = (await apiFetch({
			parse: false,
			path: `/wp/v2/${restBase}?context=edit&per_page=100&page=${page}`,
		})) as Response;
		totalPages = Number.parseInt(response.headers.get("X-WP-TotalPages") ?? "1", 10);
		entries.push(...((await response.json()) as EditablePostRecord[]));
		page += 1;
	} while (page <= totalPages);

	return entries;
}

function walkBlocks(
	blocks: ParsedBlock[],
	pathPrefix: number[],
	visitor: (block: ParsedBlock, path: number[]) => void,
): void {
	blocks.forEach((block, index) => {
		const blockPath = [...pathPrefix, index];
		visitor(block, blockPath);
		if (Array.isArray(block.innerBlocks) && block.innerBlocks.length > 0) {
			walkBlocks(block.innerBlocks, blockPath, visitor);
		}
	});
}

function groupResultsByPost(results: BlockScanResult[]): Record<string, GroupedScanResult> {
	return results.reduce<Record<string, GroupedScanResult>>(
		(accumulator, result) => {
			const key = `${result.restBase}:${result.postId}`;
			if (!accumulator[key]) {
				accumulator[key] = {
					postId: result.postId,
					postTitle: result.postTitle,
					postType: result.postType,
					rawContent: result.rawContent,
					restBase: result.restBase,
					results: [],
				};
			}
			accumulator[key].results.push(result);
			return accumulator;
		},
		{},
	);
}

function migratePostContent(results: BatchMigrationBlockResult[], rawContent: string): string {
	const replacements = new Map(
		results
			.filter((result) => result.preview.after)
			.map((result) => [result.blockPath.join("."), result.preview.after as Record<string, unknown>]),
	);
	const blocks = parse(rawContent) as ParsedBlock[];
	const nextBlocks = replaceBlocks(blocks, [], replacements);
	return serialize(nextBlocks);
}

function replaceBlocks(
	blocks: ParsedBlock[],
	pathPrefix: number[],
	replacements: Map<string, Record<string, unknown>>,
): ParsedBlock[] {
	return blocks.map((block, index) => {
		const blockPath = [...pathPrefix, index];
		const replacement = replacements.get(blockPath.join("."));
		const innerBlocks = Array.isArray(block.innerBlocks)
			? replaceBlocks(block.innerBlocks, blockPath, replacements)
			: [];

		if (!replacement) {
			return {
				...block,
				innerBlocks,
			};
		}

		return {
			...block,
			attributes: replacement,
			innerBlocks,
		};
	});
}

function resolveMigrationState(attributes: Record<string, unknown>): MigrationResolution {
	const currentValidation = validators.validate(attributes as any);
	if (currentValidation.success) {
		return {
			analysis: {
				affectedFields: {
					added: [],
					changed: [],
					removed: [],
				},
				confidence: 1,
				currentVersion: migrationRegistry.currentVersion,
				needsMigration: false,
				reasons: ["Current Typia validator accepted the attributes."],
				targetVersion: migrationRegistry.currentVersion,
				warnings: [],
			} satisfies MigrationAnalysis,
			preview: createPreview({
				after: attributes,
				before: attributes,
				currentManifest: migrationRegistry.currentManifest as ManifestDocument,
				legacyManifest: null,
				status: "current",
				unresolved: [],
				validationErrors: [],
			}),
		};
	}

	for (const entry of migrationRegistry.entries) {
		if (manifestMatchesDocument(entry.manifest as ManifestDocument, attributes)) {
			const migrated = entry.rule.migrate(attributes);
			const migratedValidation = validators.validate(migrated as any);
			const unresolved = Array.isArray(entry.rule.unresolved) ? [...entry.rule.unresolved] : [];
			const validationErrors = migratedValidation.success ? [] : formatValidationErrors(migratedValidation.errors);
			const preview = createPreview({
				after: migratedValidation.success ? (migrated as Record<string, unknown>) : null,
				before: attributes,
				currentManifest: migrationRegistry.currentManifest as ManifestDocument,
				legacyManifest: entry.manifest as ManifestDocument,
				status: migratedValidation.success ? (unresolved.length > 0 ? "manual" : "auto") : "manual",
				unresolved,
				validationErrors,
			});
			const delta = summarizeVersionDelta(
				entry.manifest as ManifestDocument,
				migrationRegistry.currentManifest as ManifestDocument,
			);

			return {
				analysis: {
					affectedFields: delta,
					confidence: unresolved.length > 0 ? 0.8 : 0.95,
					currentVersion: entry.fromVersion,
					needsMigration: true,
					reasons: [
						`Snapshot ${entry.fromVersion} matched this block.`,
						...preview.unionBranches.map(
							(branch) => `Union ${branch.field}: ${branch.legacyBranch ?? "unknown"} -> ${branch.nextBranch ?? "unknown"} (${branch.status})`,
						),
					],
					targetVersion: migrationRegistry.currentVersion,
					warnings: [...unresolved, ...validationErrors],
				} satisfies MigrationAnalysis,
				preview,
			};
		}
	}

	return {
		analysis: {
			affectedFields: {
				added: [],
				changed: [],
				removed: [],
			},
			confidence: 0.2,
			currentVersion: "unknown",
			needsMigration: true,
			reasons: ["No legacy snapshot matched and current Typia validator rejected the attributes."],
			targetVersion: migrationRegistry.currentVersion,
			warnings: formatValidationErrors(currentValidation.errors),
		} satisfies MigrationAnalysis,
		preview: createPreview({
			after: null,
			before: attributes,
			currentManifest: migrationRegistry.currentManifest as ManifestDocument,
			legacyManifest: null,
			status: "unknown",
			unresolved: ["Manual migration review is required because the block does not match any supported snapshot."],
			validationErrors: formatValidationErrors(currentValidation.errors),
		}),
	};
}

function createPreview({
	after,
	before,
	currentManifest,
	legacyManifest,
	status,
	unresolved,
	validationErrors,
}: {
	after: Record<string, unknown> | null;
	before: Record<string, unknown>;
	currentManifest: ManifestDocument;
	legacyManifest: ManifestDocument | null;
	status: UnionBranchPreview["status"];
	unresolved: string[];
	validationErrors: string[];
}): MigrationPreview {
	return {
		after,
		before,
		changedFields: after ? collectChangedFieldPaths(before, after) : [],
		unresolved,
		unionBranches: collectUnionBranchPreview(legacyManifest, currentManifest, before, after, status),
		validationErrors,
	};
}

function collectChangedFieldPaths(
	before: Record<string, unknown>,
	after: Record<string, unknown>,
	prefix = "",
): string[] {
	const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
	const changes: string[] = [];

	for (const key of keys) {
		const nextPrefix = prefix ? `${prefix}.${key}` : key;
		const left = before[key];
		const right = after[key];

		if (isPlainObject(left) && isPlainObject(right)) {
			changes.push(...collectChangedFieldPaths(left, right, nextPrefix));
			continue;
		}
		if (JSON.stringify(left) !== JSON.stringify(right)) {
			changes.push(nextPrefix);
		}
	}

	return changes;
}

function collectUnionBranchPreview(
	legacyManifest: ManifestDocument | null,
	currentManifest: ManifestDocument,
	before: Record<string, unknown>,
	after: Record<string, unknown> | null,
	status: UnionBranchPreview["status"],
): UnionBranchPreview[] {
	const fieldNames = new Set<string>();

	for (const [field, attribute] of Object.entries(legacyManifest?.attributes ?? {})) {
		if (attribute.ts.kind === "union") {
			fieldNames.add(field);
		}
	}
	for (const [field, attribute] of Object.entries(currentManifest.attributes ?? {})) {
		if (attribute.ts.kind === "union") {
			fieldNames.add(field);
		}
	}

	return [...fieldNames].map((field) => {
		const legacyAttribute = legacyManifest?.attributes?.[field] ?? null;
		const currentAttribute = currentManifest.attributes?.[field] ?? null;
		return {
			field,
			legacyBranch: resolveUnionBranchKey(legacyAttribute, before[field]),
			nextBranch: resolveUnionBranchKey(currentAttribute, (after ?? before)[field]),
			status,
		};
	});
}

function resolveUnionBranchKey(attribute: ManifestAttribute | null, value: unknown): string | null {
	if (!attribute || attribute.ts.kind !== "union" || !attribute.ts.union || !isPlainObject(value)) {
		return null;
	}

	const discriminatorValue = value[attribute.ts.union.discriminator];
	if (typeof discriminatorValue !== "string") {
		return null;
	}

	return discriminatorValue in attribute.ts.union.branches ? discriminatorValue : null;
}

function formatValidationErrors(errors: Array<{ expected?: string; path?: string }> = []): string[] {
	return errors.map((error) => {
		const pathLabel = error.path ?? "$";
		const expectedLabel = error.expected ?? "unknown";
		return `${pathLabel}: ${expectedLabel}`;
	});
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
