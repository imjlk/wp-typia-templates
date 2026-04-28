import path from 'node:path';
import {
  ADD_OPTION_METADATA,
  buildCommandOptionParser,
  collectOptionNamesByType,
  CREATE_OPTION_METADATA,
  GLOBAL_OPTION_METADATA,
  MIGRATE_OPTION_METADATA,
  TEMPLATES_OPTION_METADATA,
} from './command-option-metadata';

export const WP_TYPIA_CANONICAL_CREATE_USAGE = 'wp-typia create <project-dir>';
export const WP_TYPIA_POSITIONAL_ALIAS_USAGE = 'wp-typia <project-dir>';
export const WP_TYPIA_CANONICAL_MIGRATE_USAGE = 'wp-typia migrate <subcommand>';
export const WP_TYPIA_DEPRECATED_MIGRATIONS_USAGE =
  'wp-typia migrations <subcommand>';
export const WP_TYPIA_BUNLI_MIGRATION_DOC =
  'https://imjlk.github.io/wp-typia/maintainers/bunli-cli-migration/';

export const WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES = [
  'create',
  'init',
  'sync',
  'add',
  'migrate',
  'templates',
  'doctor',
  'mcp',
  'help',
  'version',
  'skills',
  'completions',
  'complete',
] as const;

export const WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES = [
  'create',
  'init',
  'sync',
  'add',
  'migrate',
  'templates',
  'doctor',
  'help',
  'version',
] as const;

export const WP_TYPIA_TOP_LEVEL_COMMAND_NAMES = [
  'create',
  'init',
  'sync',
  'add',
  'migrate',
  'templates',
  'doctor',
  'mcp',
] as const;

const NODE_FALLBACK_TOP_LEVEL_COMMAND_NAME_SET = new Set<string>(
  WP_TYPIA_NODE_FALLBACK_TOP_LEVEL_COMMAND_NAMES,
);

export const WP_TYPIA_BUN_REQUIRED_TOP_LEVEL_COMMAND_NAMES =
  WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES.filter(
    (name) => !NODE_FALLBACK_TOP_LEVEL_COMMAND_NAME_SET.has(name),
  );

const SHARED_OPTION_PARSER = buildCommandOptionParser(
  ADD_OPTION_METADATA,
  GLOBAL_OPTION_METADATA,
  CREATE_OPTION_METADATA,
  MIGRATE_OPTION_METADATA,
  TEMPLATES_OPTION_METADATA,
);

const STRING_OPTION_NAMES_BY_COMMAND = {
  add: new Set(collectOptionNamesByType(ADD_OPTION_METADATA, 'string')),
  create: new Set(collectOptionNamesByType(CREATE_OPTION_METADATA, 'string')),
  migrate: new Set(collectOptionNamesByType(MIGRATE_OPTION_METADATA, 'string')),
  templates: new Set(
    collectOptionNamesByType(TEMPLATES_OPTION_METADATA, 'string'),
  ),
} as const;

const GLOBAL_STRING_OPTION_NAMES = new Set(
  collectOptionNamesByType(GLOBAL_OPTION_METADATA, 'string'),
);

const SHORT_OPTION_NAMES_WITH_VALUES = new Set<string>(
  [...SHARED_OPTION_PARSER.shortFlagMap.entries()]
    .filter(([, option]) => option.type === 'string')
    .map(([short]) => short),
);

function isLongOptionValueConsumer(optionName: string): boolean {
  if (GLOBAL_STRING_OPTION_NAMES.has(optionName)) {
    return true;
  }

  return Object.values(STRING_OPTION_NAMES_BY_COMMAND).some((optionNames) =>
    optionNames.has(optionName as never),
  );
}

function findFirstPositionalIndex(argv: string[]): number {
  const positionalIndexes = collectPositionalIndexes(argv);
  return positionalIndexes[0] ?? -1;
}

