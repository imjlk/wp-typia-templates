import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import { analyzeSourceTypes } from "@wp-typia/block-runtime/metadata-parser";
import ts from "typescript";

import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "./cli-diagnostics.js";
import {
	quoteTsString,
	rollbackWorkspaceMutation,
	snapshotWorkspaceFiles,
	type WorkspaceMutationSnapshot,
} from "./cli-add-shared.js";
import { discoverMigrationInitLayout } from "./migration-project.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import {
	formatAddDevDependenciesCommand,
	formatPackageExecCommand,
	formatRunScript,
	getPackageManager,
	transformPackageManagerText,
	type PackageManagerId,
} from "./package-managers.js";
import { getPackageVersions } from "./package-versions.js";
import { toPascalCase } from "./string-case.js";
import { updateWorkspaceInventorySource } from "./workspace-inventory.js";
import {
	parseWorkspacePackageManagerId,
	tryResolveWorkspaceProject,
	type WorkspacePackageJson,
} from "./workspace-project.js";

type InitCommandMode = "apply" | "preview-only";
type InitPlanAction = "add" | "update";
type InitPlanStatus = "already-initialized" | "applied" | "preview";
type InitPlanLayoutKind =
	| "generated-project"
	| "multi-block"
	| "official-workspace"
	| "single-block"
	| "unsupported";

interface InitDependencyChange {
	action: InitPlanAction;
	currentValue?: string;
	name: string;
	requiredValue: string;
}

interface InitScriptChange {
	action: InitPlanAction;
	currentValue?: string;
	name: string;
	requiredValue: string;
}

interface InitPackageManagerFieldChange {
	action: InitPlanAction;
	currentValue?: string;
	requiredValue: string;
}

interface InitFilePlan {
	action: InitPlanAction;
	path: string;
	purpose: string;
}

/**
 * One existing block target that `wp-typia init` can retrofit into the shared
 * sync surface.
 *
 * Each path stays relative to the project root so generated helper scripts can
 * resolve the current block metadata and TypeScript source of truth without
 * guessing layout-specific locations.
 */
export interface RetrofitInitBlockTarget {
	attributeTypeName: string;
	blockJsonFile: string;
	blockName: string;
	manifestFile: string;
	saveFile: string;
	slug: string;
	typesFile: string;
}

/**
 * Preview or apply result returned by `wp-typia init`.
 *
 * The plan describes the detected retrofit layout, package-level mutations,
 * helper files, next steps, and any warnings gathered while preparing or
 * applying the minimum sync surface for an existing project.
 */
export interface RetrofitInitPlan {
	blockTargets: RetrofitInitBlockTarget[];
	commandMode: InitCommandMode;
	detectedLayout: {
		blockNames: string[];
		description: string;
		kind: InitPlanLayoutKind;
	};
	generatedArtifacts: string[];
	nextSteps: string[];
	notes: string[];
	packageChanges: {
		addDevDependencies: InitDependencyChange[];
		packageManagerField?: InitPackageManagerFieldChange;
		scripts: InitScriptChange[];
	};
	plannedFiles: InitFilePlan[];
	packageManager: PackageManagerId;
	projectDir: string;
	projectName: string;
	status: InitPlanStatus;
	summary: string;
}

type ProjectPackageJson = WorkspacePackageJson & {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	private?: boolean;
	version?: string;
};

const SUPPORTED_RETROFIT_LAYOUT_NOTE =
	"Supported retrofit layouts currently mirror the migration bootstrap detector: `src/block.json` + `src/types.ts` + `src/save.tsx`, legacy root `block.json` + `src/types.ts` + `src/save.tsx`, or multi-block `src/blocks/*/block.json` workspaces."

const RETROFIT_APPLY_PREVIEW_NOTE =
	"If you rerun with `wp-typia init --apply`, package.json and generated helper files are snapshotted and rolled back automatically if a write fails."

const RETROFIT_ROLLBACK_NOTE =
	"Apply mode writes package.json and generated helper files with rollback-on-failure protection."

const BASE_RETROFIT_SCRIPTS = {
	sync: "tsx scripts/sync-project.ts",
	"sync-types": "tsx scripts/sync-types-to-block-json.ts",
	typecheck: "bun run sync --check && tsc --noEmit",
} as const;

const BASE_RETROFIT_DEV_DEPENDENCIES = [
	"@typia/unplugin",
	"@wp-typia/block-runtime",
	"@wp-typia/block-types",
	"tsx",
	"typescript",
	"typia",
] as const;

function normalizeRelativePath(value: string): string {
	return value.replace(/\\/gu, "/");
}

function readProjectPackageJson(projectDir: string): ProjectPackageJson | null {
	const packageJsonPath = path.join(projectDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return null;
	}

	const source = fs.readFileSync(packageJsonPath, "utf8");
	try {
		return JSON.parse(source) as ProjectPackageJson;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			`Unable to parse ${packageJsonPath}: ${message}`,
			error instanceof Error ? { cause: error } : undefined,
		);
	}
}

