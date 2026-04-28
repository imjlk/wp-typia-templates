import fs from "node:fs";
import path from "node:path";

import {
	CLI_DIAGNOSTIC_CODES,
	createCliDiagnosticCodeError,
} from "./cli-diagnostics.js";
import { discoverMigrationInitLayout } from "./migration-project.js";
import {
	formatAddDevDependenciesCommand,
	formatPackageExecCommand,
	formatRunScript,
	getPackageManager,
	transformPackageManagerText,
	type PackageManagerId,
} from "./package-managers.js";
import { getPackageVersions } from "./package-versions.js";
import {
	parseWorkspacePackageManagerId,
	tryResolveWorkspaceProject,
	type WorkspacePackageJson,
} from "./workspace-project.js";

type InitPlanAction = "add" | "update";
type InitPlanStatus = "already-initialized" | "preview";
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
	path: string;
	purpose: string;
}

export interface RetrofitInitPlan {
	commandMode: "preview-only";
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

	try {
		return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as ProjectPackageJson;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw createCliDiagnosticCodeError(
			CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
			`Unable to parse ${packageJsonPath}: ${message}`,
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

function getWpTypiaCliSpecifier(): string {
	const versions = getPackageVersions();
	return versions.wpTypiaPackageExactVersion === "0.0.0"
		? "wp-typia"
		: `wp-typia@${versions.wpTypiaPackageExactVersion}`;
}

function buildRequiredDevDependencyMap(): Record<string, string> {
	const versions = getPackageVersions();
	return {
		"@typia/unplugin": "^12.0.1",
		"@wp-typia/block-runtime": versions.blockRuntimePackageVersion,
		"@wp-typia/block-types": versions.blockTypesPackageVersion,
		tsx: "^4.20.5",
		typescript: "^5.9.2",
		typia: "^12.0.1",
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
): InitPackageManagerFieldChange | undefined {
	if (packageManager === "npm") {
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

function buildLayoutDetails(projectDir: string): {
	blockNames: string[];
	description: string;
	generatedArtifacts: string[];
	kind: InitPlanLayoutKind;
	notes: string[];
} {
	try {
		const discoveredLayout = discoverMigrationInitLayout(projectDir);
		if (discoveredLayout.mode === "multi") {
			return {
				blockNames: discoveredLayout.blocks.map((block) => block.blockName),
				description: `Detected a supported multi-block retrofit candidate (${discoveredLayout.blocks.length} targets).`,
				generatedArtifacts: discoveredLayout.blocks.flatMap((block) =>
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
			description: "No supported retrofit layout was auto-detected yet.",
			generatedArtifacts: [],
			kind: "unsupported",
			notes: [message, SUPPORTED_RETROFIT_LAYOUT_NOTE],
		};
	}
}

function hasExistingWpTypiaProjectSurface(
	packageJson: ProjectPackageJson | null,
): boolean {
	const scripts = packageJson?.scripts ?? {};
	const hasSyncSurface =
		typeof scripts.sync === "string" || typeof scripts["sync-types"] === "string";
	const hasRuntimeDeps =
		typeof getExistingDependencyVersion(packageJson, "@wp-typia/block-runtime") ===
			"string" &&
		typeof getExistingDependencyVersion(packageJson, "@wp-typia/block-types") ===
			"string";

	return hasSyncSurface && hasRuntimeDeps;
}

function buildPlannedFiles(layoutKind: InitPlanLayoutKind): InitFilePlan[] {
	const plannedFiles: InitFilePlan[] = [
		{
			path: "scripts/sync-types-to-block-json.ts",
			purpose:
				"Generate block.json and Typia metadata artifacts from the current TypeScript source of truth.",
		},
		{
			path: "scripts/sync-project.ts",
			purpose:
				"Provide one shared sync entrypoint that can grow into sync-rest or workspace-aware refresh steps later.",
		},
	];

	if (layoutKind === "unsupported") {
		plannedFiles.unshift({
			path: "package.json",
			purpose:
				"Add the minimum wp-typia devDependencies and scripts once the project matches a supported retrofit layout.",
		});
	}

	return plannedFiles;
}

function buildChangeSummary(
	changes: Pick<RetrofitInitPlan, "generatedArtifacts" | "packageChanges" | "plannedFiles">,
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
		lines.push(`file add ${filePlan.path} (${filePlan.purpose})`);
	}

	for (const artifactPath of changes.generatedArtifacts) {
		lines.push(`generated artifact ${artifactPath}`);
	}

	return lines;
}

function buildNextSteps(options: {
	changeSummaryLines: string[];
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

	const steps = [
		...(options.changeSummaryLines.length > 0
			? [
					"Apply the planned package.json changes and helper files listed below.",
					dependencyInstallCommand,
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

export function getInitPlan(projectDir: string): RetrofitInitPlan {
	const resolvedProjectDir = path.resolve(projectDir);
	const packageJson = readProjectPackageJson(resolvedProjectDir);
	const packageManager = inferInitPackageManager(resolvedProjectDir, packageJson);
	const workspace = tryResolveWorkspaceProject(resolvedProjectDir);

	if (workspace) {
		return {
			commandMode: "preview-only",
			detectedLayout: {
				blockNames: [],
				description: "Already an official wp-typia workspace.",
				kind: "official-workspace",
			},
			generatedArtifacts: [],
			nextSteps: [
				formatPackageExecCommand(packageManager, getWpTypiaCliSpecifier(), "doctor"),
				"Use `wp-typia add ...` to extend this workspace instead of rerunning init.",
			],
			notes: [
				"The official workspace template already owns inventory, doctor, and add-command workflows.",
			],
			packageChanges: {
				addDevDependencies: [],
				scripts: [],
			},
			plannedFiles: [],
			packageManager,
			projectDir: workspace.projectDir,
			projectName: workspace.packageName,
			status: "already-initialized",
			summary:
				"This directory is already an official wp-typia workspace. No retrofit bootstrap is needed.",
		};
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
	);
	const rawPlannedFiles =
		layout.kind === "generated-project" || layout.kind === "official-workspace"
			? []
			: buildPlannedFiles(layout.kind);
	const hasExistingSurface = hasExistingWpTypiaProjectSurface(packageJson);
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
	const plan: RetrofitInitPlan = {
		commandMode: "preview-only",
		detectedLayout,
		generatedArtifacts:
			status === "already-initialized" && detectedLayout.kind === "generated-project"
				? []
				: layout.generatedArtifacts,
		nextSteps: buildNextSteps({
			changeSummaryLines: buildChangeSummary({
				generatedArtifacts:
					status === "already-initialized" &&
					detectedLayout.kind === "generated-project"
						? []
						: layout.generatedArtifacts,
				packageChanges: {
					addDevDependencies: dependencyChanges,
					...(packageManagerFieldChange
						? { packageManagerField: packageManagerFieldChange }
						: {}),
					scripts: scriptChanges,
				},
				plannedFiles,
			}),
			layoutKind: detectedLayout.kind,
			packageManager,
		}),
		notes: Array.from(
			new Set([
				"Preview only: `wp-typia init` does not write files yet.",
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
		plannedFiles,
		packageManager,
		projectDir: resolvedProjectDir,
		projectName,
		status,
		summary:
			status === "already-initialized"
				? "This project already exposes the minimum wp-typia retrofit surface."
				: "This command previews the minimum wp-typia adoption layer for the current project without rewriting it into a full scaffold.",
	};

	return plan;
}
