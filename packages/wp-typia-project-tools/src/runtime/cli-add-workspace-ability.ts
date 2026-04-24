import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import { syncTypeSchemas } from "@wp-typia/block-runtime/metadata-core";

import {
	appendWorkspaceInventoryEntries,
	readWorkspaceInventory,
} from "./workspace-inventory.js";
import { resolveWorkspaceProject, type WorkspaceProject } from "./workspace-project.js";
import { toTitleCase } from "./string-case.js";
import {
	assertAbilityDoesNotExist,
	assertValidGeneratedSlug,
	getWorkspaceBootstrapPath,
	normalizeBlockSlug,
	patchFile,
	quoteTsString,
	rollbackWorkspaceMutation,
	type RunAddAbilityCommandOptions,
	type WorkspaceMutationSnapshot,
	snapshotWorkspaceFiles,
} from "./cli-add-shared.js";

const ABILITY_SERVER_GLOB = "/inc/abilities/*.php";
const ABILITY_EDITOR_SCRIPT = "build/abilities/index.js";
const ABILITY_EDITOR_ASSET = "build/abilities/index.asset.php";
const ABILITY_REGISTRY_END_MARKER = "// wp-typia add ability entries end";
const ABILITY_REGISTRY_START_MARKER = "// wp-typia add ability entries start";
const WP_ABILITIES_SCRIPT_HANDLE = "wp-abilities";
const WP_CORE_ABILITIES_SCRIPT_HANDLE = "wp-core-abilities";

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function quotePhpString(value: string): string {
	return `'${value.replace(/\\/gu, "\\\\").replace(/'/gu, "\\'")}'`;
}

function toPascalCaseFromAbilitySlug(abilitySlug: string): string {
	return normalizeBlockSlug(abilitySlug)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join("");
}

function toAbilityCategorySlug(workspaceNamespace: string): string {
	const normalizedNamespace = workspaceNamespace
		.replace(/[^a-z0-9-]+/gu, "-")
		.replace(/-{2,}/gu, "-")
		.replace(/^-|-$/gu, "");

	return `${normalizedNamespace || "workspace"}-workflows`;
}

function buildAbilityConfigEntry(abilitySlug: string): string {
	const pascalCase = toPascalCaseFromAbilitySlug(abilitySlug);

	return [
		"\t{",
		`\t\tclientFile: ${quoteTsString(`src/abilities/${abilitySlug}/client.ts`)},`,
		`\t\tconfigFile: ${quoteTsString(`src/abilities/${abilitySlug}/ability.config.json`)},`,
		`\t\tdataFile: ${quoteTsString(`src/abilities/${abilitySlug}/data.ts`)},`,
		`\t\tinputSchemaFile: ${quoteTsString(`src/abilities/${abilitySlug}/input.schema.json`)},`,
		`\t\tinputTypeName: ${quoteTsString(`${pascalCase}AbilityInput`)},`,
		`\t\toutputSchemaFile: ${quoteTsString(`src/abilities/${abilitySlug}/output.schema.json`)},`,
		`\t\toutputTypeName: ${quoteTsString(`${pascalCase}AbilityOutput`)},`,
		`\t\tphpFile: ${quoteTsString(`inc/abilities/${abilitySlug}.php`)},`,
		`\t\tslug: ${quoteTsString(abilitySlug)},`,
		`\t\ttypesFile: ${quoteTsString(`src/abilities/${abilitySlug}/types.ts`)},`,
		"\t},",
	].join("\n");
}

function buildAbilityConfigSource(
	abilitySlug: string,
	workspaceNamespace: string,
): string {
	const abilityTitle = toTitleCase(abilitySlug);

	return `${JSON.stringify(
		{
			abilityId: `${workspaceNamespace}/${abilitySlug}`,
			category: {
				description: `Typed editor and admin workflows exposed by the ${workspaceNamespace} workspace.`,
				label: `${toTitleCase(workspaceNamespace)} Workflows`,
				slug: toAbilityCategorySlug(workspaceNamespace),
			},
			description: `Runs the ${abilityTitle} workflow using a typed server callback.`,
			label: abilityTitle,
			meta: {
				annotations: {
					destructive: false,
					idempotent: true,
					readonly: false,
				},
				mcp: {
					public: false,
				},
				showInRest: true,
			},
		},
		null,
		2,
	)}\n`;
}

