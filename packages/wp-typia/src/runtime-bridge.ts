import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	listTemplates,
} from "@wp-typia/project-tools/cli-templates";
import { formatRunScript } from "@wp-typia/project-tools/package-managers";
import { tryResolveWorkspaceProject } from "@wp-typia/project-tools/workspace-project";
import type { ReadlinePrompt } from "@wp-typia/project-tools/cli-prompt";
import type { AlternateBufferCompletionPayload } from "./ui/alternate-buffer-lifecycle";

type CreateExecutionInput = {
	projectDir: string;
	cwd: string;
	emitOutput?: boolean;
	flags: Record<string, unknown>;
	interactive?: boolean;
	printLine?: PrintLine;
	prompt?: ReadlinePrompt;
	warnLine?: PrintLine;
};

type AddExecutionInput = {
	cwd: string;
	emitOutput?: boolean;
	flags: Record<string, unknown>;
	interactive?: boolean;
	kind?: string;
	name?: string;
	printLine?: PrintLine;
	prompt?: ReadlinePrompt;
	warnLine?: PrintLine;
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
type ExternalLayerSelectOption = {
	description?: string;
	extends: string[];
	id: string;
};

type SyncProjectContext = {
	cwd: string;
	packageJsonPath: string;
	packageManager: PackageManagerId;
	scripts: Partial<Record<"sync" | "sync-rest" | "sync-types", string>>;
};

const loadCliAddRuntime = () => import("@wp-typia/project-tools/cli-add");
const loadCliDoctorRuntime = () => import("@wp-typia/project-tools/cli-doctor");
const loadCliPromptRuntime = () => import("@wp-typia/project-tools/cli-prompt");
const loadCliScaffoldRuntime = () => import("@wp-typia/project-tools/cli-scaffold");
const loadCliTemplatesRuntime = () => import("@wp-typia/project-tools/cli-templates");
const loadMigrationsRuntime = () => import("@wp-typia/project-tools/migrations");

function printBlock(lines: string[], printLine: PrintLine): void {
	for (const line of lines) {
		printLine(line);
	}
}

function formatExternalLayerSelectHint(option: ExternalLayerSelectOption): string | undefined {
	const details = [
		option.description,
		option.extends.length > 0 ? `extends ${option.extends.join(", ")}` : undefined,
	].filter((value): value is string => typeof value === "string" && value.length > 0);

	return details.length > 0 ? details.join(" · ") : undefined;
}

function toExternalLayerPromptOptions(options: ExternalLayerSelectOption[]) {
	return options.map((option) => ({
		hint: formatExternalLayerSelectHint(option),
		label: option.id,
		value: option.id,
	}));
}

export function printCompletionPayload(
	payload: AlternateBufferCompletionPayload,
	options: {
		printLine?: PrintLine;
		warnLine?: PrintLine;
	} = {},
): void {
	const printLine = options.printLine ?? (console.log as PrintLine);
	const warnLine = options.warnLine ?? printLine;

	for (const line of payload.preambleLines ?? []) {
		printLine(line);
	}
	for (const warning of payload.warningLines ?? []) {
		warnLine(`⚠️ ${warning}`);
	}

	const hasDetails =
		(payload.summaryLines?.length ?? 0) > 0 ||
		(payload.nextSteps?.length ?? 0) > 0 ||
		(payload.optionalLines?.length ?? 0) > 0 ||
		Boolean(payload.optionalNote);
	const hasLeadingContext =
		(payload.preambleLines?.length ?? 0) > 0 ||
		(payload.warningLines?.length ?? 0) > 0;

	printLine(hasLeadingContext && hasDetails ? `\n${payload.title}` : payload.title);
	for (const line of payload.summaryLines ?? []) {
		printLine(line);
	}
	if ((payload.nextSteps?.length ?? 0) > 0) {
		printLine("Next steps:");
		for (const step of payload.nextSteps ?? []) {
			printLine(`  ${step}`);
		}
	}
	if ((payload.optionalLines?.length ?? 0) > 0) {
		printLine(`\n${payload.optionalTitle ?? "Optional:"}`);
		for (const step of payload.optionalLines ?? []) {
			printLine(`  ${step}`);
		}
	}
	if (payload.optionalNote) {
		printLine(`Note: ${payload.optionalNote}`);
	}
}

export function buildCreateCompletionPayload(flow: {
	nextSteps: string[];
	optionalOnboarding: {
		note: string;
		steps: string[];
	};
	projectDir: string;
	result: {
		selectedVariant?: string | null;
		variables: {
			title: string;
		};
		warnings: string[];
	};
}): AlternateBufferCompletionPayload {
	return {
		nextSteps: flow.nextSteps,
		optionalLines:
			flow.optionalOnboarding.steps.length > 0 ? flow.optionalOnboarding.steps : undefined,
		optionalNote:
			flow.optionalOnboarding.steps.length > 0 ? flow.optionalOnboarding.note : undefined,
		optionalTitle:
			flow.optionalOnboarding.steps.length > 0 ? "Optional before first commit:" : undefined,
		preambleLines: flow.result.selectedVariant
			? [`Template variant: ${flow.result.selectedVariant}`]
			: undefined,
		summaryLines: [`Project directory: ${flow.projectDir}`],
		title: `✅ Created ${flow.result.variables.title} in ${flow.projectDir}`,
		warningLines: flow.result.warnings,
	};
}

export function buildMigrationCompletionPayload(options: {
	command: string;
	lines: string[];
}): AlternateBufferCompletionPayload {
	const summaryLines = options.lines.filter((line) => line.trim().length > 0);

	return {
		summaryLines,
		title: `✅ Completed wp-typia migrate ${options.command}`,
	};
}

function buildAddCompletionPayload(options: {
	kind: "binding-source" | "block" | "hooked-block" | "pattern" | "variation";
	projectDir: string;
	values: Record<string, string>;
	warnings?: string[];
}): AlternateBufferCompletionPayload {
	switch (options.kind) {
		case "variation":
			return {
				summaryLines: [
					`Variation: ${options.values.variationSlug}`,
					`Target block: ${options.values.blockSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace variation",
			};
		case "pattern":
			return {
				summaryLines: [
					`Pattern: ${options.values.patternSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace pattern",
			};
		case "binding-source":
			return {
				summaryLines: [
					`Binding source: ${options.values.bindingSourceSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added binding source",
			};
		case "hooked-block":
			return {
				summaryLines: [
					`Block: ${options.values.blockSlug}`,
					`Anchor: ${options.values.anchorBlockName}`,
					`Position: ${options.values.position}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added blockHooks metadata",
			};
		case "block":
		default:
			return {
				summaryLines: [
					`Blocks: ${options.values.blockSlugs}`,
					`Template family: ${options.values.templateId}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace block",
				warningLines: options.warnings,
			};
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

function inferSyncPackageManager(cwd: string, packageManagerField?: string): PackageManagerId {
	const field = String(packageManagerField ?? "");
	if (field.startsWith("bun@")) return "bun";
	if (field.startsWith("npm@")) return "npm";
	if (field.startsWith("pnpm@")) return "pnpm";
	if (field.startsWith("yarn@")) return "yarn";

	if (
		fs.existsSync(path.join(cwd, "bun.lock")) ||
		fs.existsSync(path.join(cwd, "bun.lockb"))
	) {
		return "bun";
	}
	if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	if (
		fs.existsSync(path.join(cwd, "yarn.lock")) ||
		fs.existsSync(path.join(cwd, ".pnp.cjs")) ||
		fs.existsSync(path.join(cwd, ".pnp.loader.mjs")) ||
		fs.existsSync(path.join(cwd, ".yarnrc.yml"))
	) {
		return "yarn";
	}
	if (
		fs.existsSync(path.join(cwd, "package-lock.json")) ||
		fs.existsSync(path.join(cwd, "npm-shrinkwrap.json"))
	) {
		return "npm";
	}

	return "npm";
}

function resolveSyncProjectContext(cwd: string): SyncProjectContext {
	const packageJsonPath = path.join(cwd, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
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
		packageManager: inferSyncPackageManager(cwd, packageJson.packageManager),
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

	const result = spawnSync(invocation.command, invocation.args, {
		cwd: project.cwd,
		shell: process.platform === "win32",
		stdio: "inherit",
	});

	if (result.error || result.status !== 0) {
		throw new Error(
			`\`${formatRunScript(project.packageManager, scriptName, extraArgs.join(" "))}\` failed.`,
			{
				cause: result.error,
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
	emitOutput = true,
	flags,
	interactive,
	printLine = console.log as PrintLine,
	prompt,
	warnLine = console.warn as PrintLine,
}: CreateExecutionInput): Promise<AlternateBufferCompletionPayload> {
	const [
		{ createReadlinePrompt },
		{ runScaffoldFlow },
		{ getTemplateSelectOptions },
	] = await Promise.all([
		loadCliPromptRuntime(),
		loadCliScaffoldRuntime(),
		loadCliTemplatesRuntime(),
	]);
	const shouldPrompt =
		interactive ?? (!Boolean(flags.yes) && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY));
	const activePrompt = shouldPrompt ? (prompt ?? createReadlinePrompt()) : undefined;
	const shouldPromptForExternalLayerSelection =
		Boolean(activePrompt) && activePrompt !== prompt;

	try {
		const flow = await runScaffoldFlow({
			cwd,
			dataStorageMode: readOptionalLooseStringFlag(flags, "data-storage"),
			externalLayerId: readOptionalLooseStringFlag(flags, "external-layer-id"),
			externalLayerSource: readOptionalLooseStringFlag(flags, "external-layer-source"),
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
			selectExternalLayerId: shouldPromptForExternalLayerSelection
				? (options) =>
						activePrompt.select(
							"Select an external layer",
							toExternalLayerPromptOptions(options),
							1,
						)
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

		const payload = buildCreateCompletionPayload(flow);
		if (emitOutput) {
			printCompletionPayload(payload, {
				printLine,
				warnLine,
			});
		}
		return payload;
	} finally {
		if (activePrompt && activePrompt !== prompt) {
			activePrompt.close();
		}
	}
}

export async function executeAddCommand({
	cwd,
	emitOutput = true,
	flags,
	interactive,
	kind,
	name,
	printLine = console.log as PrintLine,
	prompt,
	warnLine = console.warn as PrintLine,
}: AddExecutionInput): Promise<AlternateBufferCompletionPayload | void> {
	if (!kind) {
		const { formatAddHelpText } = await loadCliAddRuntime();
		printLine(formatAddHelpText());
		return;
	}

	const addRuntime = await loadCliAddRuntime();

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

		const result = await addRuntime.runAddVariationCommand({
			blockName: blockSlug,
			cwd,
			variationName: name,
		});
		const payload = buildAddCompletionPayload({
			kind: "variation",
			projectDir: result.projectDir,
			values: {
				blockSlug: result.blockSlug,
				variationSlug: result.variationSlug,
			},
		});
		if (emitOutput) {
			printCompletionPayload(payload, { printLine });
		}
		return payload;
	}

	if (kind === "pattern") {
		if (!name) {
			throw new Error(
				"`wp-typia add pattern` requires <name>. Usage: wp-typia add pattern <name>.",
			);
		}

		const result = await addRuntime.runAddPatternCommand({
			cwd,
			patternName: name,
		});
		const payload = buildAddCompletionPayload({
			kind: "pattern",
			projectDir: result.projectDir,
			values: {
				patternSlug: result.patternSlug,
			},
		});
		if (emitOutput) {
			printCompletionPayload(payload, { printLine });
		}
		return payload;
	}

	if (kind === "binding-source") {
		if (!name) {
			throw new Error(
				"`wp-typia add binding-source` requires <name>. Usage: wp-typia add binding-source <name>.",
			);
		}

		const result = await addRuntime.runAddBindingSourceCommand({
			bindingSourceName: name,
			cwd,
		});
		const payload = buildAddCompletionPayload({
			kind: "binding-source",
			projectDir: result.projectDir,
			values: {
				bindingSourceSlug: result.bindingSourceSlug,
			},
		});
		if (emitOutput) {
			printCompletionPayload(payload, { printLine });
		}
		return payload;
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

		const result = await addRuntime.runAddHookedBlockCommand({
			anchorBlockName,
			blockName: name,
			cwd,
			position,
		});
		const payload = buildAddCompletionPayload({
			kind: "hooked-block",
			projectDir: result.projectDir,
			values: {
				anchorBlockName: result.anchorBlockName,
				blockSlug: result.blockSlug,
				position: result.position,
			},
		});
		if (emitOutput) {
			printCompletionPayload(payload, { printLine });
		}
		return payload;
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

	const externalLayerId = readOptionalStringFlag(flags, "external-layer-id");
	const externalLayerSource = readOptionalStringFlag(flags, "external-layer-source");
	const shouldPromptForLayerSelection =
		Boolean(externalLayerSource) &&
		!Boolean(externalLayerId) &&
		(interactive ?? (Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY)));
	const promptRuntime = shouldPromptForLayerSelection
		? await loadCliPromptRuntime()
		: undefined;
	const activePrompt = shouldPromptForLayerSelection
		? (prompt ?? promptRuntime?.createReadlinePrompt())
		: undefined;

	try {
		const result = await addRuntime.runAddBlockCommand({
			blockName: name,
			cwd,
			dataStorageMode: readOptionalStringFlag(flags, "data-storage"),
			externalLayerId,
			externalLayerSource,
			persistencePolicy: readOptionalStringFlag(flags, "persistence-policy"),
			selectExternalLayerId: activePrompt
				? (options) =>
						activePrompt.select(
							"Select an external layer",
							toExternalLayerPromptOptions(options),
							1,
						)
				: undefined,
			templateId: readOptionalStringFlag(flags, "template") as
				| "basic"
				| "interactivity"
				| "persistence"
				| "compound",
		});

		const payload = buildAddCompletionPayload({
			kind: "block",
			projectDir: result.projectDir,
			values: {
				blockSlugs: result.blockSlugs.join(", "),
				templateId: result.templateId,
			},
			warnings: result.warnings,
		});
		if (emitOutput) {
			printCompletionPayload(payload, { printLine, warnLine });
		}
		return payload;
	} finally {
		if (activePrompt && activePrompt !== prompt) {
			activePrompt.close();
		}
	}
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
	const { runDoctor } = await loadCliDoctorRuntime();
	await runDoctor(cwd);
}

export async function loadAddWorkspaceBlockOptions(cwd: string) {
	const workspace = tryResolveWorkspaceProject(cwd);
	if (!workspace) {
		return [];
	}

	const { getWorkspaceBlockSelectOptions } = await loadCliAddRuntime();
	return getWorkspaceBlockSelectOptions(workspace.projectDir);
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
}: MigrateExecutionInput): Promise<AlternateBufferCompletionPayload | void> {
	const { formatMigrationHelpText, parseMigrationArgs, runMigrationCommand } =
		await loadMigrationsRuntime();
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
	const lines: string[] | null = renderLine ? [] : null;
	const captureLine = (line: string) => {
		lines?.push(line);
		if (renderLine) {
			renderLine(line);
			return;
		}
		console.log(line);
	};
	const result = await runMigrationCommand(parsed, cwd, {
		prompt,
		renderLine: captureLine,
	});
	if (renderLine) {
		return result && typeof result === "object" && "cancelled" in result && result.cancelled === true
				? undefined
				: buildMigrationCompletionPayload({
					command: parsed.command ?? "plan",
					lines: lines ?? [],
				});
	}

	if (result && typeof result === "object" && "cancelled" in result && result.cancelled === true) {
		return;
	}
}

export { listTemplates };
