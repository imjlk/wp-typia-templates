import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import type { HookedBlockPositionId } from "./hooked-blocks.js";
import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventory,
} from "./workspace-inventory.js";
import {
	toKebabCase,
	toTitleCase,
} from "./string-case.js";
import {
	assertBindingSourceDoesNotExist,
	assertPatternDoesNotExist,
	assertValidGeneratedSlug,
	assertValidHookAnchor,
	assertValidHookedBlockPosition,
	assertVariationDoesNotExist,
	getMutableBlockHooks,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	readWorkspaceBlockJson,
	resolveWorkspaceBlock,
	type RunAddBindingSourceCommandOptions,
	type RunAddHookedBlockCommandOptions,
	type RunAddPatternCommandOptions,
	type RunAddVariationCommandOptions,
	rollbackWorkspaceMutation,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";

const VARIATIONS_IMPORT_LINE = "import { registerWorkspaceVariations } from './variations';";
const VARIATIONS_CALL_LINE = "registerWorkspaceVariations();";
const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";
const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";

function buildVariationConfigEntry(
	blockSlug: string,
	variationSlug: string,
): string {
	return [
		"\t{",
		`\t\tblock: ${quoteTsString(blockSlug)},`,
		`\t\tfile: ${quoteTsString(`src/blocks/${blockSlug}/variations/${variationSlug}.ts`)},`,
		`\t\tslug: ${quoteTsString(variationSlug)},`,
		"\t},",
	].join("\n");
}

function buildPatternConfigEntry(patternSlug: string): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/patterns/${patternSlug}.php`)},`,
		`\t\tslug: ${quoteTsString(patternSlug)},`,
		"\t},",
	].join("\n");
}

