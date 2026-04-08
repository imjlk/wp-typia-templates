export const WP_TYPIA_CANONICAL_CREATE_USAGE = "wp-typia create <project-dir>";
export const WP_TYPIA_POSITIONAL_ALIAS_USAGE = "wp-typia <project-dir>";
export const WP_TYPIA_BUNLI_MIGRATION_DOC = "docs/bunli-cli-migration.md";

export const WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES = [
	"create",
	"add",
	"templates",
	"migrations",
	"doctor",
] as const;

export type WpTypiaReservedTopLevelCommandName =
	(typeof WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES)[number];

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
		description: "Inspect scaffold templates.",
		name: "templates",
		subcommands: ["list", "inspect"],
	},
	{
		description: "Run migration workflows.",
		name: "migrations",
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
		description: "Run repository and project diagnostics.",
		name: "doctor",
	},
] as const satisfies ReadonlyArray<{
	description: string;
	name: WpTypiaReservedTopLevelCommandName;
	subcommands?: readonly string[];
}>;