function inferInitPackageManager(
	projectDir: string,
	packageJson: ProjectPackageJson | null,
): PackageManagerId {
	if (packageJson?.packageManager) {
		return parseWorkspacePackageManagerId(packageJson.packageManager);
	}

	if (
		fs.existsSync(path.join(projectDir, "bun.lock")) ||
		fs.existsSync(path.join(projectDir, "bun.lockb"))
	) {
		return "bun";
	}
	if (fs.existsSync(path.join(projectDir, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	if (
		fs.existsSync(path.join(projectDir, "yarn.lock")) ||
		fs.existsSync(path.join(projectDir, ".yarnrc.yml"))
	) {
		return "yarn";
	}

	return "npm";
}

function resolveInitPackageManager(
	projectDir: string,
	packageJson: ProjectPackageJson | null,
	override?: string,
): PackageManagerId {
	if (!override) {
		return inferInitPackageManager(projectDir, packageJson);
	}

	if (
		override !== "bun" &&
		override !== "npm" &&
		override !== "pnpm" &&
		override !== "yarn"
	) {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			`Unknown package manager "${override}". Expected one of: bun, npm, pnpm, yarn.`,
		);
	}

	return override;
}

function getWpTypiaCliSpecifier(): string {
	const versions = getPackageVersions();
	return versions.wpTypiaPackageExactVersion === "0.0.0"
		? "wp-typia"
		: `wp-typia@${versions.wpTypiaPackageExactVersion}`;
}

function buildRequiredDevDependencyMap(): Record<string, string> {
	const versions = getPackageVersions();
	return {
		"@typia/unplugin": versions.typiaUnpluginPackageVersion,
		"@wp-typia/block-runtime": versions.blockRuntimePackageVersion,
		"@wp-typia/block-types": versions.blockTypesPackageVersion,
		tsx: versions.tsxPackageVersion,
		typescript: versions.typescriptPackageVersion,
		typia: versions.typiaPackageVersion,
	};
}

function getExistingDependencyVersion(
	packageJson: ProjectPackageJson | null,
	name: string,
): string | undefined {
	return packageJson?.devDependencies?.[name] ?? packageJson?.dependencies?.[name];
}

function buildDependencyChanges(
	packageJson: ProjectPackageJson | null,
): InitDependencyChange[] {
	const requiredDependencies = buildRequiredDevDependencyMap();
	return BASE_RETROFIT_DEV_DEPENDENCIES.flatMap((name) => {
		const requiredValue = requiredDependencies[name];
		const currentValue = getExistingDependencyVersion(packageJson, name);

		if (currentValue === requiredValue) {
			return [];
		}

		return [
			{
				action: currentValue ? "update" : "add",
				...(currentValue ? { currentValue } : {}),
				name,
				requiredValue,
			} satisfies InitDependencyChange,
		];
	});
}

function buildScriptChanges(
	packageJson: ProjectPackageJson | null,
	packageManager: PackageManagerId,
): InitScriptChange[] {
	const scripts = packageJson?.scripts ?? {};

	return Object.entries(BASE_RETROFIT_SCRIPTS).flatMap(
		([name, commandSource]) => {
			const requiredValue = transformPackageManagerText(
				commandSource,
				packageManager,
			);
			const currentValue = scripts[name];
			if (currentValue === requiredValue) {
				return [];
			}

			return [
				{
					action: typeof currentValue === "string" ? "update" : "add",
					...(typeof currentValue === "string" ? { currentValue } : {}),
					name,
					requiredValue,
				} satisfies InitScriptChange,
			];
		},
	);
}

function buildPackageManagerFieldChange(
	packageJson: ProjectPackageJson | null,
	packageManager: PackageManagerId,
	options: {
		persistExplicitOverride?: boolean;
	} = {},
): InitPackageManagerFieldChange | undefined {
	if (!options.persistExplicitOverride && packageManager === "npm") {
		return undefined;
	}

	const requiredValue = getPackageManager(packageManager).packageManagerField;
	const currentValue = packageJson?.packageManager;
	if (currentValue === requiredValue) {
		return undefined;
	}

	return {
		action: typeof currentValue === "string" ? "update" : "add",
		...(typeof currentValue === "string" ? { currentValue } : {}),
		requiredValue,
	};
}

function buildGeneratedArtifactPaths(
	blockJsonFile: string,
	manifestFile: string,
): string[] {
	const manifestDir = path.dirname(manifestFile);
	const artifactPaths = [
		blockJsonFile,
		manifestFile,
		path.join(manifestDir, "typia.schema.json"),
		path.join(manifestDir, "typia-validator.php"),
		path.join(manifestDir, "typia.openapi.json"),
	];

	return Array.from(
		new Set(artifactPaths.map((filePath) => normalizeRelativePath(filePath))),
	);
}

function collectNamedSourceTypeCandidates(typesSource: string): string[] {
	const sourceFile = ts.createSourceFile(
		"types.ts",
		typesSource,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);

	return sourceFile.statements.flatMap((statement) => {
		if (
			ts.isInterfaceDeclaration(statement) ||
			ts.isTypeAliasDeclaration(statement)
		) {
			return [statement.name.text];
		}

		return [];
	});
}

function isObjectLikeSourceType(
	projectDir: string,
	typesFile: string,
	sourceTypeName: string,
): boolean {
	const analyzedTypes = analyzeSourceTypes(
		{
			projectRoot: projectDir,
			typesFile,
		},
		[sourceTypeName],
	);
	return analyzedTypes[sourceTypeName]?.kind === "object";
}

function inferRetrofitAttributeTypeName(
	projectDir: string,
	block: MigrationBlockConfig,
): string {
	const typesPath = path.join(projectDir, block.typesFile);
	const typesSource = fs.readFileSync(typesPath, "utf8");
	const blockNameSegments = block.blockName.split("/");
	const slug = blockNameSegments[blockNameSegments.length - 1] ?? block.key;
	const candidateNames = collectNamedSourceTypeCandidates(typesSource);
	const validCandidates = candidateNames.filter((candidateName) =>
		isObjectLikeSourceType(projectDir, block.typesFile, candidateName),
	);
	const preferredName = `${toPascalCase(slug)}Attributes`;

	if (validCandidates.includes(preferredName)) {
		return preferredName;
	}

	const attributeCandidates = validCandidates.filter((candidateName) =>
		candidateName.endsWith("Attributes"),
	);
	if (attributeCandidates.length === 1) {
		return attributeCandidates[0];
	}

	if (validCandidates.length === 1) {
		return validCandidates[0];
	}

	if (validCandidates.length === 0) {
		throw new Error(
			`Unable to infer an object-like source type from ${block.typesFile}. Add one interface or type alias such as ${preferredName} before rerunning \`wp-typia init\`.`,
		);
	}

	throw new Error(
		`Unable to infer a unique source type from ${block.typesFile}. Candidate object-like exports: ${validCandidates.join(", ")}. Rename one to ${preferredName} or leave a single object-like attributes type before rerunning \`wp-typia init\`.`,
	);
}

function buildRetrofitBlockTarget(
	projectDir: string,
	block: MigrationBlockConfig,
): RetrofitInitBlockTarget {
	const blockNameSegments = block.blockName.split("/");
	const slug = blockNameSegments[blockNameSegments.length - 1] ?? block.key;

	return {
		attributeTypeName: inferRetrofitAttributeTypeName(projectDir, block),
		blockJsonFile: block.blockJsonFile,
		blockName: block.blockName,
		manifestFile: block.manifestFile,
		saveFile: block.saveFile,
		slug,
		typesFile: block.typesFile,
	};
}

function buildRetrofitBlockConfigEntry(
	target: RetrofitInitBlockTarget,
): string {
	return [
		"\t{",
		`\t\tslug: ${quoteTsString(target.slug)},`,
		`\t\tattributeTypeName: ${quoteTsString(target.attributeTypeName)},`,
		`\t\tblockJsonFile: ${quoteTsString(target.blockJsonFile)},`,
		`\t\tmanifestFile: ${quoteTsString(target.manifestFile)},`,
		`\t\ttypesFile: ${quoteTsString(target.typesFile)},`,
		"\t},",
	].join("\n");
}

function buildRetrofitBlockConfigSource(
	targets: RetrofitInitBlockTarget[],
): string {
	const blockEntries = targets.map(buildRetrofitBlockConfigEntry).join("\n");
	const baseSource = `export interface WorkspaceBlockConfig {
\tattributeTypeName: string;
\tapiTypesFile?: string;
\tblockJsonFile?: string;
\tmanifestFile?: string;
\topenApiFile?: string;
\trestManifest?: ReturnType<
\t\ttypeof import( '@wp-typia/block-runtime/metadata-core' ).defineEndpointManifest
\t>;
\tslug: string;
\ttypesFile: string;
}

export const BLOCKS: WorkspaceBlockConfig[] = [
${blockEntries}
];
`;

	return `${updateWorkspaceInventorySource(baseSource)}\n`;
}

function buildRetrofitSyncTypesScriptSource(): string {
	return `/* eslint-disable no-console */
import path from 'node:path';

import { syncBlockMetadata } from '@wp-typia/block-runtime/metadata-core';

import { BLOCKS } from './block-config';

function parseCliOptions( argv: string[] ) {
\tconst options = {
\t\tcheck: false,
\t};

\tfor ( const argument of argv ) {
\t\tif ( argument === '--check' ) {
\t\t\toptions.check = true;
\t\t\tcontinue;
\t\t}

\t\tthrow new Error( \`Unknown sync-types flag: \${ argument }\` );
\t}

\treturn options;
}

async function main() {
\tconst options = parseCliOptions( process.argv.slice( 2 ) );

\tif ( BLOCKS.length === 0 ) {
\t\tconsole.log(
\t\t\toptions.check
\t\t\t\t? 'ℹ️ No retrofit blocks are registered yet. \`sync-types --check\` is already clean.'
\t\t\t\t: 'ℹ️ No retrofit blocks are registered yet. Add one block target to scripts/block-config.ts before rerunning sync-types.'
\t\t);
\t\treturn;
\t}

\tfor ( const block of BLOCKS ) {
\t\tconst blockDir = path.dirname( block.typesFile );
\t\tconst blockJsonFile =
\t\t\tblock.blockJsonFile ?? path.join( blockDir, 'block.json' );
\t\tconst manifestFile =
\t\t\tblock.manifestFile ?? path.join( blockDir, 'typia.manifest.json' );
\t\tconst manifestDir = path.dirname( manifestFile );
\t\tconst result = await syncBlockMetadata(
\t\t\t{
\t\t\t\tblockJsonFile,
\t\t\t\tjsonSchemaFile: path.join( manifestDir, 'typia.schema.json' ),
\t\t\t\tmanifestFile,
\t\t\t\topenApiFile: path.join( manifestDir, 'typia.openapi.json' ),
\t\t\t\tsourceTypeName: block.attributeTypeName,
\t\t\t\ttypesFile: block.typesFile,
\t\t\t},
\t\t\t{
\t\t\t\tcheck: options.check,
\t\t\t}
\t\t);
\t\tfor ( const warning of result.lossyProjectionWarnings ) {
\t\t\tconsole.warn( \`⚠️ \${ block.slug }: \${ warning }\` );
\t\t}
\t\tfor ( const warning of result.phpGenerationWarnings ) {
\t\t\tconsole.warn( \`⚠️ \${ block.slug }: \${ warning }\` );
\t\t}

\t\tconsole.log(
\t\t\toptions.check
\t\t\t\t? \`✅ \${ block.slug }: block.json, typia.manifest.json, typia-validator.php, typia.schema.json, and typia.openapi.json are already up to date with the TypeScript types!\`
\t\t\t\t: \`✅ \${ block.slug }: block.json, typia.manifest.json, typia-validator.php, typia.schema.json, and typia.openapi.json were generated from TypeScript types!\`
\t\t);
\t\tconsole.log( '📝 Generated attributes:', result.attributeNames );
\t}
}

main().catch( ( error ) => {
\tconsole.error( '❌ Type sync failed:', error );
\tprocess.exit( 1 );
} );
`;
}

function buildRetrofitSyncProjectScriptSource(): string {
	return `/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface SyncCliOptions {
\tcheck: boolean;
}

function parseCliOptions( argv: string[] ): SyncCliOptions {
\tconst options: SyncCliOptions = {
\t\tcheck: false,
\t};

\tfor ( const argument of argv ) {
\t\tif ( argument === '--check' ) {
\t\t\toptions.check = true;
\t\t\tcontinue;
\t\t}

\t\tthrow new Error( \`Unknown sync flag: \${ argument }\` );
\t}

\treturn options;
}

function getSyncScriptEnv() {
\tconst binaryDirectory = path.join( process.cwd(), 'node_modules', '.bin' );
\tconst inheritedPath =
\t\tprocess.env.PATH ??
\t\tprocess.env.Path ??
\t\tObject.entries( process.env ).find(
\t\t\t( [ key ] ) => key.toLowerCase() === 'path'
\t\t)?.[ 1 ] ??
\t\t'';
\tconst nextPath = fs.existsSync( binaryDirectory )
\t\t? \`\${ binaryDirectory }\${ path.delimiter }\${ inheritedPath }\`
\t\t: inheritedPath;
\tconst env: NodeJS.ProcessEnv = {
\t\t...process.env,
\t};

\tfor ( const key of Object.keys( env ) ) {
\t\tif ( key.toLowerCase() === 'path' ) {
\t\t\tdelete env[ key ];
\t\t}
\t}

\tenv.PATH = nextPath;

\treturn env;
}

function runSyncScript( scriptPath: string, options: SyncCliOptions ) {
\tconst args = [ scriptPath ];
\tif ( options.check ) {
\t\targs.push( '--check' );
\t}

\tconst result = spawnSync( 'tsx', args, {
\t\tcwd: process.cwd(),
\t\tenv: getSyncScriptEnv(),
\t\tshell: process.platform === 'win32',
\t\tstdio: 'inherit',
\t} );

\tif ( result.error ) {
\t\tif ( ( result.error as NodeJS.ErrnoException ).code === 'ENOENT' ) {
\t\t\tthrow new Error(
\t\t\t\t'Unable to resolve \`tsx\` for project sync. Install project dependencies or rerun the command through your package manager.'
\t\t\t);
\t\t}

\t\tthrow result.error;
\t}

\tif ( result.status !== 0 ) {
\t\tthrow new Error( \`Sync script failed: \${ scriptPath }\` );
\t}
}

async function main() {
\tconst options = parseCliOptions( process.argv.slice( 2 ) );
\tconst syncTypesScriptPath = path.join( 'scripts', 'sync-types-to-block-json.ts' );

\trunSyncScript( syncTypesScriptPath, options );

\tconsole.log(
\t\toptions.check
\t\t\t? '✅ Generated project metadata is already synchronized.'
\t\t\t: '✅ Generated project metadata was synchronized.'
\t);
}

main().catch( ( error ) => {
\tconsole.error( '❌ Project sync failed:', error );
\tprocess.exit( 1 );
} );
`;
}

function buildLayoutDetails(projectDir: string): {
	blockNames: string[];
	blockTargets: RetrofitInitBlockTarget[];
	description: string;
	generatedArtifacts: string[];
	kind: InitPlanLayoutKind;
	notes: string[];
} {
	try {
		const discoveredLayout = discoverMigrationInitLayout(projectDir);
		const discoveredBlocks =
			discoveredLayout.mode === "multi"
				? discoveredLayout.blocks
				: [discoveredLayout.block];
		let blockTargets: RetrofitInitBlockTarget[];
		try {
			blockTargets = discoveredBlocks.map((block) =>
				buildRetrofitBlockTarget(projectDir, block),
			);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				blockNames: discoveredBlocks.map((block) => block.blockName),
				blockTargets: [],
				description:
					"Detected supported block files, but could not infer retrofit block-config metadata automatically yet.",
				generatedArtifacts: [],
				kind: "unsupported",
				notes: [message, SUPPORTED_RETROFIT_LAYOUT_NOTE],
			};
		}
		if (discoveredLayout.mode === "multi") {
			return {
				blockNames: discoveredBlocks.map((block) => block.blockName),
				blockTargets,
				description: `Detected a supported multi-block retrofit candidate (${discoveredBlocks.length} targets).`,
				generatedArtifacts: discoveredBlocks.flatMap((block) =>
					buildGeneratedArtifactPaths(block.blockJsonFile, block.manifestFile),
				),
				kind: "multi-block",
				notes: [
					"Migration bootstrap can stay optional. Add it later with `wp-typia migrate init --current-migration-version v1` once the typed sync surface is in place.",
				],
			};
		}

		return {
			blockNames: [discoveredLayout.block.blockName],
			blockTargets,
			description: "Detected a supported single-block retrofit candidate.",
			generatedArtifacts: buildGeneratedArtifactPaths(
				discoveredLayout.block.blockJsonFile,
				discoveredLayout.block.manifestFile,
			),
			kind: "single-block",
			notes:
				discoveredLayout.block.blockJsonFile === "block.json"
					? [
							"Legacy root `block.json` layouts are still supported for retrofit planning, but newer scaffolds keep generated block metadata under `src/`.",
					  ]
					: [],
		};
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			blockNames: [],
			blockTargets: [],
			description: "No supported retrofit layout was auto-detected yet.",
			generatedArtifacts: [],
			kind: "unsupported",
			notes: [message, SUPPORTED_RETROFIT_LAYOUT_NOTE],
		};
	}
}

