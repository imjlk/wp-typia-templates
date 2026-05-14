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
	appendWorkspaceInventoryEntries,
	readWorkspaceInventoryAsync,
	type WorkspaceInventory,
} from "./workspace-inventory.js";
import { toTitleCase } from "./string-case.js";
import { hasPhpFunctionDefinition, quotePhpString } from "./php-utils.js";
import {
	assertBindingSourceDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	resolveWorkspaceBlock,
	rollbackWorkspaceMutation,
	type RunAddBindingSourceCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";
import {
	appendPhpSnippetBeforeClosingTag,
	insertPhpSnippetBeforeWorkspaceAnchors,
} from "./cli-add-workspace-mutation.js";
import { resolveWorkspaceBlockTargetName } from "./block-targets.js";
import { pathExists } from "./fs-async.js";
import { normalizeOptionalCliString } from "./cli-validation.js";
import { getPropertyNameText } from "./ts-property-names.js";

const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";
const BINDING_ATTRIBUTE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/u;

type BindingTarget = {
	attributeName: string;
	blockSlug: string;
};

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
			`Binding attribute "${trimmed}" must start with a letter and use only letters, numbers, underscores, or hyphens.`,
		);
	}

	return trimmed;
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

	const targetBlock = resolveWorkspaceBlockTargetName(blockName ?? "", namespace, {
		empty: () =>
			"`wp-typia add binding-source` requires --block <block-slug|namespace/block-slug> to include a value when --attribute is provided.",
		emptySegment: (input) =>
			`Binding target block "${input}" must use <block-slug> or <namespace/block-slug> format without empty path segments.`,
		invalidFormat: (input) =>
			`Binding target block "${input}" must use <block-slug> or <namespace/block-slug> format.`,
		namespaceMismatch: (input, actualNamespace, expectedNamespace) =>
			`Binding target block "${input}" uses namespace "${actualNamespace}". Expected "${expectedNamespace}".`,
	});

	return {
		attributeName: assertValidBindingAttributeName(attributeName ?? ""),
		blockSlug: targetBlock.blockSlug,
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

function buildBindingSourceIndexSource(bindingSourceSlugs: string[]): string {
	const importLines = bindingSourceSlugs
		.map((bindingSourceSlug) => `import './${bindingSourceSlug}/editor';`)
		.join("\n");

	return `${importLines}${importLines ? "\n\n" : ""}// wp-typia add binding-source entries\n`;
}

async function ensureBindingSourceBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
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

async function resolveBindingSourceRegistryPath(projectDir: string): Promise<string> {
	const bindingsDir = path.join(projectDir, "src", "bindings");
	for (const candidatePath of [
		path.join(bindingsDir, "index.ts"),
		path.join(bindingsDir, "index.js"),
	]) {
		if (await pathExists(candidatePath)) {
			return candidatePath;
		}
	}
	return path.join(bindingsDir, "index.ts");
}

async function writeBindingSourceRegistry(
	projectDir: string,
	bindingSourceSlug: string,
): Promise<void> {
	const bindingsDir = path.join(projectDir, "src", "bindings");
	const bindingsIndexPath = await resolveBindingSourceRegistryPath(projectDir);
	await fsp.mkdir(bindingsDir, { recursive: true });

	const existingBindingSourceSlugs = (await fsp.readdir(bindingsDir, { withFileTypes: true }))
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

	const inventory = await readWorkspaceInventoryAsync(workspace.projectDir);
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
	const bindingsIndexPath = await resolveBindingSourceRegistryPath(workspace.projectDir);
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
