import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

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
	PACKAGE_MANAGER_IDS,
	formatInstallCommand,
	formatRunScript,
	getPackageManagerSelectOptions,
} from "./package-managers.js";
import type { DataStorageMode, PersistencePolicy } from "./scaffold.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPrimaryDevelopmentScript } from "./local-dev-presets.js";
import {
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
} from "./scaffold-onboarding.js";
import { getBuiltInTemplateLayerDirs } from "./template-builtins.js";
import {
	TEMPLATE_IDS,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
} from "./template-registry.js";
import type { TemplateDefinition } from "./template-registry.js";

type ValidateInput = (value: string) => boolean | string;

interface PromptOption<T extends string> {
	hint?: string;
	label: string;
	value: T;
}

interface ReadlinePrompt {
	close(): void;
	select<T extends string>(message: string, options: PromptOption<T>[], defaultValue?: number): Promise<T>;
	text(message: string, defaultValue: string, validate?: ValidateInput): Promise<string>;
}

interface DoctorCheck {
	detail: string;
	label: string;
	status: "pass" | "fail";
}

interface RunDoctorOptions {
	renderLine?: (check: DoctorCheck) => void;
}

interface GetNextStepsOptions {
	noInstall: boolean;
	packageManager: PackageManagerId;
	projectDir: string;
	projectInput: string;
	templateId: string;
}

