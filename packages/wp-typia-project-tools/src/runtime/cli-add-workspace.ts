import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import type { HookedBlockPositionId } from "./hooked-blocks.js";
import { resolveWorkspaceProject } from "./workspace-project.js";
import { appendWorkspaceInventoryEntries, readWorkspaceInventory } from "./workspace-inventory.js";
import { toKebabCase, toSnakeCase, toTitleCase } from "./string-case.js";
import {
	assertBlockStyleDoesNotExist,
	assertBlockTransformDoesNotExist,
	assertValidGeneratedSlug,
	assertValidHookAnchor,
	assertValidHookedBlockPosition,
	assertVariationDoesNotExist,
	getMutableBlockHooks,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	readWorkspaceBlockJson,
	resolveWorkspaceBlock,
	rollbackWorkspaceMutation,
	type RunAddBlockStyleCommandOptions,
	type RunAddBlockTransformCommandOptions,
	type RunAddHookedBlockCommandOptions,
	type RunAddVariationCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	findExecutablePatternMatch,
	hasExecutablePattern,
	hasUncommentedPattern,
	maskTypeScriptCommentsAndLiterals,
	type SourceRange,
} from "./ts-source-masking.js";

const VARIATIONS_IMPORT_LINE = "import { registerWorkspaceVariations } from './variations';";
const VARIATIONS_IMPORT_PATTERN =
	/^\s*import\s*\{\s*registerWorkspaceVariations\s*\}\s*from\s*["']\.\/variations["']\s*;?\s*$/mu;
const VARIATIONS_CALL_LINE = "registerWorkspaceVariations();";
const VARIATIONS_CALL_PATTERN = /registerWorkspaceVariations\s*\(\s*\)\s*;?/u;
const BLOCK_STYLES_IMPORT_LINE = "import { registerWorkspaceBlockStyles } from './styles';";
const BLOCK_STYLES_IMPORT_PATTERN =
	/^\s*import\s*\{\s*registerWorkspaceBlockStyles\s*\}\s*from\s*["']\.\/styles["']\s*;?\s*$/mu;
const BLOCK_STYLES_CALL_LINE = "registerWorkspaceBlockStyles();";
const BLOCK_STYLES_CALL_PATTERN = /registerWorkspaceBlockStyles\s*\(\s*\)\s*;?/u;
const BLOCK_TRANSFORMS_IMPORT_LINE =
	"import { applyWorkspaceBlockTransforms } from './transforms';";
const BLOCK_TRANSFORMS_IMPORT_PATTERN =
	/^\s*import\s*\{\s*applyWorkspaceBlockTransforms\s*\}\s*from\s*["']\.\/transforms["']\s*;?\s*$/mu;
const BLOCK_TRANSFORMS_CALL_LINE = "applyWorkspaceBlockTransforms(registration.settings);";
const BLOCK_TRANSFORMS_CALL_PATTERN =
	/applyWorkspaceBlockTransforms\s*\(\s*registration\s*\.\s*settings\s*\)\s*;?/u;
const SCAFFOLD_REGISTRATION_SETTINGS_CALL_PATTERN =
	/registerScaffoldBlockType\s*\(\s*registration\s*\.\s*name\s*,\s*registration\s*\.\s*settings\s*\)\s*;?/u;
const FULL_BLOCK_NAME_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/u;

function isIdentifierBoundary(source: string, index: number): boolean {
	if (index < 0 || index >= source.length) {
		return true;
	}

	return !/[A-Za-z0-9_$]/u.test(source[index] ?? "");
}

function skipWhitespace(source: string, index: number): number {
	let cursor = index;

	while (cursor < source.length && /\s/u.test(source[cursor] ?? "")) {
		cursor += 1;
	}

	return cursor;
}

function findMatchingDelimiterEnd(
	source: string,
	openIndex: number,
	openDelimiter: string,
	closeDelimiter: string,
): number | undefined {
	let depth = 0;

	for (let index = openIndex; index < source.length; index += 1) {
		const char = source[index];

		if (char === openDelimiter) {
			depth += 1;
			continue;
		}

		if (char === closeDelimiter) {
			depth -= 1;

			if (depth === 0) {
				return index + 1;
			}
		}
	}

	return undefined;
}

function findExecutableCallRange(source: string, callName: string): SourceRange | undefined {
	const maskedSource = maskTypeScriptCommentsAndLiterals(source);
	let searchIndex = 0;

	while (searchIndex < maskedSource.length) {
		const callNameIndex = maskedSource.indexOf(callName, searchIndex);

		if (callNameIndex === -1) {
			return undefined;
		}

		const callNameEnd = callNameIndex + callName.length;
		if (
			!isIdentifierBoundary(maskedSource, callNameIndex - 1) ||
			!isIdentifierBoundary(maskedSource, callNameEnd)
		) {
			searchIndex = callNameEnd;
			continue;
		}

		let cursor = skipWhitespace(maskedSource, callNameEnd);
		if (maskedSource[cursor] === "<") {
			const genericEnd = findMatchingDelimiterEnd(maskedSource, cursor, "<", ">");
			if (genericEnd === undefined) {
				searchIndex = callNameEnd;
				continue;
			}
			cursor = skipWhitespace(maskedSource, genericEnd);
		}

		if (maskedSource[cursor] !== "(") {
			searchIndex = callNameEnd;
			continue;
		}

		const callEnd = findMatchingDelimiterEnd(maskedSource, cursor, "(", ")");
		if (callEnd === undefined) {
			searchIndex = callNameEnd;
			continue;
		}

		let end = skipWhitespace(maskedSource, callEnd);
		if (maskedSource[end] === ";") {
			end += 1;
		}

		return {
			end,
			start: callNameIndex,
		};
	}

	return undefined;
}

function findBlockRegistrationCallRange(source: string): SourceRange | undefined {
	return (
		findExecutableCallRange(source, "registerScaffoldBlockType") ??
		findExecutableCallRange(source, "registerBlockType")
	);
}

function buildVariationConfigEntry(blockSlug: string, variationSlug: string): string {
	return [
		"\t{",
		`\t\tblock: ${quoteTsString(blockSlug)},`,
		`\t\tfile: ${quoteTsString(`src/blocks/${blockSlug}/variations/${variationSlug}.ts`)},`,
		`\t\tslug: ${quoteTsString(variationSlug)},`,
		"\t},",
	].join("\n");
}

function buildVariationConstName(variationSlug: string): string {
	const identifierSegments = toKebabCase(variationSlug)
		.split("-")
		.filter(Boolean);

	return `workspaceVariation_${identifierSegments.join("_")}`;
}

function getVariationConstBindings(
	variationSlugs: string[],
): Array<{ constName: string; variationSlug: string }> {
	const seenConstNames = new Map<string, string>();

	return variationSlugs.map((variationSlug) => {
		const constName = buildVariationConstName(variationSlug);
		const previousSlug = seenConstNames.get(constName);

		if (previousSlug && previousSlug !== variationSlug) {
			throw new Error(
				`Variation slugs "${previousSlug}" and "${variationSlug}" generate the same registry identifier "${constName}". Rename one of the variations.`,
			);
		}

		seenConstNames.set(constName, variationSlug);
		return { constName, variationSlug };
	});
}

function buildVariationSource(variationSlug: string, textDomain: string): string {
	const variationTitle = toTitleCase(variationSlug);
	const variationConstName = buildVariationConstName(variationSlug);

	return `import type { BlockVariation } from '@wp-typia/block-types/blocks/registration';
import { __ } from '@wordpress/i18n';

export const ${variationConstName} = {
\tname: ${quoteTsString(variationSlug)},
\ttitle: __( ${quoteTsString(variationTitle)}, ${quoteTsString(textDomain)} ),
\tdescription: __(
\t\t${quoteTsString(`A starter variation for ${variationTitle}.`)},
\t\t${quoteTsString(textDomain)},
\t),
\tattributes: {},
\tscope: ['inserter'],
} satisfies BlockVariation;
`;
}

function buildVariationIndexSource(variationSlugs: string[]): string {
	const variationBindings = getVariationConstBindings(variationSlugs);
	const importLines = variationBindings
		.map(({ constName, variationSlug }) => {
			return `import { ${constName} } from './${variationSlug}';`;
		})
		.join("\n");
	const variationConstNames = variationBindings
		.map(({ constName }) => constName)
		.join(",\n\t\t");

	return `import { registerBlockVariation } from '@wordpress/blocks';
import metadata from '../block.json';
${importLines ? `\n${importLines}` : ""}

const WORKSPACE_VARIATIONS = [
\t${variationConstNames}
\t// wp-typia add variation entries
];

export function registerWorkspaceVariations() {
\tfor (const variation of WORKSPACE_VARIATIONS) {
\t\tregisterBlockVariation(metadata.name, variation);
\t}
}
`;
}

function buildWorkspaceConstName(prefix: string, slug: string): string {
	return `workspace${prefix}_${toSnakeCase(slug)}`;
}

function buildBlockStyleConfigEntry(blockSlug: string, styleSlug: string): string {
	return [
		"\t{",
		`\t\tblock: ${quoteTsString(blockSlug)},`,
		`\t\tfile: ${quoteTsString(`src/blocks/${blockSlug}/styles/${styleSlug}.ts`)},`,
		`\t\tslug: ${quoteTsString(styleSlug)},`,
		"\t},",
	].join("\n");
}

function buildBlockTransformConfigEntry(options: {
	blockSlug: string;
	fromBlockName: string;
	toBlockName: string;
	transformSlug: string;
}): string {
	return [
		"\t{",
		`\t\tblock: ${quoteTsString(options.blockSlug)},`,
		`\t\tfile: ${quoteTsString(`src/blocks/${options.blockSlug}/transforms/${options.transformSlug}.ts`)},`,
		`\t\tfrom: ${quoteTsString(options.fromBlockName)},`,
		`\t\tslug: ${quoteTsString(options.transformSlug)},`,
		`\t\tto: ${quoteTsString(options.toBlockName)},`,
		"\t},",
	].join("\n");
}

function getBlockStyleConstBindings(
	styleSlugs: string[],
): Array<{ constName: string; styleSlug: string }> {
	const seenConstNames = new Map<string, string>();

	return styleSlugs.map((styleSlug) => {
		const constName = buildWorkspaceConstName("BlockStyle", styleSlug);
		const previousSlug = seenConstNames.get(constName);

		if (previousSlug && previousSlug !== styleSlug) {
			throw new Error(
				`Style slugs "${previousSlug}" and "${styleSlug}" generate the same registry identifier "${constName}". Rename one of the styles.`,
			);
		}

		seenConstNames.set(constName, styleSlug);
		return { constName, styleSlug };
	});
}

function getBlockTransformConstBindings(
	transformSlugs: string[],
): Array<{ constName: string; transformSlug: string }> {
	const seenConstNames = new Map<string, string>();

	return transformSlugs.map((transformSlug) => {
		const constName = buildWorkspaceConstName("BlockTransform", transformSlug);
		const previousSlug = seenConstNames.get(constName);

		if (previousSlug && previousSlug !== transformSlug) {
			throw new Error(
				`Transform slugs "${previousSlug}" and "${transformSlug}" generate the same registry identifier "${constName}". Rename one of the transforms.`,
			);
		}

		seenConstNames.set(constName, transformSlug);
		return { constName, transformSlug };
	});
}

function buildBlockStyleSource(styleSlug: string, textDomain: string): string {
	const styleTitle = toTitleCase(styleSlug);
	const styleConstName = buildWorkspaceConstName("BlockStyle", styleSlug);

	return `import { __ } from '@wordpress/i18n';

export const ${styleConstName} = {
\tname: ${quoteTsString(styleSlug)},
\tlabel: __( ${quoteTsString(styleTitle)}, ${quoteTsString(textDomain)} ),
} as const;
`;
}

function buildBlockStyleIndexSource(styleSlugs: string[]): string {
	const styleBindings = getBlockStyleConstBindings(styleSlugs);
	const importLines = styleBindings
		.map(({ constName, styleSlug }) => `import { ${constName} } from './${styleSlug}';`)
		.join("\n");
	const styleConstNames = styleBindings.map(({ constName }) => constName).join(",\n\t");

	return `import { registerBlockStyle } from '@wordpress/blocks';
import metadata from '../block.json';
${importLines ? `\n${importLines}` : ""}

const WORKSPACE_BLOCK_STYLES = [
\t${styleConstNames}
\t// wp-typia add style entries
] as const;

export function registerWorkspaceBlockStyles() {
\tfor (const style of WORKSPACE_BLOCK_STYLES) {
\t\tregisterBlockStyle(metadata.name, style);
\t}
}
`;
}

function buildBlockTransformSource(options: {
	fromBlockName: string;
	textDomain: string;
	transformSlug: string;
}): string {
	const transformTitle = toTitleCase(options.transformSlug);
	const transformConstName = buildWorkspaceConstName(
		"BlockTransform",
		options.transformSlug,
	);

	return `import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

type TransformAttributes = Record<string, unknown>;
type TransformInnerBlock = ReturnType<typeof createBlock>;

function mapTransformAttributes(attributes: TransformAttributes): TransformAttributes {
\tconst content = attributes.content;

\treturn typeof content === 'string' ? { content } : {};
}

export const ${transformConstName} = {
\ttype: 'block',
\tblocks: [${quoteTsString(options.fromBlockName)}],
\ttitle: __( ${quoteTsString(transformTitle)}, ${quoteTsString(options.textDomain)} ),
\ttransform: (
\t\tattributes: TransformAttributes,
\t\tinnerBlocks: TransformInnerBlock[] = [],
\t) => createBlock(metadata.name, mapTransformAttributes(attributes), innerBlocks),
} as const;
`;
}

function buildBlockTransformIndexSource(transformSlugs: string[]): string {
	const transformBindings = getBlockTransformConstBindings(transformSlugs);
	const importLines = transformBindings
		.map(
			({ constName, transformSlug }) =>
				`import { ${constName} } from './${transformSlug}';`,
		)
		.join("\n");
	const transformConstNames = transformBindings
		.map(({ constName }) => constName)
		.join(",\n\t");

	return `${importLines ? `${importLines}\n\n` : ""}type BlockSettingsWithTransforms = {
\ttransforms?: {
\t\tfrom?: unknown[];
\t\tto?: unknown[];
\t};
};

const WORKSPACE_BLOCK_TRANSFORMS = [
\t${transformConstNames}
\t// wp-typia add transform entries
] as const;

export function applyWorkspaceBlockTransforms(settings: BlockSettingsWithTransforms) {
\tconst transforms = settings.transforms ?? {};

\tsettings.transforms = {
\t\t...transforms,
\t\tfrom: [...(transforms.from ?? []), ...WORKSPACE_BLOCK_TRANSFORMS],
\t};
}
`;
}

async function ensureVariationRegistrationHook(blockIndexPath: string): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!hasUncommentedPattern(nextSource, VARIATIONS_IMPORT_PATTERN)) {
			nextSource = `${VARIATIONS_IMPORT_LINE}\n${nextSource}`;
		}

		if (!hasExecutablePattern(nextSource, VARIATIONS_CALL_PATTERN)) {
			const callRange = findBlockRegistrationCallRange(nextSource);

			if (callRange) {
				nextSource = [
					nextSource.slice(0, callRange.end),
					`\n${VARIATIONS_CALL_LINE}\n`,
					nextSource.slice(callRange.end),
				].join("");
			} else {
				nextSource = `${nextSource.trimEnd()}\n\n${VARIATIONS_CALL_LINE}\n`;
			}
		}

		if (!hasExecutablePattern(nextSource, VARIATIONS_CALL_PATTERN)) {
			throw new Error(
				`Unable to inject ${VARIATIONS_CALL_LINE} into ${path.basename(blockIndexPath)}.`,
			);
		}

		return nextSource;
	});
}