function buildAbilityTypesSource(abilitySlug: string): string {
	const pascalCase = toPascalCaseFromAbilitySlug(abilitySlug);

	return `export interface ${pascalCase}AbilityInput {
\tcontextId: number;
\tnote?: string;
}

export interface ${pascalCase}AbilityOutput {
\tprocessedContextId: number;
\treceivedNote?: string;
\tstatus: 'ready';
\tsummary: string;
}
`;
}

function buildAbilityDataSource(abilitySlug: string): string {
	const pascalCase = toPascalCaseFromAbilitySlug(abilitySlug);
	const abilityConstBase = abilitySlug
		.toUpperCase()
		.replace(/[^A-Z0-9]+/gu, "_")
		.replace(/_{2,}/gu, "_")
		.replace(/^_|_$/gu, "");

	return `import abilityConfig from './ability.config.json';

import type { ${pascalCase}AbilityInput, ${pascalCase}AbilityOutput } from './types';

interface WordPressAbilityDefinition {
\tcategory?: string;
\tdescription?: string;
\tlabel?: string;
\tmeta?: Record<string, unknown>;
\tname?: string;
}

interface WordPressAbilitiesClient {
\texecuteAbility( name: string, input?: unknown ): Promise< unknown >;
\tgetAbilities( args?: { category?: string } ): WordPressAbilityDefinition[];
\tgetAbility( name: string ): WordPressAbilityDefinition | undefined;
}

const ABILITY_CLIENT_UNAVAILABLE_MESSAGE =
\t'The WordPress abilities client is unavailable on this screen. Ensure the Abilities API and @wordpress/core-abilities integration are loaded before using this scaffold.';

export const ${abilityConstBase}_ABILITY = abilityConfig;
export const ${abilityConstBase}_ABILITY_CATEGORY = abilityConfig.category;
export const ${abilityConstBase}_ABILITY_ID = abilityConfig.abilityId;
export const ${abilityConstBase}_ABILITY_META = abilityConfig.meta;

export type {
\t${pascalCase}AbilityInput,
\t${pascalCase}AbilityOutput,
};

function resolveAbilitiesClient(): WordPressAbilitiesClient {
\tconst runtime = globalThis as typeof globalThis & {
\t\twindow?: {
\t\t\twp?: {
\t\t\t\tabilities?: WordPressAbilitiesClient;
\t\t\t};
\t\t};
\t};
\tconst client = runtime.window?.wp?.abilities;
\tif ( ! client ) {
\t\tthrow new Error( ABILITY_CLIENT_UNAVAILABLE_MESSAGE );
\t}

\treturn client;
}

export function list${pascalCase}CategoryAbilities(): WordPressAbilityDefinition[] {
\treturn resolveAbilitiesClient().getAbilities( {
\t\tcategory: ${abilityConstBase}_ABILITY_CATEGORY.slug,
\t} );
}

export function get${pascalCase}Ability():
\t| WordPressAbilityDefinition
\t| undefined {
\treturn resolveAbilitiesClient().getAbility( ${abilityConstBase}_ABILITY_ID );
}

export function require${pascalCase}Ability(): WordPressAbilityDefinition {
\tconst ability = get${pascalCase}Ability();
\tif ( ability ) {
\t\treturn ability;
\t}

\tthrow new Error(
\t\t[
\t\t\t\`Ability "\${ ${abilityConstBase}_ABILITY_ID }" is not available yet.\`,
\t\t\t'Load the WordPress core abilities integration on this screen and confirm the server-side registration succeeded.',
\t\t].join( ' ' )
\t);
}

export async function run${pascalCase}Ability(
\tinput: ${pascalCase}AbilityInput
): Promise< ${pascalCase}AbilityOutput > {
\treturn ( await resolveAbilitiesClient().executeAbility(
\t\t${abilityConstBase}_ABILITY_ID,
\t\tinput
\t) ) as ${pascalCase}AbilityOutput;
}
`;
}

function buildAbilityClientSource(abilitySlug: string): string {
	const pascalCase = toPascalCaseFromAbilitySlug(abilitySlug);

	return `/**
 * Re-export the typed ${pascalCase} ability client helpers.
 *
 * The underlying WordPress abilities client is expected to have been hydrated
 * by the site's admin/editor bootstrap before these helpers execute.
 */
export * from './data';
`;
}