interface GetOptionalOnboardingOptions {
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

export function createReadlinePrompt(): ReadlinePrompt {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return {
		async text(message: string, defaultValue: string, validate?: ValidateInput): Promise<string> {
			const suffix = defaultValue ? ` (${defaultValue})` : "";
			const answer = await new Promise<string>((resolve) => {
				rl.question(`${message}${suffix}: `, resolve);
			});

			const value = String(answer).trim() || defaultValue;
			if (validate) {
				const result = validate(value);
					if (result !== true) {
						console.error(`❌ ${typeof result === "string" ? result : "Invalid input"}`);
					return this.text(message, defaultValue, validate);
				}
			}

			return value;
		},
		async select<T extends string>(
			message: string,
			options: PromptOption<T>[],
			defaultValue = 1,
		): Promise<T> {
			console.log(message);
			options.forEach((option, index) => {
				const hint = option.hint ? ` - ${option.hint}` : "";
				console.log(`  ${index + 1}. ${option.label}${hint}`);
			});

			const answer = await this.text("Choice", String(defaultValue));
			const numericChoice = Number(answer);
			if (!Number.isNaN(numericChoice) && options[numericChoice - 1]) {
				return options[numericChoice - 1].value;
			}

			const directChoice = options.find((option) => option.value === answer);
			if (directChoice) {
				return directChoice.value;
			}

			console.error(`❌ Invalid selection: ${answer}`);
			return this.select(message, options, defaultValue);
		},
		close(): void {
			rl.close();
		},
	};
}

export function formatHelpText(): string {
	return `Usage:
  wp-typia <project-dir> [--template <basic|interactivity|persistence|compound|./path|github:owner/repo/path[#ref]>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template <npm-package>] [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template persistence] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template compound] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--with-migration-ui] [--with-wp-env] [--with-test-preset] [--yes] [--no-install] [--package-manager <id>]
  wp-typia templates list
  wp-typia templates inspect <id>
  wp-typia migrations <init|snapshot|diff|scaffold|verify|doctor|fixtures|fuzz> [...]
  wp-typia doctor

Built-in templates: ${TEMPLATE_IDS.join(", ")}
Package managers: ${PACKAGE_MANAGER_IDS.join(", ")}`;
}

export function formatTemplateSummary(template: TemplateDefinition): string {
	return `${template.id.padEnd(14)} ${template.description}`;
}

export function formatTemplateFeatures(template: TemplateDefinition): string {
	return `  ${template.features.join(" • ")}`;
}

export function formatTemplateDetails(template: TemplateDefinition): string {
	const layers =
		template.id === "persistence"
			? [
					`authenticated: ${getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "authenticated" }).join(" -> ")}`,
					`public: ${getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "public" }).join(" -> ")}`,
				]
			: template.id === "compound"
				? [
						`pure: ${getBuiltInTemplateLayerDirs(template.id).join(" -> ")}`,
						`authenticated+persistence: ${getBuiltInTemplateLayerDirs(template.id, {
							persistenceEnabled: true,
							persistencePolicy: "authenticated",
						}).join(" -> ")}`,
						`public+persistence: ${getBuiltInTemplateLayerDirs(template.id, {
							persistenceEnabled: true,
							persistencePolicy: "public",
						}).join(" -> ")}`,
					]
			: [getBuiltInTemplateLayerDirs(template.id).join(" -> ")];
	return [
		template.id,
		template.description,
		`Category: ${template.defaultCategory}`,
		`Overlay path: ${template.templateDir}`,
		`Layers: ${layers.join("\n")}`,
		`Features: ${template.features.join(", ")}`,
	].join("\n");
}

function readCommandVersion(command: string, args: string[] = ["--version"]): string | null {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

function compareMajorVersion(actualVersion: string, minimumMajor: number): boolean {
	const parsed = Number.parseInt(actualVersion.replace(/^v/, "").split(".")[0] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= minimumMajor;
}

async function checkWritableDirectory(directory: string): Promise<boolean> {
	try {
		await access(directory, fsConstants.W_OK);
		return true;
	} catch {
		return false;
	}
}

async function checkTempDirectory(): Promise<boolean> {
	const tempFile = path.join(os.tmpdir(), `wp-typia-${Date.now()}.tmp`);
	try {
		await writeFile(tempFile, "ok", "utf8");
		await rm(tempFile, { force: true });
		return true;
	} catch {
		return false;
	}
}

export async function getDoctorChecks(cwd: string): Promise<DoctorCheck[]> {
	const checks: DoctorCheck[] = [];
	const bunVersion = readCommandVersion("bun");
	const nodeVersion = readCommandVersion("node");
	const gitVersion = readCommandVersion("git");
	const cwdWritable = await checkWritableDirectory(cwd);
	const tempWritable = await checkTempDirectory();

	checks.push({
		status: bunVersion && compareMajorVersion(bunVersion, 1) ? "pass" : "fail",
		label: "Bun",
		detail: bunVersion ? `Detected ${bunVersion}` : "Not available",
	});
	checks.push({
		status: nodeVersion && compareMajorVersion(nodeVersion, 20) ? "pass" : "fail",
		label: "Node",
		detail: nodeVersion ? `Detected ${nodeVersion}` : "Not available",
	});
	checks.push({
		status: gitVersion ? "pass" : "fail",
		label: "git",
		detail: gitVersion ?? "Not available",
	});
	checks.push({
		status: cwdWritable ? "pass" : "fail",
		label: "Current directory",
		detail: cwdWritable ? "Writable" : "Not writable",
	});
	checks.push({
		status: tempWritable ? "pass" : "fail",
		label: "Temp directory",
		detail: tempWritable ? "Writable" : "Not writable",
	});

	for (const template of listTemplates()) {
		const layerDirs =
			template.id === "persistence"
				? Array.from(
						new Set([
							...getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "authenticated" }),
							...getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "public" }),
						]),
					)
				: template.id === "compound"
					? Array.from(
							new Set([
								...getBuiltInTemplateLayerDirs(template.id),
								...getBuiltInTemplateLayerDirs(template.id, {
									persistenceEnabled: true,
									persistencePolicy: "authenticated",
								}),
								...getBuiltInTemplateLayerDirs(template.id, {
									persistenceEnabled: true,
									persistencePolicy: "public",
								}),
							]),
						)
					: getBuiltInTemplateLayerDirs(template.id);
		const hasAssets =
			layerDirs.every((layerDir) => fs.existsSync(layerDir)) &&
			layerDirs.some((layerDir) => fs.existsSync(path.join(layerDir, "package.json.mustache"))) &&
			layerDirs.some((layerDir) => fs.existsSync(path.join(layerDir, "src")));
		checks.push({
			status: hasAssets ? "pass" : "fail",
			label: `Template ${template.id}`,
			detail: hasAssets ? layerDirs.join(" + ") : "Missing core template assets",
		});
	}

	return checks;
}