async function ensureBlockStyleRegistrationHook(blockIndexPath: string): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!hasUncommentedPattern(nextSource, BLOCK_STYLES_IMPORT_PATTERN)) {
			nextSource = `${BLOCK_STYLES_IMPORT_LINE}\n${nextSource}`;
		}

		if (!hasExecutablePattern(nextSource, BLOCK_STYLES_CALL_PATTERN)) {
			const callRange = findBlockRegistrationCallRange(nextSource);

			if (callRange) {
				nextSource = [
					nextSource.slice(0, callRange.end),
					`\n${BLOCK_STYLES_CALL_LINE}\n`,
					nextSource.slice(callRange.end),
				].join("");
			} else {
				nextSource = `${nextSource.trimEnd()}\n\n${BLOCK_STYLES_CALL_LINE}\n`;
			}
		}

		if (!hasExecutablePattern(nextSource, BLOCK_STYLES_CALL_PATTERN)) {
			throw new Error(
				`Unable to inject ${BLOCK_STYLES_CALL_LINE} into ${path.basename(blockIndexPath)}.`,
			);
		}

		return nextSource;
	});
}

async function ensureBlockTransformRegistrationHook(blockIndexPath: string): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!hasUncommentedPattern(nextSource, BLOCK_TRANSFORMS_IMPORT_PATTERN)) {
			nextSource = `${BLOCK_TRANSFORMS_IMPORT_LINE}\n${nextSource}`;
		}

		if (!hasExecutablePattern(nextSource, BLOCK_TRANSFORMS_CALL_PATTERN)) {
			const callRange = findExecutablePatternMatch(nextSource, [
				SCAFFOLD_REGISTRATION_SETTINGS_CALL_PATTERN,
			]);

			if (!callRange) {
				throw new Error(
					`Unable to inject ${BLOCK_TRANSFORMS_CALL_LINE} into ${path.basename(
						blockIndexPath,
					)} because it does not expose a scaffold registration settings object.`,
				);
			}

			nextSource = [
				nextSource.slice(0, callRange.start),
				`${BLOCK_TRANSFORMS_CALL_LINE}\n`,
				nextSource.slice(callRange.start),
			].join("");
		}

		return nextSource;
	});
}