function buildBindingSourceConfigEntry(bindingSourceSlug: string): string {
	return [
		"\t{",
		`\t\teditorFile: ${quoteTsString(`src/bindings/${bindingSourceSlug}/editor.ts`)},`,
		`\t\tserverFile: ${quoteTsString(`src/bindings/${bindingSourceSlug}/server.php`)},`,
		`\t\tslug: ${quoteTsString(bindingSourceSlug)},`,
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

function buildVariationSource(
	variationSlug: string,
	textDomain: string,
): string {
	const variationTitle = toTitleCase(variationSlug);
	const variationConstName = buildVariationConstName(variationSlug);

	return `import type { BlockVariation } from '@wordpress/blocks';
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

function buildVariationIndexSource(
	variationSlugs: string[],
): string {
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

function buildPatternSource(
	patternSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const patternTitle = toTitleCase(patternSlug);

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

register_block_pattern(
\t'${namespace}/${patternSlug}',
\tarray(
\t\t'title'       => __( ${JSON.stringify(patternTitle)}, '${textDomain}' ),
\t\t'description' => __( ${JSON.stringify(`A starter pattern for ${patternTitle}.`)}, '${textDomain}' ),
\t\t'categories'  => array( '${namespace}' ),
\t\t'content'     => '<!-- wp:paragraph --><p>' . esc_html__( 'Describe this pattern here.', '${textDomain}' ) . '</p><!-- /wp:paragraph -->',
\t)
);
`;
}

function buildBindingSourceServerSource(
	bindingSourceSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const bindingSourceTitle = toTitleCase(bindingSourceSlug);

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( 'register_block_bindings_source' ) ) {
\treturn;
}

register_block_bindings_source(
\t'${namespace}/${bindingSourceSlug}',
\tarray(
\t\t'label' => __( ${JSON.stringify(bindingSourceTitle)}, '${textDomain}' ),
\t\t'get_value_callback' => static function( array $source_args ) : string {
\t\t\t$field = isset( $source_args['field'] ) && is_string( $source_args['field'] )
\t\t\t\t? $source_args['field']
\t\t\t\t: '${bindingSourceSlug}';

\t\t\treturn sprintf(
\t\t\t\t__( 'Replace %s with real binding source data.', '${textDomain}' ),
\t\t\t\t$field
\t\t\t);
\t\t},
\t)
);
`;
}

function buildBindingSourceEditorSource(
	bindingSourceSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const bindingSourceTitle = toTitleCase(bindingSourceSlug);

	return `import { registerBlockBindingsSource } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

registerBlockBindingsSource( {
\tname: ${quoteTsString(`${namespace}/${bindingSourceSlug}`)},
\tlabel: __( ${quoteTsString(bindingSourceTitle)}, ${quoteTsString(textDomain)} ),
\tgetFieldsList() {
\t\treturn [
\t\t\t{
\t\t\t\tlabel: __( ${quoteTsString(bindingSourceTitle)}, ${quoteTsString(textDomain)} ),
\t\t\t\ttype: 'string',
\t\t\t\targs: {
\t\t\t\t\tfield: ${quoteTsString(bindingSourceSlug)},
\t\t\t\t},
\t\t\t},
\t\t];
\t},
\tgetValues( { bindings } ) {
\t\tconst values: Record<string, string> = {};
\t\tfor ( const attributeName of Object.keys( bindings ) ) {
\t\t\tvalues[ attributeName ] = ${quoteTsString(
				`TODO: replace ${bindingSourceSlug} with real editor-side values.`,
			)};
\t\t}
\t\treturn values;
\t},
} );
`;
}

function buildBindingSourceIndexSource(bindingSourceSlugs: string[]): string {
	const importLines = bindingSourceSlugs
		.map((bindingSourceSlug) => `import './${bindingSourceSlug}/editor';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add binding-source entries\n`;
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

	const existingVariationSlugs = fs.existsSync(variationsDir)
		? fs
				.readdirSync(variationsDir)
				.filter((entry) => entry.endsWith(".ts") && entry !== "index.ts")
				.map((entry) => entry.replace(/\.ts$/u, ""))
		: [];
	const nextVariationSlugs = Array.from(new Set([...existingVariationSlugs, variationSlug])).sort();
	await fsp.writeFile(
		variationsIndexPath,
		buildVariationIndexSource(nextVariationSlugs),
		"utf8",
	);
}

async function ensurePatternBootstrapAnchors(workspace: WorkspaceProject): Promise<void> {
	const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const patternCategoryFunctionName = `${workspace.workspace.phpPrefix}_register_pattern_category`;
		const patternRegistrationFunctionName = `${workspace.workspace.phpPrefix}_register_patterns`;
		const patternCategoryHook = `add_action( 'init', '${patternCategoryFunctionName}' );`;
		const patternRegistrationHook = `add_action( 'init', '${patternRegistrationFunctionName}', 20 );`;
		const patternFunctions = `

function ${patternCategoryFunctionName}() {
\tif ( function_exists( 'register_block_pattern_category' ) ) {
\t\tregister_block_pattern_category(
\t\t\t'${workspace.workspace.namespace}',
\t\t\tarray(
\t\t\t\t'label' => __( ${JSON.stringify(`${toTitleCase(workspaceBaseName)} Patterns`)}, '${workspace.workspace.textDomain}' ),
\t\t\t)
\t\t);
\t}
}

function ${patternRegistrationFunctionName}() {
\tforeach ( glob( __DIR__ . '/src/patterns/*.php' ) ?: array() as $pattern_module ) {
\t\trequire $pattern_module;
\t}
}
`;

		if (!nextSource.includes(PATTERN_BOOTSTRAP_CATEGORY)) {
			const insertionAnchors = [
				/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
				/\?>\s*$/u,
			];
			let inserted = false;

			for (const anchor of insertionAnchors) {
				const candidate = nextSource.replace(anchor, (match) => `${patternFunctions}\n${match}`);
				if (candidate !== nextSource) {
					nextSource = candidate;
					inserted = true;
					break;
				}
			}

			if (!inserted) {
				nextSource = `${nextSource.trimEnd()}\n${patternFunctions}\n`;
			}
		}

		if (
			!nextSource.includes(patternCategoryFunctionName) ||
			!nextSource.includes(patternRegistrationFunctionName)
		) {
			throw new Error(
				`Unable to inject pattern bootstrap functions into ${path.basename(bootstrapPath)}.`,
			);
		}

		if (!nextSource.includes(patternCategoryHook)) {
			nextSource = `${nextSource.trimEnd()}\n${patternCategoryHook}\n`;
		}
		if (!nextSource.includes(patternRegistrationHook)) {
			nextSource = `${nextSource.trimEnd()}\n${patternRegistrationHook}\n`;
		}

		return nextSource;
	});
}

async function ensureBindingSourceBootstrapAnchors(workspace: WorkspaceProject): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
		const bindingRegistrationFunctionName = `${workspace.workspace.phpPrefix}_register_binding_sources`;
		const bindingEditorEnqueueFunctionName = `${workspace.workspace.phpPrefix}_enqueue_binding_sources_editor`;
		const bindingRegistrationHook = `add_action( 'init', '${bindingRegistrationFunctionName}', 20 );`;
		const bindingEditorEnqueueHook = `add_action( 'enqueue_block_editor_assets', '${bindingEditorEnqueueFunctionName}' );`;
		const bindingRegistrationFunction = `

function ${bindingRegistrationFunctionName}() {
\tforeach ( glob( __DIR__ . '${BINDING_SOURCE_SERVER_GLOB}' ) ?: array() as $binding_source_module ) {
\t\trequire_once $binding_source_module;
\t}
}
`;

		const bindingEditorEnqueueFunction = `

function ${bindingEditorEnqueueFunctionName}() {
\t$script_path = __DIR__ . '/${BINDING_SOURCE_EDITOR_SCRIPT}';
\t$asset_path  = __DIR__ . '/${BINDING_SOURCE_EDITOR_ASSET}';

\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\treturn;
\t}

\t$asset = require $asset_path;
\tif ( ! is_array( $asset ) ) {
\t\t$asset = array();
\t}

\twp_enqueue_script(
\t\t'${workspaceBaseName}-binding-sources',
\t\tplugins_url( '${BINDING_SOURCE_EDITOR_SCRIPT}', __FILE__ ),
\t\tisset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array(),
\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $script_path ),
\t\ttrue
\t);
}
`;

		const insertionAnchors = [
			/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
			/\?>\s*$/u,
		];
		const hasPhpFunctionDefinition = (functionName: string): boolean =>
			new RegExp(`function\\s+${functionName}\\s*\\(`, "u").test(nextSource);
		const insertPhpSnippet = (snippet: string): void => {
			for (const anchor of insertionAnchors) {
				const candidate = nextSource.replace(anchor, (match) => `${snippet}\n${match}`);
				if (candidate !== nextSource) {
					nextSource = candidate;
					return;
				}
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};
		const appendPhpSnippet = (snippet: string): void => {
			const closingTagPattern = /\?>\s*$/u;
			if (closingTagPattern.test(nextSource)) {
				nextSource = nextSource.replace(closingTagPattern, `${snippet}\n?>`);
				return;
			}
			nextSource = `${nextSource.trimEnd()}\n${snippet}\n`;
		};

		if (!hasPhpFunctionDefinition(bindingRegistrationFunctionName)) {
			insertPhpSnippet(bindingRegistrationFunction);
		}
		if (!hasPhpFunctionDefinition(bindingEditorEnqueueFunctionName)) {
			insertPhpSnippet(bindingEditorEnqueueFunction);
		}

		if (!nextSource.includes(bindingRegistrationHook)) {
			appendPhpSnippet(bindingRegistrationHook);
		}
		if (!nextSource.includes(bindingEditorEnqueueHook)) {
			appendPhpSnippet(bindingEditorEnqueueHook);
		}

		return nextSource;
	});
}

function resolveBindingSourceRegistryPath(projectDir: string): string {
	const bindingsDir = path.join(projectDir, "src", "bindings");
	return [path.join(bindingsDir, "index.ts"), path.join(bindingsDir, "index.js")].find(
		(candidatePath) => fs.existsSync(candidatePath),
	) ?? path.join(bindingsDir, "index.ts");
}

async function writeBindingSourceRegistry(
	projectDir: string,
	bindingSourceSlug: string,
): Promise<void> {
	const bindingsDir = path.join(projectDir, "src", "bindings");
	const bindingsIndexPath = resolveBindingSourceRegistryPath(projectDir);
	await fsp.mkdir(bindingsDir, { recursive: true });

	const existingBindingSourceSlugs = fs.existsSync(bindingsDir)
		? fs
				.readdirSync(bindingsDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name)
		: [];
	const nextBindingSourceSlugs = Array.from(
		new Set([...existingBindingSourceSlugs, bindingSourceSlug]),
	).sort();
	await fsp.writeFile(
		bindingsIndexPath,
		buildBindingSourceIndexSource(nextBindingSourceSlugs),
		"utf8",
	);
}

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
 * Add one PHP block pattern shell to an official workspace project.
 *
 * @param options Command options for the pattern scaffold workflow.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.patternName Human-entered pattern name that will be normalized
 * and validated before files are written.
 * @returns A promise that resolves with the normalized `patternSlug` and
 * owning `projectDir` after the pattern file and inventory entry have been
 * written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the pattern slug is invalid, or when a conflicting file or inventory entry
 * already exists.
 */
export async function runAddPatternCommand({
	cwd = process.cwd(),
	patternName,
}: RunAddPatternCommandOptions): Promise<{
	patternSlug: string;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const patternSlug = assertValidGeneratedSlug(
		"Pattern name",
		normalizeBlockSlug(patternName),
		"wp-typia add pattern <name>",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertPatternDoesNotExist(workspace.projectDir, patternSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const patternFilePath = path.join(workspace.projectDir, "src", "patterns", `${patternSlug}.php`);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([blockConfigPath, bootstrapPath]),
		snapshotDirs: [],
		targetPaths: [patternFilePath],
	};

	try {
		await fsp.mkdir(path.dirname(patternFilePath), { recursive: true });
		await ensurePatternBootstrapAnchors(workspace);
		await fsp.writeFile(
			patternFilePath,
			buildPatternSource(
				patternSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			patternEntries: [buildPatternConfigEntry(patternSlug)],
		});

		return {
			patternSlug,
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}

/**
 * Add one block binding source scaffold to an official workspace project.
 *
 * @param options Command options for the binding-source scaffold workflow.
 * @param options.bindingSourceName Human-entered binding source name that will
 * be normalized and validated before files are written.
 * @param options.cwd Working directory used to resolve the nearest official
 * workspace. Defaults to `process.cwd()`.
 * @returns A promise that resolves with the normalized `bindingSourceSlug` and
 * owning `projectDir` after the server/editor files and inventory entry have
 * been written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the slug is invalid, or when a conflicting file or inventory entry exists.
 */
export async function runAddBindingSourceCommand({
	bindingSourceName,
	cwd = process.cwd(),
}: RunAddBindingSourceCommandOptions): Promise<{
	bindingSourceSlug: string;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const bindingSourceSlug = assertValidGeneratedSlug(
		"Binding source name",
		normalizeBlockSlug(bindingSourceName),
		"wp-typia add binding-source <name>",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertBindingSourceDoesNotExist(workspace.projectDir, bindingSourceSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const bindingsIndexPath = resolveBindingSourceRegistryPath(workspace.projectDir);
	const bindingSourceDir = path.join(workspace.projectDir, "src", "bindings", bindingSourceSlug);
	const serverFilePath = path.join(bindingSourceDir, "server.php");
	const editorFilePath = path.join(bindingSourceDir, "editor.ts");
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([blockConfigPath, bootstrapPath, bindingsIndexPath]),
		snapshotDirs: [],
		targetPaths: [bindingSourceDir],
	};

	try {
		await fsp.mkdir(bindingSourceDir, { recursive: true });
		await ensureBindingSourceBootstrapAnchors(workspace);
		await fsp.writeFile(
			serverFilePath,
			buildBindingSourceServerSource(
				bindingSourceSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await fsp.writeFile(
			editorFilePath,
			buildBindingSourceEditorSource(
				bindingSourceSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await writeBindingSourceRegistry(workspace.projectDir, bindingSourceSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			bindingSourceEntries: [buildBindingSourceConfigEntry(bindingSourceSlug)],
		});

		return {
			bindingSourceSlug,
			projectDir: workspace.projectDir,
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
