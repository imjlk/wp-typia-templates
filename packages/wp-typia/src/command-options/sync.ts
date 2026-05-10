import type { CommandOptionMetadataMap } from './types';

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