async function writeVariationRegistry(
	projectDir: string,
	blockSlug: string,
	variationSlug: string,
): Promise<void> {
	const variationsDir = path.join(projectDir, "src", "blocks", blockSlug, "variations");
	const variationsIndexPath = path.join(variationsDir, "index.ts");
	await fsp.mkdir(variationsDir, { recursive: true });

	const existingVariationSlugs = fs
		.readdirSync(variationsDir)
		.filter((entry) => entry.endsWith(".ts") && entry !== "index.ts")
		.map((entry) => entry.replace(/\.ts$/u, ""));
	const nextVariationSlugs = Array.from(new Set([...existingVariationSlugs, variationSlug])).sort();
	await fsp.writeFile(
		variationsIndexPath,
		buildVariationIndexSource(nextVariationSlugs),
		"utf8",
	);
}

async function writeBlockStyleRegistry(
	projectDir: string,
	blockSlug: string,
	styleSlug: string,
): Promise<void> {
	const stylesDir = path.join(projectDir, "src", "blocks", blockSlug, "styles");
	const stylesIndexPath = path.join(stylesDir, "index.ts");
	await fsp.mkdir(stylesDir, { recursive: true });

	const existingStyleSlugs = fs
		.readdirSync(stylesDir)
		.filter((entry) => entry.endsWith(".ts") && entry !== "index.ts")
		.map((entry) => entry.replace(/\.ts$/u, ""));
	const nextStyleSlugs = Array.from(new Set([...existingStyleSlugs, styleSlug])).sort();
	await fsp.writeFile(stylesIndexPath, buildBlockStyleIndexSource(nextStyleSlugs), "utf8");
}