function buildAbilitySyncScriptSource(): string {
	return `/* eslint-disable no-console */
import { syncTypeSchemas } from '@wp-typia/block-runtime/metadata-core';

import {
\tABILITIES,
\ttype WorkspaceAbilityConfig,
} from './block-config';

function parseCliOptions( argv: string[] ) {
\tconst options = {
\t\tcheck: false,
\t};

\tfor ( const argument of argv ) {
\t\tif ( argument === '--check' ) {
\t\t\toptions.check = true;
\t\t\tcontinue;
\t\t}

\t\tthrow new Error( \`Unknown sync-abilities flag: \${ argument }\` );
\t}

\treturn options;
}

function isWorkspaceAbility(
\tability: WorkspaceAbilityConfig
): ability is WorkspaceAbilityConfig & {
\tclientFile: string;
\tconfigFile: string;
\tdataFile: string;
\tinputSchemaFile: string;
\tinputTypeName: string;
\toutputSchemaFile: string;
\toutputTypeName: string;
\tphpFile: string;
\ttypesFile: string;
} {
\treturn (
\t\ttypeof ability.clientFile === 'string' &&
\t\ttypeof ability.configFile === 'string' &&
\t\ttypeof ability.dataFile === 'string' &&
\t\ttypeof ability.inputSchemaFile === 'string' &&
\t\ttypeof ability.inputTypeName === 'string' &&
\t\ttypeof ability.outputSchemaFile === 'string' &&
\t\ttypeof ability.outputTypeName === 'string' &&
\t\ttypeof ability.phpFile === 'string' &&
\t\ttypeof ability.typesFile === 'string'
\t);
}

async function main() {
\tconst options = parseCliOptions( process.argv.slice( 2 ) );
\tconst abilities = ABILITIES.filter( isWorkspaceAbility );

\tif ( ABILITIES.length > 0 && abilities.length === 0 ) {
\t\tconsole.warn(
\t\t\t'⚠️ Ability inventory entries exist, but none include the required typed schema files. Check scripts/block-config.ts before relying on sync-abilities.'
\t\t);
\t}

\tif ( abilities.length === 0 ) {
\t\tconsole.log(
\t\t\toptions.check
\t\t\t\t? 'ℹ️ No typed workflow abilities are registered yet. "sync-abilities --check" is already clean.'
\t\t\t\t: 'ℹ️ No typed workflow abilities are registered yet.'
\t\t);
\t\treturn;
\t}

\tfor ( const ability of abilities ) {
\t\tawait syncTypeSchemas(
\t\t\t{
\t\t\t\tjsonSchemaFile: ability.inputSchemaFile,
\t\t\t\tprojectRoot: process.cwd(),
\t\t\t\tsourceTypeName: ability.inputTypeName,
\t\t\t\ttypesFile: ability.typesFile,
\t\t\t},
\t\t\t{
\t\t\t\tcheck: options.check,
\t\t\t}
\t\t);

\t\tawait syncTypeSchemas(
\t\t\t{
\t\t\t\tjsonSchemaFile: ability.outputSchemaFile,
\t\t\t\tprojectRoot: process.cwd(),
\t\t\t\tsourceTypeName: ability.outputTypeName,
\t\t\t\ttypesFile: ability.typesFile,
\t\t\t},
\t\t\t{
\t\t\t\tcheck: options.check,
\t\t\t}
\t\t);
\t}

\tconsole.log(
\t\toptions.check
\t\t\t? '✅ Ability input and output schemas are already up to date for all registered workflow abilities!'
\t\t\t: '✅ Ability input and output schemas generated for all registered workflow abilities!'
\t);
}

main().catch( ( error ) => {
\tconsole.error( '❌ Ability schema sync failed:', error );
\tprocess.exit( 1 );
} );
`;
}

