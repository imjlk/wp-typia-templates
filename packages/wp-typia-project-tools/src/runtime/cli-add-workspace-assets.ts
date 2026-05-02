import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import {
	syncBlockMetadata,
} from "@wp-typia/block-runtime/metadata-core";
import ts from "typescript";

import {
	resolveWorkspaceProject,
	type WorkspaceProject,
} from "./workspace-project.js";
import {
	readWorkspaceInventory,
	appendWorkspaceInventoryEntries,
	type WorkspaceInventory,
} from "./workspace-inventory.js";
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
	resolveWorkspaceBlock,
	rollbackWorkspaceMutation,
	type RunAddBindingSourceCommandOptions,
	type RunAddEditorPluginCommandOptions,
	type RunAddPatternCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	appendPhpSnippetBeforeClosingTag,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";
import { normalizeOptionalCliString } from "./cli-validation.js";

const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";
const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";
const EDITOR_PLUGIN_EDITOR_SCRIPT = "build/editor-plugins/index.js";
const EDITOR_PLUGIN_EDITOR_ASSET = "build/editor-plugins/index.asset.php";
const EDITOR_PLUGIN_EDITOR_STYLE = "build/editor-plugins/style-index.css";
const EDITOR_PLUGIN_EDITOR_STYLE_RTL = "build/editor-plugins/style-index-rtl.css";
const BINDING_ATTRIBUTE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/u;

type BindingTarget = {
	attributeName: string;
	blockSlug: string;
};

function buildPatternConfigEntry(patternSlug: string): string {
	return [
		"\t{",
		`\t\tfile: ${quoteTsString(`src/patterns/${patternSlug}.php`)},`,
		`\t\tslug: ${quoteTsString(patternSlug)},`,
		"\t},",
	].join("\n");
}

function buildBindingSourceConfigEntry(
	bindingSourceSlug: string,
	target?: BindingTarget,
): string {
	return [
		"\t{",
		...(target ? [`\t\tattribute: ${quoteTsString(target.attributeName)},`] : []),
		...(target ? [`\t\tblock: ${quoteTsString(target.blockSlug)},`] : []),
		`\t\teditorFile: ${quoteTsString(`src/bindings/${bindingSourceSlug}/editor.ts`)},`,
		`\t\tserverFile: ${quoteTsString(`src/bindings/${bindingSourceSlug}/server.php`)},`,
		`\t\tslug: ${quoteTsString(bindingSourceSlug)},`,
		"\t},",
	].join("\n");
}

function assertValidBindingAttributeName(attributeName: string): string {
	const trimmed = attributeName.trim();
	if (!trimmed) {
		throw new Error(
			"`wp-typia add binding-source` requires --attribute <attribute> to include a value when --block is provided.",
		);
	}
	if (!BINDING_ATTRIBUTE_NAME_PATTERN.test(trimmed)) {
		throw new Error(
			`Binding attribute "${attributeName}" must start with a letter and use only letters, numbers, underscores, or hyphens.`,
		);
	}

	return trimmed;
}