async function writeBlockTransformRegistry(
	projectDir: string,
	blockSlug: string,
	transformSlug: string,
): Promise<void> {
	const transformsDir = path.join(projectDir, "src", "blocks", blockSlug, "transforms");
	const transformsIndexPath = path.join(transformsDir, "index.ts");
	await fsp.mkdir(transformsDir, { recursive: true });

	const existingTransformSlugs = fs
		.readdirSync(transformsDir)
		.filter((entry) => entry.endsWith(".ts") && entry !== "index.ts")
		.map((entry) => entry.replace(/\.ts$/u, ""));
	const nextTransformSlugs = Array.from(
		new Set([...existingTransformSlugs, transformSlug]),
	).sort();
	await fsp.writeFile(
		transformsIndexPath,
		buildBlockTransformIndexSource(nextTransformSlugs),
		"utf8",
	);
}

function assertFullBlockName(blockName: string, flagName: string): string {
	const trimmed = blockName.trim();
	if (!trimmed) {
		throw new Error(`\`${flagName}\` requires a block name.`);
	}
	if (!FULL_BLOCK_NAME_PATTERN.test(trimmed)) {
		throw new Error(`\`${flagName}\` must use <namespace/block-slug> format.`);
	}

	return trimmed;
}

function resolveWorkspaceTargetBlockName(
	blockName: string,
	namespace: string,
	flagName: string,
): { blockName: string; blockSlug: string } {
	const trimmed = blockName.trim();
	if (!trimmed) {
		throw new Error(`\`${flagName}\` requires <block-slug|namespace/block-slug>.`);
	}

	const blockNameSegments = trimmed.split("/");
	if (
		blockNameSegments.length > 2 ||
		blockNameSegments.some((segment) => segment.trim() === "")
	) {
		throw new Error(`\`${flagName}\` must use <block-slug|namespace/block-slug> format.`);
	}

	const [maybeNamespace, maybeSlug] =
		blockNameSegments.length === 2
			? blockNameSegments
			: [undefined, blockNameSegments[0]];
	if (maybeNamespace && maybeNamespace !== namespace) {
		throw new Error(
			`\`${flagName}\` references namespace "${maybeNamespace}". Expected "${namespace}".`,
		);
	}

	const blockSlug = normalizeBlockSlug(maybeSlug ?? "");
	return {
		blockName: `${namespace}/${blockSlug}`,
		blockSlug,
	};
}

