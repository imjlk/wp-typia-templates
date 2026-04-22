import { createElement } from "react";

import { defineCommand } from "@bunli/core";

import {
	buildCommandOptions,
	CREATE_OPTION_METADATA,
	resolveCommandOptionValues,
} from "../command-option-metadata";
import { getCreateDefaults } from "../config";
import { resolveBundledModuleHref } from "../render-loader";
import { executeCreateCommand } from "../runtime-bridge";
import { supportsInteractiveTui } from "../runtime-capabilities";
import type { WpTypiaRenderArgs } from "./render-types";
import { LazyFlow } from "../ui/lazy-flow";

function loadCreateFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/create-flow.js",
			"../ui/create-flow.js",
			"../ui/create-flow.tsx",
		], {
			moduleLabel: "the create-flow UI",
		}),
	).then((module) => ({ default: module.CreateFlow }));
}

const createOptions = buildCommandOptions(CREATE_OPTION_METADATA);

export const createCommand = defineCommand({
	defaultFormat: "toon",
	description: "Scaffold a new wp-typia project.",
	handler: async (args) => {
		const projectDir = args.positional[0];
		if (!projectDir) {
			const { createCliCommandError } = await import("@wp-typia/project-tools/cli-diagnostics");
			throw createCliCommandError({
				command: "create",
				detailLines: [
					"`wp-typia create` requires <project-dir>.",
					"`--dry-run` still needs a logical project directory name because wp-typia derives slugs, package names, and planned file paths from it.",
				],
			});
		}
		await executeCreateCommand({
			cwd: args.cwd,
			flags: args.flags as Record<string, unknown>,
			projectDir,
		});
	},
	name: "create",
	options: createOptions,
	...(supportsInteractiveTui()
		? {
				render: (args: WpTypiaRenderArgs) => {
					const config =
						args.context?.store?.wpTypiaUserConfig &&
						typeof args.context.store.wpTypiaUserConfig === "object"
							? getCreateDefaults(args.context.store.wpTypiaUserConfig)
							: {};
					const initialValues = resolveCommandOptionValues(CREATE_OPTION_METADATA, {
						defaults: config,
						flags: args.flags as Record<string, unknown>,
					});
					return createElement(LazyFlow, {
						loader: loadCreateFlow,
						props: {
							cwd: args.cwd,
							initialValues: {
								...initialValues,
								"project-dir": args.positional[0] ?? "",
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

export default createCommand;