function collectPositionalIndexes(argv: string[]): number[] {
  const positionalIndexes: number[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      for (let restIndex = index + 1; restIndex < argv.length; restIndex += 1) {
        positionalIndexes.push(restIndex);
      }
      break;
    }
    if (!arg.startsWith('-') || arg === '-') {
      positionalIndexes.push(index);
      continue;
    }
    if (arg.startsWith('--')) {
      if (arg.includes('=')) {
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

  return positionalIndexes;
}

export const WP_TYPIA_FUTURE_COMMAND_TREE = [
  {
    description: 'Scaffold a new wp-typia project.',
    name: 'create',
  },
  {
    description: 'Preview the minimum retrofit plan for an existing project.',
    name: 'init',
  },
  {
    description: 'Run the common generated-project sync workflow.',
    name: 'sync',
    subcommands: ['ai'],
  },
  {
    description: 'Extend an official wp-typia workspace.',
    name: 'add',
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
    description: 'Run migration workflows.',
    name: 'migrate',
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
    description: 'Inspect scaffold templates.',
    name: 'templates',
    subcommands: ['list', 'inspect'],
  },
  {
    description: 'Run repository and project diagnostics.',
    name: 'doctor',
  },
  {
    description: 'Inspect or sync schema-driven MCP metadata.',
    name: 'mcp',
    subcommands: ['list', 'sync'],
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

  const commandName = argv[
    firstPositionalIndex
  ] as keyof typeof STRING_OPTION_NAMES_BY_COMMAND;
  const stringOptionNames = new Set<string>(GLOBAL_STRING_OPTION_NAMES);
  for (const optionName of STRING_OPTION_NAMES_BY_COMMAND[commandName] ?? []) {
    stringOptionNames.add(optionName);
  }

  for (let index = firstPositionalIndex + 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') {
      break;
    }
    if (arg.length === 2 && arg.startsWith('-')) {
      if (SHORT_OPTION_NAMES_WITH_VALUES.has(arg.slice(1))) {
        const next = argv[index + 1];
        if (!next || next.startsWith('-')) {
          throw new Error(`\`${arg}\` requires a value.`);
        }
        index += 1;
      }
      continue;
    }
    if (!arg.startsWith('--')) {
      continue;
    }

    const [rawName, inlineValue] = arg.slice(2).split('=', 2);
    if (!stringOptionNames.has(rawName)) {
      continue;
    }

    if (arg.includes('=')) {
      if (!inlineValue) {
        throw new Error(`\`--${rawName}\` requires a value.`);
      }
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith('-')) {
      throw new Error(`\`--${rawName}\` requires a value.`);
    }
    index += 1;
  }
}

function isWindowsDrivePath(value: string): boolean {
  return /^[A-Za-z]:([\\/]|$)/.test(value);
}

function looksLikeStructuredProjectInput(value: string): boolean {
  if (value.includes('#')) {
    return true;
  }

  if (!isWindowsDrivePath(value) && /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value)) {
    return true;
  }

  return value.startsWith('@') && value.includes('/');
}

function assertPositionalAliasProjectDir(projectDir: string): void {
  const normalizedProjectDir =
    path.normalize(projectDir).replace(/[\\/]+$/u, '') ||
    path.normalize(projectDir);
  if (normalizedProjectDir === '.' || normalizedProjectDir === '..') {
    throw new Error(
      `The positional alias does not scaffold into \`${projectDir}\`. Use \`${WP_TYPIA_CANONICAL_CREATE_USAGE}\` with an explicit child directory instead.`,
    );
  }

  if (looksLikeStructuredProjectInput(projectDir)) {
    throw new Error(
      `The positional alias only accepts unambiguous local project directories. Use \`${WP_TYPIA_CANONICAL_CREATE_USAGE}\` for \`${projectDir}\`.`,
    );
  }
}

export function normalizeWpTypiaArgv(argv: string[]): string[] {
  const positionalIndexes = collectPositionalIndexes(argv);
  const firstPositionalIndex = positionalIndexes[0] ?? -1;
  if (firstPositionalIndex === -1) {
    return argv;
  }

  const firstPositional = argv[firstPositionalIndex];
  if (!firstPositional) {
    return argv;
  }

  if (firstPositional === 'migrations') {
    throw new Error(
      '`wp-typia migrations` was removed in favor of `wp-typia migrate`. Use `wp-typia migrate <subcommand>` instead.',
    );
  }

  if (isReservedTopLevelCommandName(firstPositional)) {
    assertStringOptionValues(argv);
    return argv;
  }

  if (positionalIndexes.length > 1) {
    const extraPositionals = positionalIndexes
      .slice(1)
      .map((index) => argv[index])
      .filter(
        (value): value is string =>
          typeof value === 'string' && value.length > 0,
      );

    throw new Error(
      `The positional alias only accepts a single project directory. Use \`${WP_TYPIA_CANONICAL_CREATE_USAGE}\` for scaffold invocations with additional positional arguments, or check the command spelling if you meant another top-level command. Extra positional arguments: ${extraPositionals.map((value) => `\`${value}\``).join(', ')}.`,
    );
  }

  assertPositionalAliasProjectDir(firstPositional);

  const normalizedArgv = [
    ...argv.slice(0, firstPositionalIndex),
    'create',
    ...argv.slice(firstPositionalIndex),
  ];
  assertStringOptionValues(normalizedArgv);
  return normalizedArgv;
}