/**
 * Re-export the DataViews admin screen scaffold workflow from the focused
 * admin-view runtime helper module.
 */
export {
	runAddAdminViewCommand,
} from "./cli-add-workspace-admin-view.js";
/**
 * Re-export focused workspace asset scaffold commands from the companion
 * `cli-add-workspace-assets` module.
 */
export {
	runAddEditorPluginCommand,
	runAddBindingSourceCommand,
	runAddPatternCommand,
} from "./cli-add-workspace-assets.js";
/**
 * Re-export the plugin-level REST resource scaffold workflow from the focused
 * rest-resource runtime helper module.
 */
export { runAddRestResourceCommand } from "./cli-add-workspace-rest.js";
/**
 * Re-export the typed workflow ability scaffold workflow from the focused
 * ability runtime helper module.
 */
export { runAddAbilityCommand } from "./cli-add-workspace-ability.js";
/**
 * Re-export the server-only AI feature scaffold workflow from the focused
 * AI-feature runtime helper module.
 */
export { runAddAiFeatureCommand } from "./cli-add-workspace-ai.js";

/**
 * Add one variation entry to an existing workspace block.
 *
 * @param options Command options for the variation scaffold workflow.
 * @param options.blockName Target workspace block slug that will own the variation.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.variationName Human-entered variation name that will be normalized
 * and validated before files are written.
 * @returns A promise that resolves with the normalized `blockSlug`,
 * `variationSlug`, and owning `projectDir` after the variation files and
 * inventory entry have been written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the target block is unknown, when the variation slug is invalid, or when a
 * conflicting file or inventory entry already exists.
 */