function hasExistingWpTypiaProjectSurface(
	projectDir: string,
	packageJson: ProjectPackageJson | null,
): boolean {
	const scripts = packageJson?.scripts ?? {};
	const hasSyncSurface =
		typeof scripts.sync === "string" || typeof scripts["sync-types"] === "string";
	const hasHelperFiles = [
		path.join("scripts", "block-config.ts"),
		path.join("scripts", "sync-project.ts"),
		path.join("scripts", "sync-types-to-block-json.ts"),
	].every((relativePath) => fs.existsSync(path.join(projectDir, relativePath)));
	const hasRuntimeDeps =
		typeof getExistingDependencyVersion(packageJson, "@wp-typia/block-runtime") ===
			"string" &&
		typeof getExistingDependencyVersion(packageJson, "@wp-typia/block-types") ===
			"string";

	return hasSyncSurface && hasHelperFiles && hasRuntimeDeps;
}

function buildPlannedFiles(
	projectDir: string,
	layoutKind: InitPlanLayoutKind,
): InitFilePlan[] {
	if (layoutKind === "unsupported") {
		return [];
	}

	return [
		{
			action: fs.existsSync(path.join(projectDir, "scripts", "block-config.ts"))
				? "update"
				: "add",
			path: "scripts/block-config.ts",
			purpose:
				"Declare the current retrofit block targets so sync-types can regenerate metadata from the existing TypeScript source of truth.",
		},
		{
			action: fs.existsSync(
				path.join(projectDir, "scripts", "sync-types-to-block-json.ts"),
			)
				? "update"
				: "add",
			path: "scripts/sync-types-to-block-json.ts",
			purpose:
				"Generate block.json and Typia metadata artifacts from the current TypeScript source of truth.",
		},
		{
			action: fs.existsSync(path.join(projectDir, "scripts", "sync-project.ts"))
				? "update"
				: "add",
			path: "scripts/sync-project.ts",
			purpose:
				"Provide one shared sync entrypoint that can grow into sync-rest or workspace-aware refresh steps later.",
		},
	];
}

