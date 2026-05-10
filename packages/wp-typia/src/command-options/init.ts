import type { CommandOptionMetadataMap } from './types';

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