export async function runAddVariationCommand({
	blockName,
	cwd = process.cwd(),
	variationName,
}: RunAddVariationCommandOptions): Promise<{
	blockSlug: string;
	projectDir: string;
	variationSlug: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const blockSlug = normalizeBlockSlug(blockName);
	const variationSlug = assertValidGeneratedSlug(
		"Variation name",
		normalizeBlockSlug(variationName),
		"wp-typia add variation <name> --block <block-slug>",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	resolveWorkspaceBlock(inventory, blockSlug);
	assertVariationDoesNotExist(workspace.projectDir, blockSlug, variationSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const blockIndexPath = path.join(workspace.projectDir, "src", "blocks", blockSlug, "index.tsx");
	const variationsDir = path.join(workspace.projectDir, "src", "blocks", blockSlug, "variations");
	const variationFilePath = path.join(variationsDir, `${variationSlug}.ts`);
	const variationsIndexPath = path.join(variationsDir, "index.ts");
	const shouldRemoveVariationsDirOnRollback = !fs.existsSync(variationsDir);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			blockIndexPath,
			variationsIndexPath,
		]),
		snapshotDirs: [],
		targetPaths: [
			variationFilePath,
			...(shouldRemoveVariationsDirOnRollback ? [variationsDir] : []),
		],
	};

	try {
		await fsp.mkdir(variationsDir, { recursive: true });
		await fsp.writeFile(
			variationFilePath,
			buildVariationSource(variationSlug, workspace.workspace.textDomain),
			"utf8",
		);
		await writeVariationRegistry(workspace.projectDir, blockSlug, variationSlug);
		await ensureVariationRegistrationHook(blockIndexPath);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			variationEntries: [buildVariationConfigEntry(blockSlug, variationSlug)],
		});

		return {
			blockSlug,
			projectDir: workspace.projectDir,
			variationSlug,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}

