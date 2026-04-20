import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import type { HookedBlockPositionId } from "./hooked-blocks.js";
import { resolveWorkspaceProject } from "./workspace-project.js";
import { appendWorkspaceInventoryEntries, readWorkspaceInventory } from "./workspace-inventory.js";
import { toKebabCase, toTitleCase } from "./string-case.js";
import {
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
	type RunAddHookedBlockCommandOptions,
	type RunAddVariationCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";

const VARIATIONS_IMPORT_LINE = "import { registerWorkspaceVariations } from './variations';";
const VARIATIONS_CALL_LINE = "registerWorkspaceVariations();";

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

async function ensureVariationRegistrationHook(blockIndexPath: string): Promise<void> {
	await patchFile(blockIndexPath, (source) => {
		let nextSource = source;

		if (!nextSource.includes(VARIATIONS_IMPORT_LINE)) {
			nextSource = `${VARIATIONS_IMPORT_LINE}\n${nextSource}`;
		}

		if (!nextSource.includes(VARIATIONS_CALL_LINE)) {
			const callInsertionPatterns = [
				/(registerBlockType<[\s\S]*?\);\s*)/u,
				/(registerBlockType\([\s\S]*?\);\s*)/u,
			];
			let inserted = false;

			for (const pattern of callInsertionPatterns) {
				const candidate = nextSource.replace(
					pattern,
					(match) => `${match}\n${VARIATIONS_CALL_LINE}\n`,
				);
				if (candidate !== nextSource) {
					nextSource = candidate;
					inserted = true;
					break;
				}
			}

			if (!inserted) {
				nextSource = `${nextSource.trimEnd()}\n\n${VARIATIONS_CALL_LINE}\n`;
			}
		}

		if (!nextSource.includes(VARIATIONS_CALL_LINE)) {
			throw new Error(
				`Unable to inject ${VARIATIONS_CALL_LINE} into ${path.basename(blockIndexPath)}.`,
			);
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

/**
 * Re-export focused workspace asset scaffold commands from the companion
 * `cli-add-workspace-assets` module.
 */
export {
	runAddEditorPluginCommand,
	runAddBindingSourceCommand,
	runAddPatternCommand,
} from "./cli-add-workspace-assets.js";
export { runAddRestResourceCommand } from "./cli-add-workspace-rest.js";

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
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			blockIndexPath,
			variationsIndexPath,
		]),
		snapshotDirs: [],
		targetPaths: [variationFilePath],
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
