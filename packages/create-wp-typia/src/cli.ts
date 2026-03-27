#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { execFileSync, execSync } from "node:child_process";

import { createCLI, defineCommand, defineGroup, option } from "@bunli/core";
import { z } from "zod";

import packageJson from "../package.json";
import {
	collectScaffoldAnswers,
	resolvePackageManagerId,
	resolveTemplateId,
	scaffoldProject,
} from "../lib/scaffold.js";
import {
	PACKAGE_MANAGER_IDS,
	formatInstallCommand,
	formatRunScript,
	getPackageManager,
	getPackageManagerSelectOptions,
} from "../lib/package-managers.js";
import {
	TEMPLATE_IDS,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
} from "../lib/template-registry.js";

const TOP_LEVEL_COMMANDS = new Set(["scaffold", "templates", "doctor"]);
type TemplateRecord = ReturnType<typeof getTemplateById>;

function normalizeRootArgv(argv: string[]) {
	if (argv.length === 0) {
		return argv;
	}

	const [first] = argv;
	if (!first || first.startsWith("-") || TOP_LEVEL_COMMANDS.has(first)) {
		return argv;
	}

	return ["scaffold", ...argv];
}

function formatTemplateSummary(template: TemplateRecord) {
	return `${template.id.padEnd(14)} ${template.description}`;
}

async function collectInteractiveAnswers(prompt: any, projectName: string, templateId: string, yes: boolean) {
	return collectScaffoldAnswers({
		projectName,
		templateId,
		yes,
		promptText: async (
			message: string,
			defaultValue: string,
			validate?: (input: string) => boolean | string,
		) =>
			prompt.text(message, {
				default: defaultValue,
				validate: validate
					? (value: string) => {
						const result = validate(value);
						return result === true ? true : result;
					}
					: undefined,
			}),
	});
}

async function runShellCommand(command: string, cwd: string) {
	execSync(command, {
		cwd,
		stdio: "inherit",
	});
}

