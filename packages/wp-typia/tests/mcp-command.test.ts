import { expect, test } from 'bun:test';

import {
  printMcpSyncSummary,
  printMcpToolGroupSummary,
} from '../src/commands/mcp';

test('MCP list human output uses an injected PrintLine', () => {
  const lines: string[] = [];

  printMcpToolGroupSummary(
    [
      {
        namespace: 'demo',
        toolCount: 2,
        tools: ['ping', 'pong'],
      },
    ],
    (line) => lines.push(line),
  );

  expect(lines).toEqual(['demo (2)', '  - ping', '  - pong']);
});

test('MCP sync human output uses an injected PrintLine', () => {
  const lines: string[] = [];

  printMcpSyncSummary(
    {
      commandCount: 2,
      groups: [
        {
          namespace: 'demo',
          tools: [],
        },
      ],
      outputDir: '/tmp/wp-typia-mcp',
    },
    (line) => lines.push(line),
  );

  expect(lines).toEqual([
    'Synced 2 MCP tools across 1 namespaces into /tmp/wp-typia-mcp.',
  ]);
});