function buildChangeSummary(
	changes: Pick<RetrofitInitPlan, "generatedArtifacts" | "packageChanges" | "plannedFiles">,
	options: {
		includeGeneratedArtifacts: boolean;
	},
): string[] {
	const lines: string[] = [];

	for (const dependencyChange of changes.packageChanges.addDevDependencies) {
		lines.push(
			`devDependency ${dependencyChange.action} ${dependencyChange.name} -> ${dependencyChange.requiredValue}`,
		);
	}

	if (changes.packageChanges.packageManagerField) {
		lines.push(
			`packageManager ${changes.packageChanges.packageManagerField.action} -> ${changes.packageChanges.packageManagerField.requiredValue}`,
		);
	}

	for (const scriptChange of changes.packageChanges.scripts) {
		lines.push(
			`script ${scriptChange.action} ${scriptChange.name} -> ${scriptChange.requiredValue}`,
		);
	}

	for (const filePlan of changes.plannedFiles) {
		lines.push(`file ${filePlan.action} ${filePlan.path} (${filePlan.purpose})`);
	}

	if (options.includeGeneratedArtifacts) {
		for (const artifactPath of changes.generatedArtifacts) {
			lines.push(`generated artifact ${artifactPath}`);
		}
	}

	return lines;
}

function buildNextSteps(options: {
	commandMode: InitCommandMode;
	dependencyChangeCount: number;
	hasPlannedChanges: boolean;
	layoutKind: InitPlanLayoutKind;
	packageManager: PackageManagerId;
}): string[] {
	const cliSpecifier = getWpTypiaCliSpecifier();
	const syncTypesRun = formatRunScript(options.packageManager, "sync-types");
	const syncRun = formatRunScript(options.packageManager, "sync");
	const doctorRun = formatPackageExecCommand(
		options.packageManager,
		cliSpecifier,
		"doctor",
	);
	const migrationInitRun = formatPackageExecCommand(
		options.packageManager,
		cliSpecifier,
		"migrate init --current-migration-version v1",
	);
	const dependencyInstallCommand = formatAddDevDependenciesCommand(
		options.packageManager,
		buildRequiredDevDependencyMapEntries(),
	);

	if (options.layoutKind === "unsupported") {
		return [
			"Align the project to one of the supported retrofit layouts listed below, then rerun `wp-typia init`.",
			dependencyInstallCommand,
			syncTypesRun,
			doctorRun,
		];
	}

	if (options.commandMode === "apply") {
		return [
			...(options.dependencyChangeCount > 0
				? [
						"Install or reinstall project dependencies so the retrofit sync scripts and metadata generators are available locally.",
						dependencyInstallCommand,
				  ]
				: []),
			syncRun,
			doctorRun,
			`Optional migration bootstrap: ${migrationInitRun}`,
		];
	}

	const steps = [
		...(options.hasPlannedChanges
			? [
					"Re-run `wp-typia init --apply` to write the planned package.json changes and helper files automatically.",
					...(options.dependencyChangeCount > 0 ? [dependencyInstallCommand] : []),
			  ]
			: []),
		syncRun,
		doctorRun,
		`Optional migration bootstrap: ${migrationInitRun}`,
	];

	return steps;
}