/**
 * Add one Block Styles registration to an existing workspace block.
 *
 * @param options Command options for the Block Styles scaffold workflow.
 * @param options.blockName Target workspace block slug that will own the style.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.styleName Human-entered style name that will be normalized and
 * validated before files are written.
 * @returns A promise that resolves with the normalized `blockSlug`, `styleSlug`,
 * and owning `projectDir` after the style module, style registry, entrypoint
 * hook, and inventory entry have been written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the target block is unknown, when the style slug is invalid, or when a
 * conflicting file or inventory entry already exists.
 */
export async function runAddBlockStyleCommand({
	blockName,
	cwd = process.cwd(),
	styleName,
}: RunAddBlockStyleCommandOptions): Promise<{
	blockSlug: string;
	projectDir: string;
	styleSlug: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const blockSlug = normalizeBlockSlug(blockName);
	const styleSlug = assertValidGeneratedSlug(
		"Style name",
		normalizeBlockSlug(styleName),
		"wp-typia add style <name> --block <block-slug>",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	resolveWorkspaceBlock(inventory, blockSlug);
	assertBlockStyleDoesNotExist(workspace.projectDir, blockSlug, styleSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const blockIndexPath = path.join(workspace.projectDir, "src", "blocks", blockSlug, "index.tsx");
	const stylesDir = path.join(workspace.projectDir, "src", "blocks", blockSlug, "styles");
	const styleFilePath = path.join(stylesDir, `${styleSlug}.ts`);
	const stylesIndexPath = path.join(stylesDir, "index.ts");
	const shouldRemoveStylesDirOnRollback = !fs.existsSync(stylesDir);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			blockIndexPath,
			stylesIndexPath,
		]),
		snapshotDirs: [],
		targetPaths: [
			styleFilePath,
			...(shouldRemoveStylesDirOnRollback ? [stylesDir] : []),
		],
	};

	try {
		await fsp.mkdir(stylesDir, { recursive: true });
		await fsp.writeFile(
			styleFilePath,
			buildBlockStyleSource(styleSlug, workspace.workspace.textDomain),
			"utf8",
		);
		await writeBlockStyleRegistry(workspace.projectDir, blockSlug, styleSlug);
		await ensureBlockStyleRegistrationHook(blockIndexPath);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			blockStyleEntries: [buildBlockStyleConfigEntry(blockSlug, styleSlug)],
		});

		return {
			blockSlug,
			projectDir: workspace.projectDir,
			styleSlug,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}

/**
 * Add one block-to-block transform registration to an existing workspace block.
 *
 * @param options Command options for the block transform scaffold workflow.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.fromBlockName Source block name for `--from`. This must be the
 * full `namespace/block` form because transforms may originate from WordPress
 * core or third-party blocks outside the workspace.
 * @param options.toBlockName Target block for `--to`. A workspace block slug is
 * resolved against the workspace namespace, while a full `namespace/block` name
 * must still point at an existing workspace block.
 * @param options.transformName Human-entered transform name that will be
 * normalized and validated before files are written.
 * @returns A promise that resolves with the normalized target `blockSlug`,
 * resolved `fromBlockName`, resolved `toBlockName`, `transformSlug`, and owning
 * `projectDir` after the transform module, transform registry, entrypoint hook,
 * and inventory entry have been written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the target block is unknown, when `--from` is not a full block name, when
 * `--to` uses a non-workspace namespace, when the target block entrypoint does
 * not expose `registration.settings`, when the transform slug is invalid, or
 * when a conflicting file or inventory entry already exists.
 */
