export const WP_TYPIA_CANONICAL_CREATE_USAGE = 'wp-typia create <project-dir>';
export const WP_TYPIA_POSITIONAL_ALIAS_USAGE = 'wp-typia <project-dir>';
export const WP_TYPIA_CANONICAL_MIGRATE_USAGE = 'wp-typia migrate <subcommand>';
export const WP_TYPIA_DEPRECATED_MIGRATIONS_USAGE =
  'wp-typia migrations <subcommand>';
export const WP_TYPIA_BUNLI_MIGRATION_DOC =
  'https://imjlk.github.io/wp-typia/maintainers/bunli-cli-migration/';

export const WP_TYPIA_COMMAND_REGISTRY = [
  {
    commandTree: true,
    description: 'Scaffold a new wp-typia project.',
    name: 'create',
    nodeFallback: true,
    optionGroups: ['create'],
    requiresBunRuntime: false,
  },
  {
    commandTree: true,
    description: 'Preview the minimum retrofit plan for an existing project.',
    name: 'init',
    nodeFallback: true,
    optionGroups: [],
    requiresBunRuntime: false,
  },
  {
    commandTree: true,
    description: 'Run the common generated-project sync workflow.',
    name: 'sync',
    nodeFallback: true,
    optionGroups: ['sync'],
    requiresBunRuntime: false,
    subcommands: ['ai'],
  },
  {
    commandTree: true,
    description: 'Extend an official wp-typia workspace.',
    name: 'add',
    nodeFallback: true,
    optionGroups: ['add'],
    requiresBunRuntime: false,
    subcommands: [
      'block',
      'variation',
      'style',
      'transform',
      'pattern',
      'binding-source',
      'rest-resource',
      'editor-plugin',
      'hooked-block',
    ],
  },
  {
    commandTree: true,
    description: 'Run migration workflows.',
    name: 'migrate',
    nodeFallback: true,
    optionGroups: ['migrate'],
    requiresBunRuntime: false,
    subcommands: [
      'init',
      'snapshot',
      'diff',
      'scaffold',
      'plan',
      'wizard',
      'verify',
      'doctor',
      'fixtures',
      'fuzz',
    ],
  },
  {
    commandTree: true,
    description: 'Inspect scaffold templates.',
    name: 'templates',
    nodeFallback: true,
    optionGroups: ['templates'],
    requiresBunRuntime: false,
    subcommands: ['list', 'inspect'],
  },
  {
    commandTree: true,
    description: 'Run repository and project diagnostics.',
    name: 'doctor',
    nodeFallback: true,
    optionGroups: ['doctor'],
    requiresBunRuntime: false,
  },
  {
    commandTree: true,
    description: 'Inspect or sync schema-driven MCP metadata.',
    name: 'mcp',
    nodeFallback: false,
    optionGroups: [],
    requiresBunRuntime: true,
    subcommands: ['list', 'sync'],
  },
  {
    commandTree: false,
    name: 'help',
    nodeFallback: true,
    optionGroups: [],
    requiresBunRuntime: false,
  },
  {
    commandTree: false,
    name: 'version',
    nodeFallback: true,
    optionGroups: [],
    requiresBunRuntime: false,
  },
  {
    commandTree: false,
    name: 'skills',
    nodeFallback: false,
    optionGroups: [],
    requiresBunRuntime: true,
  },
  {
    commandTree: false,
    name: 'completions',
    nodeFallback: false,
    optionGroups: [],
    requiresBunRuntime: true,
  },
  {
    commandTree: false,
    name: 'complete',
    nodeFallback: false,
    optionGroups: [],
    requiresBunRuntime: true,
  },
] as const;

export type WpTypiaCommandRegistryEntry =
  (typeof WP_TYPIA_COMMAND_REGISTRY)[number];
export type WpTypiaReservedTopLevelCommandName =
  WpTypiaCommandRegistryEntry['name'];
export type WpTypiaCommandOptionGroupName =
  WpTypiaCommandRegistryEntry['optionGroups'][number];
export type WpTypiaTopLevelCommandName = Extract<
  WpTypiaCommandRegistryEntry,
  { commandTree: true }
>['name'];

export const WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES =
  WP_TYPIA_COMMAND_REGISTRY.map(
    (command) => command.name,
  ) as readonly WpTypiaReservedTopLevelCommandName[];

export const WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES =
  WP_TYPIA_COMMAND_REGISTRY.filter((command) => command.nodeFallback).map(
    (command) => command.name,
  ) as readonly WpTypiaReservedTopLevelCommandName[];

export const WP_TYPIA_TOP_LEVEL_COMMAND_NAMES =
  WP_TYPIA_COMMAND_REGISTRY.filter((command) => command.commandTree).map(
    (command) => command.name,
  ) as readonly WpTypiaTopLevelCommandName[];

export const WP_TYPIA_BUN_REQUIRED_TOP_LEVEL_COMMAND_NAMES =
  WP_TYPIA_COMMAND_REGISTRY.filter((command) => command.requiresBunRuntime).map(
    (command) => command.name,
  ) as readonly WpTypiaReservedTopLevelCommandName[];

export const WP_TYPIA_FUTURE_COMMAND_TREE = WP_TYPIA_COMMAND_REGISTRY.filter(
  (
    command,
  ): command is Extract<WpTypiaCommandRegistryEntry, { commandTree: true }> =>
    command.commandTree,
).map((command) => ({
  description: command.description,
  name: command.name,
  ...(command.subcommands ? { subcommands: command.subcommands } : {}),
})) as ReadonlyArray<{
  description: string;
  name: WpTypiaTopLevelCommandName;
  subcommands?: readonly string[];
}>;

export const WP_TYPIA_COMMAND_OPTION_GROUP_NAMES_BY_TOP_LEVEL_COMMAND =
  Object.fromEntries(
    WP_TYPIA_COMMAND_REGISTRY.map((command) => [
      command.name,
      command.optionGroups,
    ]),
  ) as {
    [Name in WpTypiaReservedTopLevelCommandName]: readonly WpTypiaCommandOptionGroupName[];
  };