function buildRequiredDevDependencyMapEntries(): string[] {
	return Object.entries(buildRequiredDevDependencyMap()).map(
		([name, version]) => `${name}@${version.replace(/^workspace:/u, "")}`,
	);
}

function buildRetrofitPlanSummary(options: {
	commandMode: InitCommandMode;
	status: InitPlanStatus;
}): string {
	if (options.status === "already-initialized") {
		return options.commandMode === "apply"
			? "This project already exposes the minimum wp-typia retrofit surface. No files were changed."
			: "This project already exposes the minimum wp-typia retrofit surface.";
	}

	if (options.commandMode === "apply") {
		return "Applied the minimum wp-typia retrofit surface so package.json and helper scripts are ready for the next install and sync run.";
	}

	return "This command previews the minimum wp-typia adoption layer for the current project without rewriting it into a full scaffold.";
}

function createRetrofitPlan(options: {
	commandMode: InitCommandMode;
	detectedLayout: {
		blockNames: string[];
		description: string;
		kind: InitPlanLayoutKind;
	};
	blockTargets: RetrofitInitBlockTarget[];
	generatedArtifacts: string[];
	nextSteps?: string[];
	notes: string[];
	packageChanges: RetrofitInitPlan["packageChanges"];
	packageManager: PackageManagerId;
	plannedFiles: InitFilePlan[];
	projectDir: string;
	projectName: string;
	status: InitPlanStatus;
}): RetrofitInitPlan {
	const includeGeneratedArtifacts = options.commandMode === "preview-only";
	const plannedChanges = buildChangeSummary(
		{
			generatedArtifacts: options.generatedArtifacts,
			packageChanges: options.packageChanges,
			plannedFiles: options.plannedFiles,
		},
		{
			includeGeneratedArtifacts,
		},
	);

	return {
		blockTargets: options.blockTargets,
		commandMode: options.commandMode,
		detectedLayout: options.detectedLayout,
		generatedArtifacts: options.generatedArtifacts,
		nextSteps:
			options.nextSteps ??
			buildNextSteps({
				commandMode: options.commandMode,
				dependencyChangeCount: options.packageChanges.addDevDependencies.length,
				hasPlannedChanges: plannedChanges.length > 0,
				layoutKind: options.detectedLayout.kind,
				packageManager: options.packageManager,
			}),
		notes: options.notes,
		packageChanges: options.packageChanges,
		plannedFiles: options.plannedFiles,
		packageManager: options.packageManager,
		projectDir: options.projectDir,
		projectName: options.projectName,
		status: options.status,
		summary: buildRetrofitPlanSummary({
			commandMode: options.commandMode,
			status: options.status,
		}),
	};
}

