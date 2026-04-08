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
	const firstPositionalIndex = argv.findIndex((arg) => !arg.startsWith("-"));
	if (firstPositionalIndex === -1) {
		return;
	}

	const commandName = argv[firstPositionalIndex] as keyof typeof STRING_OPTION_NAMES_BY_COMMAND;
	const stringOptionNames = STRING_OPTION_NAMES_BY_COMMAND[commandName];
	if (!stringOptionNames) {
		return;
	}

	for (let index = firstPositionalIndex + 1; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--") {
			break;
		}
		if (!arg.startsWith("--")) {
			continue;
		}

		const [rawName, inlineValue] = arg.slice(2).split("=", 2);
		if (!stringOptionNames.has(rawName as never)) {
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
	const firstPositional = argv.find((arg) => !arg.startsWith("-"));
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

	const positionalIndex = argv.indexOf(firstPositional);
	const normalizedArgv = [
		...argv.slice(0, positionalIndex),
		"create",
		...argv.slice(positionalIndex),
	];
	assertStringOptionValues(normalizedArgv);
	return normalizedArgv;
}