export async function runAddBlockTransformCommand({
	cwd = process.cwd(),
	fromBlockName,
	toBlockName,
	transformName,
}: RunAddBlockTransformCommandOptions): Promise<{
	blockSlug: string;
	fromBlockName: string;
	projectDir: string;
	toBlockName: string;
	transformSlug: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const transformSlug = assertValidGeneratedSlug(
		"Transform name",
		normalizeBlockSlug(transformName),
		"wp-typia add transform <name> --from <namespace/block> --to <block-slug|namespace/block-slug>",
	);
	const resolvedFromBlockName = assertFullBlockName(fromBlockName, "--from");
	const target = resolveWorkspaceTargetBlockName(
		toBlockName,
		workspace.workspace.namespace,
		"--to",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	resolveWorkspaceBlock(inventory, target.blockSlug);
	assertBlockTransformDoesNotExist(
		workspace.projectDir,
		target.blockSlug,
		transformSlug,
		inventory,
	);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const blockIndexPath = path.join(
		workspace.projectDir,
		"src",
		"blocks",
		target.blockSlug,
		"index.tsx",
	);
	const transformsDir = path.join(
		workspace.projectDir,
		"src",
		"blocks",
		target.blockSlug,
		"transforms",
	);
	const transformFilePath = path.join(transformsDir, `${transformSlug}.ts`);
	const transformsIndexPath = path.join(transformsDir, "index.ts");
	const shouldRemoveTransformsDirOnRollback = !fs.existsSync(transformsDir);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			blockIndexPath,
			transformsIndexPath,
		]),
		snapshotDirs: [],
		targetPaths: [
			transformFilePath,
			...(shouldRemoveTransformsDirOnRollback ? [transformsDir] : []),
		],
	};

	try {
		await fsp.mkdir(transformsDir, { recursive: true });
		await fsp.writeFile(
			transformFilePath,
			buildBlockTransformSource({
				fromBlockName: resolvedFromBlockName,
				textDomain: workspace.workspace.textDomain,
				transformSlug,
			}),
			"utf8",
		);
		await writeBlockTransformRegistry(workspace.projectDir, target.blockSlug, transformSlug);
		await ensureBlockTransformRegistrationHook(blockIndexPath);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			blockTransformEntries: [
				buildBlockTransformConfigEntry({
					blockSlug: target.blockSlug,
					fromBlockName: resolvedFromBlockName,
					toBlockName: target.blockName,
					transformSlug,
				}),
			],
		});

		return {
			blockSlug: target.blockSlug,
			fromBlockName: resolvedFromBlockName,
			projectDir: workspace.projectDir,
			toBlockName: target.blockName,
			transformSlug,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}

/**
 * Add one `blockHooks` entry to an existing official workspace block.
 *
 * @param options Command options for the hooked-block workflow.
 * @param options.anchorBlockName Full block name that will anchor the insertion.
 * @param options.blockName Existing workspace block slug to patch.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.position Hook position to store in `block.json`.
 * @returns A promise that resolves with the normalized target block slug, anchor
 * block name, position, and owning project directory after `block.json` is written.
 * @throws {Error} When the command is run outside an official workspace, when
 * the target block is unknown, when required flags are missing, or when the
 * block already defines a hook for the requested anchor.
 */
export async function runAddHookedBlockCommand({
	anchorBlockName,
	blockName,
	cwd = process.cwd(),
	position,
}: RunAddHookedBlockCommandOptions): Promise<{
	anchorBlockName: string;
	blockSlug: string;
	position: HookedBlockPositionId;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const blockSlug = normalizeBlockSlug(blockName);
	const inventory = readWorkspaceInventory(workspace.projectDir);
	resolveWorkspaceBlock(inventory, blockSlug);

	const resolvedAnchorBlockName = assertValidHookAnchor(anchorBlockName);
	const resolvedPosition = assertValidHookedBlockPosition(position);
	const selfHookAnchor = `${workspace.workspace.namespace}/${blockSlug}`;
	if (resolvedAnchorBlockName === selfHookAnchor) {
		throw new Error(
			"`wp-typia add hooked-block` cannot hook a block relative to its own block name.",
		);
	}
	const { blockJson, blockJsonPath } = readWorkspaceBlockJson(workspace.projectDir, blockSlug);
	const blockJsonRelativePath = path.relative(workspace.projectDir, blockJsonPath);
	const blockHooks = getMutableBlockHooks(blockJson, blockJsonRelativePath);

	if (Object.prototype.hasOwnProperty.call(blockHooks, resolvedAnchorBlockName)) {
		throw new Error(
			`${blockJsonRelativePath} already defines a blockHooks entry for "${resolvedAnchorBlockName}".`,
		);
	}

	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([blockJsonPath]),
		snapshotDirs: [],
		targetPaths: [],
	};

	try {
		blockHooks[resolvedAnchorBlockName] = resolvedPosition;
		await fsp.writeFile(blockJsonPath, JSON.stringify(blockJson, null, "\t"), "utf8");

		return {
			anchorBlockName: resolvedAnchorBlockName,
			blockSlug,
			position: resolvedPosition,
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
