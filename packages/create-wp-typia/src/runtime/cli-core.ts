import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

import {
	collectScaffoldAnswers,
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
import type { PackageManagerId } from "./package-managers.js";
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
}

interface RunScaffoldFlowOptions {
	allowExistingDir?: boolean;
	cwd?: string;
	installDependencies?: Parameters<typeof scaffoldProject>[0]["installDependencies"];
	isInteractive?: boolean;
	noInstall?: boolean;
	packageManager?: string;
	projectInput: string;
	promptText?: Parameters<typeof collectScaffoldAnswers>[0]["promptText"];
	selectPackageManager?: () => Promise<PackageManagerId>;
	selectTemplate?: () => Promise<TemplateDefinition["id"]>;
	templateId?: string;
	yes?: boolean;
}

interface LegacyArgs {
	help: boolean;
	noInstall: boolean;
	packageManager?: string;
	yes: boolean;
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
  create-wp-typia <project-dir> [--template <id>] [--yes] [--no-install] [--package-manager <id>]
  create-wp-typia templates list
  create-wp-typia templates inspect <id>
  create-wp-typia migrations <init|snapshot|diff|scaffold|verify> [...]
  create-wp-typia doctor

Templates: ${TEMPLATE_IDS.join(", ")}
Package managers: ${PACKAGE_MANAGER_IDS.join(", ")}`;
}

export function formatTemplateSummary(template: TemplateDefinition): string {
	return `${template.id.padEnd(14)} ${template.description}`;
}

export function formatTemplateFeatures(template: TemplateDefinition): string {
	return `  ${template.features.join(" • ")}`;
}

export function formatTemplateDetails(template: TemplateDefinition): string {
	return [
		template.id,
		template.description,
		`Category: ${template.defaultCategory}`,
		`Path: ${template.templateDir}`,
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
	const tempFile = path.join(os.tmpdir(), `create-wp-typia-${Date.now()}.tmp`);
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
		status: nodeVersion && compareMajorVersion(nodeVersion, 16) ? "pass" : "fail",
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
		const hasAssets =
			fs.existsSync(template.templateDir) &&
			fs.existsSync(path.join(template.templateDir, "package.json.mustache"));
		checks.push({
			status: hasAssets ? "pass" : "fail",
			label: `Template ${template.id}`,
			detail: hasAssets ? template.templateDir : "Missing core template assets",
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
	packageManager,
	yes = false,
	noInstall = false,
	isInteractive = false,
	allowExistingDir = false,
	selectTemplate,
	selectPackageManager,
	promptText,
	installDependencies = undefined,
}: RunScaffoldFlowOptions) {
	if (!projectInput) {
		throw new Error("Project directory is required. Usage: create-wp-typia <project-dir>");
	}

	const resolvedTemplateId = await resolveTemplateId({
		templateId,
		yes,
		isInteractive,
		selectTemplate,
	});
	const resolvedPackageManager = await resolvePackageManagerId({
		packageManager,
		yes,
		isInteractive,
		selectPackageManager,
	});
	const projectDir = path.resolve(cwd, projectInput);
	const projectName = path.basename(projectDir);
	const answers = await collectScaffoldAnswers({
		projectName,
		templateId: resolvedTemplateId,
		yes,
		promptText,
	});

	const result = await scaffoldProject({
		answers,
		allowExistingDir,
		installDependencies,
		noInstall,
		packageManager: resolvedPackageManager,
		projectDir,
		templateId: resolvedTemplateId,
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

function parseLegacyArgs(argv: string[]): LegacyArgs {
	const parsed: LegacyArgs = {
		help: false,
		noInstall: false,
		packageManager: undefined,
		yes: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (arg === "--yes" || arg === "-y") {
			parsed.yes = true;
			continue;
		}
		if (arg === "--no-install") {
			parsed.noInstall = true;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
			continue;
		}
		if (arg === "--package-manager" || arg === "-p") {
			parsed.packageManager = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--package-manager=")) {
			parsed.packageManager = arg.split("=", 2)[1];
			continue;
		}

		throw new Error(`Unknown flag: ${arg}`);
	}

	return parsed;
}

export async function runLegacyCli(
	templateId: TemplateDefinition["id"],
	argv: string[] = process.argv.slice(2),
): Promise<void> {
	const args = parseLegacyArgs(argv);
	if (args.help) {
		console.log(
			`Usage: wp-typia-${templateId} [--yes] [--no-install] [--package-manager <${PACKAGE_MANAGER_IDS.join("|")}>]`,
		);
		return;
	}

	const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
	const prompt = createReadlinePrompt();

	try {
		if (!args.yes && !isInteractive) {
			throw new Error("Interactive answers require a TTY. Use --yes inside an existing directory.");
		}

		const flow = await runScaffoldFlow({
			allowExistingDir: true,
			cwd: process.cwd(),
			isInteractive,
			noInstall: args.noInstall,
			packageManager: args.packageManager,
			projectInput: ".",
			promptText: (message, defaultValue, validate) =>
				prompt.text(message, defaultValue, validate),
			selectPackageManager: () =>
				prompt.select("Choose a package manager:", getPackageManagerSelectOptions(), 1),
			templateId,
			yes: args.yes,
		});

		console.log(`\n✅ Scaffolded ${flow.result.variables.title} in the current directory`);
		console.log("Next steps:");
		for (const step of flow.nextSteps.slice(1)) {
			console.log(`  ${step}`);
		}
	} finally {
		prompt.close();
	}
}

export { getTemplateById, getTemplateSelectOptions, listTemplates };
