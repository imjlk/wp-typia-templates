import { z } from 'zod';

export type CommandOptionMetadata = {
  argumentKind?: 'flag';
  description: string;
  short?: string;
  type: 'boolean' | 'string';
};

export type CommandOptionMetadataMap = Record<string, CommandOptionMetadata>;
export type ParsedCommandArgv = {
  flags: Record<string, unknown>;
  positionals: string[];
};
export type ShortOptionDescriptor = {
  name: string;
  type: CommandOptionMetadata['type'];
};
export type CommandOptionParser = {
  booleanOptionNames: Set<string>;
  shortFlagMap: Map<string, ShortOptionDescriptor>;
  stringOptionNames: Set<string>;
};
export type CommandOptionGroupName =
  | 'global'
  | 'create'
  | 'add'
  | 'init'
  | 'migrate'
  | 'mcp'
  | 'sync'
  | 'doctor'
  | 'templates';

/**
 * Shared `wp-typia create` option metadata used by both the Bunli command
 * definitions and the Node fallback parser/help surface.
 */
export const CREATE_OPTION_METADATA = {
  'alternate-render-targets': {
    description:
      'Comma-separated alternate render targets for dynamic block scaffolds (email,mjml,plain-text).',
    type: 'string',
  },
  'data-storage': {
    description: 'Persistence storage mode for persistence-capable templates.',
    type: 'string',
  },
  'dry-run': {
    argumentKind: 'flag',
    description:
      'Preview scaffold output for a logical <project-dir> without writing files to the target directory.',
    type: 'boolean',
  },
  'external-layer-id': {
    description:
      'Explicit layer id when an external layer package exposes multiple selectable layers.',
    type: 'string',
  },
  'external-layer-source': {
    description:
      'Local path, GitHub locator, or npm package that exposes wp-typia.layers.json for built-in templates.',
    type: 'string',
  },
  'inner-blocks-preset': {
    description:
      'Compound-only InnerBlocks preset (freeform, ordered, horizontal, locked-structure).',
    type: 'string',
  },
  namespace: {
    description: 'Override the default block namespace.',
    type: 'string',
  },
  'no-install': {
    argumentKind: 'flag',
    description: 'Skip dependency installation after scaffold.',
    type: 'boolean',
  },
  'package-manager': {
    description: 'Package manager to use for install and scripts.',
    short: 'p',
    type: 'string',
  },
  'persistence-policy': {
    description:
      'Authenticated or public write policy for persistence-capable templates.',
    type: 'string',
  },
  'php-prefix': {
    description: 'Custom PHP symbol prefix.',
    type: 'string',
  },
  'query-post-type': {
    description:
      'Default post type assigned to Query Loop variation scaffolds.',
    type: 'string',
  },
  template: {
    description: 'Template id or external template package.',
    short: 't',
    type: 'string',
  },
  'text-domain': {
    description: 'Custom text domain for the generated project.',
    type: 'string',
  },
  variant: {
    description: 'Optional template variant identifier.',
    type: 'string',
  },
  'with-migration-ui': {
    argumentKind: 'flag',
    description: 'Enable migration UI support when the template supports it.',
    type: 'boolean',
  },
  'with-test-preset': {
    argumentKind: 'flag',
    description: 'Include the Playwright smoke-test preset.',
    type: 'boolean',
  },
  'with-wp-env': {
    argumentKind: 'flag',
    description: 'Include a local wp-env preset.',
    type: 'boolean',
  },
  yes: {
    argumentKind: 'flag',
    description: 'Accept defaults without prompt fallbacks.',
    short: 'y',
    type: 'boolean',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia add` option metadata used by both runtime entry paths.
 */
export const ADD_OPTION_METADATA = {
  'alternate-render-targets': {
    description:
      'Comma-separated alternate render targets for dynamic block scaffolds (email,mjml,plain-text).',
    type: 'string',
  },
  anchor: {
    description: 'Anchor block name for hooked-block workflows.',
    type: 'string',
  },
  attribute: {
    description:
      'Target block attribute for end-to-end binding-source workflows.',
    type: 'string',
  },
  block: {
    description:
      'Target block slug for variation, style, and end-to-end binding-source workflows.',
    type: 'string',
  },
  'data-storage': {
    description: 'Persistence storage mode for persistence-capable templates.',
    type: 'string',
  },
  'dry-run': {
    argumentKind: 'flag',
    description:
      'Preview workspace file updates and completion guidance without writing them.',
    type: 'boolean',
  },
  'external-layer-id': {
    description:
      'Explicit layer id when an external layer package exposes multiple selectable layers.',
    type: 'string',
  },
  'external-layer-source': {
    description:
      'Local path, GitHub locator, or npm package that exposes wp-typia.layers.json for built-in block templates.',
    type: 'string',
  },
  from: {
    description:
      'Source full block name (namespace/block) for transform workflows.',
    type: 'string',
  },
  'inner-blocks-preset': {
    description:
      'Compound-only InnerBlocks preset (freeform, ordered, horizontal, locked-structure).',
    type: 'string',
  },
  methods: {
    description:
      'Comma-separated REST resource methods for rest-resource workflows.',
    type: 'string',
  },
  namespace: {
    description: 'REST namespace for rest-resource and ai-feature workflows.',
    type: 'string',
  },
  'persistence-policy': {
    description: 'Persistence write policy for persistence-capable templates.',
    type: 'string',
  },
  position: {
    description: 'Hook position for hooked-block workflows.',
    type: 'string',
  },
  slot: {
    description:
      'Document editor shell slot for editor-plugin workflows (sidebar or document-setting-panel).',
    type: 'string',
  },
  source: {
    description:
      'Optional data source locator for admin-view workflows, such as rest-resource:products or core-data:postType/post.',
    type: 'string',
  },
  template: {
    description:
      'Optional built-in block family for the new block; interactive flows let you choose it when omitted and non-interactive runs default to basic.',
    type: 'string',
  },
  to: {
    description:
      'Target workspace block slug or full block name for transform workflows.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia init` option metadata used by both runtime entry paths.
 */
export const INIT_OPTION_METADATA = {
  apply: {
    argumentKind: 'flag',
    description:
      'Write the planned package.json updates and retrofit helper files instead of previewing only.',
    type: 'boolean',
  },
  'package-manager': {
    description: 'Package manager to use for emitted scripts and next steps.',
    short: 'p',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia migrate` option metadata used by both runtime entry paths.
 */
export const MIGRATE_OPTION_METADATA = {
  all: {
    argumentKind: 'flag',
    description:
      'Run across every configured migration version and block target.',
    type: 'boolean',
  },
  'current-migration-version': {
    description: 'Current migration version label for `migrate init`.',
    type: 'string',
  },
  force: {
    argumentKind: 'flag',
    description: 'Force overwrite behavior where supported.',
    type: 'boolean',
  },
  'from-migration-version': {
    description: 'Source migration version label.',
    type: 'string',
  },
  iterations: {
    description: 'Iteration count for `migrate fuzz`.',
    type: 'string',
  },
  'migration-version': {
    description: 'Version label to capture with `migrate snapshot`.',
    type: 'string',
  },
  seed: {
    description: 'Deterministic fuzz seed.',
    type: 'string',
  },
  'to-migration-version': {
    description: 'Target migration version label.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia mcp` option metadata.
 */
export const MCP_OPTION_METADATA = {
  'output-dir': {
    description: 'Output directory for generated MCP metadata.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia sync` option metadata used by both runtime entry paths.
 */
export const SYNC_OPTION_METADATA = {
  check: {
    argumentKind: 'flag',
    description:
      'Check generated artifacts without writing changes. Advanced sync-types-only flags stay on sync-types.',
    type: 'boolean',
  },
  'dry-run': {
    argumentKind: 'flag',
    description:
      'Preview the generated sync commands that would run without executing them.',
    type: 'boolean',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia doctor` option metadata.
 */
export const DOCTOR_OPTION_METADATA = {
  format: {
    description:
      'Use `json` for machine-readable doctor check output or `text` for human-readable output.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Shared `wp-typia templates` option metadata.
 */
export const TEMPLATES_OPTION_METADATA = {
  id: {
    description: 'Template id for `templates inspect`.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

/**
 * Global option metadata used by Node fallback parsing before command dispatch.
 */
export const GLOBAL_OPTION_METADATA = {
  config: {
    description: 'Config override file path.',
    short: 'c',
    type: 'string',
  },
  format: {
    description: 'Output format for supported commands (`json` or `text`).',
    type: 'string',
  },
  id: {
    description: 'Template id for top-level `templates inspect` convenience.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;

export const COMMAND_OPTION_METADATA_BY_GROUP = {
  add: ADD_OPTION_METADATA,
  create: CREATE_OPTION_METADATA,
  doctor: DOCTOR_OPTION_METADATA,
  global: GLOBAL_OPTION_METADATA,
  init: INIT_OPTION_METADATA,
  migrate: MIGRATE_OPTION_METADATA,
  mcp: MCP_OPTION_METADATA,
  sync: SYNC_OPTION_METADATA,
  templates: TEMPLATES_OPTION_METADATA,
} as const satisfies Record<CommandOptionGroupName, CommandOptionMetadataMap>;

export const COMMAND_OPTION_GROUP_NAMES = Object.keys(
  COMMAND_OPTION_METADATA_BY_GROUP,
) as CommandOptionGroupName[];

export function collectCommandOptionMetadata(
  ...groupNames: readonly CommandOptionGroupName[]
): CommandOptionMetadataMap {
  const metadata: CommandOptionMetadataMap = {};

  for (const groupName of groupNames) {
    for (const [optionName, option] of Object.entries(
      COMMAND_OPTION_METADATA_BY_GROUP[groupName],
    )) {
      metadata[optionName] = {
        ...(metadata[optionName] ?? {}),
        ...option,
      };
    }
  }

  return metadata;
}

export const ALL_COMMAND_OPTION_METADATA = collectCommandOptionMetadata(
  ...COMMAND_OPTION_GROUP_NAMES,
);

export function buildCommandOptions<TOptions extends CommandOptionMetadataMap>(
  metadata: TOptions,
): Record<
  string,
  {
    argumentKind?: 'flag';
    description: string;
    schema: z.ZodDefault<z.ZodBoolean> | z.ZodOptional<z.ZodString>;
    short?: string;
  }
> {
  return Object.fromEntries(
    Object.entries(metadata).map(([name, option]) => [
      name,
      {
        ...(option.argumentKind ? { argumentKind: option.argumentKind } : {}),
        description: option.description,
        schema:
          option.type === 'boolean'
            ? z.boolean().default(false)
            : z.string().optional(),
        ...(option.short ? { short: option.short } : {}),
      },
    ]),
  );
}

export function collectOptionNamesByType(
  metadata: CommandOptionMetadataMap,
  type: CommandOptionMetadata['type'],
): string[] {
  return Object.entries(metadata)
    .filter(([, option]) => option.type === type)
    .map(([name]) => name);
}

export function formatNodeFallbackOptionHelp(
  metadata: CommandOptionMetadataMap,
): string[] {
  return Object.entries(metadata).map(([name, option]) => {
    const short = option.short ? `, -${option.short}` : '';
    return `- --${name}${short}: ${option.description}`;
  });
}

export function buildCommandOptionParser(
  ...metadataMaps: CommandOptionMetadataMap[]
): CommandOptionParser {
  const metadata: CommandOptionMetadataMap = {};

  for (const metadataMap of metadataMaps) {
    for (const [optionName, option] of Object.entries(metadataMap)) {
      metadata[optionName] = {
        ...(metadata[optionName] ?? {}),
        ...option,
      };
    }
  }

  return {
    booleanOptionNames: new Set(collectOptionNamesByType(metadata, 'boolean')),
    shortFlagMap: new Map<string, ShortOptionDescriptor>(
      Object.entries(metadata).flatMap(([name, option]) =>
        option.short
          ? [[option.short, { name, type: option.type }] as const]
          : [],
      ),
    ),
    stringOptionNames: new Set(collectOptionNamesByType(metadata, 'string')),
  };
}

export function buildArgvWalkerRoutingMetadata(
  ...metadataMaps: CommandOptionMetadataMap[]
): {
  longValueOptions: string[];
  shortValueOptions: string[];
} {
  const parser = buildCommandOptionParser(...metadataMaps);

  return {
    longValueOptions: Array.from(parser.stringOptionNames)
      .map((optionName) => `--${optionName}`)
      .sort((left, right) => left.localeCompare(right)),
    shortValueOptions: Array.from(parser.shortFlagMap.entries())
      .filter(([, option]) => option.type === 'string')
      .map(([short]) => `-${short}`)
      .sort((left, right) => left.localeCompare(right)),
  };
}

export const COMMAND_ROUTING_METADATA = buildArgvWalkerRoutingMetadata(
  ALL_COMMAND_OPTION_METADATA,
);

export function extractKnownOptionValuesFromArgv(
  argv: string[],
  options: {
    optionNames: Iterable<string>;
    parser: CommandOptionParser;
  },
): {
  argv: string[];
  flags: Record<string, unknown>;
} {
  const flags: Record<string, unknown> = {};
  const nextArgv: string[] = [];
  const optionNames = new Set(options.optionNames);

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === '--') {
      nextArgv.push(...argv.slice(index));
      break;
    }

    if (arg.length === 2 && arg.startsWith('-')) {
      const shortFlag = options.parser.shortFlagMap.get(arg.slice(1));
      if (!shortFlag || !optionNames.has(shortFlag.name)) {
        nextArgv.push(arg);
        continue;
      }
      if (shortFlag.type === 'boolean') {
        flags[shortFlag.name] = true;
        continue;
      }
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) {
        throw new Error(`\`${arg}\` requires a value.`);
      }
      flags[shortFlag.name] = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      const separatorIndex = option.indexOf('=');
      const rawName =
        separatorIndex === -1 ? option : option.slice(0, separatorIndex);
      const inlineValue =
        separatorIndex === -1 ? undefined : option.slice(separatorIndex + 1);
      if (!optionNames.has(rawName)) {
        nextArgv.push(arg);
        continue;
      }
      if (options.parser.booleanOptionNames.has(rawName)) {
        flags[rawName] = true;
        continue;
      }
      if (!options.parser.stringOptionNames.has(rawName)) {
        nextArgv.push(arg);
        continue;
      }
      if (inlineValue !== undefined) {
        if (!inlineValue) {
          throw new Error(`\`--${rawName}\` requires a value.`);
        }
        flags[rawName] = inlineValue;
        continue;
      }
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) {
        throw new Error(`\`--${rawName}\` requires a value.`);
      }
      flags[rawName] = next;
      index += 1;
      continue;
    }

    nextArgv.push(arg);
  }

  return {
    argv: nextArgv,
    flags,
  };
}

export function parseCommandArgvWithMetadata(
  argv: string[],
  options: {
    extraBooleanOptionNames?: Iterable<string>;
    parser: CommandOptionParser;
  },
): ParsedCommandArgv {
  const flags: Record<string, unknown> = {};
  const positionals: string[] = [];
  const booleanOptionNames = new Set(options.parser.booleanOptionNames);

  for (const optionName of options.extraBooleanOptionNames ?? []) {
    booleanOptionNames.add(optionName);
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === '--') {
      positionals.push(...argv.slice(index + 1));
      break;
    }

    if (arg.length === 2 && arg.startsWith('-')) {
      const shortFlag = options.parser.shortFlagMap.get(arg.slice(1));
      if (!shortFlag) {
        throw new Error(`Unknown option \`${arg}\`.`);
      }
      if (shortFlag.type === 'boolean') {
        flags[shortFlag.name] = true;
        continue;
      }
      const next = argv[index + 1];
      if (!next || next.startsWith('-')) {
        throw new Error(`\`${arg}\` requires a value.`);
      }
      flags[shortFlag.name] = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('--')) {
      const option = arg.slice(2);
      const separatorIndex = option.indexOf('=');
      const rawName =
        separatorIndex === -1 ? option : option.slice(0, separatorIndex);
      const inlineValue =
        separatorIndex === -1 ? undefined : option.slice(separatorIndex + 1);
      if (booleanOptionNames.has(rawName)) {
        flags[rawName] = true;
        continue;
      }
      if (!options.parser.stringOptionNames.has(rawName)) {
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
      if (!next || next.startsWith('-')) {
        throw new Error(`\`--${rawName}\` requires a value.`);
      }
      flags[rawName] = next;
      index += 1;
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unknown option \`${arg}\`.`);
    }

    positionals.push(arg);
  }

  return {
    flags,
    positionals,
  };
}

export function resolveCommandOptionValues<
  TMetadata extends CommandOptionMetadataMap,
>(
  metadata: TMetadata,
  options: {
    defaults?: Record<string, unknown>;
    flags?: Record<string, unknown>;
    optionNames?: Iterable<keyof TMetadata | string>;
  },
): Record<string, string | boolean | undefined> {
  const resolved: Record<string, string | boolean | undefined> = {};
  const optionNames =
    options.optionNames ?? (Object.keys(metadata) as Array<keyof TMetadata>);

  for (const optionName of optionNames) {
    const name = String(optionName);
    const descriptor = metadata[name];
    if (!descriptor) {
      continue;
    }

    const value = options.flags?.[name] ?? options.defaults?.[name];
    if (descriptor.type === 'boolean') {
      resolved[name] = Boolean(value ?? false);
      continue;
    }

    resolved[name] = typeof value === 'string' ? value : undefined;
  }

  return resolved;
}
