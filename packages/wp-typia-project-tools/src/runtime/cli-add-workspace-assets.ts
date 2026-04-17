import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import { readWorkspaceInventory, appendWorkspaceInventoryEntries } from "./workspace-inventory.js";
import { toTitleCase } from "./string-case.js";
import {
	assertBindingSourceDoesNotExist,
	assertPatternDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddBindingSourceCommandOptions,
	type RunAddPatternCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";

const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";
const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
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
	phpPrefix: string,
	namespace: string,
	textDomain: string,
): string {
	const bindingSourceTitle = toTitleCase(bindingSourceSlug);
	const bindingSourcePhpId = bindingSourceSlug.replace(/-/g, "_");
	const bindingSourceValueFunctionName = `${phpPrefix}_${bindingSourcePhpId}_binding_source_values`;
	const bindingSourceResolveFunctionName = `${phpPrefix}_${bindingSourcePhpId}_resolve_binding_source_value`;
	const starterValue = `${bindingSourceTitle} starter value`;

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( 'register_block_bindings_source' ) ) {
\treturn;
}

if ( ! function_exists( '${bindingSourceValueFunctionName}' ) ) {
\tfunction ${bindingSourceValueFunctionName}() : array {
\t\treturn array(
\t\t\t${quotePhpString(bindingSourceSlug)} => ${quotePhpString(starterValue)},
\t\t);
\t}
}

if ( ! function_exists( '${bindingSourceResolveFunctionName}' ) ) {
\tfunction ${bindingSourceResolveFunctionName}( array $source_args ) : string {
\t\t$field = isset( $source_args['field'] ) && is_string( $source_args['field'] )
\t\t\t? $source_args['field']
\t\t\t: '${bindingSourceSlug}';
\t\t$binding_source_values = ${bindingSourceValueFunctionName}();
\t\t$value = $binding_source_values[ $field ] ?? '';

\t\treturn is_string( $value ) ? $value : '';
\t}
}

register_block_bindings_source(
\t${quotePhpString(`${namespace}/${bindingSourceSlug}`)},
\tarray(
\t\t'label' => __( ${quotePhpString(bindingSourceTitle)}, ${quotePhpString(textDomain)} ),
\t\t'get_value_callback' => ${quotePhpString(bindingSourceResolveFunctionName)},
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
	const starterValue = `${bindingSourceTitle} starter value`;

	return `import { registerBlockBindingsSource } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

interface BindingSourceRegistration {
\targs?: {
\t\tfield?: string;
\t};
}

const BINDING_SOURCE_VALUES: Record<string, string> = {
\t${quoteTsString(bindingSourceSlug)}: ${quoteTsString(starterValue)},
};

function resolveBindingSourceValue( field: string ): string {
\treturn BINDING_SOURCE_VALUES[ field ] ?? '';
}

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
\t\tfor ( const [ attributeName, binding ] of Object.entries(
\t\t\tbindings as Record<string, BindingSourceRegistration>
\t\t) ) {
\t\t\tconst field =
\t\t\t\ttypeof binding?.args?.field === 'string'
\t\t\t\t\t? binding.args.field
\t\t\t\t\t: ${quoteTsString(bindingSourceSlug)};
\t\t\tvalues[ attributeName ] = resolveBindingSourceValue( field );
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
			new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(`, "u").test(nextSource);
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

	const existingBindingSourceSlugs = fs
		.readdirSync(bindingsDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);
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
				workspace.workspace.phpPrefix,
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
