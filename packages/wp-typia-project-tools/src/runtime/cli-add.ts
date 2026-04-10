import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	syncBlockMetadata,
} from "@wp-typia/block-runtime/metadata-core";

import {
	ensureMigrationDirectories,
	parseMigrationConfig,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import {
	syncPersistenceRestArtifacts,
} from "./persistence-rest-artifacts.js";
import { snapshotProjectVersion } from "./migrations.js";
import { getDefaultAnswers, scaffoldProject } from "./scaffold.js";
import {
	SHARED_WORKSPACE_TEMPLATE_ROOT,
} from "./template-registry.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import {
	toKebabCase,
	toTitleCase,
	toSnakeCase,
} from "./string-case.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import type { ScaffoldTemplateVariables } from "./scaffold.js";
import {
	appendWorkspaceInventoryEntries,
	getWorkspaceBlockSelectOptions,
	readWorkspaceInventory,
	type WorkspaceInventory,
} from "./workspace-inventory.js";
import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_IDS,
	type HookedBlockPositionId,
} from "./hooked-blocks.js";
import {
	resolveWorkspaceProject,
	WORKSPACE_TEMPLATE_PACKAGE,
	type WorkspaceProject,
} from "./workspace-project.js";

/**
 * Supported top-level `wp-typia add` kinds exposed by the canonical CLI.
 */
export const ADD_KIND_IDS = ["block", "variation", "pattern", "binding-source", "hooked-block"] as const;
export type AddKindId = (typeof ADD_KIND_IDS)[number];

/**
 * Supported built-in block families accepted by `wp-typia add block --template`.
 */
export const ADD_BLOCK_TEMPLATE_IDS = [
	"basic",
	"interactivity",
	"persistence",
	"compound",
] as const;
export type AddBlockTemplateId = (typeof ADD_BLOCK_TEMPLATE_IDS)[number];

