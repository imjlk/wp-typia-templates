import type { CommandOptionMetadataMap } from './types';

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
