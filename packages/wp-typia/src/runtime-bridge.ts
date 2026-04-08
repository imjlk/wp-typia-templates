import {
	createAddPlaceholderMessage,
	formatAddHelpText,
	formatMigrationHelpText,
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	listTemplates,
	parseMigrationArgs,
	runAddBlockCommand,
	runDoctor,
	runMigrationCommand,
	runScaffoldFlow,
} from "@wp-typia/project-tools";
import type { ReadlinePrompt } from "@wp-typia/project-tools";

type CreateExecutionInput = {
	projectDir: string;
	cwd: string;
	flags: Record<string, unknown>;
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

type MigrateExecutionInput = {
	command?: string;
	cwd: string;
	flags: Record<string, unknown>;
	prompt?: ReadlinePrompt;
	renderLine?: (line: string) => void;
};

type PrintLine = (line: string) => void;

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

export async function executeCreateCommand({
	projectDir,
	cwd,
	flags,
}: CreateExecutionInput): Promise<void> {
	const flow = await runScaffoldFlow({
		cwd,
		dataStorageMode: readOptionalStringFlag(flags, "data-storage"),
		isInteractive: false,
		namespace: readOptionalStringFlag(flags, "namespace"),
		noInstall: Boolean(flags["no-install"]),
		packageManager: readOptionalStringFlag(flags, "package-manager"),
		persistencePolicy: readOptionalStringFlag(flags, "persistence-policy"),
		phpPrefix: readOptionalStringFlag(flags, "php-prefix"),
		projectInput: projectDir,
		templateId: readOptionalStringFlag(flags, "template"),
		textDomain: readOptionalStringFlag(flags, "text-domain"),
		variant: readOptionalStringFlag(flags, "variant"),
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

	if (kind === "variation" || kind === "pattern") {
		throw new Error(createAddPlaceholderMessage(kind));
	}

	if (kind !== "block") {
		throw new Error(`Unknown add kind "${kind}". Expected one of: block, variation, pattern.`);
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
	pushFlag(argv, "current-migration-version", readOptionalStringFlag(flags, "current-migration-version"));
	pushFlag(argv, "migration-version", readOptionalStringFlag(flags, "migration-version"));
	pushFlag(argv, "from-migration-version", readOptionalStringFlag(flags, "from-migration-version"));
	pushFlag(argv, "to-migration-version", readOptionalStringFlag(flags, "to-migration-version"));
	pushFlag(argv, "iterations", readOptionalStringFlag(flags, "iterations"));
	pushFlag(argv, "seed", readOptionalStringFlag(flags, "seed"));

	const parsed = parseMigrationArgs(argv);
	await runMigrationCommand(parsed, cwd, {
		prompt,
		renderLine,
	});
}

export { formatAddHelpText, formatMigrationHelpText, listTemplates };