const COLLECTION_IMPORT_LINE = "import '../../collection';";
const REST_MANIFEST_IMPORT_PATTERN =
	/import\s*\{[^}]*\bdefineEndpointManifest\b[^}]*\}\s*from\s*["']@wp-typia\/block-runtime\/metadata-core["'];?/m;
const VARIATIONS_IMPORT_LINE = "import { registerWorkspaceVariations } from './variations';";
const VARIATIONS_CALL_LINE = "registerWorkspaceVariations();";
const PATTERN_BOOTSTRAP_CATEGORY = "register_block_pattern_category";
const BINDING_SOURCE_SERVER_GLOB = "/src/bindings/*/server.php";
const BINDING_SOURCE_EDITOR_SCRIPT = "build/bindings/index.js";
const BINDING_SOURCE_EDITOR_ASSET = "build/bindings/index.asset.php";
const WORKSPACE_GENERATED_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;

interface RunAddVariationCommandOptions {
	blockName: string;
	cwd?: string;
	variationName: string;
}

interface RunAddPatternCommandOptions {
	cwd?: string;
	patternName: string;
}

interface RunAddBindingSourceCommandOptions {
	bindingSourceName: string;
	cwd?: string;
}

interface RunAddHookedBlockCommandOptions {
	anchorBlockName: string;
	blockName: string;
	cwd?: string;
	position: string;
}

interface RunAddBlockCommandOptions {
	blockName: string;
	cwd?: string;
	dataStorageMode?: string;
	persistencePolicy?: string;
	templateId?: string;
}

interface WorkspaceMutationSnapshot {
	fileSources: Array<{
		filePath: string;
		source: string | null;
	}>;
	snapshotDirs: string[];
	targetPaths: string[];
}

function normalizeBlockSlug(input: string): string {
	return toKebabCase(input);
}

function assertValidGeneratedSlug(label: string, slug: string, usage: string): string {
	if (!slug) {
		throw new Error(`${label} is required. Use \`${usage}\`.`);
	}
	if (!WORKSPACE_GENERATED_SLUG_PATTERN.test(slug)) {
		throw new Error(
			`${label} must start with a letter and contain only lowercase letters, numbers, and hyphens.`,
		);
	}

	return slug;
}

function assertValidHookedBlockPosition(position: string): HookedBlockPositionId {
	if ((HOOKED_BLOCK_POSITION_IDS as readonly string[]).includes(position)) {
		return position as HookedBlockPositionId;
	}

	throw new Error(
		`Hook position must be one of: ${HOOKED_BLOCK_POSITION_IDS.join(", ")}.`,
	);
}

function getWorkspaceBootstrapPath(workspace: WorkspaceProject): string {
	const workspaceBaseName = workspace.packageName.split("/").pop() ?? workspace.packageName;
	return path.join(workspace.projectDir, `${workspaceBaseName}.php`);
}

function buildWorkspacePhpPrefix(workspacePhpPrefix: string, slug: string): string {
	return toSnakeCase(`${workspacePhpPrefix}_${slug}`);
}

function isAddBlockTemplateId(value: string): value is AddBlockTemplateId {
	return (ADD_BLOCK_TEMPLATE_IDS as readonly string[]).includes(value);
}

function quoteTsString(value: string): string {
	return JSON.stringify(value);
}

function buildServerTemplateRoot(persistencePolicy: string | undefined): string {
	return path.join(
		SHARED_WORKSPACE_TEMPLATE_ROOT,
		persistencePolicy === "public" ? "persistence-public" : "persistence-auth",
	);
}

function buildSingleBlockConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tslug: ${quoteTsString(variables.slugKebabCase)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}Attributes`)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildPersistenceBlockConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tapiTypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/api-types.ts`)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}Attributes`)},`,
		"\t\trestManifest: defineEndpointManifest( {",
		"\t\t\tcontracts: {",
		"\t\t\t\t'bootstrap-query': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}BootstrapQuery`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'bootstrap-response': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}BootstrapResponse`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'state-query': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}StateQuery`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'state-response': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}StateResponse`)},`,
		"\t\t\t\t},",
		"\t\t\t\t'write-state-request': {",
		`\t\t\t\t\tsourceTypeName: ${quoteTsString(`${variables.pascalCase}WriteStateRequest`)},`,
		"\t\t\t\t},",
		"\t\t\t},",
		"\t\t\tendpoints: [",
		"\t\t\t\t{",
		"\t\t\t\t\tauth: 'public',",
		"\t\t\t\t\tmethod: 'GET',",
		`\t\t\t\t\toperationId: ${quoteTsString(`get${variables.pascalCase}State`)},`,
		`\t\t\t\t\tpath: ${quoteTsString(`/${variables.namespace}/v1/${variables.slugKebabCase}/state`)},`,
		"\t\t\t\t\tqueryContract: 'state-query',",
		"\t\t\t\t\tresponseContract: 'state-response',",
		`\t\t\t\t\tsummary: 'Read the current persisted state.',`,
		`\t\t\t\t\ttags: [ ${quoteTsString(variables.title)} ],`,
		"\t\t\t\t},",
		"\t\t\t\t{",
		`\t\t\t\t\tauth: ${quoteTsString(variables.restWriteAuthIntent)},`,
		"\t\t\t\t\tbodyContract: 'write-state-request',",
		"\t\t\t\t\tmethod: 'POST',",
		`\t\t\t\t\toperationId: ${quoteTsString(`write${variables.pascalCase}State`)},`,
		`\t\t\t\t\tpath: ${quoteTsString(`/${variables.namespace}/v1/${variables.slugKebabCase}/state`)},`,
		"\t\t\t\t\tresponseContract: 'state-response',",
		`\t\t\t\t\tsummary: 'Write the current persisted state.',`,
		`\t\t\t\t\ttags: [ ${quoteTsString(variables.title)} ],`,
		"\t\t\t\t\twordpressAuth: {",
		`\t\t\t\t\t\tmechanism: ${quoteTsString(variables.restWriteAuthMechanism)},`,
		"\t\t\t\t\t},",
		"\t\t\t\t},",
		"\t\t\t\t{",
		"\t\t\t\t\tauth: 'public',",
		"\t\t\t\t\tmethod: 'GET',",
		`\t\t\t\t\toperationId: ${quoteTsString(`get${variables.pascalCase}Bootstrap`)},`,
		`\t\t\t\t\tpath: ${quoteTsString(`/${variables.namespace}/v1/${variables.slugKebabCase}/bootstrap`)},`,
		"\t\t\t\t\tqueryContract: 'bootstrap-query',",
		"\t\t\t\t\tresponseContract: 'bootstrap-response',",
		`\t\t\t\t\tsummary: 'Read fresh session bootstrap state for the current viewer.',`,
		`\t\t\t\t\ttags: [ ${quoteTsString(variables.title)} ],`,
		"\t\t\t\t},",
		"\t\t\t],",
		"\t\t\tinfo: {",
		`\t\t\t\ttitle: ${quoteTsString(`${variables.title} REST API`)},`,
		"\t\t\t\tversion: '1.0.0',",
		"\t\t\t},",
		"\t\t} ),",
		`\t\topenApiFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/api.openapi.json`)},`,
		`\t\tslug: ${quoteTsString(variables.slugKebabCase)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildCompoundChildConfigEntry(variables: ScaffoldTemplateVariables): string {
	return [
		"\t{",
		`\t\tslug: ${quoteTsString(`${variables.slugKebabCase}-item`)},`,
		`\t\tattributeTypeName: ${quoteTsString(`${variables.pascalCase}ItemAttributes`)},`,
		`\t\ttypesFile: ${quoteTsString(`src/blocks/${variables.slugKebabCase}-item/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildConfigEntries(
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): string[] {
	if (templateId === "basic" || templateId === "interactivity") {
		return [buildSingleBlockConfigEntry(variables)];
	}

	if (templateId === "persistence") {
		return [buildPersistenceBlockConfigEntry(variables)];
	}

	if (variables.compoundPersistenceEnabled === "true") {
		return [
			buildPersistenceBlockConfigEntry(variables),
			buildCompoundChildConfigEntry(variables),
		];
	}

	return [
		buildSingleBlockConfigEntry(variables),
		buildCompoundChildConfigEntry(variables),
	];
}

function buildMigrationBlocks(
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): MigrationBlockConfig[] {
	if (templateId === "compound") {
		return [
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}`,
				key: variables.slugKebabCase,
				manifestFile: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}/types.ts`,
			},
			{
				blockJsonFile: `src/blocks/${variables.slugKebabCase}-item/block.json`,
				blockName: `${variables.namespace}/${variables.slugKebabCase}-item`,
				key: `${variables.slugKebabCase}-item`,
				manifestFile: `src/blocks/${variables.slugKebabCase}-item/typia.manifest.json`,
				saveFile: `src/blocks/${variables.slugKebabCase}-item/save.tsx`,
				typesFile: `src/blocks/${variables.slugKebabCase}-item/types.ts`,
			},
		];
	}

	return [
		{
			blockJsonFile: `src/blocks/${variables.slugKebabCase}/block.json`,
			blockName: `${variables.namespace}/${variables.slugKebabCase}`,
			key: variables.slugKebabCase,
			manifestFile: `src/blocks/${variables.slugKebabCase}/typia.manifest.json`,
			saveFile: `src/blocks/${variables.slugKebabCase}/save.tsx`,
			typesFile: `src/blocks/${variables.slugKebabCase}/types.ts`,
		},
	];
}

async function patchFile(
	filePath: string,
	transform: (source: string) => string,
): Promise<void> {
	const currentSource = await fsp.readFile(filePath, "utf8");
	const nextSource = transform(currentSource);
	if (nextSource !== currentSource) {
		await fsp.writeFile(filePath, nextSource, "utf8");
	}
}

async function readOptionalFile(filePath: string): Promise<string | null> {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	return fsp.readFile(filePath, "utf8");
}

async function restoreOptionalFile(filePath: string, source: string | null): Promise<void> {
	if (source === null) {
		await fsp.rm(filePath, { force: true });
		return;
	}

	await fsp.mkdir(path.dirname(filePath), { recursive: true });
	await fsp.writeFile(filePath, source, "utf8");
}

async function ensureCollectionImport(filePath: string): Promise<void> {
	await patchFile(filePath, (source) => {
		if (source.includes(COLLECTION_IMPORT_LINE)) {
			return source;
		}
		if (source.includes("import metadata from './block.json';")) {
			return source.replace(
				"import metadata from './block.json';",
				`${COLLECTION_IMPORT_LINE}\nimport metadata from './block.json';`,
			);
		}
		return `${COLLECTION_IMPORT_LINE}\n${source}`;
	});
}

async function copyTempDirectory(sourceDir: string, targetDir: string): Promise<void> {
	await fsp.mkdir(path.dirname(targetDir), { recursive: true });
	await fsp.cp(sourceDir, targetDir, { recursive: true });
}

async function addCollectionImportsForTemplate(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	if (templateId === "compound") {
		await ensureCollectionImport(
			path.join(projectDir, "src", "blocks", variables.slugKebabCase, "index.tsx"),
		);
		await ensureCollectionImport(
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`, "index.tsx"),
		);
		return;
	}

	await ensureCollectionImport(
		path.join(projectDir, "src", "blocks", variables.slugKebabCase, "index.tsx"),
	);
}

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

function ensureBlockConfigCanAddRestManifests(source: string): string {
	const importLine =
		"import { defineEndpointManifest } from '@wp-typia/block-runtime/metadata-core';";
	if (REST_MANIFEST_IMPORT_PATTERN.test(source)) {
		return source;
	}
	return `${importLine}\n\n${source}`;
}

async function appendBlockConfigEntries(
	projectDir: string,
	entries: string[],
	needsRestManifestImport: boolean,
): Promise<void> {
	await appendWorkspaceInventoryEntries(projectDir, {
		blockEntries: entries,
		transformSource: needsRestManifestImport ? ensureBlockConfigCanAddRestManifests : undefined,
	});
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

function resolveBindingSourceRegistryPath(projectDir: string): string {
	const bindingsDir = path.join(projectDir, "src", "bindings");
	return [path.join(bindingsDir, "index.ts"), path.join(bindingsDir, "index.js")].find(
		(candidatePath) => fs.existsSync(candidatePath),
	) ?? path.join(bindingsDir, "index.ts");
}

async function snapshotWorkspaceFiles(filePaths: string[]): Promise<WorkspaceMutationSnapshot["fileSources"]> {
	const uniquePaths = Array.from(new Set(filePaths));
	return Promise.all(
		uniquePaths.map(async (filePath) => ({
			filePath,
			source: await readOptionalFile(filePath),
		})),
	);
}

async function renderWorkspacePersistenceServerModule(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const targetDir = path.join(projectDir, "src", "blocks", variables.slugKebabCase);
	const templateDir = buildServerTemplateRoot(variables.persistencePolicy);
	await copyInterpolatedDirectory(templateDir, targetDir, variables);
}

const COMPOUND_SHARED_SUPPORT_FILES = ["hooks.ts", "validator-toolkit.ts"] as const;

function shouldRefreshCompoundValidatorToolkit(source: string | null): boolean {
	return (
		source === null ||
		!source.includes("interface TemplateValidatorFunctions<") ||
		!source.includes("assert: ScaffoldValidatorToolkitOptions< T >['assert'];") ||
		!source.includes("validate,")
	);
}

function isLegacyCompoundValidatorSource(source: string | null): source is string {
	return (
		typeof source === "string" &&
		source.includes("from '../../validator-toolkit'") &&
		!source.includes("assert: typia.createAssert<")
	);
}

function upgradeLegacyCompoundValidatorSource(source: string): string {
	const typeNameMatch = source.match(
		/createTemplateValidatorToolkit<\s*(?<typeName>[A-Za-z0-9_]+)\s*>\s*\(\s*\{/u,
	);
	const typeName = typeNameMatch?.groups?.typeName;
	if (!typeName) {
		throw new Error(
			"Unable to upgrade a legacy compound validator without a generated type import.",
		);
	}

	let nextSource = source;
	if (!nextSource.includes("import typia from 'typia';")) {
		nextSource = `import typia from 'typia';\n${nextSource}`;
	}

	nextSource = nextSource.replace(
		new RegExp(
			`createTemplateValidatorToolkit<\\s*${typeName}\\s*>\\s*\\(\\s*\\{\\n`,
			"u",
		),
		[
			`createTemplateValidatorToolkit< ${typeName} >( {`,
			`\tassert: typia.createAssert< ${typeName} >(),`,
			`\tclone: typia.misc.createClone< ${typeName} >() as (`,
			`\t\tvalue: ${typeName},`,
			`\t) => ${typeName},`,
			`\tis: typia.createIs< ${typeName} >(),`,
		].join("\n") + "\n",
	);

	nextSource = nextSource.replace(
		"\n\tmanifest: currentManifest,",
		[
			"",
			"\tmanifest: currentManifest,",
			`\tprune: typia.misc.createPrune< ${typeName} >(),`,
			`\trandom: typia.createRandom< ${typeName} >() as (`,
			"\t\t...args: unknown[]",
			`\t) => ${typeName},`,
			`\tvalidate: typia.createValidate< ${typeName} >(),`,
		].join("\n"),
	);

	return nextSource;
}

async function collectLegacyCompoundValidatorPaths(projectDir: string): Promise<string[]> {
	const blocksDir = path.join(projectDir, "src", "blocks");
	if (!fs.existsSync(blocksDir)) {
		return [];
	}

	const blockEntries = await fsp.readdir(blocksDir, { withFileTypes: true });
	const validatorPaths = await Promise.all(
		blockEntries
			.filter((entry) => entry.isDirectory())
			.map(async (entry) => {
				const validatorPath = path.join(blocksDir, entry.name, "validators.ts");
				const validatorSource = await readOptionalFile(validatorPath);
				return isLegacyCompoundValidatorSource(validatorSource) ? validatorPath : null;
			}),
	);

	return validatorPaths.filter((validatorPath): validatorPath is string => validatorPath !== null);
}

async function ensureCompoundWorkspaceSupportFiles(
	projectDir: string,
	tempProjectDir: string,
	legacyValidatorPaths: readonly string[],
): Promise<void> {
	for (const fileName of COMPOUND_SHARED_SUPPORT_FILES) {
		const sourcePath = path.join(tempProjectDir, "src", fileName);
		if (!fs.existsSync(sourcePath)) {
			continue;
		}

		const targetPath = path.join(projectDir, "src", fileName);
		const currentSource = await readOptionalFile(targetPath);
		if (
			fileName === "validator-toolkit.ts"
				? shouldRefreshCompoundValidatorToolkit(currentSource)
				: currentSource === null
		) {
			await fsp.mkdir(path.dirname(targetPath), { recursive: true });
			await fsp.copyFile(sourcePath, targetPath);
		}
	}

	for (const validatorPath of legacyValidatorPaths) {
		const currentSource = await readOptionalFile(validatorPath);
		if (!isLegacyCompoundValidatorSource(currentSource)) {
			continue;
		}

		await fsp.writeFile(
			validatorPath,
			upgradeLegacyCompoundValidatorSource(currentSource),
			"utf8",
		);
	}
}

async function copyScaffoldedBlockSlice(
	projectDir: string,
	templateId: AddBlockTemplateId,
	tempProjectDir: string,
	variables: ScaffoldTemplateVariables,
	legacyValidatorPaths: readonly string[] = [],
): Promise<void> {
	if (templateId === "compound") {
		await ensureCompoundWorkspaceSupportFiles(
			projectDir,
			tempProjectDir,
			legacyValidatorPaths,
		);
		await copyTempDirectory(
			path.join(tempProjectDir, "src", "blocks", variables.slugKebabCase),
			path.join(projectDir, "src", "blocks", variables.slugKebabCase),
		);
		await copyTempDirectory(
			path.join(tempProjectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
		);
		if (variables.compoundPersistenceEnabled === "true") {
			await renderWorkspacePersistenceServerModule(projectDir, variables);
		}
		return;
	}

	await copyTempDirectory(
		path.join(tempProjectDir, "src"),
		path.join(projectDir, "src", "blocks", variables.slugKebabCase),
	);

	if (templateId === "persistence") {
		await renderWorkspacePersistenceServerModule(projectDir, variables);
	}
}

function collectWorkspaceBlockPaths(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): string[] {
	if (templateId === "compound") {
		return [
			path.join(projectDir, "src", "blocks", variables.slugKebabCase),
			path.join(projectDir, "src", "blocks", `${variables.slugKebabCase}-item`),
		];
	}

	return [path.join(projectDir, "src", "blocks", variables.slugKebabCase)];
}

function assertBlockTargetsDoNotExist(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): void {
	for (const targetPath of collectWorkspaceBlockPaths(projectDir, templateId, variables)) {
		if (fs.existsSync(targetPath)) {
			throw new Error(
				`A block already exists at ${path.relative(projectDir, targetPath)}. Choose a different name.`,
			);
		}
	}
}

async function updateWorkspaceMigrationConfigIfPresent(
	projectDir: string,
	newBlocks: MigrationBlockConfig[],
): Promise<void> {
	const configPath = path.join(projectDir, "src", "migrations", "config.ts");
	if (!fs.existsSync(configPath)) {
		return;
	}

	const configSource = await fsp.readFile(configPath, "utf8");
	const config = parseMigrationConfig(configSource);
	const existingBlocks = Array.isArray(config.blocks) ? config.blocks : [];
	const nextBlocks = [
		...existingBlocks,
		...newBlocks.filter(
			(block) => !existingBlocks.some((existing) => existing.key === block.key),
		),
	];

	writeMigrationConfig(projectDir, {
		...config,
		blocks: nextBlocks,
	});

	snapshotProjectVersion(projectDir, config.currentMigrationVersion, {
		skipConfigUpdate: true,
	});
}

async function syncWorkspaceBlockMetadata(
	projectDir: string,
	slug: string,
	sourceTypeName: string,
	typesFile: string,
): Promise<void> {
	await syncBlockMetadata(
		{
			blockJsonFile: path.join("src", "blocks", slug, "block.json"),
			jsonSchemaFile: path.join("src", "blocks", slug, "typia.schema.json"),
			manifestFile: path.join("src", "blocks", slug, "typia.manifest.json"),
			openApiFile: path.join("src", "blocks", slug, "typia.openapi.json"),
			projectRoot: projectDir,
			sourceTypeName,
			typesFile,
		},
	);
}

async function syncWorkspacePersistenceArtifacts(
	projectDir: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	await syncPersistenceRestArtifacts({
		apiTypesFile: path.join("src", "blocks", variables.slugKebabCase, "api-types.ts"),
		outputDir: path.join("src", "blocks", variables.slugKebabCase),
		projectDir,
		variables,
	});
}

async function syncWorkspaceAddedBlockArtifacts(
	projectDir: string,
	templateId: AddBlockTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	await syncWorkspaceBlockMetadata(
		projectDir,
		variables.slugKebabCase,
		`${variables.pascalCase}Attributes`,
		path.join("src", "blocks", variables.slugKebabCase, "types.ts"),
	);

	if (templateId === "compound") {
		await syncWorkspaceBlockMetadata(
			projectDir,
			`${variables.slugKebabCase}-item`,
			`${variables.pascalCase}ItemAttributes`,
			path.join("src", "blocks", `${variables.slugKebabCase}-item`, "types.ts"),
		);
	}

	if (
		templateId === "persistence" ||
		(templateId === "compound" && variables.compoundPersistenceEnabled === "true")
	) {
		await syncWorkspacePersistenceArtifacts(projectDir, variables);
	}
}

function assertPersistenceFlagsAllowed(
	templateId: AddBlockTemplateId,
	options: Pick<RunAddBlockCommandOptions, "dataStorageMode" | "persistencePolicy">,
): void {
	const hasPersistenceFlags =
		typeof options.dataStorageMode === "string" ||
		typeof options.persistencePolicy === "string";

	if (!hasPersistenceFlags) {
		return;
	}

	if (templateId === "persistence" || templateId === "compound") {
		if (
			typeof options.dataStorageMode === "string" &&
			options.dataStorageMode !== "custom-table" &&
			options.dataStorageMode !== "post-meta"
		) {
			throw new Error(
				`Unsupported data storage mode "${options.dataStorageMode}". Expected one of: post-meta, custom-table.`,
			);
		}
		if (
			typeof options.persistencePolicy === "string" &&
			options.persistencePolicy !== "authenticated" &&
			options.persistencePolicy !== "public"
		) {
			throw new Error(
				`Unsupported persistence policy "${options.persistencePolicy}". Expected one of: authenticated, public.`,
			);
		}
		return;
	}

	throw new Error(
		`--data-storage and --persistence-policy are supported only for \`wp-typia add block --template persistence\` or \`--template compound\`.`,
	);
}

/**
 * Returns help text for the canonical `wp-typia add` subcommands.
 */
export function formatAddHelpText(): string {
	return `Usage:
  wp-typia add block <name> --template <${ADD_BLOCK_TEMPLATE_IDS.join("|")}> [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>]
  wp-typia add variation <name> --block <block-slug>
  wp-typia add pattern <name>
  wp-typia add binding-source <name>
  wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <${HOOKED_BLOCK_POSITION_IDS.join("|")}>

Notes:
  \`wp-typia add\` runs only inside official ${WORKSPACE_TEMPLATE_PACKAGE} workspaces.
  \`add variation\` targets an existing block slug from \`scripts/block-config.ts\`.
  \`add pattern\` scaffolds a namespaced PHP pattern shell under \`src/patterns/\`.
  \`add binding-source\` scaffolds shared PHP and editor registration under \`src/bindings/\`.
  \`add hooked-block\` patches an existing workspace block's \`block.json\` \`blockHooks\` metadata.`;
}

/**
 * Seeds an empty official workspace migration project before any blocks are added.
 */
export async function seedWorkspaceMigrationProject(
	projectDir: string,
	currentMigrationVersion: string,
): Promise<void> {
	writeMigrationConfig(projectDir, {
		blocks: [],
		currentMigrationVersion,
		snapshotDir: "src/migrations/versions",
		supportedMigrationVersions: [currentMigrationVersion],
	});
	ensureMigrationDirectories(projectDir, []);
	writeInitialMigrationScaffold(projectDir, currentMigrationVersion, []);
}

async function rollbackWorkspaceMutation(snapshot: WorkspaceMutationSnapshot): Promise<void> {
	for (const targetPath of snapshot.targetPaths) {
		await fsp.rm(targetPath, { force: true, recursive: true });
	}
	for (const snapshotDir of snapshot.snapshotDirs) {
		await fsp.rm(snapshotDir, { force: true, recursive: true });
	}
	for (const { filePath, source } of snapshot.fileSources) {
		await restoreOptionalFile(filePath, source);
	}
}

/**
 * Adds one built-in block slice to an official workspace project.
 */
export async function runAddBlockCommand({
	blockName,
	cwd = process.cwd(),
	dataStorageMode,
	persistencePolicy,
	templateId = "basic",
}: RunAddBlockCommandOptions): Promise<{
	blockSlugs: string[];
	projectDir: string;
	templateId: AddBlockTemplateId;
}> {
	if (!isAddBlockTemplateId(templateId)) {
		throw new Error(
			`Unknown add-block template "${templateId}". Expected one of: ${ADD_BLOCK_TEMPLATE_IDS.join(", ")}`,
		);
	}
	const resolvedTemplateId = templateId;

	assertPersistenceFlagsAllowed(resolvedTemplateId, { dataStorageMode, persistencePolicy });

	const workspace = resolveWorkspaceProject(cwd);
	const normalizedSlug = normalizeBlockSlug(blockName);
	if (!normalizedSlug) {
		throw new Error("Block name is required. Use `wp-typia add block <name> --template <family>`.");
	}

	const defaults = getDefaultAnswers(normalizedSlug, resolvedTemplateId);
	let tempRoot = "";

	try {
		tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-add-block-"));
		const tempProjectDir = path.join(tempRoot, normalizedSlug);
		const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
		const migrationConfigPath = path.join(workspace.projectDir, "src", "migrations", "config.ts");
		const blockPhpPrefix = buildWorkspacePhpPrefix(
			workspace.workspace.phpPrefix,
			normalizedSlug,
		);
		const migrationConfigSource = await readOptionalFile(migrationConfigPath);
		const migrationConfig =
			migrationConfigSource === null ? null : parseMigrationConfig(migrationConfigSource);
		const compoundSupportPaths =
			resolvedTemplateId === "compound"
				? COMPOUND_SHARED_SUPPORT_FILES.map((fileName) =>
						path.join(workspace.projectDir, "src", fileName),
					)
				: [];
		const legacyCompoundValidatorPaths =
			resolvedTemplateId === "compound"
				? await collectLegacyCompoundValidatorPaths(workspace.projectDir)
				: [];
		const result = await scaffoldProject({
			answers: {
				...defaults,
				author: workspace.author,
				namespace: workspace.workspace.namespace,
				phpPrefix: blockPhpPrefix,
				slug: normalizedSlug,
				textDomain: workspace.workspace.textDomain,
				title: defaults.title,
			},
			cwd: workspace.projectDir,
			dataStorageMode: dataStorageMode as "custom-table" | "post-meta" | undefined,
			noInstall: true,
			packageManager: workspace.packageManager,
			persistencePolicy: persistencePolicy as "authenticated" | "public" | undefined,
			projectDir: tempProjectDir,
			templateId: resolvedTemplateId,
		});
		assertBlockTargetsDoNotExist(workspace.projectDir, resolvedTemplateId, result.variables);
		const mutationSnapshot: WorkspaceMutationSnapshot = {
			fileSources: await snapshotWorkspaceFiles([
				blockConfigPath,
				migrationConfigPath,
				...compoundSupportPaths,
				...legacyCompoundValidatorPaths,
			]),
			snapshotDirs:
				migrationConfig === null
					? []
					: buildMigrationBlocks(resolvedTemplateId, result.variables).map((block) =>
						path.join(
							workspace.projectDir,
							...migrationConfig.snapshotDir.split("/"),
							migrationConfig.currentMigrationVersion,
							block.key,
						),
					),
			targetPaths: collectWorkspaceBlockPaths(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			),
		};

		try {
			await copyScaffoldedBlockSlice(
				workspace.projectDir,
				resolvedTemplateId,
				tempProjectDir,
				result.variables,
				legacyCompoundValidatorPaths,
			);
			await addCollectionImportsForTemplate(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			);
			await appendBlockConfigEntries(
				workspace.projectDir,
				buildConfigEntries(resolvedTemplateId, result.variables),
				resolvedTemplateId === "persistence" ||
					(resolvedTemplateId === "compound" &&
						result.variables.compoundPersistenceEnabled === "true"),
			);
			await syncWorkspaceAddedBlockArtifacts(
				workspace.projectDir,
				resolvedTemplateId,
				result.variables,
			);
			await updateWorkspaceMigrationConfigIfPresent(
				workspace.projectDir,
				buildMigrationBlocks(resolvedTemplateId, result.variables),
			);

			return {
				blockSlugs: collectWorkspaceBlockPaths(
					workspace.projectDir,
					resolvedTemplateId,
					result.variables,
				).map((targetPath) => path.basename(targetPath)),
				projectDir: workspace.projectDir,
				templateId: resolvedTemplateId,
			};
		} catch (error) {
			await rollbackWorkspaceMutation(mutationSnapshot);
			throw error;
		}
	} finally {
		if (tempRoot) {
			await fsp.rm(tempRoot, { force: true, recursive: true });
		}
	}
}

function resolveWorkspaceBlock(
	inventory: WorkspaceInventory,
	blockSlug: string,
): WorkspaceInventory["blocks"][number] {
	const block = inventory.blocks.find((entry) => entry.slug === blockSlug);
	if (!block) {
		throw new Error(
			`Unknown workspace block "${blockSlug}". Choose one of: ${inventory.blocks.map((entry) => entry.slug).join(", ")}`,
		);
	}
	return block;
}

function assertValidHookAnchor(anchorBlockName: string): string {
	const trimmed = anchorBlockName.trim();
	if (!trimmed) {
		throw new Error(
			"`wp-typia add hooked-block` requires --anchor <anchor-block-name>.",
		);
	}
	if (!HOOKED_BLOCK_ANCHOR_PATTERN.test(trimmed)) {
		throw new Error(
			"`wp-typia add hooked-block` requires --anchor <anchor-block-name> to use the full `namespace/slug` block name format.",
		);
	}

	return trimmed;
}

function readWorkspaceBlockJson(
	projectDir: string,
	blockSlug: string,
): {
	blockJson: Record<string, unknown>;
	blockJsonPath: string;
} {
	const blockJsonPath = path.join(projectDir, "src", "blocks", blockSlug, "block.json");
	if (!fs.existsSync(blockJsonPath)) {
		throw new Error(
			`Missing ${path.relative(projectDir, blockJsonPath)} for workspace block "${blockSlug}".`,
		);
	}

	let blockJson: unknown;
	try {
		blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
	} catch (error) {
		throw new Error(
			error instanceof Error
				? `Failed to parse ${path.relative(projectDir, blockJsonPath)}: ${error.message}`
				: `Failed to parse ${path.relative(projectDir, blockJsonPath)}.`,
		);
	}

	if (!blockJson || typeof blockJson !== "object" || Array.isArray(blockJson)) {
		throw new Error(
			`${path.relative(projectDir, blockJsonPath)} must contain a JSON object.`,
		);
	}

	return {
		blockJson: blockJson as Record<string, unknown>,
		blockJsonPath,
	};
}

function getMutableBlockHooks(
	blockJson: Record<string, unknown>,
	blockJsonRelativePath: string,
): Record<string, string> {
	const blockHooks = blockJson.blockHooks;
	if (blockHooks === undefined) {
		const nextHooks: Record<string, string> = {};
		blockJson.blockHooks = nextHooks;
		return nextHooks;
	}
	if (!blockHooks || typeof blockHooks !== "object" || Array.isArray(blockHooks)) {
		throw new Error(`${blockJsonRelativePath} must define blockHooks as an object when present.`);
	}

	return blockHooks as Record<string, string>;
}

function assertVariationDoesNotExist(
	projectDir: string,
	blockSlug: string,
	variationSlug: string,
	inventory: WorkspaceInventory,
): void {
	const variationPath = path.join(
		projectDir,
		"src",
		"blocks",
		blockSlug,
		"variations",
		`${variationSlug}.ts`,
	);
	if (fs.existsSync(variationPath)) {
		throw new Error(
			`A variation already exists at ${path.relative(projectDir, variationPath)}. Choose a different name.`,
		);
	}
	if (
		inventory.variations.some(
			(entry) => entry.block === blockSlug && entry.slug === variationSlug,
		)
	) {
		throw new Error(
			`A variation inventory entry already exists for ${blockSlug}/${variationSlug}. Choose a different name.`,
		);
	}
}

function assertPatternDoesNotExist(
	projectDir: string,
	patternSlug: string,
	inventory: WorkspaceInventory,
): void {
	const patternPath = path.join(projectDir, "src", "patterns", `${patternSlug}.php`);
	if (fs.existsSync(patternPath)) {
		throw new Error(
			`A pattern already exists at ${path.relative(projectDir, patternPath)}. Choose a different name.`,
		);
	}
	if (inventory.patterns.some((entry) => entry.slug === patternSlug)) {
		throw new Error(
			`A pattern inventory entry already exists for ${patternSlug}. Choose a different name.`,
		);
	}
}

function assertBindingSourceDoesNotExist(
	projectDir: string,
	bindingSourceSlug: string,
	inventory: WorkspaceInventory,
): void {
	const bindingSourceDir = path.join(projectDir, "src", "bindings", bindingSourceSlug);
	if (fs.existsSync(bindingSourceDir)) {
		throw new Error(
			`A binding source already exists at ${path.relative(projectDir, bindingSourceDir)}. Choose a different name.`,
		);
	}
	if (inventory.bindingSources.some((entry) => entry.slug === bindingSourceSlug)) {
		throw new Error(
			`A binding source inventory entry already exists for ${bindingSourceSlug}. Choose a different name.`,
		);
	}
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

export { getWorkspaceBlockSelectOptions };
