import fs from "node:fs";
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
import {
	formatInstallCommand,
	formatRunScript,
} from "./package-managers.js";
import type { DataStorageMode, PersistencePolicy } from "./scaffold.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPrimaryDevelopmentScript } from "./local-dev-presets.js";
import {
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
} from "./scaffold-onboarding.js";
import { isBuiltInTemplateId } from "./template-registry.js";
import type { TemplateDefinition } from "./template-registry.js";

const OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";

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

interface RunScaffoldFlowOptions {
	allowExistingDir?: boolean;
	cwd?: string;
	dataStorageMode?: string;
	installDependencies?: Parameters<typeof scaffoldProject>[0]["installDependencies"];
	isInteractive?: boolean;
	namespace?: string;
	noInstall?: boolean;
	packageManager?: string;
	phpPrefix?: string;
	projectInput: string;
	promptText?: Parameters<typeof collectScaffoldAnswers>[0]["promptText"];
	selectDataStorage?: () => Promise<DataStorageMode>;
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
	dataStorageMode,
	persistencePolicy,
	packageManager,
	namespace,
	textDomain,
	phpPrefix,
	yes = false,
	noInstall = false,
	isInteractive = false,
	allowExistingDir = false,
	selectTemplate,
	selectDataStorage,
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
	if (!projectInput) {
		throw new Error(
			"Project directory is required. Usage: wp-typia create <project-dir> (or wp-typia <project-dir>).",
		);
	}

	const resolvedTemplateId = await resolveTemplateId({
		templateId,
		yes,
		isInteractive,
		selectTemplate,
	});
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
		templateId: resolvedTemplateId,
		textDomain,
		yes,
		promptText,
	});

	const result = await scaffoldProject({
		answers,
		allowExistingDir,
		cwd,
		dataStorageMode: resolvedDataStorage,
		installDependencies,
		noInstall,
		packageManager: resolvedPackageManager,
		persistencePolicy: resolvedPersistencePolicy,
		projectDir,
		templateId: resolvedTemplateId,
		variant,
		withMigrationUi: resolvedWithMigrationUi,
		withTestPreset: resolvedWithTestPreset,
		withWpEnv: resolvedWithWpEnv,
	});
	let availableScripts: string[] | undefined;
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

	return {
		optionalOnboarding: getOptionalOnboarding({
			availableScripts,
			packageManager: resolvedPackageManager,
			templateId: resolvedTemplateId,
			compoundPersistenceEnabled: result.variables.compoundPersistenceEnabled === "true",
		}),
		projectDir,
		projectInput,
		packageManager: resolvedPackageManager,
		result,
		nextSteps: getNextSteps({
			projectInput,
			projectDir,
			packageManager: resolvedPackageManager,
			noInstall,
			templateId: resolvedTemplateId,
		}),
	};
}
