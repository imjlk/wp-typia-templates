import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";

import {
	collectScaffoldAnswers,
	DATA_STORAGE_MODES,
	PERSISTENCE_POLICIES,
	isDataStorageMode,
	isPersistencePolicy,
	resolvePackageManagerId,
	resolveTemplateId,
	scaffoldProject,
} from "./scaffold.js";
import { parseAlternateRenderTargets } from "./alternate-render-targets.js";
import {
	formatInstallCommand,
	formatRunScript,
} from "./package-managers.js";
import type {
	DataStorageMode,
	PersistencePolicy,
	ScaffoldProgressEvent,
} from "./scaffold.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPrimaryDevelopmentScript } from "./local-dev-presets.js";
import {
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
} from "./scaffold-onboarding.js";
import { formatNonEmptyTargetDirectoryError } from "./scaffold-bootstrap.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	isBuiltInTemplateId,
} from "./template-registry.js";
import {
	resolveOptionalInteractiveExternalLayerId,
	type ExternalLayerSelectionOption,
} from "./external-layer-selection.js";
import type { TemplateDefinition } from "./template-registry.js";

interface GetNextStepsOptions {
	noInstall: boolean;
	packageManager: PackageManagerId;
	projectDir: string;
	projectInput: string;
	templateId: string;
}

interface GetOptionalOnboardingOptions {
	availableScripts?: string[];
	packageManager: PackageManagerId;
	templateId: string;
	compoundPersistenceEnabled?: boolean;
}

interface OptionalOnboardingGuidance {
	note: string;
	steps: string[];
}

export interface ScaffoldDryRunPlan {
	dependencyInstall: "skipped-by-flag" | "would-install";
	files: string[];
}

interface RunScaffoldFlowOptions {
	allowExistingDir?: boolean;
	alternateRenderTargets?: string;
	cwd?: string;
	dataStorageMode?: string;
	dryRun?: boolean;
	externalLayerId?: string;
	externalLayerSource?: string;
	installDependencies?: Parameters<typeof scaffoldProject>[0]["installDependencies"];
	isInteractive?: boolean;
	namespace?: string;
	noInstall?: boolean;
	onProgress?: ((event: ScaffoldProgressEvent) => void | Promise<void>) | undefined;
	packageManager?: string;
	phpPrefix?: string;
	projectInput: string;
	promptText?: Parameters<typeof collectScaffoldAnswers>[0]["promptText"];
	queryPostType?: string;
	selectDataStorage?: () => Promise<DataStorageMode>;
	selectExternalLayerId?: (
		options: ExternalLayerSelectionOption[],
	) => Promise<string>;
	selectPackageManager?: () => Promise<PackageManagerId>;
	selectPersistencePolicy?: () => Promise<PersistencePolicy>;
	selectTemplate?: () => Promise<TemplateDefinition["id"]>;
	selectWithMigrationUi?: () => Promise<boolean>;
	selectWithTestPreset?: () => Promise<boolean>;
	selectWithWpEnv?: () => Promise<boolean>;
	templateId?: string;
	textDomain?: string;
	variant?: string;
	persistencePolicy?: string;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	yes?: boolean;
}

async function listRelativeProjectFiles(rootDir: string): Promise<string[]> {
	const relativeFiles: string[] = [];

	async function visit(currentDir: string): Promise<void> {
		const entries = await fsp.readdir(currentDir, { withFileTypes: true });
		for (const entry of entries) {
			const absolutePath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				await visit(absolutePath);
				continue;
			}

			relativeFiles.push(
				path
					.relative(rootDir, absolutePath)
					.replace(path.sep === "\\" ? /\\/gu : /\//gu, "/"),
			);
		}
	}

	await visit(rootDir);
	return relativeFiles.sort((left, right) => left.localeCompare(right));
}

