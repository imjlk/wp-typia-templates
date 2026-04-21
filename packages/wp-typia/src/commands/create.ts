import { createElement } from "react";

import { defineCommand } from "@bunli/core";

import {
	buildCommandOptions,
	CREATE_OPTION_METADATA,
} from "../command-option-metadata";
import { getCreateDefaults } from "../config";
import { resolveBundledModuleHref } from "../render-loader";
import { executeCreateCommand } from "../runtime-bridge";
import type { WpTypiaRenderArgs } from "./render-types";
import { LazyFlow } from "../ui/lazy-flow";

const supportsInteractiveTui = typeof Bun !== "undefined";

function loadCreateFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/create-flow.js",
			"../ui/create-flow.js",
			"../ui/create-flow.tsx",
		]),
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
				detailLines: ["`wp-typia create` requires <project-dir>."],
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
	...(supportsInteractiveTui
		? {
				render: (args: WpTypiaRenderArgs) => {
					const config =
						args.context?.store?.wpTypiaUserConfig &&
						typeof args.context.store.wpTypiaUserConfig === "object"
							? getCreateDefaults(args.context.store.wpTypiaUserConfig)
							: {};
					return createElement(LazyFlow, {
						loader: loadCreateFlow,
						props: {
							cwd: args.cwd,
							initialValues: {
								"alternate-render-targets":
									(args.flags["alternate-render-targets"] as string | undefined) ??
									config["alternate-render-targets"],
								"data-storage":
									(args.flags["data-storage"] as string | undefined) ??
									config["data-storage"],
								"dry-run": Boolean(
									args.flags["dry-run"] ?? config["dry-run"] ?? false,
								),
								"external-layer-id":
									(args.flags["external-layer-id"] as string | undefined) ??
									config["external-layer-id"],
								"external-layer-source":
									(args.flags["external-layer-source"] as string | undefined) ??
									config["external-layer-source"],
								namespace:
									(args.flags.namespace as string | undefined) ?? config.namespace,
								"no-install": Boolean(
									args.flags["no-install"] ?? config["no-install"] ?? false,
								),
								"package-manager":
									(args.flags["package-manager"] as string | undefined) ??
									config["package-manager"],
								"persistence-policy":
									(args.flags["persistence-policy"] as string | undefined) ??
									config["persistence-policy"],
								"php-prefix":
									(args.flags["php-prefix"] as string | undefined) ??
									config["php-prefix"],
								"query-post-type":
									(args.flags["query-post-type"] as string | undefined) ??
									config["query-post-type"],
								"project-dir": args.positional[0] ?? "",
								template:
									(args.flags.template as string | undefined) ?? config.template,
								"text-domain":
									(args.flags["text-domain"] as string | undefined) ??
									config["text-domain"],
								variant:
									(args.flags.variant as string | undefined) ?? config.variant,
								"with-migration-ui": Boolean(
									args.flags["with-migration-ui"] ??
										config["with-migration-ui"] ??
										false,
								),
								"with-test-preset": Boolean(
									args.flags["with-test-preset"] ??
										config["with-test-preset"] ??
										false,
								),
								"with-wp-env": Boolean(
									args.flags["with-wp-env"] ?? config["with-wp-env"] ?? false,
								),
								yes: Boolean(args.flags.yes ?? config.yes ?? false),
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
