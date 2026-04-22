import { createElement } from "react";

import { defineCommand } from "@bunli/core";

import {
	ADD_OPTION_METADATA,
	buildCommandOptions,
} from "../command-option-metadata";
import { getAddBlockDefaults } from "../config";
import { resolveBundledModuleHref } from "../render-loader";
import { executeAddCommand } from "../runtime-bridge";
import { supportsInteractiveTui } from "../runtime-capabilities";
import type { WpTypiaRenderArgs } from "./render-types";
import { LazyFlow } from "../ui/lazy-flow";

function loadAddFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/add-flow.js",
			"../ui/add-flow.js",
			"../ui/add-flow.tsx",
		], {
			moduleLabel: "the add-flow UI",
		}),
	).then((module) => ({ default: module.AddFlow }));
}

const addOptions = buildCommandOptions(ADD_OPTION_METADATA);

export const addCommand = defineCommand({
	defaultFormat: "toon",
	description: "Extend an official wp-typia workspace with blocks, variations, patterns, binding sources, plugin-level REST resources, editor plugins, or hooked blocks.",
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
	...(supportsInteractiveTui()
		? {
				render: (args: WpTypiaRenderArgs) => {
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
								"alternate-render-targets":
									(args.flags["alternate-render-targets"] as string | undefined) ??
									config["alternate-render-targets"],
								"data-storage":
									(args.flags["data-storage"] as string | undefined) ??
									config["data-storage"],
								"external-layer-id":
									(args.flags["external-layer-id"] as string | undefined) ??
									config["external-layer-id"],
								"external-layer-source":
									(args.flags["external-layer-source"] as string | undefined) ??
									config["external-layer-source"],
								anchor: (args.flags.anchor as string | undefined) ?? "",
								block: (args.flags.block as string | undefined) ?? "",
								kind:
									(args.positional[0] as
										| "block"
										| "variation"
										| "pattern"
										| "binding-source"
										| "rest-resource"
										| "editor-plugin"
										| "hooked-block"
										| undefined) ?? "block",
								methods: (args.flags.methods as string | undefined) ?? "",
								name: args.positional[1] ?? "",
								namespace: (args.flags.namespace as string | undefined) ?? "",
								"persistence-policy":
									(args.flags["persistence-policy"] as string | undefined) ??
									config["persistence-policy"],
								position: (args.flags.position as string | undefined) ?? "after",
								slot: (args.flags.slot as string | undefined) ?? "PluginSidebar",
								template:
									(args.flags.template as string | undefined) ?? config.template,
							},
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