async function assertDryRunTargetDirectoryReady(
	projectDir: string,
	allowExistingDir: boolean,
): Promise<void> {
	if (!fs.existsSync(projectDir) || allowExistingDir) {
		return;
	}

	const entries = await fsp.readdir(projectDir);
	if (entries.length > 0) {
		throw new Error(formatNonEmptyTargetDirectoryError(projectDir));
	}
}

async function buildScaffoldDryRunPlan({
	allowExistingDir,
	alternateRenderTargets,
	answers,
	cwd,
	dataStorageMode,
	externalLayerId,
	externalLayerSource,
	externalLayerSourceLabel,
	installDependencies,
	noInstall,
	onProgress,
	packageManager,
	persistencePolicy,
	projectDir,
	templateId,
	variant,
	withMigrationUi,
	withTestPreset,
	withWpEnv,
}: {
	allowExistingDir: boolean;
	alternateRenderTargets?: Parameters<typeof scaffoldProject>[0]["alternateRenderTargets"];
	answers: Parameters<typeof scaffoldProject>[0]["answers"];
	cwd: string;
	dataStorageMode?: Parameters<typeof scaffoldProject>[0]["dataStorageMode"];
	externalLayerId?: string;
	externalLayerSource?: string;
	externalLayerSourceLabel?: string;
	installDependencies?: Parameters<typeof scaffoldProject>[0]["installDependencies"];
	noInstall: boolean;
	onProgress?: RunScaffoldFlowOptions["onProgress"];
	packageManager: PackageManagerId;
	persistencePolicy?: Parameters<typeof scaffoldProject>[0]["persistencePolicy"];
	projectDir: string;
	templateId: string;
	variant?: string;
	withMigrationUi: boolean;
	withTestPreset: boolean;
	withWpEnv: boolean;
}): Promise<{
	plan: ScaffoldDryRunPlan;
	result: Awaited<ReturnType<typeof scaffoldProject>>;
}> {
	await assertDryRunTargetDirectoryReady(projectDir, allowExistingDir);
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-scaffold-plan-"));
	const previewProjectDir = path.join(tempRoot, "preview-project");

	try {
		const result = await scaffoldProject({
			allowExistingDir: false,
			alternateRenderTargets,
			answers,
			cwd,
			dataStorageMode,
			externalLayerId,
			externalLayerSource,
			externalLayerSourceLabel,
			installDependencies,
			noInstall: true,
			onProgress,
			packageManager,
			persistencePolicy,
			projectDir: previewProjectDir,
			templateId,
			variant,
			withMigrationUi,
			withTestPreset,
			withWpEnv,
		});
		const files = await listRelativeProjectFiles(previewProjectDir);

		return {
			plan: {
				dependencyInstall: noInstall ? "skipped-by-flag" : "would-install",
				files,
			},
			result,
		};
	} finally {
		await fsp.rm(tempRoot, { force: true, recursive: true });
	}
}

function validateCreateProjectInput(projectInput: string) {
	const normalizedProjectInput = projectInput.trim();
	if (normalizedProjectInput.length === 0) {
		throw new Error(
			"Project directory is required. Usage: wp-typia create <project-dir> (or wp-typia <project-dir> when <project-dir> is the only positional argument).",
		);
	}

	const normalizedProjectPath =
		path.normalize(normalizedProjectInput).replace(/[\\/]+$/u, "") ||
		path.normalize(normalizedProjectInput);
	if (normalizedProjectPath === "." || normalizedProjectPath === "..") {
		throw new Error(
			"`wp-typia create` requires a new project directory. Use an explicit child directory instead of `.` or `..`.",
		);
	}
}

function collectProjectDirectoryWarnings(projectDir: string): string[] {
	const warnings: string[] = [];
	const projectName = path.basename(projectDir);
	if (/\s/u.test(projectName)) {
		warnings.push(
			`Project directory "${projectName}" contains spaces. The generated next-step commands will be quoted, but a simple kebab-case directory name is usually easier to use with shells and downstream tooling.`,
		);
	}

	const shellSensitiveCharacters = Array.from(
		new Set(projectName.match(/[^A-Za-z0-9._ -]/gu) ?? []),
	);
	if (shellSensitiveCharacters.length > 0) {
		warnings.push(
			`Project directory "${projectName}" contains shell-sensitive characters (${shellSensitiveCharacters.join(", ")}). Prefer letters, numbers, ".", "_" and "-" when possible.`,
		);
	}

	return warnings;
}