function resolveBindingTargetBlockSlug(
	blockName: string,
	namespace: string,
): string {
	const trimmed = blockName.trim();
	if (!trimmed) {
		throw new Error(
			"`wp-typia add binding-source` requires --block <block-slug|namespace/block-slug> to include a value when --attribute is provided.",
		);
	}

	const blockNameSegments = trimmed.split("/");
	if (blockNameSegments.length > 2) {
		throw new Error(
			`Binding target block "${trimmed}" must use <block-slug> or <namespace/block-slug> format.`,
		);
	}
	if (blockNameSegments.some((segment) => segment.trim() === "")) {
		throw new Error(
			`Binding target block "${trimmed}" must use <block-slug> or <namespace/block-slug> format without empty path segments.`,
		);
	}

	const [maybeNamespace, maybeSlug] =
		blockNameSegments.length === 2
			? blockNameSegments
			: [undefined, blockNameSegments[0]];
	if (maybeNamespace && maybeNamespace !== namespace) {
		throw new Error(
			`Binding target block "${trimmed}" uses namespace "${maybeNamespace}". Expected "${namespace}".`,
		);
	}

	return normalizeBlockSlug(maybeSlug ?? "");
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
	target?: BindingTarget,
): string {
	const bindingSourceTitle = toTitleCase(bindingSourceSlug);
	const bindingSourcePhpId = bindingSourceSlug.replace(/-/g, "_");
	const bindingSourceValueFunctionName = `${phpPrefix}_${bindingSourcePhpId}_binding_source_values`;
	const bindingSourceResolveFunctionName = `${phpPrefix}_${bindingSourcePhpId}_resolve_binding_source_value`;
	const bindingSourceSupportedAttributesFunctionName = `${phpPrefix}_${bindingSourcePhpId}_supported_binding_attributes`;
	const starterValue = `${bindingSourceTitle} starter value`;
	const supportedAttributesSource = target
		? `
if ( ! function_exists( '${bindingSourceSupportedAttributesFunctionName}' ) ) {
\tfunction ${bindingSourceSupportedAttributesFunctionName}( array $supported_attributes ) : array {
\t\tif ( ! in_array( ${quotePhpString(target.attributeName)}, $supported_attributes, true ) ) {
\t\t\t$supported_attributes[] = ${quotePhpString(target.attributeName)};
\t\t}

\t\treturn $supported_attributes;
\t}
}
`
		: "";
	const supportedAttributesHook = target
		? `
if ( function_exists( '${bindingSourceSupportedAttributesFunctionName}' ) ) {
\tadd_filter(
\t\t${quotePhpString(`block_bindings_supported_attributes_${namespace}/${target.blockSlug}`)},
\t\t${quotePhpString(bindingSourceSupportedAttributesFunctionName)}
\t);
}
`
		: "";

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
${supportedAttributesSource}

register_block_bindings_source(
\t${quotePhpString(`${namespace}/${bindingSourceSlug}`)},
\tarray(
\t\t'label' => __( ${quotePhpString(bindingSourceTitle)}, ${quotePhpString(textDomain)} ),
\t\t'get_value_callback' => ${quotePhpString(bindingSourceResolveFunctionName)},
\t)
);
${supportedAttributesHook}`;
}

function buildBindingSourceEditorSource(
	bindingSourceSlug: string,
	namespace: string,
	textDomain: string,
	target?: BindingTarget,
): string {
	const bindingSourceTitle = toTitleCase(bindingSourceSlug);
	const starterValue = `${bindingSourceTitle} starter value`;
	const bindingSourceName = `${namespace}/${bindingSourceSlug}`;
	const targetSource = target
		? `
export const BINDING_SOURCE_TARGET = {
\tattribute: ${quoteTsString(target.attributeName)},
\tblock: ${quoteTsString(`${namespace}/${target.blockSlug}`)},
\tfield: ${quoteTsString(bindingSourceSlug)},
\tsource: ${quoteTsString(bindingSourceName)},
} as const;
`
		: "";

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
${targetSource}

function resolveBindingSourceValue( field: string ): string {
\treturn BINDING_SOURCE_VALUES[ field ] ?? '';
}

registerBlockBindingsSource( {
\tname: ${quoteTsString(bindingSourceName)},
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

function resolveBindingTarget(
	options: Pick<RunAddBindingSourceCommandOptions, "attributeName" | "blockName">,
	namespace: string,
): BindingTarget | undefined {
	const blockName = normalizeOptionalCliString(options.blockName);
	const attributeName = normalizeOptionalCliString(options.attributeName);
	const hasBlock = blockName !== undefined;
	const hasAttribute = attributeName !== undefined;
	if (!hasBlock && !hasAttribute) {
		return undefined;
	}
	if (!hasBlock || !hasAttribute) {
		throw new Error(
			"`wp-typia add binding-source` requires --block and --attribute to be provided together.",
		);
	}

	return {
		attributeName: assertValidBindingAttributeName(attributeName ?? ""),
		blockSlug: resolveBindingTargetBlockSlug(blockName ?? "", namespace),
	};
}

function formatBindingAttributeTypeMember(attributeName: string): string {
	const propertyName = /^[A-Za-z_$][\w$]*$/u.test(attributeName)
		? attributeName
		: JSON.stringify(attributeName);
	return [
		"\t/**",
		"\t * Starter string attribute declared for WordPress Block Bindings.",
		"\t */",
		`\t${propertyName}?: string;`,
	].join("\n");
}

function getInterfaceDeclaration(
	source: string,
	interfaceName: string,
): {
	declaration: ts.InterfaceDeclaration;
	sourceFile: ts.SourceFile;
} | undefined {
	const sourceFile = ts.createSourceFile(
		"types.ts",
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);
	let declaration: ts.InterfaceDeclaration | undefined;

	const visit = (node: ts.Node): boolean => {
		if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
			declaration = node;
			return true;
		}
		return ts.forEachChild(node, (child) => (visit(child) ? true : undefined)) ?? false;
	};
	visit(sourceFile);

	return declaration ? { declaration, sourceFile } : undefined;
}

function getPropertyNameText(name: ts.PropertyName): string | undefined {
	if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
		return name.text;
	}

	return undefined;
}

function interfaceHasAttributeMember(
	declaration: ts.InterfaceDeclaration,
	attributeName: string,
): boolean {
	return declaration.members.some(
		(member) =>
			ts.isPropertySignature(member) &&
			member.name !== undefined &&
			getPropertyNameText(member.name) === attributeName,
	);
}

function insertBindingAttributeTypeMember(
	source: string,
	declaration: ts.InterfaceDeclaration,
	attributeName: string,
): string {
	let closeBracePosition = declaration.end - 1;
	while (closeBracePosition > declaration.pos && source[closeBracePosition] !== "}") {
		closeBracePosition -= 1;
	}
	if (source[closeBracePosition] !== "}") {
		throw new Error("Unable to locate the target interface closing brace.");
	}

	const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
	const beforeCloseBrace = source.slice(0, closeBracePosition);
	const afterCloseBrace = source.slice(closeBracePosition);
	const memberSource = formatBindingAttributeTypeMember(attributeName)
		.split("\n")
		.join(lineEnding);
	const prefix = beforeCloseBrace.endsWith(lineEnding) ? "" : lineEnding;

	return `${beforeCloseBrace}${prefix}${memberSource}${lineEnding}${afterCloseBrace}`;
}

async function ensureBindingTargetBlockAttributeType(
	projectDir: string,
	block: WorkspaceInventory["blocks"][number],
	target: BindingTarget,
): Promise<void> {
	if (!block.attributeTypeName) {
		throw new Error(
			`Workspace block "${block.slug}" must include attributeTypeName in scripts/block-config.ts before it can receive binding-source targets.`,
		);
	}

	const typesPath = path.join(projectDir, block.typesFile);
	const source = await fsp.readFile(typesPath, "utf8");
	const targetInterface = getInterfaceDeclaration(source, block.attributeTypeName);
	if (!targetInterface) {
		throw new Error(
			`Unable to locate interface ${block.attributeTypeName} in ${block.typesFile}.`,
		);
	}

	let nextSource = source;
	if (!interfaceHasAttributeMember(targetInterface.declaration, target.attributeName)) {
		nextSource = insertBindingAttributeTypeMember(
			source,
			targetInterface.declaration,
			target.attributeName,
		);
		await fsp.writeFile(typesPath, nextSource, "utf8");
	}

	await syncBlockMetadata({
		blockJsonFile: path.join("src", "blocks", block.slug, "block.json"),
		jsonSchemaFile: path.join("src", "blocks", block.slug, "typia.schema.json"),
		manifestFile: path.join("src", "blocks", block.slug, "typia.manifest.json"),
		openApiFile: path.join("src", "blocks", block.slug, "typia.openapi.json"),
		projectRoot: projectDir,
		sourceTypeName: block.attributeTypeName,
		typesFile: block.typesFile,
	});
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

		if (!hasPhpFunctionDefinition(nextSource, bindingRegistrationFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(
				nextSource,
				bindingRegistrationFunction,
			);
		}
		if (!hasPhpFunctionDefinition(nextSource, bindingEditorEnqueueFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(
				nextSource,
				bindingEditorEnqueueFunction,
			);
		}

		if (!nextSource.includes(bindingRegistrationHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(
				nextSource,
				bindingRegistrationHook,
			);
		}
		if (!nextSource.includes(bindingEditorEnqueueHook)) {
			nextSource = appendPhpSnippetBeforeClosingTag(
				nextSource,
				bindingEditorEnqueueHook,
			);
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

		if (!hasPhpFunctionDefinition(nextSource, enqueueFunctionName)) {
			nextSource = insertPhpSnippetBeforeWorkspaceAnchors(nextSource, enqueueFunction);
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
			nextSource = appendPhpSnippetBeforeClosingTag(nextSource, enqueueHook);
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
 * @param options.attributeName Optional generated block attribute to declare as
 * bindable. Must be provided together with `blockName`.
 * @param options.blockName Optional generated block slug or full block name to
 * receive the bindable attribute wiring. Must be provided together with
 * `attributeName`.
 * @param options.bindingSourceName Human-entered binding source name that will
 * be normalized and validated before files are written.
 * @param options.cwd Working directory used to resolve the nearest official
 * workspace. Defaults to `process.cwd()`.
 * @returns A promise that resolves with the normalized `bindingSourceSlug` and
 * owning `projectDir` after the server/editor files, optional target block
 * metadata, and inventory entry have been written successfully.
 * @throws {Error} When the command is run outside an official workspace, when
 * the slug is invalid, when a binding target is incomplete or unknown, or when
 * a conflicting file or inventory entry exists.
 */
export async function runAddBindingSourceCommand({
	attributeName,
	bindingSourceName,
	blockName,
	cwd = process.cwd(),
}: RunAddBindingSourceCommandOptions): Promise<{
	attributeName?: string;
	bindingSourceSlug: string;
	blockSlug?: string;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const bindingSourceSlug = assertValidGeneratedSlug(
		"Binding source name",
		normalizeBlockSlug(bindingSourceName),
		"wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>]",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertBindingSourceDoesNotExist(workspace.projectDir, bindingSourceSlug, inventory);
	const target = resolveBindingTarget(
		{
			attributeName,
			blockName,
		},
		workspace.workspace.namespace,
	);
	const targetBlock = target ? resolveWorkspaceBlock(inventory, target.blockSlug) : undefined;

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const bindingsIndexPath = resolveBindingSourceRegistryPath(workspace.projectDir);
	const bindingSourceDir = path.join(workspace.projectDir, "src", "bindings", bindingSourceSlug);
	const serverFilePath = path.join(bindingSourceDir, "server.php");
	const editorFilePath = path.join(bindingSourceDir, "editor.ts");
	const blockJsonPath = target
		? path.join(workspace.projectDir, "src", "blocks", target.blockSlug, "block.json")
		: undefined;
	const targetGeneratedMetadataPaths = target
		? [
				path.join(workspace.projectDir, "src", "blocks", target.blockSlug, "typia.manifest.json"),
				path.join(workspace.projectDir, "src", "blocks", target.blockSlug, "typia.openapi.json"),
				path.join(workspace.projectDir, "src", "blocks", target.blockSlug, "typia.schema.json"),
				path.join(workspace.projectDir, "src", "blocks", target.blockSlug, "typia-validator.php"),
			]
		: [];
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			bindingsIndexPath,
			...(blockJsonPath ? [blockJsonPath] : []),
			...(targetBlock ? [path.join(workspace.projectDir, targetBlock.typesFile)] : []),
			...targetGeneratedMetadataPaths,
		]),
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
				target,
			),
			"utf8",
		);
		await fsp.writeFile(
			editorFilePath,
			buildBindingSourceEditorSource(
				bindingSourceSlug,
				workspace.workspace.namespace,
				workspace.workspace.textDomain,
				target,
			),
			"utf8",
		);
		if (target && targetBlock) {
			await ensureBindingTargetBlockAttributeType(workspace.projectDir, targetBlock, target);
		}
		await writeBindingSourceRegistry(workspace.projectDir, bindingSourceSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			bindingSourceEntries: [buildBindingSourceConfigEntry(bindingSourceSlug, target)],
		});

		return {
			...(target ? { attributeName: target.attributeName, blockSlug: target.blockSlug } : {}),
			bindingSourceSlug,
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