function setDependencyVersion(
	packageJson: ProjectPackageJson,
	name: string,
	requiredValue: string,
): void {
	if (packageJson.devDependencies?.[name] !== undefined) {
		packageJson.devDependencies[name] = requiredValue;
		return;
	}
	if (packageJson.dependencies?.[name] !== undefined) {
		packageJson.dependencies[name] = requiredValue;
		return;
	}

	packageJson.devDependencies ??= {};
	packageJson.devDependencies[name] = requiredValue;
}

function buildNextProjectPackageJson(options: {
	packageChanges: RetrofitInitPlan["packageChanges"];
	packageJson: ProjectPackageJson | null;
	packageManager: PackageManagerId;
	projectName: string;
}): ProjectPackageJson {
	const nextPackageJson: ProjectPackageJson = options.packageJson
		? JSON.parse(JSON.stringify(options.packageJson))
		: {
				name: options.projectName,
				private: true,
		  };

	nextPackageJson.devDependencies ??= {};
	nextPackageJson.scripts ??= {};

	for (const dependencyChange of options.packageChanges.addDevDependencies) {
		setDependencyVersion(
			nextPackageJson,
			dependencyChange.name,
			dependencyChange.requiredValue,
		);
	}

	if (options.packageChanges.packageManagerField) {
		nextPackageJson.packageManager =
			options.packageChanges.packageManagerField.requiredValue;
	} else if (
		!nextPackageJson.packageManager &&
		options.packageManager !== "npm"
	) {
		nextPackageJson.packageManager =
			getPackageManager(options.packageManager).packageManagerField;
	}

	for (const scriptChange of options.packageChanges.scripts) {
		nextPackageJson.scripts[scriptChange.name] = scriptChange.requiredValue;
	}

	return nextPackageJson;
}