function templateUsesPersistenceSettings(
	templateId: string,
	options: {
		dataStorageMode?: string;
		persistencePolicy?: string;
	},
): boolean {
	if (templateId === "persistence") {
		return true;
	}

	if (templateId !== "compound") {
		return false;
	}

	return Boolean(options.dataStorageMode || options.persistencePolicy);
}

function templateSupportsPersistenceFlags(templateId: string): boolean {
	return templateId === "persistence" || templateId === "compound";
}

function createTemplateLabel(templateId: string): string {
	return templateId === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
		? "`--template workspace`"
		: `"${templateId}"`;
}

function collectTemplateCapabilityWarnings(options: {
	queryPostType?: string;
	templateId: string;
	withMigrationUi?: boolean;
}): string[] {
	const warnings: string[] = [];
	const trimmedQueryPostType = options.queryPostType?.trim();

	if (
		trimmedQueryPostType &&
		options.templateId !== "query-loop" &&
		(isBuiltInTemplateId(options.templateId) ||
			options.templateId === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE)
	) {
		warnings.push(
			`\`--query-post-type\` only applies to \`wp-typia create --template query-loop\`, which scaffolds a create-time \`core/query\` variation instead of a standalone block. ${createTemplateLabel(options.templateId)} will ignore "${trimmedQueryPostType}".`,
		);
	}

	if (
		options.withMigrationUi === true &&
		!isBuiltInTemplateId(options.templateId) &&
		options.templateId !== OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
	) {
		warnings.push(
			`\`--with-migration-ui\` was ignored for ${createTemplateLabel(options.templateId)}. Migration UI currently scaffolds built-in templates and the official \`--template workspace\` flow; external templates still need to opt into that surface explicitly.`,
		);
	}

	return warnings;
}

function templateSupportsAlternateRenderTargets(options: {
	alternateRenderTargets?: string;
	dataStorageMode?: string;
	persistencePolicy?: string;
	templateId: string;
}): boolean {
	if (!options.alternateRenderTargets) {
		return false;
	}

	if (options.templateId === "persistence") {
		return true;
	}

	if (options.templateId !== "compound") {
		return false;
	}

	return templateUsesPersistenceSettings(options.templateId, {
		dataStorageMode: options.dataStorageMode,
		persistencePolicy: options.persistencePolicy,
	});
}

function validateCreateFlagContract(options: {
	alternateRenderTargets?: string;
	dataStorageMode?: string;
	persistencePolicy?: string;
	templateId: string;
	variant?: string;
}) {
	const {
		alternateRenderTargets,
		dataStorageMode,
		persistencePolicy,
		templateId,
		variant,
	} = options;
	if (
		(dataStorageMode || persistencePolicy) &&
		!templateSupportsPersistenceFlags(templateId)
	) {
		throw new Error(
			"`--data-storage` and `--persistence-policy` are supported only for `wp-typia create --template persistence` or `--template compound`.",
		);
	}
	if (
		alternateRenderTargets &&
		!templateSupportsAlternateRenderTargets({
			alternateRenderTargets,
			dataStorageMode,
			persistencePolicy,
			templateId,
		})
	) {
		if (templateId === "compound") {
			throw new Error(
				"`--alternate-render-targets` on `wp-typia create --template compound` requires the persistence-enabled server render path. Add `--data-storage <post-meta|custom-table>` or `--persistence-policy <authenticated|public>` first.",
			);
		}
		throw new Error(
			"`--alternate-render-targets` is supported only for `wp-typia create --template persistence` or persistence-enabled `--template compound` scaffolds.",
		);
	}
	parseAlternateRenderTargets(alternateRenderTargets);

	if (variant && isBuiltInTemplateId(templateId)) {
		throw new Error(
			`--variant is only supported for official external template configs. Received variant "${variant}" for built-in template "${templateId}".`,
		);
	}
}

