import { defineCommand } from '@bunli/core';

import { CLI_DIAGNOSTIC_CODES } from '@wp-typia/project-tools/cli-diagnostics';
import {
  emitCliDiagnosticFailure,
  prefersStructuredCliOutput,
} from '../cli-diagnostic-output';
import {
  buildCommandOptions,
  MCP_OPTION_METADATA,
} from '../command-option-metadata';
import { getMcpSchemaSources } from '../config';
import { loadMcpToolGroups, syncMcpSchemas } from '../mcp';
import { resolveCommandPrintLine } from './output-adapters';
import type { PrintLine } from '../print-line';

type McpToolGroupSummary = {
  namespace: string;
  toolCount: number;
  tools: string[];
};

type McpSyncResult = Awaited<ReturnType<typeof syncMcpSchemas>>;

export function printMcpToolGroupSummary(
  summary: McpToolGroupSummary[],
  printLine: PrintLine,
): void {
  for (const group of summary) {
    printLine(`${group.namespace} (${group.toolCount})`);
    for (const tool of group.tools) {
      printLine(`  - ${tool}`);
    }
  }
}

export function printMcpSyncSummary(
  result: McpSyncResult,
  printLine: PrintLine,
): void {
  printLine(
    `Synced ${result.commandCount} MCP tools across ${result.groups.length} namespaces into ${result.outputDir}.`,
  );
}

export const mcpCommand = defineCommand({
  defaultFormat: 'json',
  description: 'Inspect or sync schema-driven MCP metadata for wp-typia.',
  handler: async (args) => {
    const subcommand = args.positional[0] ?? 'list';
    const prefersStructuredOutput = prefersStructuredCliOutput(args);
    const printLine = resolveCommandPrintLine(args);
    const userConfig =
      args.context?.store?.wpTypiaUserConfig &&
      typeof args.context.store.wpTypiaUserConfig === 'object'
        ? args.context.store.wpTypiaUserConfig
        : {};
    const schemaSources = getMcpSchemaSources(userConfig);

    if (schemaSources.length === 0) {
      emitCliDiagnosticFailure(args, {
        code: CLI_DIAGNOSTIC_CODES.CONFIGURATION_MISSING,
        command: 'mcp',
        detailLines: [
          'No MCP schema sources are configured. Add `mcp.schemaSources` in ~/.config/wp-typia/config.json, .wp-typiarc(.json), or package.json#wp-typia.',
        ],
      });
      return;
    }

    try {
      if (subcommand === 'list') {
        const groups = await loadMcpToolGroups(args.cwd, schemaSources);
        const summary = groups.map((group) => ({
          namespace: group.namespace,
          toolCount: group.tools.length,
          tools: group.tools.map((tool) => tool.name),
        }));
        if (prefersStructuredOutput) {
          args.output({ groups: summary });
          return;
        }
        printMcpToolGroupSummary(summary, printLine);
        return;
      }

      if (subcommand === 'sync') {
        const outputDir =
          (args.flags['output-dir'] as string | undefined) ??
          `${args.cwd}/.bunli/mcp`;
        const result = await syncMcpSchemas(args.cwd, schemaSources, outputDir);
        if (prefersStructuredOutput) {
          args.output({ sync: result });
          return;
        }
        printMcpSyncSummary(result, printLine);
        return;
      }

      emitCliDiagnosticFailure(args, {
        code: CLI_DIAGNOSTIC_CODES.INVALID_COMMAND,
        command: 'mcp',
        detailLines: [
          `Unknown mcp subcommand "${subcommand}". Expected list or sync.`,
        ],
      });
    } catch (error) {
      emitCliDiagnosticFailure(args, {
        command: 'mcp',
        error,
      });
    }
  },
  name: 'mcp',
  options: buildCommandOptions(MCP_OPTION_METADATA),
});

export default mcpCommand;
