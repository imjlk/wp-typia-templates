import type { CommandOptionMetadataMap } from './types';

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