function parseSelectableValue<T extends string>(
	label: string,
	value: string,
	isValue: (input: string) => input is T,
	allowedValues: readonly T[],
): T {
	if (isValue(value)) {
		return value;
	}

	throw new Error(
		`Unsupported ${label} "${value}". Expected one of: ${allowedValues.join(", ")}`,
	);
}

async function resolveOptionalSelection<T extends string>({
	defaultValue,
	explicitValue,
	isInteractive,
	isValue,
	label,
	allowedValues,
	select,
	shouldResolve = true,
	yes,
}: {
	defaultValue: T;
	explicitValue?: string;
	isInteractive: boolean;
	isValue: (input: string) => input is T;
	label: string;
	allowedValues: readonly T[];
	select?: () => Promise<T>;
	shouldResolve?: boolean;
	yes: boolean;
}): Promise<T | undefined> {
	if (!shouldResolve) {
		return undefined;
	}

	if (explicitValue) {
		return parseSelectableValue(label, explicitValue, isValue, allowedValues);
	}

	if (yes) {
		return defaultValue;
	}

	if (isInteractive && select) {
		return select();
	}

	return defaultValue;
}

async function resolveOptionalBooleanFlag({
	defaultValue = false,
	disabled = false,
	explicitValue,
	isInteractive,
	select,
	yes,
}: {
	defaultValue?: boolean;
	disabled?: boolean;
	explicitValue?: boolean;
	isInteractive: boolean;
	select?: () => Promise<boolean>;
	yes: boolean;
}): Promise<boolean> {
	if (disabled) {
		return defaultValue;
	}

	if (typeof explicitValue === "boolean") {
		return explicitValue;
	}

	if (yes) {
		return defaultValue;
	}

	if (isInteractive && select) {
		return select();
	}

	return defaultValue;
}

function quoteShellValue(value: string): string {
	if (
		!value.startsWith("-") &&
		/^[A-Za-z0-9._/@:-]+(?:\/[A-Za-z0-9._@:-]+)*$/.test(value)
	) {
		return value;
	}

	return `'${value.replace(/'/g, `'\"'\"'`)}'`;
}

/**
 * Build the printed next-step commands for a scaffolded project.
 *
 * @param options Project location and package-manager details used to format
 * next-step commands.
 * @returns Ordered shell commands shown after scaffolding succeeds.
 */
export function getNextSteps({
	projectInput,
	projectDir,
	packageManager,
	noInstall,
	templateId,
}: GetNextStepsOptions): string[] {
	const cdTarget = path.isAbsolute(projectInput) ? projectDir : projectInput;
	const steps = [`cd ${quoteShellValue(cdTarget)}`];

	if (noInstall) {
		steps.push(formatInstallCommand(packageManager));
	}

	steps.push(formatRunScript(packageManager, getPrimaryDevelopmentScript(templateId)));
	return steps;
}

/**
 * Compute optional onboarding guidance shown after scaffolding completes.
 *
 * @param options Package-manager and template context for optional guidance.
 * @returns Optional onboarding note and step list.
 */
export function getOptionalOnboarding({
	availableScripts,
	packageManager,
	templateId,
	compoundPersistenceEnabled = false,
}: GetOptionalOnboardingOptions): OptionalOnboardingGuidance {
	return {
		note: getOptionalOnboardingNote(packageManager, templateId, {
			availableScripts,
			compoundPersistenceEnabled,
		}),
		steps: getOptionalOnboardingSteps(packageManager, templateId, {
			availableScripts,
			compoundPersistenceEnabled,
		}),
	};
}

