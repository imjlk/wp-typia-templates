import { createElement } from "react";

import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { getAddBlockDefaults } from "../config";
import { resolveBundledModuleHref } from "../render-loader";
import { executeAddCommand, getAddWorkspaceBlockOptions } from "../runtime-bridge";
import { LazyFlow } from "../ui/lazy-flow";

const supportsInteractiveTui = typeof Bun !== "undefined";

function loadAddFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/add-flow.js",
			"../ui/add-flow.js",
			"../ui/add-flow.tsx",
		]),
	).then((module) => ({ default: module.AddFlow }));
}

const addOptions = {
	block: {
		description: "Target block slug for variation workflows.",
		schema: z.string().optional(),
	},
	"data-storage": {
		description: "Persistence storage mode for persistence-capable templates.",
		schema: z.string().optional(),
	},
	"persistence-policy": {
		description: "Persistence write policy for persistence-capable templates.",
		schema: z.string().optional(),
	},
	template: {
		description: "Built-in block family for the new block.",
		schema: z.string().optional(),
	},
};

export const addCommand = defineCommand({
	description: "Extend an official wp-typia workspace with blocks, variations, or patterns.",
	handler: async (args) => {
		await executeAddCommand({
			cwd: args.cwd,
			flags: args.flags as Record<string, unknown>,
			kind: args.positional[0],
			name: args.positional[1],
		});
	},
	name: "add",
	options: addOptions,
	...(supportsInteractiveTui
		? {
				render: (args: any) => {
					const config =
						args.context?.store?.wpTypiaUserConfig &&
						typeof args.context.store.wpTypiaUserConfig === "object"
							? getAddBlockDefaults(args.context.store.wpTypiaUserConfig)
							: {};
					return createElement(LazyFlow, {
						loader: loadAddFlow,
						props: {
							cwd: args.cwd,
							initialValues: {
								"data-storage":
									(args.flags["data-storage"] as string | undefined) ??
									config["data-storage"],
								block: (args.flags.block as string | undefined) ?? "",
								kind:
									(args.positional[0] as
										| "block"
										| "variation"
										| "pattern"
										| undefined) ?? "block",
								name: args.positional[1] ?? "",
								"persistence-policy":
									(args.flags["persistence-policy"] as string | undefined) ??
									config["persistence-policy"],
								template:
									(args.flags.template as string | undefined) ?? config.template,
							},
							workspaceBlockOptions: getAddWorkspaceBlockOptions(args.cwd),
						},
					});
				},
				tui: {
					renderer: {
						bufferMode: "alternate" as const,
					},
				},
			}
		: {}),
});

export default addCommand;
