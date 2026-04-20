import type { ReadlinePrompt } from "@wp-typia/project-tools/cli-prompt";
import type { AlternateBufferCompletionPayload } from "./ui/alternate-buffer-lifecycle";
import {
	buildAddCompletionPayload,
	buildCreateCompletionPayload,
	buildCreateDryRunPayload,
	buildMigrationCompletionPayload,
	formatCreateProgressLine,
	printBlock,
	printCompletionPayload,
	toExternalLayerPromptOptions,
} from "./runtime-bridge-output";
export {
	buildCreateCompletionPayload,
	buildCreateDryRunPayload,
	buildMigrationCompletionPayload,
	formatCreateProgressLine,
	printCompletionPayload,
} from "./runtime-bridge-output";
export { executeSyncCommand } from "./runtime-bridge-sync";

type CreateProgressPayload = {
	detail: string;
	title: string;
};

type CreateExecutionInput = {
	projectDir: string;
	cwd: string;
	emitOutput?: boolean;
	flags: Record<string, unknown>;
	interactive?: boolean;
	onProgress?: (payload: CreateProgressPayload) => void;
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

type MigrateExecutionInput = {
	command?: string;
	cwd: string;
	flags: Record<string, unknown>;
	prompt?: ReadlinePrompt;
	renderLine?: (line: string) => void;
};

type PrintLine = (line: string) => void;
type CliCommandId = "add" | "create" | "doctor" | "migrate";

const loadCliAddRuntime = () => import("@wp-typia/project-tools/cli-add");
const loadCliDiagnosticsRuntime = () => import("@wp-typia/project-tools/cli-diagnostics");
const loadCliDoctorRuntime = () => import("@wp-typia/project-tools/cli-doctor");
const loadCliPromptRuntime = () => import("@wp-typia/project-tools/cli-prompt");
const loadCliScaffoldRuntime = () => import("@wp-typia/project-tools/cli-scaffold");
const loadCliTemplatesRuntime = () => import("@wp-typia/project-tools/cli-templates");
const loadWorkspaceProjectRuntime = () => import("@wp-typia/project-tools/workspace-project");
const loadMigrationsRuntime = () => import("@wp-typia/project-tools/migrations");

async function wrapCliCommandError(command: CliCommandId, error: unknown) {
	const { createCliCommandError } = await loadCliDiagnosticsRuntime();
	return createCliCommandError({ command, error });
}

function shouldWrapCliCommandError(options: {
	emitOutput?: boolean;
	renderLine?: ((line: string) => void) | undefined;
}): boolean {
	if (options.emitOutput === false) {
		return false;
	}

	if (options.renderLine) {
		return false;
	}

	return true;
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
	onProgress,
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
			dryRun: Boolean(flags["dry-run"]),
			externalLayerId: readOptionalLooseStringFlag(flags, "external-layer-id"),
			externalLayerSource: readOptionalLooseStringFlag(flags, "external-layer-source"),
			isInteractive: Boolean(activePrompt),
			namespace: readOptionalLooseStringFlag(flags, "namespace"),
			noInstall: Boolean(flags["no-install"]),
			packageManager: readOptionalLooseStringFlag(flags, "package-manager"),
			persistencePolicy: readOptionalLooseStringFlag(flags, "persistence-policy"),
			phpPrefix: readOptionalLooseStringFlag(flags, "php-prefix"),
			projectInput: projectDir,
			onProgress: async (progress) => {
				const payload = {
					detail: progress.detail,
					title: progress.title,
				};
				onProgress?.(payload);
				if (emitOutput) {
					printLine(formatCreateProgressLine(payload));
				}
			},
			promptText: activePrompt
				? (message, defaultValue, validate) => activePrompt.text(message, defaultValue, validate)
				: undefined,
			queryPostType: readOptionalLooseStringFlag(flags, "query-post-type"),
			selectDataStorage: activePrompt
				? () => activePrompt.select("Select a data storage mode", [...DATA_STORAGE_PROMPT_OPTIONS], 1)
				: undefined,
			selectExternalLayerId: shouldPromptForExternalLayerSelection && activePrompt
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

		const payload = flow.dryRun && flow.plan
			? buildCreateDryRunPayload({
					packageManager: flow.packageManager,
					plan: flow.plan,
					projectDir: flow.projectDir,
					result: flow.result,
				})
			: buildCreateCompletionPayload(flow);
		if (emitOutput) {
			printCompletionPayload(payload, {
				printLine,
				warnLine,
			});
		}
		return payload;
	} catch (error) {
		if (!shouldWrapCliCommandError({ emitOutput })) {
			throw error;
		}
		throw await wrapCliCommandError("create", error);
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
	let activePrompt: ReadlinePrompt | undefined;

	try {
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

		if (kind === "rest-resource") {
			if (!name) {
				throw new Error(
					"`wp-typia add rest-resource` requires <name>. Usage: wp-typia add rest-resource <name> [--namespace <vendor/v1>] [--methods <list,read,create>].",
				);
			}

			const result = await addRuntime.runAddRestResourceCommand({
				cwd,
				methods: readOptionalStringFlag(flags, "methods"),
				namespace: readOptionalStringFlag(flags, "namespace"),
				restResourceName: name,
			});
			const payload = buildAddCompletionPayload({
				kind: "rest-resource",
				projectDir: result.projectDir,
				values: {
					methods: result.methods.join(", "),
					namespace: result.namespace,
					restResourceSlug: result.restResourceSlug,
				},
			});
			if (emitOutput) {
				printCompletionPayload(payload, { printLine });
			}
			return payload;
		}

		if (kind === "editor-plugin") {
			if (!name) {
				throw new Error(
					"`wp-typia add editor-plugin` requires <name>. Usage: wp-typia add editor-plugin <name> [--slot <PluginSidebar>].",
				);
			}

			const result = await addRuntime.runAddEditorPluginCommand({
				cwd,
				editorPluginName: name,
				slot: readOptionalStringFlag(flags, "slot"),
			});
			const payload = buildAddCompletionPayload({
				kind: "editor-plugin",
				projectDir: result.projectDir,
				values: {
					editorPluginSlug: result.editorPluginSlug,
					slot: result.slot,
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
				`Unknown add kind "${kind}". Expected one of: block, variation, pattern, binding-source, rest-resource, editor-plugin, hooked-block.`,
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
		activePrompt = shouldPromptForLayerSelection
			? (prompt ?? promptRuntime?.createReadlinePrompt())
			: undefined;
		const selectPrompt = activePrompt;

		const result = await addRuntime.runAddBlockCommand({
			blockName: name,
			cwd,
			dataStorageMode: readOptionalStringFlag(flags, "data-storage"),
			externalLayerId,
			externalLayerSource,
			persistencePolicy: readOptionalStringFlag(flags, "persistence-policy"),
			selectExternalLayerId: selectPrompt
				? (options) =>
						selectPrompt.select(
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
	} catch (error) {
		if (!shouldWrapCliCommandError({ emitOutput })) {
			throw error;
		}
		throw await wrapCliCommandError("add", error);
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
	const {
		formatTemplateDetails,
		formatTemplateFeatures,
		formatTemplateSummary,
		getTemplateById,
		listTemplates,
	} = await loadCliTemplatesRuntime();
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
	try {
		const { runDoctor } = await loadCliDoctorRuntime();
		await runDoctor(cwd);
	} catch (error) {
		throw await wrapCliCommandError("doctor", error);
	}
}

export async function loadAddWorkspaceBlockOptions(cwd: string) {
	const { tryResolveWorkspaceProject } = await loadWorkspaceProjectRuntime();
	const workspace = tryResolveWorkspaceProject(cwd);
	if (!workspace) {
		return [];
	}

	const { getWorkspaceBlockSelectOptions } = await loadCliAddRuntime();
	return getWorkspaceBlockSelectOptions(workspace.projectDir);
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

	try {
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
	} catch (error) {
		if (!shouldWrapCliCommandError({ renderLine })) {
			throw error;
		}
		throw await wrapCliCommandError("migrate", error);
	}
}

export async function listTemplatesForRuntime() {
	const { listTemplates } = await loadCliTemplatesRuntime();
	return listTemplates();
}
