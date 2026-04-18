import packageJson from "../package.json";
import {
	createCliCommandError,
	formatCliDiagnosticError,
} from "@wp-typia/project-tools/cli-diagnostics";
import {
	formatTemplateDetails,
	formatTemplateFeatures,
	formatTemplateSummary,
	getTemplateById,
	listTemplates,
} from "@wp-typia/project-tools/cli-templates";
import {
	getAddBlockDefaults,
	getCreateDefaults,
	loadWpTypiaUserConfigFromSource,
} from "./config";
import { extractWpTypiaConfigOverride } from "./config-override";
import {
	executeAddCommand,
	executeCreateCommand,
	executeDoctorCommand,
	executeMigrateCommand,
	executeSyncCommand,
	executeTemplatesCommand,
} from "./runtime-bridge";
import {
	WP_TYPIA_CANONICAL_CREATE_USAGE,
	WP_TYPIA_CANONICAL_MIGRATE_USAGE,
	WP_TYPIA_POSITIONAL_ALIAS_USAGE,
	WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
	normalizeWpTypiaArgv,
} from "./command-contract";

type GlobalFlags = {
	format?: string;
	id?: string;
};

type ParsedArgv = {
	flags: Record<string, unknown>;
	positionals: string[];
};

const STRING_FLAG_NAMES = new Set([
	"anchor",
	"block",
	"current-migration-version",
	"data-storage",
	"external-layer-id",
	"external-layer-source",
	"format",
	"id",
	"iterations",
	"migration-version",
	"namespace",
	"package-manager",
	"persistence-policy",
	"php-prefix",
	"position",
	"seed",
	"template",
	"text-domain",
	"to-migration-version",
	"from-migration-version",
	"variant",
]);

const BOOLEAN_FLAG_NAMES = new Set([
	"all",
	"check",
	"force",
	"help",
	"no-install",
	"version",
	"with-migration-ui",
	"with-test-preset",
	"with-wp-env",
	"yes",
]);

function printLine(line = "") {
	console.log(line);
}

function printBlock(lines: string[]) {
	for (const line of lines) {
		printLine(line);
	}
}

function parseGlobalFlags(argv: string[]): {
	argv: string[];
	flags: GlobalFlags;
} {
	const nextArgv: string[] = [];
	const flags: GlobalFlags = {};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg) {
			continue;
		}

		if (arg === "--format" || arg === "--id") {
			const next = argv[index + 1];
			if (!next || next.startsWith("-")) {
				throw new Error(`\`${arg}\` requires a value.`);
			}
			if (arg === "--format") {
				flags.format = next;
			} else {
				flags.id = next;
			}
			index += 1;
			continue;
		}

		if (arg.startsWith("--format=")) {
			flags.format = arg.slice("--format=".length);
			continue;
		}

		if (arg.startsWith("--id=")) {
			flags.id = arg.slice("--id=".length);
			continue;
		}

		nextArgv.push(arg);
	}

	return {
		argv: nextArgv,
		flags,
	};
}

async function applyNodeFallbackConfigDefaults(
	command: string | undefined,
	subcommand: string | undefined,
	flags: Record<string, unknown>,
	configOverridePath: string | undefined,
	cwd: string,
): Promise<Record<string, unknown>> {
	if (!configOverridePath) {
		return flags;
	}

	const config = await loadWpTypiaUserConfigFromSource(cwd, configOverridePath);

	if (command === "create") {
		return {
			...getCreateDefaults(config),
			...flags,
		};
	}

	if (command === "add" && subcommand === "block") {
		return {
			...getAddBlockDefaults(config),
			...flags,
		};
	}

	return flags;
}

function parseArgv(argv: string[]): ParsedArgv {
	const flags: Record<string, unknown> = {};
	const positionals: string[] = [];

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg) {
			continue;
		}

		if (arg === "--") {
			positionals.push(...argv.slice(index + 1));
			break;
		}

		if (arg === "-y") {
			flags.yes = true;
			continue;
		}

		if (arg === "-t" || arg === "-p" || arg === "-c") {
			const next = argv[index + 1];
			if (!next || next.startsWith("-")) {
				throw new Error(`\`${arg}\` requires a value.`);
			}
			if (arg === "-t") {
				flags.template = next;
			} else if (arg === "-p") {
				flags["package-manager"] = next;
			} else {
				flags.config = next;
			}
			index += 1;
			continue;
		}

		if (arg.startsWith("--")) {
			const option = arg.slice(2);
			const separatorIndex = option.indexOf("=");
			const rawName =
				separatorIndex === -1 ? option : option.slice(0, separatorIndex);
			const inlineValue =
				separatorIndex === -1 ? undefined : option.slice(separatorIndex + 1);
			if (BOOLEAN_FLAG_NAMES.has(rawName)) {
				flags[rawName] = true;
				continue;
			}
			if (!STRING_FLAG_NAMES.has(rawName)) {
				throw new Error(`Unknown option \`--${rawName}\`.`);
			}
			if (inlineValue !== undefined) {
				if (!inlineValue) {
					throw new Error(`\`--${rawName}\` requires a value.`);
				}
				flags[rawName] = inlineValue;
				continue;
			}
			const next = argv[index + 1];
			if (!next || next.startsWith("-")) {
				throw new Error(`\`--${rawName}\` requires a value.`);
			}
			flags[rawName] = next;
			index += 1;
			continue;
		}

		positionals.push(arg);
	}

	return {
		flags,
		positionals,
	};
}