function buildAbilityPhpSource(
	abilitySlug: string,
	workspace: WorkspaceProject,
): string {
	const abilityTitle = toTitleCase(abilitySlug);
	const abilityPhpId = abilitySlug.replace(/-/g, "_");
	const categoryRegisterFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_register_ability_category`;
	const abilityRegisterFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_register_ability`;
	const configLoaderFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_load_ability_config`;
	const schemaLoaderFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_load_ability_schema`;
	const permissionFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_can_execute_ability`;
	const executeFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_execute_ability`;
	const metaFactoryFunctionName = `${workspace.workspace.phpPrefix}_${abilityPhpId}_build_ability_meta`;

	return `<?php
if ( ! defined( 'ABSPATH' ) ) {
\treturn;
}

if ( ! function_exists( '${configLoaderFunctionName}' ) ) {
\tfunction ${configLoaderFunctionName}() {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$config_path  = $project_root . '/src/abilities/${abilitySlug}/ability.config.json';
\t\tif ( ! file_exists( $config_path ) ) {
\t\t\treturn null;
\t\t}

\t\t$decoded = json_decode( file_get_contents( $config_path ), true );
\t\treturn is_array( $decoded ) ? $decoded : null;
\t}
}

if ( ! function_exists( '${schemaLoaderFunctionName}' ) ) {
\tfunction ${schemaLoaderFunctionName}( $schema_name ) {
\t\t$project_root = dirname( __DIR__, 2 );
\t\t$schema_path  = $project_root . '/src/abilities/${abilitySlug}/' . $schema_name;
\t\tif ( ! file_exists( $schema_path ) ) {
\t\t\treturn null;
\t\t}

\t\t$decoded = json_decode( file_get_contents( $schema_path ), true );
\t\treturn is_array( $decoded ) ? $decoded : null;
\t}
}

if ( ! function_exists( '${metaFactoryFunctionName}' ) ) {
\tfunction ${metaFactoryFunctionName}( array $config ) {
\t\t$meta = array(
\t\t\t'annotations' => isset( $config['meta']['annotations'] ) && is_array( $config['meta']['annotations'] )
\t\t\t\t? $config['meta']['annotations']
\t\t\t\t: array(
\t\t\t\t\t'destructive' => false,
\t\t\t\t\t'idempotent'  => true,
\t\t\t\t\t'readonly'    => false,
\t\t\t\t),
\t\t\t'show_in_rest' => ! empty( $config['meta']['showInRest'] ),
\t\t);

\t\tif ( ! empty( $config['meta']['mcp']['public'] ) ) {
\t\t\t$meta['mcp'] = array(
\t\t\t\t'public' => true,
\t\t\t);
\t\t}

\t\treturn $meta;
\t}
}

if ( ! function_exists( '${permissionFunctionName}' ) ) {
\tfunction ${permissionFunctionName}( $input = array() ) {
\t\tunset( $input );

\t\treturn current_user_can( 'edit_posts' );
\t}
}

if ( ! function_exists( '${executeFunctionName}' ) ) {
\tfunction ${executeFunctionName}( $input = array() ) {
\t\t$payload = is_array( $input ) ? $input : array();
\t\t$context_id = isset( $payload['contextId'] ) ? (int) $payload['contextId'] : 0;
\t\t$note = isset( $payload['note'] ) && is_string( $payload['note'] )
\t\t\t? trim( $payload['note'] )
\t\t\t: '';
\t\t$result = array(
\t\t\t'processedContextId' => $context_id,
\t\t\t'status'             => 'ready',
\t\t\t'summary'            => sprintf(
\t\t\t\t/* translators: 1: workflow title, 2: context id */
\t\t\t\t__( '%1$s processed context %2$d.', ${quotePhpString(
					workspace.workspace.textDomain,
				)} ),
\t\t\t\t${quotePhpString(abilityTitle)},
\t\t\t\t$context_id
\t\t\t),
\t\t);

\t\tif ( '' !== $note ) {
\t\t\t$result['receivedNote'] = $note;
\t\t}

\t\treturn $result;
\t}
}

if ( ! function_exists( '${categoryRegisterFunctionName}' ) ) {
\tfunction ${categoryRegisterFunctionName}() {
\t\tif ( ! function_exists( 'wp_register_ability_category' ) ) {
\t\t\treturn;
\t\t}

\t\t$config = ${configLoaderFunctionName}();
\t\tif (
\t\t\t! is_array( $config ) ||
\t\t\tempty( $config['category']['slug'] ) ||
\t\t\tempty( $config['category']['label'] )
\t\t) {
\t\t\treturn;
\t\t}

\t\twp_register_ability_category(
\t\t\t(string) $config['category']['slug'],
\t\t\tarray(
\t\t\t\t'description' => isset( $config['category']['description'] ) && is_string( $config['category']['description'] )
\t\t\t\t\t? $config['category']['description']
\t\t\t\t\t: '',
\t\t\t\t'label'       => (string) $config['category']['label'],
\t\t\t)
\t\t);
\t}
}

if ( ! function_exists( '${abilityRegisterFunctionName}' ) ) {
\tfunction ${abilityRegisterFunctionName}() {
\t\tif ( ! function_exists( 'wp_register_ability' ) ) {
\t\t\treturn;
\t\t}

\t\t$config = ${configLoaderFunctionName}();
\t\tif (
\t\t\t! is_array( $config ) ||
\t\t\tempty( $config['abilityId'] ) ||
\t\t\tempty( $config['category']['slug'] ) ||
\t\t\tempty( $config['label'] ) ||
\t\t\tempty( $config['description'] )
\t\t) {
\t\t\treturn;
\t\t}

\t\t$input_schema  = ${schemaLoaderFunctionName}( 'input.schema.json' );
\t\t$output_schema = ${schemaLoaderFunctionName}( 'output.schema.json' );
\t\tif ( ! is_array( $output_schema ) ) {
\t\t\treturn;
\t\t}

\t\t$args = array(
\t\t\t'category'            => (string) $config['category']['slug'],
\t\t\t'description'         => (string) $config['description'],
\t\t\t'execute_callback'    => ${quotePhpString(executeFunctionName)},
\t\t\t'label'               => (string) $config['label'],
\t\t\t'meta'                => ${metaFactoryFunctionName}( $config ),
\t\t\t'output_schema'       => $output_schema,
\t\t\t'permission_callback' => ${quotePhpString(permissionFunctionName)},
\t\t);

\t\tif ( is_array( $input_schema ) ) {
\t\t\t$args['input_schema'] = $input_schema;
\t\t}

\t\twp_register_ability(
\t\t\t(string) $config['abilityId'],
\t\t\t$args
\t\t);
\t}
}

add_action( 'wp_abilities_api_categories_init', '${categoryRegisterFunctionName}' );
add_action( 'wp_abilities_api_init', '${abilityRegisterFunctionName}' );
`;
}