function buildProjectPackageJsonSource(packageJson: ProjectPackageJson): string {
	return `${JSON.stringify(packageJson, null, 2)}\n`;
}

function buildRetrofitHelperFiles(
	blockTargets: RetrofitInitBlockTarget[],
): Record<string, string> {
	return {
		[path.join("scripts", "block-config.ts")]:
			buildRetrofitBlockConfigSource(blockTargets),
		[path.join("scripts", "sync-project.ts")]:
			buildRetrofitSyncProjectScriptSource(),
		[path.join("scripts", "sync-types-to-block-json.ts")]:
			buildRetrofitSyncTypesScriptSource(),
	};
}

async function createRetrofitMutationSnapshot(
	projectDir: string,
	filePaths: string[],
): Promise<WorkspaceMutationSnapshot> {
	const scriptsDir = path.join(projectDir, "scripts");
	const scriptsDirExisted = fs.existsSync(scriptsDir);
	const fileSources = await snapshotWorkspaceFiles(filePaths);
	const targetPaths = fileSources
		.filter((entry) => entry.source === null)
		.map((entry) => entry.filePath);

	if (!scriptsDirExisted) {
		targetPaths.push(scriptsDir);
	}

	return {
		fileSources,
		snapshotDirs: [],
		targetPaths,
	};
}

async function writeRetrofitFiles(options: {
	blockTargets: RetrofitInitBlockTarget[];
	packageJson: ProjectPackageJson;
	projectDir: string;
}): Promise<void> {
	const helperFiles = buildRetrofitHelperFiles(options.blockTargets);
	const scriptsDir = path.join(options.projectDir, "scripts");

	await fsp.mkdir(scriptsDir, { recursive: true });
	await fsp.writeFile(
		path.join(options.projectDir, "package.json"),
		buildProjectPackageJsonSource(options.packageJson),
		"utf8",
	);

	for (const [relativePath, source] of Object.entries(helperFiles)) {
		await fsp.writeFile(path.join(options.projectDir, relativePath), source, "utf8");
	}
}

function buildApplyFailureError(error: unknown): Error {
	const message = error instanceof Error ? error.message : String(error);
	return createCliDiagnosticCodeError(
		CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
		`Unable to apply the retrofit init plan safely. The command restored the previous package.json/helper-file snapshot. ${message}`,
		error instanceof Error ? { cause: error } : undefined,
	);
}

/**
 * Inspect one project directory and return the current retrofit init plan.
 *
 * @param projectDir Project root or nested path that should be analyzed.
 * @param options Optional package-manager override used for emitted scripts and
 * follow-up guidance.
 * @returns The preview-only retrofit init plan for the resolved project.
 */
export function getInitPlan(
	projectDir: string,
	options: {
		packageManager?: string;
	} = {},
): RetrofitInitPlan {
	const resolvedProjectDir = path.resolve(projectDir);
	const packageJson = readProjectPackageJson(resolvedProjectDir);
	const packageManager = resolveInitPackageManager(
		resolvedProjectDir,
		packageJson,
		options.packageManager,
	);
	const workspace = tryResolveWorkspaceProject(resolvedProjectDir);

	if (workspace) {
		const workspacePackageJson = readProjectPackageJson(workspace.projectDir);
		const workspacePackageManager = resolveInitPackageManager(
			workspace.projectDir,
			workspacePackageJson,
			options.packageManager,
		);
		const cliSpecifier = getWpTypiaCliSpecifier();
		return createRetrofitPlan({
			blockTargets: [],
			commandMode: "preview-only",
			detectedLayout: {
				blockNames: [],
				description: "Already an official wp-typia workspace.",
				kind: "official-workspace",
			},
			generatedArtifacts: [],
			nextSteps: [
				"Use `wp-typia add <kind> <name>` to extend the official workspace instead of rerunning init.",
				formatRunScript(workspacePackageManager, "sync"),
				formatPackageExecCommand(
					workspacePackageManager,
					cliSpecifier,
					"doctor",
				),
			],
			notes: [
				"The official workspace template already owns inventory, doctor, and add-command workflows.",
			],
			packageChanges: {
				addDevDependencies: [],
				scripts: [],
			},
			packageManager: workspacePackageManager,
			plannedFiles: [],
			projectDir: workspace.projectDir,
			projectName: workspace.packageName,
			status: "already-initialized",
		});
	}

	const projectName =
		typeof packageJson?.name === "string" && packageJson.name.length > 0
			? packageJson.name
			: path.basename(resolvedProjectDir);
	const layout = buildLayoutDetails(resolvedProjectDir);
	const dependencyChanges = buildDependencyChanges(packageJson);
	const scriptChanges = buildScriptChanges(packageJson, packageManager);
	const packageManagerFieldChange = buildPackageManagerFieldChange(
		packageJson,
		packageManager,
		{
			persistExplicitOverride: typeof options.packageManager === "string",
		},
	);
	const rawPlannedFiles =
		layout.kind === "generated-project" || layout.kind === "official-workspace"
			? []
			: buildPlannedFiles(resolvedProjectDir, layout.kind);
	const hasExistingSurface = hasExistingWpTypiaProjectSurface(
		resolvedProjectDir,
		packageJson,
	);
	const status: InitPlanStatus =
		hasExistingSurface &&
		dependencyChanges.length === 0 &&
		scriptChanges.length === 0 &&
		packageManagerFieldChange === undefined
			? "already-initialized"
			: "preview";
	const plannedFiles = status === "already-initialized" ? [] : rawPlannedFiles;
	const detectedLayout =
		status === "already-initialized" && hasExistingSurface
			? {
					blockNames: layout.blockNames,
					description:
						layout.kind === "unsupported"
							? "Already exposes the minimum wp-typia sync surface."
							: `Already exposes the minimum wp-typia sync surface for ${layout.kind === "multi-block" ? "a multi-block project" : "a single-block project"}.`,
					kind: "generated-project" as const,
			  }
			: {
					blockNames: layout.blockNames,
					description: layout.description,
					kind: layout.kind,
			  };

	return createRetrofitPlan({
		blockTargets: layout.blockTargets,
		commandMode: "preview-only",
		detectedLayout,
		generatedArtifacts:
			status === "already-initialized" && detectedLayout.kind === "generated-project"
				? []
				: layout.generatedArtifacts,
		notes: Array.from(
			new Set([
				"Preview only: `wp-typia init` does not write files yet.",
				RETROFIT_APPLY_PREVIEW_NOTE,
				...layout.notes,
			]),
		),
		packageChanges: {
			addDevDependencies: dependencyChanges,
			...(packageManagerFieldChange
				? { packageManagerField: packageManagerFieldChange }
				: {}),
			scripts: scriptChanges,
		},
		packageManager,
		plannedFiles,
		projectDir: resolvedProjectDir,
		projectName,
		status,
	});
}

