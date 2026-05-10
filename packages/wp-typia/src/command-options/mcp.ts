import type { CommandOptionMetadataMap } from './types';

/**
 * Shared `wp-typia mcp` option metadata.
 */
export const MCP_OPTION_METADATA = {
  'output-dir': {
    description: 'Output directory for generated MCP metadata.',
    type: 'string',
  },
} as const satisfies CommandOptionMetadataMap;
