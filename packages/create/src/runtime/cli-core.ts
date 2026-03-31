import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

import {
	collectScaffoldAnswers,
	DATA_STORAGE_MODES,
	WRITE_AUTH_MODES,
	isDataStorageMode,
	isWriteAuthMode,
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
import type { DataStorageMode, WriteAuthMode } from "./scaffold.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	TEMPLATE_IDS,
	getTemplateLayerDirs,
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
}

interface RunScaffoldFlowOptions {
	allowExistingDir?: boolean;
	cwd?: string;
	dataStorageMode?: string;
	installDependencies?: Parameters<typeof scaffoldProject>[0]["installDependencies"];
	isInteractive?: boolean;
	noInstall?: boolean;
	packageManager?: string;
	projectInput: string;
	promptText?: Parameters<typeof collectScaffoldAnswers>[0]["promptText"];
	selectDataStorage?: () => Promise<DataStorageMode>;
	selectPackageManager?: () => Promise<PackageManagerId>;
	selectTemplate?: () => Promise<TemplateDefinition["id"]>;
	selectWriteAuth?: () => Promise<WriteAuthMode>;
	templateId?: string;
	variant?: string;
	writeAuthMode?: string;
	yes?: boolean;
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
  wp-typia <project-dir> [--template <basic|interactivity|data|./path|github:owner/repo/path[#ref]>] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template <npm-package>] [--variant <name>] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template data] [--data-storage <post-meta|custom-table>] [--yes] [--no-install] [--package-manager <id>]
  wp-typia <project-dir> [--template persisted] [--data-storage <post-meta|custom-table>] [--write-auth <nonce|public>] [--yes] [--no-install] [--package-manager <id>]
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
	const layers = getTemplateLayerDirs(template.id);
	return [
		template.id,
		template.description,
		`Category: ${template.defaultCategory}`,
		`Overlay path: ${template.templateDir}`,
		`Layers: ${layers.join(" -> ")}`,
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
		const layerDirs = getTemplateLayerDirs(template.id);
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
}: GetNextStepsOptions): string[] {
	const steps = [`cd ${path.isAbsolute(projectInput) ? projectDir : projectInput}`];

	if (noInstall) {
		steps.push(formatInstallCommand(packageManager));
	}

	steps.push(formatRunScript(packageManager, "start"));
	return steps;
}

export async function runScaffoldFlow({
	projectInput,
	cwd = process.cwd(),
	templateId,
	dataStorageMode,
	writeAuthMode,
	packageManager,
	yes = false,
	noInstall = false,
	isInteractive = false,
	allowExistingDir = false,
	selectTemplate,
	selectDataStorage,
	selectWriteAuth,
	selectPackageManager,
	promptText,
	installDependencies = undefined,
	variant,
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
	const resolvedDataStorage =
		resolvedTemplateId !== "data" && resolvedTemplateId !== "persisted"
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
	const resolvedWriteAuth =
		resolvedTemplateId !== "persisted"
			? undefined
			: writeAuthMode
				? isWriteAuthMode(writeAuthMode)
					? writeAuthMode
					: (() => {
						throw new Error(
							`Unsupported write auth mode "${writeAuthMode}". Expected one of: ${WRITE_AUTH_MODES.join(", ")}`,
						);
					})()
				: yes
					? "nonce"
					: isInteractive && selectWriteAuth
						? await selectWriteAuth()
						: "nonce";
	const resolvedPackageManager = await resolvePackageManagerId({
		packageManager,
		yes,
		isInteractive,
		selectPackageManager,
	});
	const projectDir = path.resolve(cwd, projectInput);
	const projectName = path.basename(projectDir);
	const answers = await collectScaffoldAnswers({
		dataStorageMode: resolvedDataStorage,
		projectName,
		templateId: resolvedTemplateId,
		writeAuthMode: resolvedWriteAuth,
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
		projectDir,
		templateId: resolvedTemplateId,
		variant,
		writeAuthMode: resolvedWriteAuth,
	});

	return {
		projectDir,
		projectInput,
		packageManager: resolvedPackageManager,
		result,
		nextSteps: getNextSteps({
			projectInput,
			projectDir,
			packageManager: resolvedPackageManager,
			noInstall,
		}),
	};
}

export { getTemplateById, getTemplateSelectOptions, listTemplates };
