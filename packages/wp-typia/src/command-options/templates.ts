import type { CommandOptionMetadataMap } from './types';

/**
 * Shared `wp-typia templates` option metadata.
 */
export const TEMPLATES_OPTION_METADATA = {
  id: {
    description: 'Template id for `templates inspect`.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;
