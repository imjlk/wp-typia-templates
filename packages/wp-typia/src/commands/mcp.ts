import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { getMcpSchemaSources } from "../config";
import { loadMcpToolGroups, syncMcpSchemas } from "../mcp";

export const mcpCommand = defineCommand({
	defaultFormat: "json",
	description: "Inspect or sync schema-driven MCP metadata for wp-typia.",
	handler: async (args) => {
		const subcommand = args.positional[0] ?? "list";
		const userConfig =
			args.context?.store?.wpTypiaUserConfig &&
			typeof args.context.store.wpTypiaUserConfig === "object"
				? args.context.store.wpTypiaUserConfig
				: {};
		const schemaSources = getMcpSchemaSources(userConfig);

		if (schemaSources.length === 0) {
			throw new Error(
				"No MCP schema sources are configured. Add `mcp.schemaSources` in ~/.config/wp-typia/config.json, .wp-typiarc(.json), or package.json#wp-typia.",
			);
		}

		if (subcommand === "list") {
			const groups = await loadMcpToolGroups(args.cwd, schemaSources);
			const summary = groups.map((group) => ({
				namespace: group.namespace,
				toolCount: group.tools.length,
				tools: group.tools.map((tool) => tool.name),
			}));
			const prefersStructuredOutput =
				!args.formatExplicit && (args.agent || Boolean(args.context?.store?.isAIAgent));
			if (prefersStructuredOutput) {
				args.output({ groups: summary });
				return;
			}
			for (const group of summary) {
				console.log(`${group.namespace} (${group.toolCount})`);
				for (const tool of group.tools) {
					console.log(`  - ${tool}`);
				}
			}
			return;
		}

		if (subcommand === "sync") {
			const outputDir =
				(args.flags["output-dir"] as string | undefined) ?? `${args.cwd}/.bunli/mcp`;
			const result = await syncMcpSchemas(args.cwd, schemaSources, outputDir);
			console.log(
				`Synced ${result.commandCount} MCP tools across ${result.groups.length} namespaces into ${result.outputDir}.`,
			);
			return;
		}

		throw new Error(`Unknown mcp subcommand "${subcommand}". Expected list or sync.`);
	},
	name: "mcp",
	options: {
		"output-dir": {
			description: "Output directory for generated MCP metadata during `mcp sync`.",
			schema: z.string().optional(),
		},
	},
});

export default mcpCommand;