export async function runDoctor(
	cwd: string,
	{ renderLine = (check: DoctorCheck) => console.log(`${check.status.toUpperCase()} ${check.label}: ${check.detail}`) }: RunDoctorOptions = {},
): Promise<DoctorCheck[]> {
	const checks = await getDoctorChecks(cwd);

	for (const check of checks) {
		renderLine(check);
	}

	if (checks.some((check) => check.status === "fail")) {
		throw new Error("Doctor found one or more failing checks.");
	}

	return checks;
}

export function getNextSteps({
	projectInput,
	projectDir,
	packageManager,
	noInstall,
	templateId,
}: GetNextStepsOptions): string[] {
	const steps = [`cd ${path.isAbsolute(projectInput) ? projectDir : projectInput}`];

	if (noInstall) {
		steps.push(formatInstallCommand(packageManager));
	}

	steps.push(formatRunScript(packageManager, getPrimaryDevelopmentScript(templateId)));
	return steps;
}

export function getOptionalOnboarding({
	packageManager,
	templateId,
	compoundPersistenceEnabled = false,
}: GetOptionalOnboardingOptions): OptionalOnboardingGuidance {
	return {
		note: getOptionalOnboardingNote(packageManager, templateId),
		steps: getOptionalOnboardingSteps(packageManager, templateId, {
			compoundPersistenceEnabled,
		}),
	};
}

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
		throw new Error("Project directory is required. Usage: wp-typia <project-dir>");
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
	const resolvedDataStorage =
		!shouldResolvePersistence
			? undefined
			: dataStorageMode
				? isDataStorageMode(dataStorageMode)
					? dataStorageMode
					: (() => {
						throw new Error(
							`Unsupported data storage mode "${dataStorageMode}". Expected one of: ${DATA_STORAGE_MODES.join(", ")}`,
						);
					})()
				: yes
					? "custom-table"
					: isInteractive && selectDataStorage
						? await selectDataStorage()
						: "custom-table";
	const resolvedPersistencePolicy =
		!shouldResolvePersistence
			? undefined
			: persistencePolicy
				? isPersistencePolicy(persistencePolicy)
					? persistencePolicy
					: (() => {
						throw new Error(
							`Unsupported persistence policy "${persistencePolicy}". Expected one of: ${PERSISTENCE_POLICIES.join(", ")}`,
						);
					})()
				: yes
					? "authenticated"
					: isInteractive && selectPersistencePolicy
						? await selectPersistencePolicy()
						: "authenticated";
	const resolvedPackageManager = await resolvePackageManagerId({
		packageManager,
		yes,
		isInteractive,
		selectPackageManager,
	});
	const resolvedWithWpEnv =
		typeof withWpEnv === "boolean"
			? withWpEnv
			: yes
				? false
				: isInteractive && selectWithWpEnv
					? await selectWithWpEnv()
					: false;
	const resolvedWithTestPreset =
		typeof withTestPreset === "boolean"
			? withTestPreset
			: yes
				? false
				: isInteractive && selectWithTestPreset
					? await selectWithTestPreset()
					: false;
	const resolvedWithMigrationUi =
		typeof withMigrationUi === "boolean"
			? withMigrationUi
			: yes
				? false
				: isInteractive && selectWithMigrationUi
					? await selectWithMigrationUi()
					: false;
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

	return {
		optionalOnboarding: getOptionalOnboarding({
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

export { getTemplateById, getTemplateSelectOptions, listTemplates };
