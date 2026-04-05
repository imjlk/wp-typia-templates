#!/usr/bin/env node

interface ParsedArgs {
	dataStorage?: string;
	help: boolean;
	namespace?: string;
	noInstall: boolean;
	packageManager?: string;
	persistencePolicy?: string;
	phpPrefix?: string;
	positionals: string[];
	template?: string;
	textDomain?: string;
	variant?: string;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	yes: boolean;
}

function getRequiredValue(argv: string[], index: number, flagName: string): string {
	const value = argv[index + 1];
	if (value === undefined || value.startsWith("-")) {
		throw new Error(`${flagName} requires a value`);
	}

	return value;
}

function parseArgs(argv: string[]): ParsedArgs {
	const parsed: ParsedArgs = {
		dataStorage: undefined,
		help: false,
		namespace: undefined,
		noInstall: false,
		packageManager: undefined,
		persistencePolicy: undefined,
		phpPrefix: undefined,
		positionals: [],
		template: undefined,
		textDomain: undefined,
		variant: undefined,
		withMigrationUi: undefined,
		withTestPreset: undefined,
		withWpEnv: undefined,
		yes: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (!arg.startsWith("-")) {
			parsed.positionals.push(arg);
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
			continue;
		}
		if (arg === "--yes" || arg === "-y") {
			parsed.yes = true;
			continue;
		}
		if (arg === "--no-install") {
			parsed.noInstall = true;
			continue;
		}
		if (arg === "--with-wp-env") {
			parsed.withWpEnv = true;
			continue;
		}
		if (arg === "--with-migration-ui") {
			parsed.withMigrationUi = true;
			continue;
		}
		if (arg === "--with-test-preset") {
			parsed.withTestPreset = true;
			continue;
		}
		if (arg === "--template" || arg === "-t") {
			parsed.template = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--template=")) {
			parsed.template = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--variant") {
			parsed.variant = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--variant=")) {
			parsed.variant = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--package-manager" || arg === "-p") {
			parsed.packageManager = getRequiredValue(argv, index, "--package-manager");
			index += 1;
			continue;
		}
		if (arg === "--namespace") {
			parsed.namespace = getRequiredValue(argv, index, "--namespace");
			index += 1;
			continue;
		}
		if (arg.startsWith("--namespace=")) {
			parsed.namespace = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--text-domain") {
			parsed.textDomain = getRequiredValue(argv, index, "--text-domain");
			index += 1;
			continue;
		}
		if (arg.startsWith("--text-domain=")) {
			parsed.textDomain = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--php-prefix") {
			parsed.phpPrefix = getRequiredValue(argv, index, "--php-prefix");
			index += 1;
			continue;
		}
		if (arg.startsWith("--php-prefix=")) {
			parsed.phpPrefix = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--data-storage") {
			parsed.dataStorage = getRequiredValue(argv, index, "--data-storage");
			index += 1;
			continue;
		}
		if (arg.startsWith("--data-storage=")) {
			parsed.dataStorage = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--persistence-policy") {
			parsed.persistencePolicy = getRequiredValue(argv, index, "--persistence-policy");
			index += 1;
			continue;
		}
		if (arg.startsWith("--persistence-policy=")) {
			parsed.persistencePolicy = arg.split("=", 2)[1];
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

async function runMigrationCli(argv: string[], cwd: string) {
	const { formatMigrationHelpText, parseMigrationArgs, runMigrationCommand } = await import(
		"./runtime/migrations.js"
	);
	const migrationCommand = parseMigrationArgs(argv);
	if (!migrationCommand.command) {
		console.log(formatMigrationHelpText());
		return;
	}

	await runMigrationCommand(migrationCommand, cwd, { renderLine: console.log });
}

async function runTemplatesCli(positionals: string[]) {
	const {
		formatTemplateDetails,
		formatTemplateFeatures,
		formatTemplateSummary,
		getTemplateById,
		listTemplates,
	} = await import("./runtime/cli-templates.js");
	const [, templateCommand, templateId] = positionals;

	if (templateCommand === "list") {
		for (const template of listTemplates()) {
			console.log(formatTemplateSummary(template));
			console.log(formatTemplateFeatures(template));
		}
		return;
	}

	if (templateCommand === "inspect") {
		if (!templateId) {
			throw new Error(
				`Template ID is required. Use one of: ${listTemplates().map((template) => template.id).join(", ")}`,
			);
		}
		console.log(formatTemplateDetails(getTemplateById(templateId)));
		return;
	}

	throw new Error("Usage: wp-typia templates <list|inspect>");
}

async function assertYesModePackageManager(parsed: ParsedArgs) {
	if (!parsed.yes || parsed.packageManager) {
		return;
	}

	const { PACKAGE_MANAGER_IDS } = await import("./runtime/package-managers.js");
	throw new Error(
		`Package manager is required when using --yes. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
	);
}

function printDoctorLine({
	status,
	label,
	detail,
}: {
	status: "fail" | "pass" | "warn";
	label: string;
	detail: string;
}) {
	const prefix = status === "pass" ? "PASS" : status === "fail" ? "FAIL" : "WARN";
	console.log(`${prefix} ${label}: ${detail}`);
}

async function runScaffold(parsed: ParsedArgs, cwd: string) {
	const [
		{ createReadlinePrompt, runScaffoldFlow },
		{ getPackageManagerSelectOptions },
		{ getTemplateSelectOptions },
		{ isInteractiveTerminal },
	] =
		await Promise.all([
			import("./runtime/cli-scaffold.js"),
			import("./runtime/package-managers.js"),
			import("./runtime/template-registry.js"),
			import("./runtime/migration-utils.js"),
		]);
	const isInteractive = isInteractiveTerminal();
	const prompt = createReadlinePrompt();

	try {
		const flow = await runScaffoldFlow({
			cwd,
			dataStorageMode: parsed.dataStorage,
			isInteractive,
			namespace: parsed.namespace,
			noInstall: parsed.noInstall,
			packageManager: parsed.packageManager,
			phpPrefix: parsed.phpPrefix,
			projectInput: parsed.positionals[0],
			promptText: (message: string, defaultValue: string, validate?: (input: string) => boolean | string) =>
				prompt.text(message, defaultValue, validate),
			selectPackageManager: () =>
				prompt.select("Choose a package manager", getPackageManagerSelectOptions(), 1),
			selectDataStorage: () =>
				prompt.select(
					"Choose a data storage mode",
					[
						{ label: "custom-table", value: "custom-table", hint: "Dedicated table + repository layer" },
						{ label: "post-meta", value: "post-meta", hint: "Persist through post meta" },
					],
					1,
				),
			selectPersistencePolicy: () =>
				prompt.select(
					"Choose a persistence policy",
					[
						{ label: "authenticated", value: "authenticated", hint: "Logged-in writes protected by WP REST nonce" },
						{ label: "public", value: "public", hint: "Signed public write token flow for anonymous interactions" },
					],
					1,
				),
			selectTemplate: () =>
				prompt.select("Select a template", getTemplateSelectOptions(), 1),
			selectWithTestPreset: () =>
				prompt.select(
					"Add the optional Playwright smoke preset?",
					[
						{ label: "No", value: "no", hint: "Keep the scaffold lightweight" },
						{ label: "Yes", value: "yes", hint: "Add test-only wp-env and Playwright files" },
					],
					1,
				).then((value) => value === "yes"),
			selectWithMigrationUi: () =>
				prompt.select(
					"Add migration UI support?",
					[
						{ label: "No", value: "no", hint: "Keep the scaffold lightweight" },
						{ label: "Yes", value: "yes", hint: "Seed migration workspace and editor dashboard" },
					],
					1,
				).then((value) => value === "yes"),
			selectWithWpEnv: () =>
				prompt.select(
					"Add a local wp-env preset?",
					[
						{ label: "No", value: "no", hint: "Use your existing local WordPress setup" },
						{ label: "Yes", value: "yes", hint: "Add .wp-env.json and local wp-env scripts" },
					],
					1,
				).then((value) => value === "yes"),
			templateId: parsed.template,
			textDomain: parsed.textDomain,
			variant: parsed.variant,
			persistencePolicy: parsed.persistencePolicy,
			withMigrationUi: parsed.withMigrationUi,
			withTestPreset: parsed.withTestPreset,
			withWpEnv: parsed.withWpEnv,
			yes: parsed.yes,
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
		prompt.close();
	}
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
	if (argv[0] === "migrations") {
		await runMigrationCli(argv.slice(1), cwd);
		return;
	}

	const parsed = parseArgs(argv);

	if (parsed.help) {
		const { formatHelpText } = await import("./runtime/cli-help.js");
		console.log(formatHelpText());
		return;
	}

	const [first] = parsed.positionals;
	if (first === "templates") {
		await runTemplatesCli(parsed.positionals);
		return;
	}

	if (first === "doctor") {
		const { runDoctor } = await import("./runtime/cli-doctor.js");
		await runDoctor(cwd, { renderLine: printDoctorLine });
		return;
	}

	await assertYesModePackageManager(parsed);

	await runScaffold(parsed, cwd);
}

main().catch((error: unknown) => {
	console.error("❌ wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