function renderGeneralHelp() {
	printBlock([
		`wp-typia ${packageJson.version}`,
		"",
		"Canonical CLI package for wp-typia scaffolding and project workflows.",
		"",
		"Supported without a local Bun binary:",
		"- `wp-typia --version`",
		"- `wp-typia --help`",
		`- ${WP_TYPIA_CANONICAL_CREATE_USAGE} (non-interactive)`,
		"- `wp-typia add <kind> ...` (non-interactive)",
		`- ${WP_TYPIA_CANONICAL_MIGRATE_USAGE} (non-interactive)`,
		"- `wp-typia doctor`",
		"- `wp-typia sync`",
		"- `wp-typia templates list`",
		"- `wp-typia templates inspect --id <template-id>`",
		"",
		"Commands:",
		...WP_TYPIA_TOP_LEVEL_COMMAND_NAMES.map((command) => `- ${command}`),
		"",
		"Canonical usage:",
		`- ${WP_TYPIA_CANONICAL_CREATE_USAGE}`,
		`- ${WP_TYPIA_CANONICAL_MIGRATE_USAGE}`,
		`- ${WP_TYPIA_POSITIONAL_ALIAS_USAGE}`,
		"",
		"Install Bun 1.3.11+ or use `bunx wp-typia ...` for the full Bunli-powered interactive runtime.",
	]);
}

function renderTemplatesHelp() {
	printBlock([
		"wp-typia templates <list|inspect>",
		"",
		"Node fallback support:",
		`- ${WP_TYPIA_CANONICAL_CREATE_USAGE} (non-interactive)`,
		"- `wp-typia add <kind> ...` (non-interactive)",
		`- ${WP_TYPIA_CANONICAL_MIGRATE_USAGE} (non-interactive)`,
		"- `wp-typia doctor`",
		"- `wp-typia sync`",
		"- `wp-typia templates list`",
		"- `wp-typia templates inspect --id <template-id>`",
	]);
}

function renderCreateHelp() {
	printBlock([
		`Usage: ${WP_TYPIA_CANONICAL_CREATE_USAGE}`,
		"",
		"Supported non-interactive flags:",
		"--template",
		"--variant",
		"--namespace",
		"--php-prefix",
		"--text-domain",
		"--package-manager",
		"--data-storage",
		"--persistence-policy",
		"--external-layer-source",
		"--external-layer-id",
		"--with-migration-ui",
		"--with-test-preset",
		"--with-wp-env",
		"--no-install",
		"--yes",
	]);
}

function renderAddHelp() {
	printBlock([
		"Usage: wp-typia add <kind> <name>",
		"",
		"Supported non-interactive flags:",
		"--template",
		"--data-storage",
		"--persistence-policy",
		"--external-layer-source",
		"--external-layer-id",
		"--block",
		"--anchor",
		"--position",
	]);
}

function renderVersion() {
	printLine(
		JSON.stringify(
			{
				ok: true,
				data: {
					type: "version",
					name: packageJson.name,
					version: packageJson.version,
				},
			},
			null,
			2,
		),
	);
}

function renderTemplatesJson(flags: GlobalFlags, subcommand: string) {
	if (subcommand === "list") {
		printLine(
			JSON.stringify(
				{
					templates: listTemplates(),
				},
				null,
				2,
			),
		);
		return;
	}

	const templateId = flags.id;
	if (!templateId) {
		throw new Error("`wp-typia templates inspect` requires <template-id>.");
	}
	const template = getTemplateById(templateId);
	if (!template) {
		throw new Error(`Unknown template "${templateId}".`);
	}
	printLine(
		JSON.stringify(
			{
				template,
			},
			null,
			2,
		),
	);
}

function renderTemplatesText(flags: GlobalFlags, subcommand: string) {
	if (subcommand === "list") {
		for (const template of listTemplates()) {
			printBlock([
				formatTemplateSummary(template),
				formatTemplateFeatures(template),
				"",
			]);
		}
		return;
	}

	const templateId = flags.id;
	if (!templateId) {
		throw new Error("`wp-typia templates inspect` requires <template-id>.");
	}
	const template = getTemplateById(templateId);
	if (!template) {
		throw new Error(`Unknown template "${templateId}".`);
	}
	printBlock([
		formatTemplateSummary(template),
		formatTemplateFeatures(template),
		formatTemplateDetails(template),
	]);
}

