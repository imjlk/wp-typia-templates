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
} from "./cli-core.js";
import {
	PACKAGE_MANAGER_IDS,
	getPackageManagerSelectOptions,
} from "./package-managers.js";

function parseArgs(argv) {
	const parsed = {
		help: false,
		noInstall: false,
		packageManager: undefined,
		positionals: [],
		template: undefined,
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

function printDoctorLine({ status, label, detail }) {
	console.log(`${status === "pass" ? "PASS" : "FAIL"} ${label}: ${detail}`);
}

async function runScaffold(parsed, cwd) {
	const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
	const prompt = createReadlinePrompt();

	try {
		const flow = await runScaffoldFlow({
			cwd,
			isInteractive,
			noInstall: parsed.noInstall,
			packageManager: parsed.packageManager,
			projectInput: parsed.positionals[0],
			promptText: (message, defaultValue, validate) =>
				prompt.text(message, defaultValue, validate),
			selectPackageManager: () =>
				prompt.select("Choose a package manager", getPackageManagerSelectOptions(), 1),
			selectTemplate: () =>
				prompt.select("Select a template", getTemplateSelectOptions(), 1),
			templateId: parsed.template,
			yes: parsed.yes,
		});

		console.log(`\n✅ Created ${flow.result.variables.title} in ${flow.projectDir}`);
		console.log("Next steps:");
		for (const step of flow.nextSteps) {
			console.log(`  ${step}`);
		}
	} finally {
		prompt.close();
	}
}

export async function runNodeCli(argv = process.argv.slice(2), cwd = process.cwd()) {
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
				throw new Error(`Template ID is required. Use one of: ${listTemplates().map((template) => template.id).join(", ")}`);
			}
			console.log(formatTemplateDetails(getTemplateById(templateId)));
			return;
		}
		throw new Error("Usage: create-wp-typia templates <list|inspect>");
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
