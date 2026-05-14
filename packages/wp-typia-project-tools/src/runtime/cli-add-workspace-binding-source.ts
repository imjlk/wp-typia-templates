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
import {
	assertPostMetaBindingPath,
	loadPostMetaBindingFields,
	type PostMetaBindingField,
} from "./post-meta-binding-fields.js";
import type { WorkspacePostMetaInventoryEntry } from "./workspace-inventory-types.js";

const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";
const BINDING_ATTRIBUTE_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/u;

type BindingTarget = {
	attributeName: string;
	blockSlug: string;
};

type BindingPostMetaSource = {
	fields: PostMetaBindingField[];
	metaKey: string;
	metaPath: string;
	postMetaSlug: string;
	postType: string;
	schemaFile: string;
	sourceTypeName: string;
};

function buildBindingSourceConfigEntry(
	bindingSourceSlug: string,
	target?: BindingTarget,
	postMeta?: BindingPostMetaSource,
): string {
	return [
		"\t{",
		...(target ? [`\t\tattribute: ${quoteTsString(target.attributeName)},`] : []),
		...(target ? [`\t\tblock: ${quoteTsString(target.blockSlug)},`] : []),
		`\t\teditorFile: ${quoteTsString(`src/bindings/${bindingSourceSlug}/editor.ts`)},`,
		...(postMeta ? [`\t\tmetaPath: ${quoteTsString(postMeta.metaPath)},`] : []),
		...(postMeta ? [`\t\tpostMeta: ${quoteTsString(postMeta.postMetaSlug)},`] : []),
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

function buildPhpPostMetaFallbackValue(field: PostMetaBindingField): string {
	switch (field.schemaType) {
		case "array":
		case "object":
			return "array()";
		case "boolean":
			return "false";
		case "integer":
		case "number":
			return "0";
		default:
			return quotePhpString(field.fallbackValue);
	}
}

function buildPhpPostMetaFallbackMap(fields: readonly PostMetaBindingField[]): string {
	if (fields.length === 0) {
		return "\t\treturn array();";
	}

	return [
		"\t\treturn array(",
		...fields.map(
			(field) =>
				`\t\t\t${quotePhpString(field.name)} => ${buildPhpPostMetaFallbackValue(field)},`,
		),
		"\t\t);",
	].join("\n");
}

function buildPhpStringList(values: readonly string[]): string {
	if (values.length === 0) {
		return "array()";
	}

	return `array( ${values.map((value) => quotePhpString(value)).join(", ")} )`;
}

function buildBindingPostMetaServerSource(options: {
	bindingSourceSlug: string;
	namespace: string;
	phpPrefix: string;
	postMeta: BindingPostMetaSource;
	target?: BindingTarget;
	textDomain: string;
}): string {
	const bindingSourceTitle = toTitleCase(options.bindingSourceSlug);
	const bindingSourcePhpId = options.bindingSourceSlug.replace(/-/g, "_");
	const functionPrefix = `${options.phpPrefix}_${bindingSourcePhpId}`;
	const fieldsFunctionName = `${functionPrefix}_post_meta_binding_fields`;
	const fallbackValuesFunctionName = `${functionPrefix}_post_meta_preview_values`;
	const resolveFunctionName = `${functionPrefix}_resolve_binding_source_value`;
	const supportedAttributesFunctionName = `${functionPrefix}_supported_binding_attributes`;
	const fieldNames = options.postMeta.fields.map((field) => field.name);
	const supportedAttributesSource = options.target
		? `
if ( ! function_exists( '${supportedAttributesFunctionName}' ) ) {
\tfunction ${supportedAttributesFunctionName}( array $supported_attributes ) : array {
\t\tif ( ! in_array( ${quotePhpString(options.target.attributeName)}, $supported_attributes, true ) ) {
\t\t\t$supported_attributes[] = ${quotePhpString(options.target.attributeName)};
\t\t}

\t\treturn $supported_attributes;
\t}
}
`
		: "";
	const supportedAttributesHook = options.target
		? `
if ( function_exists( '${supportedAttributesFunctionName}' ) ) {
\tadd_filter(
\t\t${quotePhpString(`block_bindings_supported_attributes_${options.namespace}/${options.target.blockSlug}`)},
\t\t${quotePhpString(supportedAttributesFunctionName)}
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

if ( ! function_exists( '${fieldsFunctionName}' ) ) {
\tfunction ${fieldsFunctionName}() : array {
\t\t$schema_file = dirname( __DIR__, 3 ) . '/${options.postMeta.schemaFile}';
\t\tif ( file_exists( $schema_file ) ) {
\t\t\t$schema = json_decode( (string) file_get_contents( $schema_file ), true );
\t\t\tif ( is_array( $schema ) && isset( $schema['properties'] ) && is_array( $schema['properties'] ) ) {
\t\t\t\treturn array_values( array_filter( array_keys( $schema['properties'] ), 'is_string' ) );
\t\t\t}
\t\t}

\t\treturn ${buildPhpStringList(fieldNames)};
\t}
}

if ( ! function_exists( '${fallbackValuesFunctionName}' ) ) {
\tfunction ${fallbackValuesFunctionName}() : array {
${buildPhpPostMetaFallbackMap(options.postMeta.fields)}
\t}
}

if ( ! function_exists( '${resolveFunctionName}' ) ) {
\tfunction ${resolveFunctionName}( array $source_args, $block_instance = null, $attribute_name = null ) {
\t\tunset( $attribute_name );

\t\t$field = isset( $source_args['field'] ) && is_string( $source_args['field'] )
\t\t\t? $source_args['field']
\t\t\t: ${quotePhpString(options.postMeta.metaPath)};
\t\tif ( ! in_array( $field, ${fieldsFunctionName}(), true ) ) {
\t\t\treturn '';
\t\t}

\t\t$post_id = 0;
\t\tif (
\t\t\tis_object( $block_instance ) &&
\t\t\tproperty_exists( $block_instance, 'context' ) &&
\t\t\tis_array( $block_instance->context ) &&
\t\t\tisset( $block_instance->context['postId'] )
\t\t) {
\t\t\t$post_id = absint( $block_instance->context['postId'] );
\t\t}
\t\tif ( ! $post_id ) {
\t\t\t$post_id = absint( get_the_ID() );
\t\t}

\t\t$value = null;
\t\tif ( $post_id ) {
\t\t\t$meta = get_post_meta( $post_id, ${quotePhpString(options.postMeta.metaKey)}, true );
\t\t\tif ( is_array( $meta ) && array_key_exists( $field, $meta ) ) {
\t\t\t\t$value = $meta[ $field ];
\t\t\t}
\t\t}
\t\tif ( null === $value ) {
\t\t\t$fallback_values = ${fallbackValuesFunctionName}();
\t\t\t$value = $fallback_values[ $field ] ?? '';
\t\t}

\t\treturn $value;
\t}
}
${supportedAttributesSource}

register_block_bindings_source(
\t${quotePhpString(`${options.namespace}/${options.bindingSourceSlug}`)},
\tarray(
\t\t'label' => __( ${quotePhpString(bindingSourceTitle)}, ${quotePhpString(options.textDomain)} ),
\t\t'get_value_callback' => ${quotePhpString(resolveFunctionName)},
\t\t'uses_context' => array( 'postId', 'postType' ),
\t)
);
${supportedAttributesHook}`;
}

function buildBindingSourceServerSource(
	bindingSourceSlug: string,
	phpPrefix: string,
	namespace: string,
	textDomain: string,
	target?: BindingTarget,
	postMeta?: BindingPostMetaSource,
): string {
	if (postMeta) {
		return buildBindingPostMetaServerSource({
			bindingSourceSlug,
			namespace,
			phpPrefix,
			postMeta,
			target,
			textDomain,
		});
	}

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

function buildTsPostMetaPreviewValue(field: PostMetaBindingField): string {
	switch (field.schemaType) {
		case "array":
			return "[]";
		case "boolean":
			return field.fallbackValue === "true" ? "true" : "false";
		case "integer":
		case "number": {
			const value = Number(field.fallbackValue);
			return Number.isFinite(value) ? String(value) : "0";
		}
		case "object":
			return "{}";
		default:
			return quoteTsString(field.fallbackValue);
	}
}

function buildTsPostMetaFieldEntries(
	fields: readonly PostMetaBindingField[],
	textDomain: string,
): string {
	return fields
		.map((field) =>
			[
				"\t{",
				`\t\tfallbackValue: ${quoteTsString(field.fallbackValue)},`,
				`\t\tlabel: __( ${quoteTsString(field.label)}, ${quoteTsString(textDomain)} ),`,
				`\t\tname: ${quoteTsString(field.name)},`,
				`\t\tpreviewValue: ${buildTsPostMetaPreviewValue(field)},`,
				`\t\trequired: ${field.required ? "true" : "false"},`,
				`\t\tschemaType: ${quoteTsString(field.schemaType)},`,
				"\t},",
			].join("\n"),
		)
		.join("\n");
}

function buildBindingPostMetaEditorSource(options: {
	bindingSourceSlug: string;
	namespace: string;
	postMeta: BindingPostMetaSource;
	target?: BindingTarget;
	textDomain: string;
}): string {
	const bindingSourceTitle = toTitleCase(options.bindingSourceSlug);
	const bindingSourceName = `${options.namespace}/${options.bindingSourceSlug}`;
	const targetSource = options.target
		? `
export const BINDING_SOURCE_TARGET = {
\tattribute: ${quoteTsString(options.target.attributeName)},
\tblock: ${quoteTsString(`${options.namespace}/${options.target.blockSlug}`)},
\tfield: ${quoteTsString(options.postMeta.metaPath)},
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

export const POST_META_BINDING_SOURCE = {
\tmetaKey: ${quoteTsString(options.postMeta.metaKey)},
\tpostMeta: ${quoteTsString(options.postMeta.postMetaSlug)},
\tpostType: ${quoteTsString(options.postMeta.postType)},
\tschemaFile: ${quoteTsString(options.postMeta.schemaFile)},
\tsourceTypeName: ${quoteTsString(options.postMeta.sourceTypeName)},
} as const;

const POST_META_BINDING_FIELDS = [
${buildTsPostMetaFieldEntries(options.postMeta.fields, options.textDomain)}
] as const;

const POST_META_PREVIEW_VALUES: Record<string, unknown> = Object.fromEntries(
\tPOST_META_BINDING_FIELDS.map( ( field ) => [
\t\tfield.name,
\t\tfield.previewValue,
\t] )
);
${targetSource}

function resolveBindingFieldType( schemaType: string ): string {
\treturn schemaType === 'unknown' ? 'string' : schemaType;
}

function resolveBindingSourceValue( field: string ): unknown {
\treturn POST_META_PREVIEW_VALUES[ field ] ?? '';
}

registerBlockBindingsSource( {
\tname: ${quoteTsString(bindingSourceName)},
\tlabel: __( ${quoteTsString(bindingSourceTitle)}, ${quoteTsString(options.textDomain)} ),
\tgetFieldsList() {
\t\treturn POST_META_BINDING_FIELDS.map( ( field ) => ( {
\t\t\tlabel: field.label,
\t\t\ttype: resolveBindingFieldType( field.schemaType ),
\t\t\targs: {
\t\t\t\tfield: field.name,
\t\t\t},
\t\t} ) );
\t},
\tgetValues( { bindings } ) {
\t\tconst values: Record<string, unknown> = {};
\t\tfor ( const [ attributeName, binding ] of Object.entries(
\t\t\tbindings as Record<string, BindingSourceRegistration>
\t\t) ) {
\t\t\tconst field =
\t\t\t\ttypeof binding?.args?.field === 'string'
\t\t\t\t\t? binding.args.field
\t\t\t\t\t: ${quoteTsString(options.postMeta.metaPath)};
\t\t\tvalues[ attributeName ] = resolveBindingSourceValue( field );
\t\t}
\t\treturn values;
\t},
} );
`;
}

function buildBindingSourceEditorSource(
	bindingSourceSlug: string,
	namespace: string,
	textDomain: string,
	target?: BindingTarget,
	postMeta?: BindingPostMetaSource,
): string {
	if (postMeta) {
		return buildBindingPostMetaEditorSource({
			bindingSourceSlug,
			namespace,
			postMeta,
			target,
			textDomain,
		});
	}

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

function resolvePostMetaInventoryEntry(
	inventory: WorkspaceInventory,
	postMetaName: string,
): WorkspacePostMetaInventoryEntry {
	const postMetaSlug = assertValidGeneratedSlug(
		"Post meta source",
		normalizeBlockSlug(postMetaName),
		"wp-typia add binding-source <name> --from-post-meta <post-meta> [--meta-path <field>]",
	);
	const postMeta = inventory.postMeta.find((entry) => entry.slug === postMetaSlug);
	if (!postMeta) {
		throw new Error(
			`Post meta contract "${postMetaSlug}" does not exist in scripts/block-config.ts. Run \`wp-typia add post-meta ${postMetaSlug} --post-type <post-type>\` first, then retry \`wp-typia add binding-source\`.`,
		);
	}

	return postMeta;
}

async function resolveBindingPostMetaSource(
	projectDir: string,
	inventory: WorkspaceInventory,
	options: Pick<RunAddBindingSourceCommandOptions, "metaPath" | "postMetaName">,
): Promise<BindingPostMetaSource | undefined> {
	const postMetaName = normalizeOptionalCliString(options.postMetaName);
	const metaPath = normalizeOptionalCliString(options.metaPath);
	if (!postMetaName && !metaPath) {
		return undefined;
	}
	if (!postMetaName) {
		throw new Error(
			"`wp-typia add binding-source` requires --from-post-meta <post-meta> or --post-meta <post-meta> when --meta-path is provided.",
		);
	}

	const postMeta = resolvePostMetaInventoryEntry(inventory, postMetaName);
	const fields = await loadPostMetaBindingFields(projectDir, postMeta);
	const selectedField = metaPath
		? assertPostMetaBindingPath(fields, postMeta.slug, metaPath)
		: fields[0];
	if (!selectedField) {
		throw new Error(
			`Post meta contract "${postMeta.slug}" does not expose a top-level field for binding-source defaults.`,
		);
	}

	return {
		fields,
		metaKey: postMeta.metaKey,
		metaPath: selectedField.name,
		postMetaSlug: postMeta.slug,
		postType: postMeta.postType,
		schemaFile: postMeta.schemaFile,
		sourceTypeName: postMeta.sourceTypeName,
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
 * @param options.metaPath Optional top-level post-meta field used as the
 * binding source's default `field` arg. Requires `postMetaName`.
 * @param options.postMetaName Optional generated post-meta contract slug used
 * to back the binding source with `get_post_meta()`.
 * @returns A promise that resolves with the normalized `bindingSourceSlug` and
 * owning `projectDir` after the server/editor files, optional target block
 * metadata, and inventory entry have been written successfully. Post-meta
 * backed results additionally include `metaKey`, `metaPath`, `postMetaSlug`,
 * `postType`, and `schemaFile`.
 * @throws {Error} When the command is run outside an official workspace, when
 * the slug is invalid, when a binding target is incomplete or unknown, or when
 * a conflicting file or inventory entry exists. Post-meta backed runs also
 * throw when the referenced contract or requested top-level field cannot be
 * resolved.
 */
export async function runAddBindingSourceCommand({
	attributeName,
	bindingSourceName,
	blockName,
	cwd = process.cwd(),
	metaPath,
	postMetaName,
}: RunAddBindingSourceCommandOptions): Promise<{
	attributeName?: string;
	bindingSourceSlug: string;
	blockSlug?: string;
	metaKey?: string;
	metaPath?: string;
	postMetaSlug?: string;
	postType?: string;
	projectDir: string;
	schemaFile?: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const bindingSourceSlug = assertValidGeneratedSlug(
		"Binding source name",
		normalizeBlockSlug(bindingSourceName),
		"wp-typia add binding-source <name> [--block <block-slug|namespace/block-slug> --attribute <attribute>] [--from-post-meta <post-meta> --meta-path <field>]",
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
	const postMeta = await resolveBindingPostMetaSource(workspace.projectDir, inventory, {
		metaPath,
		postMetaName,
	});

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
				postMeta,
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
				postMeta,
			),
			"utf8",
		);
		if (target && targetBlock) {
			await ensureBindingTargetBlockAttributeType(workspace.projectDir, targetBlock, target);
		}
		await writeBindingSourceRegistry(workspace.projectDir, bindingSourceSlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			bindingSourceEntries: [
				buildBindingSourceConfigEntry(bindingSourceSlug, target, postMeta),
			],
		});

		return {
			...(target ? { attributeName: target.attributeName, blockSlug: target.blockSlug } : {}),
			bindingSourceSlug,
			...(postMeta
				? {
						metaKey: postMeta.metaKey,
						metaPath: postMeta.metaPath,
						postMetaSlug: postMeta.postMetaSlug,
						postType: postMeta.postType,
						schemaFile: postMeta.schemaFile,
					}
				: {}),
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
