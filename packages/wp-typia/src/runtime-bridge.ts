import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
	createReadlinePrompt,
	formatRunScript,
	formatAddHelpText,
	formatMigrationHelpText,
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getWorkspaceBlockSelectOptions,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
	parseMigrationArgs,
	parseWorkspacePackageManagerId,
	tryResolveWorkspaceProject,
	runAddBindingSourceCommand,
	runAddBlockCommand,
	runAddHookedBlockCommand,
	runAddPatternCommand,
	runAddVariationCommand,
	runDoctor,
	runMigrationCommand,
	runScaffoldFlow,
} from "@wp-typia/project-tools";
import type { ReadlinePrompt } from "@wp-typia/project-tools";

type CreateExecutionInput = {
	projectDir: string;
	cwd: string;
	flags: Record<string, unknown>;
	interactive?: boolean;
	prompt?: ReadlinePrompt;
};

type AddExecutionInput = {
	cwd: string;
	flags: Record<string, unknown>;
	kind?: string;
	name?: string;
};

type TemplatesExecutionInput = {
	flags: {
		id?: string;
		subcommand?: string;
	};
};

type SyncExecutionInput = {
	check?: boolean;
	cwd: string;
};

type MigrateExecutionInput = {
	command?: string;
	cwd: string;
	flags: Record<string, unknown>;
	prompt?: ReadlinePrompt;
	renderLine?: (line: string) => void;
};

type PrintLine = (line: string) => void;
type PackageManagerId = "bun" | "npm" | "pnpm" | "yarn";

type SyncProjectContext = {
	cwd: string;
	packageJsonPath: string;
	packageManager: PackageManagerId;
	scripts: Partial<Record<"sync" | "sync-rest" | "sync-types", string>>;
};

function printBlock(lines: string[], printLine: PrintLine): void {
	for (const line of lines) {
		printLine(line);
	}
}

function readOptionalStringFlag(
	flags: Record<string, unknown>,
	name: string,
): string | undefined {
	const value = flags[name];
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new Error(`\`--${name}\` requires a value.`);
	}
	return value;
}

