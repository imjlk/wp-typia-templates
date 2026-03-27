#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createCLI, defineCommand, defineGroup, option } from "@bunli/core";
import { z } from "zod";

import packageJson from "../package.json";
import {
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
	runDoctor,
	runScaffoldFlow,
} from "../lib/cli-core.js";
import { runMigrationCommand } from "../lib/migrations.js";
import {
	PACKAGE_MANAGER_IDS,
	formatInstallCommand,
	getPackageManager,
	getPackageManagerSelectOptions,
} from "../lib/package-managers.js";
import { TEMPLATE_IDS } from "../lib/template-registry.js";

const SEMVER = z.string().regex(/^\d+\.\d+\.\d+$/, "Expected x.y.z semver");
const TOP_LEVEL_COMMANDS = new Set(["scaffold", "templates", "doctor", "migrations"]);

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

async function runShellCommand(command: string, cwd: string) {
	execSync(command, {
		cwd,
		stdio: "inherit",
	});
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
		const copySpinner = spinner({ text: "Scaffolding template..." });

		try {
			copySpinner.start();

			const flow = await runScaffoldFlow({
				cwd,
				installDependencies: flags.noInstall
					? undefined
					: async ({ packageManager, projectDir }) => {
						const installSpinner = spinner({
							text: `Installing dependencies with ${getPackageManager(packageManager).label}...`,
						});
						installSpinner.start();

						try {
							await runShellCommand(formatInstallCommand(packageManager), projectDir);
							installSpinner.succeed("Dependencies installed");
						} catch (error) {
							installSpinner.fail("Dependency installation failed");
							throw error;
						}
					},
				isInteractive: terminal.isInteractive,
				noInstall: flags.noInstall,
				packageManager: flags.packageManager as "bun" | "npm" | "pnpm" | "yarn" | undefined,
				projectInput: positional[0],
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
				selectPackageManager: () =>
					prompt.select("Choose a package manager", {
						default: "bun",
						options: getPackageManagerSelectOptions(),
					}),
				selectTemplate: () =>
					prompt.select("Select a template", {
						default: "basic",
						options: getTemplateSelectOptions(),
					}),
				templateId: flags.template,
				yes: flags.yes,
			});

			copySpinner.succeed(`Created ${flow.result.variables.title}`);
			console.log(`\n${colors.green("✓")} Project ready in ${flow.projectDir}`);
			console.log("Next steps:");
			for (const step of flow.nextSteps) {
				console.log(`  ${step}`);
			}
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
					console.log(colors.dim(formatTemplateFeatures(template)));
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

				const [heading, ...details] = formatTemplateDetails(getTemplateById(templateId)).split("\n");
				console.log(colors.bold(heading));
				for (const line of details) {
					console.log(line);
				}
			},
		}),
	],
});

const doctorCommand = defineCommand({
	name: "doctor",
	description: "Check local CLI prerequisites",
	handler: async ({ colors, cwd }) => {
		await runDoctor(cwd, {
			renderLine: ({ status, label, detail }) => {
				const icon =
					status === "pass"
						? colors.green("PASS")
						: status === "fail"
							? colors.red("FAIL")
							: colors.yellow("WARN");
				console.log(`${icon} ${label}: ${detail}`);
			},
		});
	},
});

const migrationsGroup = defineGroup({
	name: "migrations",
	description: "Author and verify advanced template migrations",
	commands: [
		defineCommand({
			name: "init",
			description: "Initialize snapshot-based migrations in an advanced project",
			options: {
				currentVersion: option(SEMVER, {
					description: "Current schema version to initialize",
				}),
			},
			handler: async ({ cwd, flags }) => {
				await runMigrationCommand(
					{
						command: "init",
						flags: {
							all: false,
							currentVersion: flags.currentVersion,
							from: undefined,
							to: "current",
							version: undefined,
						},
					},
					cwd,
					{ renderLine: console.log },
				);
			},
		}),
		defineCommand({
			name: "snapshot",
			description: "Snapshot current block contract and save output",
			options: {
				version: option(SEMVER, {
					description: "Version to snapshot",
				}),
			},
			handler: async ({ cwd, flags }) => {
				await runMigrationCommand(
					{
						command: "snapshot",
						flags: {
							all: false,
							currentVersion: undefined,
							from: undefined,
							to: "current",
							version: flags.version,
						},
					},
					cwd,
					{ renderLine: console.log },
				);
			},
		}),
		defineCommand({
			name: "diff",
			description: "Show manifest diff from a legacy snapshot to current",
			options: {
				from: option(SEMVER, {
					description: "Legacy version to compare from",
				}),
				to: option(z.string().default("current"), {
					description: "Target version or current",
				}),
			},
			handler: async ({ cwd, flags }) => {
				await runMigrationCommand(
					{
						command: "diff",
						flags: {
							all: false,
							currentVersion: undefined,
							from: flags.from,
							to: flags.to,
							version: undefined,
						},
					},
					cwd,
					{ renderLine: console.log },
				);
			},
		}),
		defineCommand({
			name: "scaffold",
			description: "Scaffold a direct legacy-to-current migration rule",
			options: {
				from: option(SEMVER, {
					description: "Legacy version to scaffold from",
				}),
				to: option(z.string().default("current"), {
					description: "Target version or current",
				}),
			},
			handler: async ({ cwd, flags }) => {
				await runMigrationCommand(
					{
						command: "scaffold",
						flags: {
							all: false,
							currentVersion: undefined,
							from: flags.from,
							to: flags.to,
							version: undefined,
						},
					},
					cwd,
					{ renderLine: console.log },
				);
			},
		}),
		defineCommand({
			name: "verify",
			description: "Run generated migration verification against fixtures",
			options: {
				all: option(z.coerce.boolean().default(false), {
					description: "Verify all supported legacy versions",
				}),
				from: option(SEMVER.optional(), {
					description: "Verify a specific legacy version",
				}),
			},
			handler: async ({ cwd, flags }) => {
				await runMigrationCommand(
					{
						command: "verify",
						flags: {
							all: flags.all,
							currentVersion: undefined,
							from: flags.from,
							to: "current",
							version: undefined,
						},
					},
					cwd,
					{ renderLine: console.log },
				);
			},
		}),
	],
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
	cli.command(migrationsGroup);

	await cli.run(normalizeRootArgv(process.argv.slice(2)));
}

main().catch((error: unknown) => {
	console.error("❌ create-wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
