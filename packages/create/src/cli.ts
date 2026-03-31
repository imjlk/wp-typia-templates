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
	noInstall: boolean;
	packageManager?: string;
	positionals: string[];
	template?: string;
	variant?: string;
	writeAuth?: string;
	yes: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	const parsed: ParsedArgs = {
		dataStorage: undefined,
		help: false,
		noInstall: false,
		packageManager: undefined,
		positionals: [],
		template: undefined,
		variant: undefined,
		writeAuth: undefined,
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
		if (arg === "--data-storage") {
			parsed.dataStorage = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--data-storage=")) {
			parsed.dataStorage = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--write-auth") {
			parsed.writeAuth = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--write-auth=")) {
			parsed.writeAuth = arg.split("=", 2)[1];
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
			noInstall: parsed.noInstall,
			packageManager: parsed.packageManager,
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
			selectWriteAuth: () =>
				prompt.select(
					"Choose a write auth mode",
					[
						{ label: "nonce", value: "nonce", hint: "Authenticated write requests with WP REST nonce" },
						{ label: "public", value: "public", hint: "Anonymous/public write sample for demo scenarios" },
					],
					1,
				),
			selectTemplate: () =>
				prompt.select("Select a template", getTemplateSelectOptions(), 1),
			templateId: parsed.template,
			variant: parsed.variant,
			writeAuthMode: parsed.writeAuth,
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