function readOptionalLooseStringFlag(
	flags: Record<string, unknown>,
	name: string,
): string | undefined {
	const value = flags[name];
	if (value === undefined || value === null) {
		return undefined;
	}
	if (typeof value !== "string") {
		throw new Error(`\`--${name}\` requires a value.`);
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function pushFlag(argv: string[], name: string, value: unknown): void {
	if (value === undefined || value === null || value === false) {
		return;
	}
	if (value === true) {
		argv.push(`--${name}`);
		return;
	}
	argv.push(`--${name}`, String(value));
}

function getSyncRootError(cwd: string): Error {
	return new Error(
		`No generated wp-typia project root was found at ${cwd}. Run \`wp-typia sync\` from a scaffolded project or official workspace root.`,
	);
}

function resolveSyncProjectContext(cwd: string): SyncProjectContext {
	const packageJsonPath = path.join(cwd, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		throw getSyncRootError(cwd);
	}

	if (!fs.existsSync(path.join(cwd, "scripts", "sync-types-to-block-json.ts"))) {
		throw getSyncRootError(cwd);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
		packageManager?: string;
		scripts?: Record<string, unknown>;
	};
	const scripts = packageJson.scripts ?? {};
	const syncScripts = {
		sync: typeof scripts.sync === "string" ? scripts.sync : undefined,
		"sync-rest":
			typeof scripts["sync-rest"] === "string" ? scripts["sync-rest"] : undefined,
		"sync-types":
			typeof scripts["sync-types"] === "string" ? scripts["sync-types"] : undefined,
	} satisfies SyncProjectContext["scripts"];

	if (!syncScripts.sync && !syncScripts["sync-types"]) {
		throw new Error(
			`Expected ${packageJsonPath} to define either a \`sync\` or \`sync-types\` script.`,
		);
	}

	return {
		cwd,
		packageJsonPath,
		packageManager: parseWorkspacePackageManagerId(packageJson.packageManager),
		scripts: syncScripts,
	};
}

function getPackageManagerRunInvocation(
	packageManager: PackageManagerId,
	scriptName: string,
	extraArgs: string[],
): { args: string[]; command: string } {
	switch (packageManager) {
		case "bun":
			return { args: ["run", scriptName, ...extraArgs], command: "bun" };
		case "npm":
			return {
				args: ["run", scriptName, ...(extraArgs.length > 0 ? ["--", ...extraArgs] : [])],
				command: "npm",
			};
		case "pnpm":
			return { args: ["run", scriptName, ...extraArgs], command: "pnpm" };
		case "yarn":
			return { args: ["run", scriptName, ...extraArgs], command: "yarn" };
	}
}

function runProjectScript(
	project: SyncProjectContext,
	scriptName: "sync" | "sync-rest" | "sync-types",
	extraArgs: string[],
): void {
	const script = project.scripts[scriptName];
	if (!script) {
		return;
	}

	const invocation = getPackageManagerRunInvocation(
		project.packageManager,
		scriptName,
		extraArgs,
	);

	try {
		execFileSync(invocation.command, invocation.args, {
			cwd: project.cwd,
			stdio: "inherit",
		});
	} catch (error) {
		throw new Error(
			`\`${formatRunScript(project.packageManager, scriptName, extraArgs.join(" "))}\` failed.`,
			{
				cause: error instanceof Error ? error : undefined,
			},
		);
	}
}

const PACKAGE_MANAGER_PROMPT_OPTIONS = [
	{ label: "npm", value: "npm", hint: "Use npm" },
	{ label: "pnpm", value: "pnpm", hint: "Use pnpm" },
	{ label: "yarn", value: "yarn", hint: "Use yarn" },
	{ label: "bun", value: "bun", hint: "Use bun" },
] as const;

const DATA_STORAGE_PROMPT_OPTIONS = [
	{ label: "custom-table", value: "custom-table", hint: "Dedicated custom table storage" },
	{ label: "post-meta", value: "post-meta", hint: "Persist through post meta" },
] as const;

const PERSISTENCE_POLICY_PROMPT_OPTIONS = [
	{ label: "authenticated", value: "authenticated", hint: "Authenticated write policy" },
	{ label: "public", value: "public", hint: "Public token policy" },
] as const;

const BOOLEAN_PROMPT_OPTIONS = [
	{ label: "Yes", value: "yes", hint: "Enable this option" },
	{ label: "No", value: "no", hint: "Keep the default disabled state" },
] as const;

export async function executeCreateCommand({
	projectDir,
	cwd,
	flags,
	interactive,
	prompt,
}: CreateExecutionInput): Promise<void> {
	const shouldPrompt =
		interactive ?? (!Boolean(flags.yes) && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY));
	const activePrompt = shouldPrompt ? (prompt ?? createReadlinePrompt()) : undefined;

	try {
		const flow = await runScaffoldFlow({
			cwd,
			dataStorageMode: readOptionalLooseStringFlag(flags, "data-storage"),
			isInteractive: Boolean(activePrompt),
			namespace: readOptionalLooseStringFlag(flags, "namespace"),
			noInstall: Boolean(flags["no-install"]),
			packageManager: readOptionalLooseStringFlag(flags, "package-manager"),
			persistencePolicy: readOptionalLooseStringFlag(flags, "persistence-policy"),
			phpPrefix: readOptionalLooseStringFlag(flags, "php-prefix"),
			projectInput: projectDir,
			promptText: activePrompt
				? (message, defaultValue, validate) => activePrompt.text(message, defaultValue, validate)
				: undefined,
			selectDataStorage: activePrompt
				? () => activePrompt.select("Select a data storage mode", [...DATA_STORAGE_PROMPT_OPTIONS], 1)
				: undefined,
			selectPackageManager: activePrompt
				? () => activePrompt.select("Select a package manager", [...PACKAGE_MANAGER_PROMPT_OPTIONS], 1)
				: undefined,
			selectPersistencePolicy: activePrompt
				? () =>
						activePrompt.select(
							"Select a persistence policy",
							[...PERSISTENCE_POLICY_PROMPT_OPTIONS],
							1,
						)
				: undefined,
			selectTemplate: activePrompt
				? () => activePrompt.select("Select a template", getTemplateSelectOptions(), 1)
				: undefined,
			selectWithMigrationUi: activePrompt
				? async () =>
						(await activePrompt.select("Enable migration UI support?", [...BOOLEAN_PROMPT_OPTIONS], 2)) ===
						"yes"
				: undefined,
			selectWithTestPreset: activePrompt
				? async () =>
						(await activePrompt.select("Include the Playwright test preset?", [...BOOLEAN_PROMPT_OPTIONS], 2)) ===
						"yes"
				: undefined,
			selectWithWpEnv: activePrompt
				? async () =>
						(await activePrompt.select("Include a local wp-env preset?", [...BOOLEAN_PROMPT_OPTIONS], 2)) ===
						"yes"
				: undefined,
			templateId: readOptionalLooseStringFlag(flags, "template"),
			textDomain: readOptionalLooseStringFlag(flags, "text-domain"),
			variant: readOptionalLooseStringFlag(flags, "variant"),
			withMigrationUi: flags["with-migration-ui"] as boolean | undefined,
			withTestPreset: flags["with-test-preset"] as boolean | undefined,
			withWpEnv: flags["with-wp-env"] as boolean | undefined,
			yes: Boolean(flags.yes),
		});

		if (flow.result.selectedVariant) {
			console.log(`Template variant: ${flow.result.selectedVariant}`);
		}
		for (const warning of flow.result.warnings) {
			console.warn(`⚠️ ${warning}`);
		}

		console.log(`\n✅ Created ${flow.result.variables.title} in ${flow.projectDir}`);
		console.log("Next steps:");
		for (const step of flow.nextSteps) {
			console.log(`  ${step}`);
		}
		if (flow.optionalOnboarding.steps.length > 0) {
			console.log("\nOptional before first commit:");
			for (const step of flow.optionalOnboarding.steps) {
				console.log(`  ${step}`);
			}
			console.log(`Note: ${flow.optionalOnboarding.note}`);
		}
	} finally {
		if (activePrompt && activePrompt !== prompt) {
			activePrompt.close();
		}
	}
}

export async function executeAddCommand({
	cwd,
	flags,
	kind,
	name,
}: AddExecutionInput): Promise<void> {
	if (!kind) {
		console.log(formatAddHelpText());
		return;
	}

	if (kind === "variation") {
		if (!name) {
			throw new Error(
				"`wp-typia add variation` requires <name>. Usage: wp-typia add variation <name> --block <block-slug>",
			);
		}

		const blockSlug = readOptionalStringFlag(flags, "block");
		if (!blockSlug) {
			throw new Error("`wp-typia add variation` requires --block <block-slug>.");
		}

		const result = await runAddVariationCommand({
			blockName: blockSlug,
			cwd,
			variationName: name,
		});
		console.log(`✅ Added variation ${result.variationSlug} to ${result.blockSlug} in ${result.projectDir}.`);
		return;
	}

	if (kind === "pattern") {
		if (!name) {
			throw new Error(
				"`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.",
			);
		}

		const result = await runAddPatternCommand({
			cwd,
			patternName: name,
		});
		console.log(`✅ Added pattern ${result.patternSlug} in ${result.projectDir}.`);
		return;
	}

	if (kind === "binding-source") {
		if (!name) {
			throw new Error(
				"`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name>.",
			);
		}

		const result = await runAddBindingSourceCommand({
			bindingSourceName: name,
			cwd,
		});
		console.log(`✅ Added binding source ${result.bindingSourceSlug} in ${result.projectDir}.`);
		return;
	}

	if (kind === "hooked-block") {
		if (!name) {
			throw new Error(
				"`wp-typia add hooked-block` requires <block-slug>. Usage: wp-typia add hooked-block <block-slug> --anchor <anchor-block-name> --position <before|after|firstChild|lastChild>.",
			);
		}

		const anchorBlockName = readOptionalStringFlag(flags, "anchor");
		if (!anchorBlockName) {
			throw new Error("`wp-typia add hooked-block` requires --anchor <anchor-block-name>.");
		}

		const position = readOptionalStringFlag(flags, "position");
		if (!position) {
			throw new Error(
				"`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.",
			);
		}

		const result = await runAddHookedBlockCommand({
			anchorBlockName,
			blockName: name,
			cwd,
			position,
		});
		console.log(
			`✅ Added blockHooks metadata for ${result.blockSlug} relative to ${result.anchorBlockName} (${result.position}) in ${result.projectDir}.`,
		);
		return;
	}

	if (kind !== "block") {
		throw new Error(
			`Unknown add kind "${kind}". Expected one of: block, variation, pattern, binding-source, hooked-block.`,
		);
	}

	if (!name) {
		throw new Error(
			"`wp-typia add block` requires <name>. Usage: wp-typia add block <name> --template <basic|interactivity|persistence|compound>",
		);
	}

	if (!flags.template) {
		throw new Error(
			"`wp-typia add block` requires --template <basic|interactivity|persistence|compound>.",
		);
	}

	const result = await runAddBlockCommand({
		blockName: name,
		cwd,
		dataStorageMode: readOptionalStringFlag(flags, "data-storage"),
		persistencePolicy: readOptionalStringFlag(flags, "persistence-policy"),
		templateId: readOptionalStringFlag(flags, "template") as
			| "basic"
			| "interactivity"
			| "persistence"
			| "compound",
	});

	console.log(
		`✅ Added ${result.blockSlugs.join(", ")} to ${result.projectDir} using the ${result.templateId} family.`,
	);
}

export async function executeTemplatesCommand(
	{ flags }: TemplatesExecutionInput,
	printLine: PrintLine = console.log,
): Promise<void> {
	const subcommand = flags.subcommand ?? "list";

	if (subcommand === "list") {
		for (const template of listTemplates()) {
			printBlock(
				[formatTemplateSummary(template), formatTemplateFeatures(template)],
				printLine,
			);
		}
		return;
	}

	if (subcommand === "inspect") {
		if (!flags.id) {
			throw new Error("`wp-typia templates inspect` requires <template-id>.");
		}
		const template = getTemplateById(flags.id);
		if (!template) {
			throw new Error(`Unknown template "${flags.id}".`);
		}
		printBlock(
			[
				formatTemplateSummary(template),
				formatTemplateFeatures(template),
				formatTemplateDetails(template),
			],
			printLine,
		);
		return;
	}

	throw new Error(`Unknown templates subcommand "${subcommand}". Expected list or inspect.`);
}

export async function executeDoctorCommand(cwd: string): Promise<void> {
	await runDoctor(cwd);
}

export async function executeSyncCommand({
	check = false,
	cwd,
}: SyncExecutionInput): Promise<void> {
	const project = resolveSyncProjectContext(cwd);
	const extraArgs = check ? ["--check"] : [];

	if (project.scripts.sync) {
		runProjectScript(project, "sync", extraArgs);
		return;
	}

	runProjectScript(project, "sync-types", extraArgs);

	if (project.scripts["sync-rest"]) {
		runProjectScript(project, "sync-rest", extraArgs);
	}
}

export async function executeMigrateCommand({
	command,
	cwd,
	flags,
	prompt,
	renderLine,
}: MigrateExecutionInput): Promise<void> {
	if (!command) {
		console.log(formatMigrationHelpText());
		return;
	}

	const argv = [command];
	pushFlag(argv, "all", flags.all);
	pushFlag(argv, "force", flags.force);
	pushFlag(
		argv,
		"current-migration-version",
		readOptionalLooseStringFlag(flags, "current-migration-version"),
	);
	pushFlag(argv, "migration-version", readOptionalLooseStringFlag(flags, "migration-version"));
	pushFlag(
		argv,
		"from-migration-version",
		readOptionalLooseStringFlag(flags, "from-migration-version"),
	);
	pushFlag(
		argv,
		"to-migration-version",
		readOptionalLooseStringFlag(flags, "to-migration-version"),
	);
	pushFlag(argv, "iterations", readOptionalLooseStringFlag(flags, "iterations"));
	pushFlag(argv, "seed", readOptionalLooseStringFlag(flags, "seed"));

	const parsed = parseMigrationArgs(argv);
	await runMigrationCommand(parsed, cwd, {
		prompt,
		renderLine,
	});
}

export function getAddWorkspaceBlockOptions(cwd: string) {
	const workspace = tryResolveWorkspaceProject(cwd);
	if (!workspace) {
		return [];
	}

	return getWorkspaceBlockSelectOptions(workspace.projectDir);
}

export { formatAddHelpText, formatMigrationHelpText, listTemplates };
