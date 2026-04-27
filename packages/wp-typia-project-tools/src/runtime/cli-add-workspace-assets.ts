import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import { readWorkspaceInventory, appendWorkspaceInventoryEntries } from "./workspace-inventory.js";
import { toPascalCase, toTitleCase } from "./string-case.js";
import {
	findPhpFunctionRange,
	hasPhpFunctionDefinition,
	quotePhpString,
	replacePhpFunctionDefinition,
} from "./php-utils.js";
import {
	assertBindingSourceDoesNotExist,
	assertEditorPluginDoesNotExist,
	assertPatternDoesNotExist,
	assertValidEditorPluginSlot,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddBindingSourceCommandOptions,
	type RunAddEditorPluginCommandOptions,
	type RunAddPatternCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";

const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";
const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";
const EDITOR_PLUGIN_EDITOR_SCRIPT = "build/editor-plugins/index.js";
const EDITOR_PLUGIN_EDITOR_ASSET = "build/editor-plugins/index.asset.php";
const EDITOR_PLUGIN_EDITOR_STYLE = "build/editor-plugins/style-index.css";
const EDITOR_PLUGIN_EDITOR_STYLE_RTL = "build/editor-plugins/style-index-rtl.css";

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

function buildEditorPluginConfigEntry(
	editorPluginSlug: string,
	slot: string,
): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/editor-plugins/${editorPluginSlug}/index.tsx`)},`,
		`\t\tslug: ${quoteTsString(editorPluginSlug)},`,
		`\t\tslot: ${quoteTsString(slot)},`,
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

function buildEditorPluginTypesSource(editorPluginSlug: string): string {
	const typeName = `${toPascalCase(editorPluginSlug)}EditorPluginModel`;

	return `export interface ${typeName} {
\tprimaryActionLabel: string;
\tsummary: string;
}
`;
}

function buildEditorPluginDataSource(
	editorPluginSlug: string,
	slot: string,
): string {
	const typeName = `${toPascalCase(editorPluginSlug)}EditorPluginModel`;
	const pluginTitle = toTitleCase(editorPluginSlug);
	const modelFactoryName = `get${toPascalCase(editorPluginSlug)}EditorPluginModel`;
	const enabledFactoryName = `is${toPascalCase(editorPluginSlug)}Enabled`;

	return `import type { ${typeName} } from './types';

export const EDITOR_PLUGIN_SLOT = ${quoteTsString(slot)} as const;
export const REQUIRED_CAPABILITY = 'edit_posts' as const;

const DEFAULT_EDITOR_PLUGIN_MODEL: ${typeName} = {
\tprimaryActionLabel: ${quoteTsString(`Review ${pluginTitle}`)},
\tsummary: ${quoteTsString(`Replace this summary with your ${pluginTitle} workflow state.`)},
};

export function ${modelFactoryName}(): ${typeName} {
\treturn DEFAULT_EDITOR_PLUGIN_MODEL;
}

export function ${enabledFactoryName}(): boolean {
\treturn true;
}
`;
}

function buildEditorPluginSurfaceSource(
	editorPluginSlug: string,
	slot: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(editorPluginSlug);
	const modelFactoryName = `get${pascalName}EditorPluginModel`;
	const enabledFactoryName = `is${pascalName}Enabled`;
	const componentName = `${pascalName}Surface`;

	if (slot === "document-setting-panel") {
		return `import { Button } from '@wordpress/components';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import { ${modelFactoryName}, ${enabledFactoryName} } from './data';
import './style.scss';

export interface ${componentName}Props {
\tsurfaceName: string;
\ttitle: string;
}

export function ${componentName}( {
\tsurfaceName,
\ttitle,
}: ${componentName}Props ) {
\tif ( ! ${enabledFactoryName}() ) {
\t\treturn null;
\t}

\tconst editorPluginModel = ${modelFactoryName}();

\treturn (
\t\t<PluginDocumentSettingPanel
\t\t\tclassName="wp-typia-editor-plugin-shell"
\t\t\tname={ surfaceName }
\t\t\ttitle={ title }
\t\t>
\t\t\t<p>{ editorPluginModel.summary }</p>
\t\t\t<Button variant="secondary">
\t\t\t\t{ editorPluginModel.primaryActionLabel }
\t\t\t</Button>
\t\t\t<p className="wp-typia-editor-plugin-shell__hint">
\t\t\t\t{ __( 'Use data.ts to add post type, capability, or editor context guards before showing this panel.', ${quoteTsString(textDomain)} ) }
\t\t\t</p>
\t\t</PluginDocumentSettingPanel>
\t);
}
`;
	}

	return `import { Button, PanelBody } from '@wordpress/components';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import { ${modelFactoryName}, ${enabledFactoryName} } from './data';
import './style.scss';

export interface ${componentName}Props {
\tsurfaceName: string;
\ttitle: string;
}

export function ${componentName}( {
\tsurfaceName,
\ttitle,
}: ${componentName}Props ) {
\tif ( ! ${enabledFactoryName}() ) {
\t\treturn null;
\t}

\tconst editorPluginModel = ${modelFactoryName}();

\treturn (
\t\t<>
\t\t\t<PluginSidebarMoreMenuItem target={ surfaceName }>
\t\t\t\t{ title }
\t\t\t</PluginSidebarMoreMenuItem>
\t\t\t<PluginSidebar name={ surfaceName } title={ title }>
\t\t\t\t<div className="wp-typia-editor-plugin-shell">
\t\t\t\t\t<PanelBody
\t\t\t\t\t\tinitialOpen
\t\t\t\t\t\ttitle={ __( 'Document workflow', ${quoteTsString(textDomain)} ) }
\t\t\t\t\t>
\t\t\t\t\t\t<p>{ editorPluginModel.summary }</p>
\t\t\t\t\t\t<Button variant="secondary">
\t\t\t\t\t\t\t{ editorPluginModel.primaryActionLabel }
\t\t\t\t\t\t</Button>
\t\t\t\t\t</PanelBody>
\t\t\t\t</div>
\t\t\t</PluginSidebar>
\t\t</>
\t);
}
`;
}

function buildEditorPluginEntrySource(
	editorPluginSlug: string,
	namespace: string,
	textDomain: string,
): string {
	const pascalName = toPascalCase(editorPluginSlug);
	const componentName = `${pascalName}Surface`;
	const pluginName = `${namespace}-${editorPluginSlug}`;
	const surfaceName = `${pluginName}-surface`;
	const pluginTitle = toTitleCase(editorPluginSlug);

	return `import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

import { REQUIRED_CAPABILITY } from './data';
import { ${componentName} } from './Surface';

const EDITOR_PLUGIN_NAME = ${quoteTsString(pluginName)};
const EDITOR_PLUGIN_SURFACE_NAME = ${quoteTsString(surfaceName)};
const EDITOR_PLUGIN_TITLE = __( ${quoteTsString(pluginTitle)}, ${quoteTsString(textDomain)} );

registerPlugin( EDITOR_PLUGIN_NAME, {
\ticon: 'admin-generic',
\trender: () => (
\t\t<${componentName}
\t\t\tsurfaceName={ EDITOR_PLUGIN_SURFACE_NAME }
\t\t\ttitle={ EDITOR_PLUGIN_TITLE }
\t\t/>
\t),
} );

export { REQUIRED_CAPABILITY };
`;
}

function buildEditorPluginStyleSource(): string {
	return `.wp-typia-editor-plugin-shell {
\tpadding: 16px;
}

.wp-typia-editor-plugin-shell p {
\tmargin: 0 0 12px;
}

.wp-typia-editor-plugin-shell__hint {
\tcolor: #757575;
\tfont-size: 12px;
}
`;
}

function buildBindingSourceIndexSource(bindingSourceSlugs: string[]): string {
	const importLines = bindingSourceSlugs
		.map((bindingSourceSlug) => `import './${bindingSourceSlug}/editor';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add binding-source entries\n`;
}

function buildEditorPluginRegistrySource(editorPluginSlugs: string[]): string {
	const importLines = editorPluginSlugs
		.map((editorPluginSlug) => `import './${editorPluginSlug}';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add editor-plugin entries\n`;
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

		if (!hasPhpFunctionDefinition(nextSource, bindingRegistrationFunctionName)) {
			insertPhpSnippet(bindingRegistrationFunction);
		}
		if (!hasPhpFunctionDefinition(nextSource, bindingEditorEnqueueFunctionName)) {
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

async function ensureEditorPluginBootstrapAnchors(workspace: WorkspaceProject): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
		const enqueueFunctionName = `${workspace.workspace.phpPrefix}_enqueue_editor_plugins_editor`;
		const enqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
		const enqueueFunction = `

function ${enqueueFunctionName}() {
\t$script_path = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_SCRIPT}';
\t$asset_path  = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_ASSET}';
\t$style_path  = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_STYLE}';
\t$style_rtl_path = __DIR__ . '/${EDITOR_PLUGIN_EDITOR_STYLE_RTL}';

\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\treturn;
\t}

\t$asset = require $asset_path;
\tif ( ! is_array( $asset ) ) {
\t\t$asset = array();
\t}

\twp_enqueue_script(
\t\t'${workspaceBaseName}-editor-plugins',
\t\tplugins_url( '${EDITOR_PLUGIN_EDITOR_SCRIPT}', __FILE__ ),
\t\tisset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ? $asset['dependencies'] : array(),
\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $script_path ),
\t\ttrue
\t);

\tif ( file_exists( $style_path ) ) {
\t\twp_enqueue_style(
\t\t\t'${workspaceBaseName}-editor-plugins',
\t\t\tplugins_url( '${EDITOR_PLUGIN_EDITOR_STYLE}', __FILE__ ),
\t\t\tarray(),
\t\t\tisset( $asset['version'] ) ? $asset['version'] : filemtime( $style_path )
\t\t);
\t\tif ( file_exists( $style_rtl_path ) ) {
\t\t\twp_style_add_data( '${workspaceBaseName}-editor-plugins', 'rtl', 'replace' );
\t\t}
\t}
}
`;

		const insertionAnchors = [
			/add_action\(\s*["']init["']\s*,\s*["'][^"']+_load_textdomain["']\s*\);\s*\n/u,
			/\?>\s*$/u,
		];
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

		if (!hasPhpFunctionDefinition(nextSource, enqueueFunctionName)) {
			insertPhpSnippet(enqueueFunction);
		} else {
			const requiredReferences = [
				EDITOR_PLUGIN_EDITOR_SCRIPT,
				EDITOR_PLUGIN_EDITOR_ASSET,
				EDITOR_PLUGIN_EDITOR_STYLE,
				EDITOR_PLUGIN_EDITOR_STYLE_RTL,
				"wp_style_add_data",
			];
			const functionRange = findPhpFunctionRange(nextSource, enqueueFunctionName);
			const functionSource = functionRange
				? nextSource.slice(functionRange.start, functionRange.end)
				: "";
			const missingReferences = requiredReferences.filter(
				(reference) => !functionSource.includes(reference),
			);
			if (missingReferences.length > 0) {
				const replacedSource = replacePhpFunctionDefinition(
					nextSource,
					enqueueFunctionName,
					enqueueFunction,
				);
				if (!replacedSource) {
					throw new Error(
						`Unable to repair ${path.basename(bootstrapPath)} for ${enqueueFunctionName}.`,
					);
				}
				nextSource = replacedSource;
			}
		}

		if (!nextSource.includes(enqueueHook)) {
			appendPhpSnippet(enqueueHook);
		}

		return nextSource;
	});
}

async function ensureEditorPluginBuildScriptAnchors(workspace: WorkspaceProject): Promise<void> {
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");

	await patchFile(buildScriptPath, (source) => {
		if (/['"]src\/editor-plugins\/index\.(?:ts|js)['"]/u.test(source)) {
			return source;
		}

		const legacySharedEntriesPattern =
			/\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]/u;
		const nextSource = source.replace(
			legacySharedEntriesPattern,
			`[
\t\t'src/bindings/index.ts',
\t\t'src/bindings/index.js',
\t\t'src/editor-plugins/index.ts',
\t\t'src/editor-plugins/index.js',
\t]`,
		);

		if (nextSource === source) {
			throw new Error(
				`Unable to update ${path.relative(workspace.projectDir, buildScriptPath)} for editor plugin shared entries.`,
			);
		}

		return nextSource;
	});
}

async function ensureEditorPluginWebpackAnchors(workspace: WorkspaceProject): Promise<void> {
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");

	await patchFile(webpackConfigPath, (source) => {
		if (/['"]editor-plugins\/index['"]/u.test(source)) {
			return source;
		}

		const legacySharedEntriesBlockPattern =
			/for\s*\(\s*const\s+relativePath\s+of\s+\[\s*['"]src\/bindings\/index\.ts['"]\s*,\s*['"]src\/bindings\/index\.js['"]\s*(?:,\s*)?\]\s*\)\s*\{[\s\S]*?entries\.push\(\s*\[\s*['"]bindings\/index['"]\s*,\s*entryPath\s*\]\s*\);\s*break;\s*\}/u;
		const nextSharedEntriesBlock = `\tfor ( const [ entryName, candidates ] of [\n\t\t[\n\t\t\t'bindings/index',\n\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],\n\t\t],\n\t\t[\n\t\t\t'editor-plugins/index',\n\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],\n\t\t],\n\t] ) {\n\t\tfor ( const relativePath of candidates ) {\n\t\t\tconst entryPath = path.resolve( process.cwd(), relativePath );\n\t\t\tif ( ! fs.existsSync( entryPath ) ) {\n\t\t\t\tcontinue;\n\t\t\t}\n\n\t\t\tentries.push( [ entryName, entryPath ] );\n\t\t\tbreak;\n\t\t}\n\t}`;
		const nextSource = source.replace(
			legacySharedEntriesBlockPattern,
			nextSharedEntriesBlock,
		);

		if (nextSource === source) {
			throw new Error(
				`Unable to update ${path.relative(workspace.projectDir, webpackConfigPath)} for editor plugin shared entries.`,
			);
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

function resolveEditorPluginRegistryPath(projectDir: string): string {
	const editorPluginsDir = path.join(projectDir, "src", "editor-plugins");
	return [
		path.join(editorPluginsDir, "index.ts"),
		path.join(editorPluginsDir, "index.js"),
	].find((candidatePath) => fs.existsSync(candidatePath)) ?? path.join(editorPluginsDir, "index.ts");
}

function readEditorPluginRegistrySlugs(registryPath: string): string[] {
	if (!fs.existsSync(registryPath)) {
		return [];
	}

	const source = fs.readFileSync(registryPath, "utf8");
	return Array.from(
		source.matchAll(
			/^\s*import\s+['"]\.\/([^/'"]+)(?:\/index(?:\.[cm]?[jt]sx?)?)?['"];?\s*$/gmu,
		),
	).map((match) => match[1]);
}

async function writeEditorPluginRegistry(
	projectDir: string,
	editorPluginSlug: string,
): Promise<void> {
	const editorPluginsDir = path.join(projectDir, "src", "editor-plugins");
	const registryPath = resolveEditorPluginRegistryPath(projectDir);
	await fsp.mkdir(editorPluginsDir, { recursive: true });

	const existingEditorPluginSlugs = readWorkspaceInventory(projectDir).editorPlugins.map((entry) =>
		entry.slug,
	);
	const existingRegistrySlugs = readEditorPluginRegistrySlugs(registryPath);
	const nextEditorPluginSlugs = Array.from(
		new Set([...existingEditorPluginSlugs, ...existingRegistrySlugs, editorPluginSlug]),
	).sort();
	await fsp.writeFile(
		registryPath,
		buildEditorPluginRegistrySource(nextEditorPluginSlugs),
		"utf8",
	);
}

/**
 * Add one document-level editor plugin scaffold to an official workspace project.
 *
 * @param options Command options for the editor-plugin scaffold workflow.
 * @param options.cwd Working directory used to resolve the nearest official workspace.
 * Defaults to `process.cwd()`.
 * @param options.editorPluginName Human-entered editor-plugin name that will be
 * normalized and validated before files are written.
 * @param options.slot Optional editor plugin shell slot. Defaults to `sidebar`.
 * @returns A promise that resolves with the normalized `editorPluginSlug`, chosen
 * `slot`, and owning `projectDir` after the scaffold files and inventory entry
 * are written successfully.
 * @throws {Error} When the command is run outside an official workspace, when the
 * slug or slot is invalid, or when a conflicting file or inventory entry exists.
 */
export async function runAddEditorPluginCommand({
	cwd = process.cwd(),
	editorPluginName,
	slot,
}: RunAddEditorPluginCommandOptions): Promise<{
	editorPluginSlug: string;
	projectDir: string;
	slot: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const editorPluginSlug = assertValidGeneratedSlug(
		"Editor plugin name",
		normalizeBlockSlug(editorPluginName),
		"wp-typia add editor-plugin <name> [--slot <sidebar|document-setting-panel>]",
	);
	const resolvedSlot = assertValidEditorPluginSlot(slot);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertEditorPluginDoesNotExist(workspace.projectDir, editorPluginSlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");
	const editorPluginsIndexPath = resolveEditorPluginRegistryPath(workspace.projectDir);
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");
	const editorPluginDir = path.join(
		workspace.projectDir,
		"src",
		"editor-plugins",
		editorPluginSlug,
	);
	const entryFilePath = path.join(editorPluginDir, "index.tsx");
	const surfaceFilePath = path.join(editorPluginDir, "Surface.tsx");
	const dataFilePath = path.join(editorPluginDir, "data.ts");
	const typesFilePath = path.join(editorPluginDir, "types.ts");
	const styleFilePath = path.join(editorPluginDir, "style.scss");
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			buildScriptPath,
			editorPluginsIndexPath,
			webpackConfigPath,
		]),
		snapshotDirs: [],
		targetPaths: [editorPluginDir],
	};

	try {
		await fsp.mkdir(editorPluginDir, { recursive: true });
		await ensureEditorPluginBootstrapAnchors(workspace);
		await ensureEditorPluginBuildScriptAnchors(workspace);
		await ensureEditorPluginWebpackAnchors(workspace);
		await fsp.writeFile(
			entryFilePath,
			buildEditorPluginEntrySource(
				editorPluginSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await fsp.writeFile(
			surfaceFilePath,
			buildEditorPluginSurfaceSource(
				editorPluginSlug,
				resolvedSlot,
				workspace.workspace.textDomain,
			),
			"utf8",
		);
		await fsp.writeFile(
			dataFilePath,
			buildEditorPluginDataSource(editorPluginSlug, resolvedSlot),
			"utf8",
		);
		await fsp.writeFile(
			typesFilePath,
			buildEditorPluginTypesSource(editorPluginSlug),
			"utf8",
		);
		await fsp.writeFile(styleFilePath, buildEditorPluginStyleSource(), "utf8");
		await writeEditorPluginRegistry(workspace.projectDir, editorPluginSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			editorPluginEntries: [
				buildEditorPluginConfigEntry(editorPluginSlug, resolvedSlot),
			],
		});

		return {
			editorPluginSlug,
			projectDir: workspace.projectDir,
			slot: resolvedSlot,
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
