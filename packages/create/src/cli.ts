#!/usr/bin/env node
import {
	createReadlinePrompt,
	formatHelpText,
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
	runDoctor,
	runScaffoldFlow,
} from "./runtime/cli-core.js";
import {
	formatMigrationHelpText,
	parseMigrationArgs,
	runMigrationCommand,
} from "./runtime/migrations.js";
import {
	PACKAGE_MANAGER_IDS,
	getPackageManagerSelectOptions,
} from "./runtime/package-managers.js";

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
	yes: boolean;
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
			parsed.packageManager = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg === "--namespace") {
			parsed.namespace = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--namespace=")) {
			parsed.namespace = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--text-domain") {
			parsed.textDomain = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--text-domain=")) {
			parsed.textDomain = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--php-prefix") {
			parsed.phpPrefix = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--php-prefix=")) {
			parsed.phpPrefix = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--data-storage") {
			parsed.dataStorage = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--data-storage=")) {
			parsed.dataStorage = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--persistence-policy") {
			parsed.persistencePolicy = argv[index + 1];
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
	const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
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
			templateId: parsed.template,
			textDomain: parsed.textDomain,
			variant: parsed.variant,
			persistencePolicy: parsed.persistencePolicy,
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
		const migrationCommand = parseMigrationArgs(argv.slice(1));
		if (!migrationCommand.command) {
			console.log(formatMigrationHelpText());
			return;
		}
		await runMigrationCommand(migrationCommand, cwd, { renderLine: console.log });
		return;
	}

	const parsed = parseArgs(argv);

	if (parsed.help) {
		console.log(formatHelpText());
		return;
	}

	const [first, second] = parsed.positionals;
	if (first === "templates") {
		if (second === "list") {
			for (const template of listTemplates()) {
				console.log(formatTemplateSummary(template));
				console.log(formatTemplateFeatures(template));
			}
			return;
		}
		if (second === "inspect") {
			const templateId = parsed.positionals[2];
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

	if (first === "doctor") {
		await runDoctor(cwd, { renderLine: printDoctorLine });
		return;
	}

	if (parsed.yes && !parsed.packageManager) {
		throw new Error(
			`Package manager is required when using --yes. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
		);
	}

	await runScaffold(parsed, cwd);
}

main().catch((error: unknown) => {
	console.error("❌ wp-typia failed:", error instanceof Error ? error.message : error);
	process.exit(1);
});