/**
 * Resolve scaffold options, prompts, and follow-up steps for one CLI run.
 *
 * @param options CLI/runtime inputs used to collect answers and scaffold a
 * project.
 * @returns The scaffold result together with next-step guidance.
 */
export async function runScaffoldFlow({
	projectInput,
	cwd = process.cwd(),
	templateId,
	alternateRenderTargets,
	dataStorageMode,
	dryRun = false,
	externalLayerId,
	externalLayerSource,
	persistencePolicy,
	packageManager,
	namespace,
	textDomain,
	phpPrefix,
	queryPostType,
	yes = false,
	noInstall = false,
	onProgress,
	isInteractive = false,
	allowExistingDir = false,
	selectTemplate,
	selectDataStorage,
	selectExternalLayerId,
	selectPersistencePolicy,
	selectPackageManager,
	promptText,
	installDependencies = undefined,
	variant,
	selectWithTestPreset,
	selectWithWpEnv,
	selectWithMigrationUi,
	withMigrationUi,
	withTestPreset,
	withWpEnv,
}: RunScaffoldFlowOptions) {
	const normalizedExternalLayerId =
		typeof externalLayerId === "string" && externalLayerId.trim().length > 0
			? externalLayerId.trim()
			: undefined;
	const normalizedExternalLayerSource =
		typeof externalLayerSource === "string" &&
		externalLayerSource.trim().length > 0
			? externalLayerSource.trim()
			: undefined;

	validateCreateProjectInput(projectInput);

	const resolvedTemplateId = await resolveTemplateId({
		templateId,
		yes,
		isInteractive,
		selectTemplate,
	});
	validateCreateFlagContract({
		alternateRenderTargets,
		dataStorageMode,
		persistencePolicy,
		templateId: resolvedTemplateId,
		variant,
	});
	const resolvedExternalLayerSelection =
		isBuiltInTemplateId(resolvedTemplateId) && isInteractive
			? await resolveOptionalInteractiveExternalLayerId({
					callerCwd: cwd,
					externalLayerId: normalizedExternalLayerId,
					externalLayerSource: normalizedExternalLayerSource,
					selectExternalLayerId,
				})
			: {
					externalLayerId: normalizedExternalLayerId,
					externalLayerSource: normalizedExternalLayerSource,
				};
	try {
		const shouldResolvePersistence = templateUsesPersistenceSettings(resolvedTemplateId, {
			dataStorageMode,
			persistencePolicy,
		});
		const resolvedDataStorage = await resolveOptionalSelection({
			allowedValues: DATA_STORAGE_MODES,
			defaultValue: "custom-table",
			explicitValue: dataStorageMode,
			isInteractive,
			isValue: isDataStorageMode,
			label: "data storage mode",
			select: selectDataStorage,
			shouldResolve: shouldResolvePersistence,
			yes,
		});
		const resolvedPersistencePolicy = await resolveOptionalSelection({
			allowedValues: PERSISTENCE_POLICIES,
			defaultValue: "authenticated",
			explicitValue: persistencePolicy,
			isInteractive,
			isValue: isPersistencePolicy,
			label: "persistence policy",
			select: selectPersistencePolicy,
			shouldResolve: shouldResolvePersistence,
			yes,
		});
		const resolvedPackageManager = await resolvePackageManagerId({
			packageManager,
			yes,
			isInteractive,
			selectPackageManager,
		});
		const resolvedWithWpEnv = await resolveOptionalBooleanFlag({
			explicitValue: withWpEnv,
			isInteractive,
			select: selectWithWpEnv,
			yes,
		});
		const resolvedWithTestPreset = await resolveOptionalBooleanFlag({
			explicitValue: withTestPreset,
			isInteractive,
			select: selectWithTestPreset,
			yes,
		});
		const resolvedWithMigrationUi = await resolveOptionalBooleanFlag({
			disabled:
				!isBuiltInTemplateId(resolvedTemplateId) &&
				resolvedTemplateId !== OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
			explicitValue: withMigrationUi,
			isInteractive,
			select: selectWithMigrationUi,
			yes,
		});
		const projectDir = path.resolve(cwd, projectInput);
		const projectName = path.basename(projectDir);
		const answers = await collectScaffoldAnswers({
			dataStorageMode: resolvedDataStorage,
			namespace,
			persistencePolicy: resolvedPersistencePolicy,
			phpPrefix,
			projectName,
			queryPostType,
			templateId: resolvedTemplateId,
			textDomain,
			yes,
			promptText,
		});

		const resolvedResult = dryRun
			? await buildScaffoldDryRunPlan({
					allowExistingDir,
					alternateRenderTargets,
					answers,
					cwd,
					dataStorageMode: resolvedDataStorage,
					externalLayerId: resolvedExternalLayerSelection.externalLayerId,
					externalLayerSource:
						resolvedExternalLayerSelection.externalLayerSource,
					externalLayerSourceLabel: normalizedExternalLayerSource,
					installDependencies,
					noInstall,
					onProgress,
					packageManager: resolvedPackageManager,
					persistencePolicy: resolvedPersistencePolicy,
					projectDir,
					templateId: resolvedTemplateId,
					variant,
					withMigrationUi: resolvedWithMigrationUi,
					withTestPreset: resolvedWithTestPreset,
					withWpEnv: resolvedWithWpEnv,
				})
			: {
					plan: undefined,
					result: await scaffoldProject({
						alternateRenderTargets,
						answers,
						allowExistingDir,
						cwd,
						dataStorageMode: resolvedDataStorage,
						externalLayerId: resolvedExternalLayerSelection.externalLayerId,
						externalLayerSource:
							resolvedExternalLayerSelection.externalLayerSource,
						externalLayerSourceLabel: normalizedExternalLayerSource,
						installDependencies,
						noInstall,
						onProgress,
						packageManager: resolvedPackageManager,
						persistencePolicy: resolvedPersistencePolicy,
						projectDir,
						templateId: resolvedTemplateId,
						variant,
						withMigrationUi: resolvedWithMigrationUi,
						withTestPreset: resolvedWithTestPreset,
						withWpEnv: resolvedWithWpEnv,
					}),
				};
		let availableScripts: string[] | undefined;
		if (!dryRun) {
			try {
				const parsedPackageJson = JSON.parse(
					fs.readFileSync(path.join(projectDir, "package.json"), "utf8"),
				) as {
					scripts?: unknown;
				};
				const scripts =
					parsedPackageJson.scripts &&
					typeof parsedPackageJson.scripts === "object" &&
					!Array.isArray(parsedPackageJson.scripts)
						? parsedPackageJson.scripts
						: {};
				availableScripts = Object.entries(scripts)
					.filter(([, value]) => typeof value === "string")
					.map(([scriptName]) => scriptName);
			} catch {
				availableScripts = undefined;
			}
		}

		return {
			dryRun,
			optionalOnboarding: getOptionalOnboarding({
				availableScripts,
				packageManager: resolvedPackageManager,
				templateId: resolvedTemplateId,
				compoundPersistenceEnabled:
					resolvedResult.result.variables.compoundPersistenceEnabled === "true",
			}),
			plan: resolvedResult.plan,
			projectDir,
			projectInput,
			packageManager: resolvedPackageManager,
			nextSteps: getNextSteps({
				projectInput,
				projectDir,
				packageManager: resolvedPackageManager,
				noInstall,
				templateId: resolvedTemplateId,
			}),
			result: {
				...resolvedResult.result,
				warnings: [
					...resolvedResult.result.warnings,
					...collectTemplateCapabilityWarnings({
						queryPostType,
						templateId: resolvedTemplateId,
						withMigrationUi,
					}),
					...collectProjectDirectoryWarnings(projectDir),
				],
			},
		};
	} finally {
		await resolvedExternalLayerSelection.cleanup?.();
	}
}