function renderUnsupportedCommand(command: string) {
	throw new Error(
		[
			`The Bun-free fallback runtime does not support \`${command}\` yet.`,
			"Supported without Bun: `--version`, `--help`, non-interactive `create`/`add`/`migrate`, `doctor`, `sync`, `templates list`, and `templates inspect`.",
			"Install Bun 1.3.11+ or use `bunx wp-typia ...` for the full Bunli-powered runtime.",
		].join(" "),
	);
}

async function renderDoctorJson(): Promise<void> {
	const [{ getDoctorChecks }, { createCliCommandError, getDoctorFailureDetailLines }] =
		await Promise.all([
			import("@wp-typia/project-tools/cli-doctor"),
			import("@wp-typia/project-tools/cli-diagnostics"),
		]);
	const checks = await getDoctorChecks(process.cwd());
	printLine(
		JSON.stringify(
			{
				checks,
			},
			null,
			2,
		),
	);
	if (checks.some((check) => check.status === "fail")) {
		throw createCliCommandError({
			command: "doctor",
			detailLines: getDoctorFailureDetailLines(checks),
			summary: "One or more doctor checks failed.",
		});
	}
}

export async function runNodeCli(argv = process.argv.slice(2)): Promise<void> {
	const normalizedArgv = normalizeWpTypiaArgv(argv);
	const {
		argv: argvWithoutConfigOverride,
		configOverridePath,
	} = extractWpTypiaConfigOverride(normalizedArgv);
	const { argv: cliArgv, flags } = parseGlobalFlags(argvWithoutConfigOverride);
	const { flags: commandFlags, positionals } = parseArgv(cliArgv);
	const rawMergedFlags: Record<string, unknown> = {
		...commandFlags,
		...flags,
	};
	const [command, subcommand] = positionals;
	const mergedFlags = await applyNodeFallbackConfigDefaults(
		command,
		subcommand,
		rawMergedFlags,
		configOverridePath,
		process.cwd(),
	);

	if (cliArgv.length === 0 || cliArgv.includes("--help") || command === "help") {
		if (command === "templates") {
			renderTemplatesHelp();
			return;
		}
		if (command === "create") {
			renderCreateHelp();
			return;
		}
		if (command === "add") {
			renderAddHelp();
			return;
		}
		renderGeneralHelp();
		return;
	}

	if (cliArgv.includes("--version") || command === "version") {
		renderVersion();
		return;
	}

	if (command === "templates") {
		const templateId =
			typeof mergedFlags.id === "string"
				? mergedFlags.id
				: (positionals[2] as string | undefined);
		const resolvedSubcommand = templateId ? "inspect" : subcommand ?? "list";
		if (resolvedSubcommand !== "list" && resolvedSubcommand !== "inspect") {
			throw new Error(
				`Unknown templates subcommand "${resolvedSubcommand}". Expected list or inspect.`,
			);
		}
		if (mergedFlags.format === "json") {
			renderTemplatesJson(
				{
					format: mergedFlags.format as string | undefined,
					id: templateId,
				},
				resolvedSubcommand,
			);
			return;
		}
		await executeTemplatesCommand({
			flags: {
				id: templateId,
				subcommand: resolvedSubcommand,
			},
		});
		return;
	}

	if (command === "create") {
		const projectDir = positionals[1];
		if (!projectDir) {
			throw createCliCommandError({
				command: "create",
				detailLines: ["`wp-typia create` requires <project-dir>."],
			});
		}
		await executeCreateCommand({
			cwd: process.cwd(),
			flags: mergedFlags,
			interactive: false,
			projectDir,
		});
		return;
	}

	if (command === "add") {
		await executeAddCommand({
			cwd: process.cwd(),
			flags: mergedFlags,
			interactive: false,
			kind: positionals[1],
			name: positionals[2],
		});
		return;
	}

	if (command === "migrate") {
		await executeMigrateCommand({
			command: positionals[1],
			cwd: process.cwd(),
			flags: mergedFlags,
		});
		return;
	}

	if (command === "doctor") {
		if (mergedFlags.format === "json") {
			await renderDoctorJson();
			return;
		}
		await executeDoctorCommand(process.cwd());
		return;
	}

	if (command === "sync") {
		await executeSyncCommand({
			check: Boolean(mergedFlags.check),
			cwd: process.cwd(),
		});
		return;
	}

	renderUnsupportedCommand(command ?? "(missing)");
}

export async function runNodeCliEntrypoint(argv = process.argv.slice(2)): Promise<void> {
	try {
		await runNodeCli(argv);
	} catch (error) {
		console.error(`Error: ${await formatCliDiagnosticError(error)}`);
		process.exit(1);
	}
}
