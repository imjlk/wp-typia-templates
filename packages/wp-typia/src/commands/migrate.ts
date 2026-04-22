import { createElement } from "react";

import { defineCommand } from "@bunli/core";

import {
	buildCommandOptions,
	MIGRATE_OPTION_METADATA,
} from "../command-option-metadata";
import { resolveBundledModuleHref } from "../render-loader";
import { executeMigrateCommand } from "../runtime-bridge";
import { supportsInteractiveTui } from "../runtime-capabilities";
import type { WpTypiaRenderArgs } from "./render-types";
import { LazyFlow } from "../ui/lazy-flow";

function loadMigrateFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/migrate-flow.js",
			"../ui/migrate-flow.js",
			"../ui/migrate-flow.tsx",
		], {
			moduleLabel: "the migrate-flow UI",
		}),
	).then((module) => ({ default: module.MigrateFlow }));
}

const migrateOptions = buildCommandOptions(MIGRATE_OPTION_METADATA);

export const migrateCommand = defineCommand({
	defaultFormat: "toon",
	description: "Run migration workflows for migration-capable wp-typia projects.",
	handler: async (args) => {
		await executeMigrateCommand({
			command: args.positional[0],
			cwd: args.cwd,
			flags: args.flags as Record<string, unknown>,
		});
	},
	name: "migrate",
	options: migrateOptions,
	...(supportsInteractiveTui()
		? {
				render: (args: WpTypiaRenderArgs) =>
					createElement(LazyFlow, {
						loader: loadMigrateFlow,
						props: {
							cwd: args.cwd,
							initialValues: {
								all: Boolean(args.flags.all ?? false),
								command:
									(args.positional[0] as
										| "init"
										| "snapshot"
										| "plan"
										| "wizard"
										| "diff"
										| "scaffold"
										| "verify"
										| "doctor"
										| "fixtures"
										| "fuzz"
										| undefined) ?? "plan",
								"current-migration-version": args.flags[
									"current-migration-version"
								] as string | undefined,
								force: Boolean(args.flags.force ?? false),
								"from-migration-version": args.flags[
									"from-migration-version"
								] as string | undefined,
								iterations: args.flags.iterations as string | undefined,
								"migration-version": args.flags[
									"migration-version"
								] as string | undefined,
								seed: args.flags.seed as string | undefined,
								"to-migration-version":
									(args.flags["to-migration-version"] as string | undefined) ??
									"current",
							},
						},
					}),
				tui: {
					renderer: {
						bufferMode: "alternate" as const,
					},
				},
			}
		: {}),
});

export default migrateCommand;