/**
 * Apply the previewed retrofit init plan to disk.
 *
 * The command snapshots package.json and generated helper targets before
 * writing, then rolls those files back automatically if any write fails.
 *
 * @param projectDir Project root that should receive the retrofit surface.
 * @param options Optional package-manager override used for emitted scripts and
 * follow-up guidance.
 * @returns The applied retrofit init plan describing the persisted changes.
 */
export async function applyInitPlan(
	projectDir: string,
	options: {
		packageManager?: string;
	} = {},
): Promise<RetrofitInitPlan> {
	const previewPlan = getInitPlan(projectDir, options);

	if (previewPlan.detectedLayout.kind === "unsupported") {
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			"`wp-typia init --apply` requires a supported retrofit layout. Run `wp-typia init` first to inspect the preview plan and any blocking notes.",
		);
	}

	if (previewPlan.status === "already-initialized") {
		return createRetrofitPlan({
			...previewPlan,
			commandMode: "apply",
			notes: Array.from(
				new Set([
					...previewPlan.notes.filter(
						(note) =>
							note !== "Preview only: `wp-typia init` does not write files yet." &&
							note !== RETROFIT_APPLY_PREVIEW_NOTE,
					),
					RETROFIT_ROLLBACK_NOTE,
				]),
			),
			status: "already-initialized",
		});
	}

	const nextPackageJson = buildNextProjectPackageJson({
		packageChanges: previewPlan.packageChanges,
		packageJson: readProjectPackageJson(previewPlan.projectDir),
		packageManager: previewPlan.packageManager,
		projectName: previewPlan.projectName,
	});
	const helperFiles = buildRetrofitHelperFiles(previewPlan.blockTargets);
	const filePaths = [
		path.join(previewPlan.projectDir, "package.json"),
		...Object.keys(helperFiles).map((relativePath) =>
			path.join(previewPlan.projectDir, relativePath),
		),
	];
	const mutationSnapshot = await createRetrofitMutationSnapshot(
		previewPlan.projectDir,
		filePaths,
	);

	try {
		await writeRetrofitFiles({
			blockTargets: previewPlan.blockTargets,
			packageJson: nextPackageJson,
			projectDir: previewPlan.projectDir,
		});
	} catch (error) {
		await rollbackWorkspaceMutation(mutationSnapshot);
		throw buildApplyFailureError(error);
	}

	return createRetrofitPlan({
		...previewPlan,
		commandMode: "apply",
		notes: Array.from(
			new Set([
				...previewPlan.notes.filter(
					(note) =>
						note !== "Preview only: `wp-typia init` does not write files yet." &&
						note !== RETROFIT_APPLY_PREVIEW_NOTE,
				),
				RETROFIT_ROLLBACK_NOTE,
			]),
		),
		status: "applied",
	});
}

/**
 * Execute `wp-typia init` in preview or apply mode.
 *
 * @param options Resolved command options including the target project
 * directory, optional package-manager override, and whether writes should be
 * applied.
 * @returns The previewed or applied retrofit init plan.
 */
export async function runInitCommand(options: {
	apply?: boolean;
	packageManager?: string;
	projectDir: string;
}): Promise<RetrofitInitPlan> {
	return options.apply
		? applyInitPlan(options.projectDir, {
				packageManager: options.packageManager,
		  })
		: getInitPlan(options.projectDir, {
				packageManager: options.packageManager,
		  });
}
