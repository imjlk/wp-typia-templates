import fs from "node:fs";
import path from "node:path";

import { analyzeSourceTypes } from "@wp-typia/block-runtime/metadata-parser";
import ts from "typescript";

import { discoverMigrationInitLayout } from "./migration-project.js";
import type { MigrationBlockConfig } from "./migration-types.js";
import {
	formatAddDevDependenciesCommand,
	formatPackageExecCommand,
	formatRunScript,
	type PackageManagerId,
} from "./package-managers.js";
import { toPascalCase } from "./string-case.js";
import {
	buildDependencyChanges,
	buildPackageManagerFieldChange,
	buildRequiredDevDependencyMapEntries,
	buildScriptChanges,
	getWpTypiaCliSpecifier,
	hasExistingWpTypiaProjectSurface,
	readProjectPackageJson,
	resolveInitPackageManager,
} from "./cli-init-package-json.js";
import {
	RETROFIT_APPLY_PREVIEW_NOTE,
	SUPPORTED_RETROFIT_LAYOUT_NOTE,
	type InitCommandMode,
	type InitFilePlan,
	type InitPlanLayoutKind,
	type InitPlanStatus,
	type RetrofitInitBlockTarget,
	type RetrofitInitPlan,
} from "./cli-init-types.js";
import { tryResolveWorkspaceProject } from "./workspace-project.js";

function normalizeRelativePath(value: string): string {
	return value.replace(/\\/gu, "/");
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

export function buildInitLayoutDetails(projectDir: string): {
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
	changes: Pick<
		RetrofitInitPlan,
		"generatedArtifacts" | "packageChanges" | "plannedFiles"
	>,
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

export function createRetrofitPlan(options: {
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
	const layout = buildInitLayoutDetails(resolvedProjectDir);
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
