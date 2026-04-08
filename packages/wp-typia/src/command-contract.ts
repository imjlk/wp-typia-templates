export const WP_TYPIA_CANONICAL_CREATE_USAGE = "wp-typia create <project-dir>";
export const WP_TYPIA_POSITIONAL_ALIAS_USAGE = "wp-typia <project-dir>";
export const WP_TYPIA_CANONICAL_MIGRATE_USAGE = "wp-typia migrate <subcommand>";
export const WP_TYPIA_DEPRECATED_MIGRATIONS_USAGE = "wp-typia migrations <subcommand>";
export const WP_TYPIA_BUNLI_MIGRATION_DOC = "docs/bunli-cli-migration.md";

export const WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES = [
	"create",
	"add",
	"migrate",
	"templates",
	"doctor",
	"mcp",
	"skills",
	"completions",
	"complete",
] as const;

export const WP_TYPIA_TOP_LEVEL_COMMAND_NAMES = [
	"create",
	"add",
	"migrate",
	"templates",
	"doctor",
	"mcp",
] as const;

const STRING_OPTION_NAMES_BY_COMMAND = {
	add: new Set([
		"data-storage",
		"persistence-policy",
		"template",
	]),
	create: new Set([
		"data-storage",
		"namespace",
		"package-manager",
		"persistence-policy",
		"php-prefix",
		"template",
		"text-domain",
		"variant",
	]),
	migrate: new Set([
		"current-migration-version",
		"from-migration-version",
		"iterations",
		"migration-version",
		"seed",
		"to-migration-version",
	]),
} as const;

const GLOBAL_STRING_OPTION_NAMES = new Set([
	"config",
	"format",
	"id",
	"output-dir",
]);

const SHORT_OPTION_NAMES_WITH_VALUES = new Set([
	"c",
	"p",
	"t",
]);

function isLongOptionValueConsumer(optionName: string): boolean {
	if (GLOBAL_STRING_OPTION_NAMES.has(optionName)) {
		return true;
	}

	return Object.values(STRING_OPTION_NAMES_BY_COMMAND).some((optionNames) =>
		optionNames.has(optionName as never),
	);
}

function findFirstPositionalIndex(argv: string[]): number {
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--") {
			return index + 1 < argv.length ? index + 1 : -1;
		}
		if (!arg.startsWith("-") || arg === "-") {
			return index;
		}
		if (arg.startsWith("--")) {
			if (arg.includes("=")) {
				continue;
			}
			if (isLongOptionValueConsumer(arg.slice(2))) {
				index += 1;
			}
			continue;
		}
		if (arg.length === 2 && SHORT_OPTION_NAMES_WITH_VALUES.has(arg.slice(1))) {
			index += 1;
		}
	}

	return -1;
}

export const WP_TYPIA_FUTURE_COMMAND_TREE = [
	{
		description: "Scaffold a new wp-typia project.",
		name: "create",
	},
	{
		description: "Extend an official wp-typia workspace.",
		name: "add",
		subcommands: ["block", "variation", "pattern"],
	},
	{
		description: "Run migration workflows.",
		name: "migrate",
		subcommands: [
			"init",
			"snapshot",
			"diff",
			"scaffold",
			"plan",
			"wizard",
			"verify",
			"doctor",
			"fixtures",
			"fuzz",
		],
	},
	{
		description: "Inspect scaffold templates.",
		name: "templates",
		subcommands: ["list", "inspect"],
	},
	{
		description: "Run repository and project diagnostics.",
		name: "doctor",
	},
	{
		description: "Inspect or sync schema-driven MCP metadata.",
		name: "mcp",
		subcommands: ["list", "sync"],
	},
] as const;

export function isReservedTopLevelCommandName(value: string): boolean {
	return WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES.includes(
		value as (typeof WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES)[number],
	);
}

function assertStringOptionValues(argv: string[]): void {
	const firstPositionalIndex = findFirstPositionalIndex(argv);
	if (firstPositionalIndex === -1) {
		return;
	}

	const commandName = argv[firstPositionalIndex] as keyof typeof STRING_OPTION_NAMES_BY_COMMAND;
	const stringOptionNames = new Set<string>(GLOBAL_STRING_OPTION_NAMES);
	for (const optionName of STRING_OPTION_NAMES_BY_COMMAND[commandName] ?? []) {
		stringOptionNames.add(optionName);
	}

	for (let index = firstPositionalIndex + 1; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--") {
			break;
		}
		if (arg.length === 2 && arg.startsWith("-")) {
			if (SHORT_OPTION_NAMES_WITH_VALUES.has(arg.slice(1))) {
				const next = argv[index + 1];
				if (!next || next.startsWith("-")) {
					throw new Error(`\`${arg}\` requires a value.`);
				}
				index += 1;
			}
			continue;
		}
		if (!arg.startsWith("--")) {
			continue;
		}

		const [rawName, inlineValue] = arg.slice(2).split("=", 2);
		if (!stringOptionNames.has(rawName)) {
			continue;
		}

		if (arg.includes("=")) {
			if (!inlineValue) {
				throw new Error(`\`--${rawName}\` requires a value.`);
			}
			continue;
		}

		const next = argv[index + 1];
		if (!next || next.startsWith("-")) {
			throw new Error(`\`--${rawName}\` requires a value.`);
		}
		index += 1;
	}
}

export function normalizeWpTypiaArgv(argv: string[]): string[] {
	const firstPositionalIndex = findFirstPositionalIndex(argv);
	if (firstPositionalIndex === -1) {
		return argv;
	}

	const firstPositional = argv[firstPositionalIndex];
	if (!firstPositional) {
		return argv;
	}

	if (firstPositional === "migrations") {
		throw new Error(
			"`wp-typia migrations` was removed in favor of `wp-typia migrate`. Use `wp-typia migrate <subcommand>` instead.",
		);
	}

	if (isReservedTopLevelCommandName(firstPositional)) {
		assertStringOptionValues(argv);
		return argv;
	}

	const normalizedArgv = [
		...argv.slice(0, firstPositionalIndex),
		"create",
		...argv.slice(firstPositionalIndex),
	];
	assertStringOptionValues(normalizedArgv);
	return normalizedArgv;
}