function buildAbilityRegistrySource(abilitySlugs: string[]): string {
	const exportLines = abilitySlugs
		.map((abilitySlug) => `export * from './${abilitySlug}/client';`)
		.join("\n");

	return [
		ABILITY_REGISTRY_START_MARKER,
		exportLines,
		ABILITY_REGISTRY_END_MARKER,
	]
		.filter((line) => line.length > 0)
		.join("\n")
		.concat("\n");
}

function resolveAbilityRegistryPath(projectDir: string): string {
	const abilitiesDir = path.join(projectDir, "src", "abilities");
	return [path.join(abilitiesDir, "index.ts"), path.join(abilitiesDir, "index.js")].find(
		(candidatePath) => fs.existsSync(candidatePath),
	) ?? path.join(abilitiesDir, "index.ts");
}

function readAbilityRegistrySlugs(registryPath: string): string[] {
	if (!fs.existsSync(registryPath)) {
		return [];
	}

	const source = fs.readFileSync(registryPath, "utf8");
	return Array.from(
		source.matchAll(/^\s*export\s+\*\s+from\s+['"]\.\/([^/'"]+)\/client['"];?\s*$/gmu),
	).map((match) => match[1]);
}

async function writeAbilityRegistry(
	projectDir: string,
	abilitySlug: string,
): Promise<void> {
	const abilitiesDir = path.join(projectDir, "src", "abilities");
	const registryPath = resolveAbilityRegistryPath(projectDir);
	await fsp.mkdir(abilitiesDir, { recursive: true });

	const existingAbilitySlugs = readWorkspaceInventory(projectDir).abilities.map(
		(entry) => entry.slug,
	);
	const existingRegistrySlugs = readAbilityRegistrySlugs(registryPath);
	const nextAbilitySlugs = Array.from(
		new Set([...existingAbilitySlugs, ...existingRegistrySlugs, abilitySlug]),
	).sort();
	const generatedSection = buildAbilityRegistrySource(nextAbilitySlugs);
	const existingSource = fs.existsSync(registryPath)
		? fs.readFileSync(registryPath, "utf8")
		: "";
	const generatedSectionPattern = new RegExp(
		`${escapeRegex(ABILITY_REGISTRY_START_MARKER)}[\\s\\S]*?${escapeRegex(ABILITY_REGISTRY_END_MARKER)}\\n?`,
		"u",
	);
	const nextSource = existingSource
		? generatedSectionPattern.test(existingSource)
			? existingSource.replace(generatedSectionPattern, generatedSection)
			: `${existingSource.trimEnd()}\n\n${generatedSection}`
		: generatedSection;
	await fsp.writeFile(
		registryPath,
		nextSource,
		"utf8",
	);
}

async function ensureAbilityBootstrapAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);

	await patchFile(bootstrapPath, (source) => {
		let nextSource = source;
		const workspaceBaseName =
			workspace.packageName.split("/").pop() ?? workspace.packageName;
		const loadFunctionName = `${workspace.workspace.phpPrefix}_load_workflow_abilities`;
		const enqueueFunctionName =
			`${workspace.workspace.phpPrefix}_enqueue_workflow_abilities`;
		const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
		const adminEnqueueHook = `add_action( 'admin_enqueue_scripts', '${enqueueFunctionName}' );`;
		const editorEnqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
		const loadFunction = `

function ${loadFunctionName}() {
\tforeach ( glob( __DIR__ . '${ABILITY_SERVER_GLOB}' ) ?: array() as $ability_module ) {
\t\trequire_once $ability_module;
\t}
}
`;
		const enqueueFunction = `

function ${enqueueFunctionName}() {
\tif ( ! class_exists( 'WP_Ability' ) ) {
\t\treturn;
\t}

\t$script_path = __DIR__ . '/${ABILITY_EDITOR_SCRIPT}';
\t$asset_path  = __DIR__ . '/${ABILITY_EDITOR_ASSET}';

\tif ( ! file_exists( $script_path ) || ! file_exists( $asset_path ) ) {
\t\treturn;
\t}

\t$asset = require $asset_path;
\tif ( ! is_array( $asset ) ) {
\t\t$asset = array();
\t}

\t$dependencies = isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] )
\t\t? $asset['dependencies']
\t\t: array();

\tforeach ( array( '${WP_CORE_ABILITIES_SCRIPT_HANDLE}', '${WP_ABILITIES_SCRIPT_HANDLE}' ) as $ability_dependency ) {
\t\tif (
\t\t\tfunction_exists( 'wp_script_is' ) &&
\t\t\twp_script_is( $ability_dependency, 'registered' ) &&
\t\t\t! in_array( $ability_dependency, $dependencies, true )
\t\t) {
\t\t\t$dependencies[] = $ability_dependency;
\t\t}
\t}

\twp_enqueue_script(
\t\t'${workspaceBaseName}-abilities',
\t\tplugins_url( '${ABILITY_EDITOR_SCRIPT}', __FILE__ ),
\t\t$dependencies,
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
			new RegExp(`function\\s+${escapeRegex(functionName)}\\s*\\(`, "u").test(
				nextSource,
			);
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

		if (!hasPhpFunctionDefinition(loadFunctionName)) {
			insertPhpSnippet(loadFunction);
		}
		if (!hasPhpFunctionDefinition(enqueueFunctionName)) {
			insertPhpSnippet(enqueueFunction);
		}

		if (!nextSource.includes(loadHook)) {
			appendPhpSnippet(loadHook);
		}
		if (!nextSource.includes(adminEnqueueHook)) {
			appendPhpSnippet(adminEnqueueHook);
		}
		if (!nextSource.includes(editorEnqueueHook)) {
			appendPhpSnippet(editorEnqueueHook);
		}

		return nextSource;
	});
}

async function ensureAbilityPackageScripts(
	workspace: WorkspaceProject,
): Promise<void> {
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const packageJson = JSON.parse(
		await fsp.readFile(packageJsonPath, "utf8"),
	) as {
		scripts?: Record<string, string>;
	};

	const nextScripts = {
		...(packageJson.scripts ?? {}),
		"sync-abilities":
			packageJson.scripts?.["sync-abilities"] ?? "tsx scripts/sync-abilities.ts",
	};

	if (JSON.stringify(nextScripts) === JSON.stringify(packageJson.scripts ?? {})) {
		return;
	}

	packageJson.scripts = nextScripts;
	await fsp.writeFile(
		packageJsonPath,
		`${JSON.stringify(packageJson, null, "\t")}\n`,
		"utf8",
	);
}

async function ensureAbilitySyncProjectAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const syncProjectScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-project.ts",
	);

	await patchFile(syncProjectScriptPath, (source) => {
		let nextSource = source;
		const syncRestConst =
			"const syncRestScriptPath = path.join( 'scripts', 'sync-rest-contracts.ts' );";
		const syncAbilitiesConst =
			"const syncAbilitiesScriptPath = path.join( 'scripts', 'sync-abilities.ts' );";
		const syncRestBlockPattern =
			/if \( fs\.existsSync\( path\.resolve\( process\.cwd\(\), syncRestScriptPath \) \) \) \{\n\s*runSyncScript\( syncRestScriptPath, options \);\n\s*\}/u;
		const syncAbilitiesBlock = [
			"if ( fs.existsSync( path.resolve( process.cwd(), syncAbilitiesScriptPath ) ) ) {",
			"\trunSyncScript( syncAbilitiesScriptPath, options );",
			"}",
		].join("\n");

		if (!nextSource.includes(syncAbilitiesConst)) {
			if (!nextSource.includes(syncRestConst)) {
				throw new Error(
					[
						`ensureAbilitySyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest script constant in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-abilities manually before retrying.",
					].join(" "),
				);
			}
			nextSource = nextSource.replace(
				syncRestConst,
				`${syncRestConst}\n${syncAbilitiesConst}`,
			);
		}

		if (!nextSource.includes("runSyncScript( syncAbilitiesScriptPath, options );")) {
			if (!syncRestBlockPattern.test(nextSource)) {
				throw new Error(
					[
						`ensureAbilitySyncProjectAnchors could not patch ${path.basename(syncProjectScriptPath)}.`,
						"Missing the expected sync-rest invocation block in scripts/sync-project.ts.",
						"Restore the generated template or wire sync-abilities manually before retrying.",
					].join(" "),
				);
			}

			nextSource = nextSource.replace(
				syncRestBlockPattern,
				(match) => `${match}\n\n${syncAbilitiesBlock}`,
			);
		}

		return nextSource;
	});
}

async function ensureAbilityBuildScriptAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");

	await patchFile(buildScriptPath, (source) => {
		let nextSource = source;
		if (/['"]src\/abilities\/index\.(?:ts|js)['"]/u.test(nextSource)) {
			return nextSource;
		}

		const sharedEntriesPattern =
			/(for\s*\(\s*const\s+relativePath\s+of\s+\[)([\s\S]*?)(\]\s*\)\s*\{)/u;
		const match = nextSource.match(sharedEntriesPattern);
		if (
			!match ||
			!match[2].includes("src/bindings/index.ts") ||
			!match[2].includes("src/editor-plugins/index.ts")
		) {
			throw new Error(
				[
					`ensureAbilityBuildScriptAnchors could not patch ${path.basename(buildScriptPath)}.`,
					"Missing the expected shared editor entries array in scripts/build-workspace.mjs.",
					"Restore the generated template or wire abilities/index manually before retrying.",
				].join(" "),
			);
		}

		nextSource = nextSource.replace(
			sharedEntriesPattern,
			`$1
\t\t'src/bindings/index.ts',
\t\t'src/bindings/index.js',
\t\t'src/editor-plugins/index.ts',
\t\t'src/editor-plugins/index.js',
\t\t'src/abilities/index.ts',
\t\t'src/abilities/index.js',
\t$3`,
		);

		return nextSource;
	});
}

async function ensureAbilityWebpackAnchors(
	workspace: WorkspaceProject,
): Promise<void> {
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");

	await patchFile(webpackConfigPath, (source) => {
		if (/['"]abilities\/index['"]/u.test(source)) {
			return source;
		}

		const sharedEntriesPattern =
			/for\s*\(\s*const\s+\[\s*entryName\s*,\s*candidates\s*\]\s+of\s+\[([\s\S]*?)\]\s*\)\s*\{/u;
		const match = source.match(sharedEntriesPattern);
		if (
			!match ||
			!match[1].includes("bindings/index") ||
			!match[1].includes("editor-plugins/index")
		) {
			throw new Error(
				[
					`ensureAbilityWebpackAnchors could not patch ${path.basename(webpackConfigPath)}.`,
					"Missing the expected shared editor entries block in webpack.config.js.",
					"Restore the generated template or wire abilities/index manually before retrying.",
				].join(" "),
			);
		}

		return source.replace(
			sharedEntriesPattern,
			`for ( const [ entryName, candidates ] of [
\t\t[
\t\t\t'bindings/index',
\t\t\t[ 'src/bindings/index.ts', 'src/bindings/index.js' ],
\t\t],
\t\t[
\t\t\t'editor-plugins/index',
\t\t\t[ 'src/editor-plugins/index.ts', 'src/editor-plugins/index.js' ],
\t\t],
\t\t[
\t\t\t'abilities/index',
\t\t\t[ 'src/abilities/index.ts', 'src/abilities/index.js' ],
\t\t],
\t] ) {`,
		);
	});
}

/**
 * Add one typed workflow ability scaffold to an official workspace project.
 */
export async function runAddAbilityCommand({
	abilityName,
	cwd = process.cwd(),
}: RunAddAbilityCommandOptions): Promise<{
	abilitySlug: string;
	projectDir: string;
}> {
	const workspace = resolveWorkspaceProject(cwd);
	const abilitySlug = assertValidGeneratedSlug(
		"Ability name",
		normalizeBlockSlug(abilityName),
		"wp-typia add ability <name>",
	);

	const inventory = readWorkspaceInventory(workspace.projectDir);
	assertAbilityDoesNotExist(workspace.projectDir, abilitySlug, inventory);

	const blockConfigPath = path.join(workspace.projectDir, "scripts", "block-config.ts");
	const bootstrapPath = getWorkspaceBootstrapPath(workspace);
	const buildScriptPath = path.join(workspace.projectDir, "scripts", "build-workspace.mjs");
	const packageJsonPath = path.join(workspace.projectDir, "package.json");
	const syncAbilitiesScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-abilities.ts",
	);
	const syncProjectScriptPath = path.join(
		workspace.projectDir,
		"scripts",
		"sync-project.ts",
	);
	const webpackConfigPath = path.join(workspace.projectDir, "webpack.config.js");
	const abilitiesIndexPath = resolveAbilityRegistryPath(workspace.projectDir);
	const abilityDir = path.join(workspace.projectDir, "src", "abilities", abilitySlug);
	const configFilePath = path.join(abilityDir, "ability.config.json");
	const typesFilePath = path.join(abilityDir, "types.ts");
	const dataFilePath = path.join(abilityDir, "data.ts");
	const clientFilePath = path.join(abilityDir, "client.ts");
	const phpFilePath = path.join(
		workspace.projectDir,
		"inc",
		"abilities",
		`${abilitySlug}.php`,
	);
	const mutationSnapshot: WorkspaceMutationSnapshot = {
		fileSources: await snapshotWorkspaceFiles([
			blockConfigPath,
			bootstrapPath,
			buildScriptPath,
			packageJsonPath,
			syncAbilitiesScriptPath,
			syncProjectScriptPath,
			webpackConfigPath,
			abilitiesIndexPath,
		]),
		snapshotDirs: [],
		targetPaths: [abilityDir, phpFilePath, syncAbilitiesScriptPath],
	};

	try {
		await fsp.mkdir(abilityDir, { recursive: true });
		await fsp.mkdir(path.dirname(phpFilePath), { recursive: true });
		await ensureAbilityBootstrapAnchors(workspace);
		await ensureAbilityPackageScripts(workspace);
		await ensureAbilitySyncProjectAnchors(workspace);
		await ensureAbilityBuildScriptAnchors(workspace);
		await ensureAbilityWebpackAnchors(workspace);
		await fsp.writeFile(syncAbilitiesScriptPath, buildAbilitySyncScriptSource(), "utf8");
		await fsp.writeFile(
			configFilePath,
			buildAbilityConfigSource(abilitySlug, workspace.workspace.namespace),
			"utf8",
		);
		await fsp.writeFile(
			typesFilePath,
			buildAbilityTypesSource(abilitySlug),
			"utf8",
		);
		await fsp.writeFile(
			dataFilePath,
			buildAbilityDataSource(abilitySlug),
			"utf8",
		);
		await fsp.writeFile(
			clientFilePath,
			buildAbilityClientSource(abilitySlug),
			"utf8",
		);
		await fsp.writeFile(
			phpFilePath,
			buildAbilityPhpSource(abilitySlug, workspace),
			"utf8",
		);

		const pascalCase = toPascalCaseFromAbilitySlug(abilitySlug);
		await syncTypeSchemas({
			jsonSchemaFile: `src/abilities/${abilitySlug}/input.schema.json`,
			projectRoot: workspace.projectDir,
			sourceTypeName: `${pascalCase}AbilityInput`,
			typesFile: `src/abilities/${abilitySlug}/types.ts`,
		});
		await syncTypeSchemas({
			jsonSchemaFile: `src/abilities/${abilitySlug}/output.schema.json`,
			projectRoot: workspace.projectDir,
			sourceTypeName: `${pascalCase}AbilityOutput`,
			typesFile: `src/abilities/${abilitySlug}/types.ts`,
		});
		await writeAbilityRegistry(workspace.projectDir, abilitySlug);
		await appendWorkspaceInventoryEntries(workspace.projectDir, {
			abilityEntries: [buildAbilityConfigEntry(abilitySlug)],
		});

		return {
			abilitySlug,
			projectDir: workspace.projectDir,
		};
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw error;
	}
}