function compareMajorVersion(actualVersion: string, minimumMajor: number) {
	const parsed = Number.parseInt(actualVersion.replace(/^v/, "").split(".")[0] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= minimumMajor;
}

function readCommandVersion(command: string, args: string[] = ["--version"]) {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

async function checkWritableDirectory(directory: string) {
	try {
		await access(directory, fsConstants.W_OK);
		return true;
	} catch {
		return false;
	}
}

async function checkTempDirectory() {
	const tempFile = path.join(os.tmpdir(), `create-wp-typia-${Date.now()}.tmp`);
	try {
		await writeFile(tempFile, "ok", "utf8");
		await rm(tempFile, { force: true });
		return true;
	} catch {
		return false;
	}
}

function printDoctorResult(colors: any, status: "pass" | "warn" | "fail", label: string, detail: string) {
	const icon =
		status === "pass" ? colors.green("PASS") : status === "warn" ? colors.yellow("WARN") : colors.red("FAIL");
	console.log(`${icon} ${label}: ${detail}`);
}

const scaffoldCommand = defineCommand({
	name: "scaffold",
	description: "Scaffold a WordPress Typia block project",
	options: {
		template: option(z.enum(TEMPLATE_IDS as [string, ...string[]]).optional(), {
			description: "Template ID to scaffold",
			short: "t",
		}),
		yes: option(z.coerce.boolean().default(false), {
			description: "Skip prompts and use defaults",
			short: "y",
		}),
		noInstall: option(z.coerce.boolean().default(false), {
			description: "Skip dependency installation",
		}),
		packageManager: option(z.enum(PACKAGE_MANAGER_IDS as [string, ...string[]]).optional(), {
			description: "Package manager for the generated project",
			short: "p",
		}),
	},
	handler: async ({ colors, cwd, flags, positional, prompt, spinner, terminal }) => {
		const projectInput = positional[0];
		if (!projectInput) {
			throw new Error("Project directory is required. Usage: create-wp-typia <project-dir>");
		}

		const projectDir = path.resolve(cwd, projectInput);
		const projectName = path.basename(projectDir);
		const templateId = await resolveTemplateId({
			templateId: flags.template,
			yes: flags.yes,
			isInteractive: terminal.isInteractive,
			selectTemplate: () =>
				prompt.select("Select a template", {
					default: "basic",
					options: getTemplateSelectOptions(),
				}),
		});
		const packageManager = await resolvePackageManagerId({
			packageManager: flags.packageManager as "bun" | "npm" | "pnpm" | "yarn" | undefined,
			yes: flags.yes,
			isInteractive: terminal.isInteractive,
			selectPackageManager: () =>
				prompt.select("Choose a package manager", {
					default: "bun",
					options: getPackageManagerSelectOptions(),
				}),
		});
		const answers = await collectInteractiveAnswers(prompt, projectName, templateId, flags.yes);

		const copySpinner = spinner({ text: `Scaffolding ${templateId} template...` });
		copySpinner.start();

		try {
			const result = await scaffoldProject({
				answers,
				installDependencies: flags.noInstall
					? undefined
					: async ({ packageManager: selectedPackageManager, projectDir: targetDir }) => {
						const installSpinner = spinner({
							text: `Installing dependencies with ${getPackageManager(selectedPackageManager).label}...`,
						});
						installSpinner.start();

						try {
							await runShellCommand(formatInstallCommand(selectedPackageManager), targetDir);
							installSpinner.succeed("Dependencies installed");
						} catch (error) {
							installSpinner.fail("Dependency installation failed");
							throw error;
						}
					},
				noInstall: flags.noInstall,
				packageManager,
				projectDir,
				templateId,
			});
			copySpinner.succeed(`Created ${result.variables.title}`);

			console.log(`\n${colors.green("✓")} Project ready in ${projectDir}`);
			console.log("Next steps:");
			console.log(`  cd ${path.isAbsolute(projectInput) ? projectDir : projectInput}`);
			if (flags.noInstall) {
				console.log(`  ${formatInstallCommand(packageManager)}`);
			}
			console.log(`  ${formatRunScript(packageManager, "start")}`);
		} catch (error) {
			copySpinner.fail("Scaffolding failed");
			throw error;
		}
	},
});

const templatesGroup = defineGroup({
	name: "templates",
	description: "Inspect available block templates",
	commands: [
		defineCommand({
			name: "list",
			description: "List available templates",
			handler: async ({ colors }) => {
				console.log(colors.bold("Available templates:\n"));
				for (const template of listTemplates()) {
					console.log(formatTemplateSummary(template));
					console.log(`  ${colors.dim(template.features.join(" • "))}`);
				}
			},
		}),
		defineCommand({
			name: "inspect",
			description: "Inspect a template",
			handler: async ({ colors, positional }) => {
				const templateId = positional[0];
				if (!templateId) {
					throw new Error(`Template ID is required. Use one of: ${TEMPLATE_IDS.join(", ")}`);
				}

				const template = getTemplateById(templateId);
				console.log(colors.bold(template.id));
				console.log(template.description);
				console.log(`Category: ${template.defaultCategory}`);
				console.log(`Path: ${template.templateDir}`);
				console.log(`Features: ${template.features.join(", ")}`);
			},
		}),
	],
});

const doctorCommand = defineCommand({
	name: "doctor",
	description: "Check local CLI prerequisites",
	handler: async ({ colors, cwd }) => {
		const bunVersion = readCommandVersion("bun");
		const nodeVersion = readCommandVersion("node");
		const gitVersion = readCommandVersion("git");
		const cwdWritable = await checkWritableDirectory(cwd);
		const tempWritable = await checkTempDirectory();
		let hasFailures = false;

		printDoctorResult(
			colors,
			bunVersion && compareMajorVersion(bunVersion, 1) ? "pass" : "fail",
			"Bun",
			bunVersion ? `Detected ${bunVersion}` : "Not available",
		);
		hasFailures ||= !(bunVersion && compareMajorVersion(bunVersion, 1));

		printDoctorResult(
			colors,
			nodeVersion && compareMajorVersion(nodeVersion, 16) ? "pass" : "fail",
			"Node",
			nodeVersion ? `Detected ${nodeVersion}` : "Not available",
		);
		hasFailures ||= !(nodeVersion && compareMajorVersion(nodeVersion, 16));

		printDoctorResult(
			colors,
			gitVersion ? "pass" : "fail",
			"git",
			gitVersion ?? "Not available",
		);
		hasFailures ||= !gitVersion;

		printDoctorResult(colors, cwdWritable ? "pass" : "fail", "Current directory", cwdWritable ? "Writable" : "Not writable");
		hasFailures ||= !cwdWritable;

		printDoctorResult(colors, tempWritable ? "pass" : "fail", "Temp directory", tempWritable ? "Writable" : "Not writable");
		hasFailures ||= !tempWritable;

		for (const template of listTemplates()) {
			const hasAssets =
				fs.existsSync(template.templateDir) &&
				fs.existsSync(path.join(template.templateDir, "package.json.mustache"));
			printDoctorResult(
				colors,
				hasAssets ? "pass" : "fail",
				`Template ${template.id}`,
				hasAssets ? template.templateDir : "Missing core template assets",
			);
			hasFailures ||= !hasAssets;
		}

		if (hasFailures) {
			throw new Error("Doctor found one or more failing checks.");
		}
	},
});

async function main() {
	const cli = await createCLI({
		description: packageJson.description,
		name: packageJson.name,
		version: packageJson.version,
	});

	cli.command(scaffoldCommand);
	cli.command(templatesGroup);
	cli.command(doctorCommand);

	await cli.run(normalizeRootArgv(process.argv.slice(2)));
}

main().catch((error: unknown) => {
	console.error("❌ create-wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
