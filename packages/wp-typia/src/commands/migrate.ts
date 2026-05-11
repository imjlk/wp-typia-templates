import { createElement } from "react";

import { defineCommand } from "@bunli/core";

import {
	buildCommandOptions,
	MIGRATE_OPTION_METADATA,
	resolveCommandOptionValues,
} from "../command-option-metadata";
import { emitCliDiagnosticFailure } from "../cli-diagnostic-output";
import { resolveCommandPrintLine } from "./output-adapters";
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
		const printLine = resolveCommandPrintLine(args);
		try {
			await executeMigrateCommand({
				command: args.positional[0],
				cwd: args.cwd,
				flags: args.flags as Record<string, unknown>,
				printLine,
			});
		} catch (error) {
			emitCliDiagnosticFailure(args, {
				command: "migrate",
				error,
			});
		}
	},
	name: "migrate",
	options: migrateOptions,
	...(supportsInteractiveTui()
		? {
				render: (args: WpTypiaRenderArgs) => {
					const initialValues = resolveCommandOptionValues(MIGRATE_OPTION_METADATA, {
						flags: args.flags as Record<string, unknown>,
					});

					return createElement(LazyFlow, {
						loader: loadMigrateFlow,
						props: {
							cwd: args.cwd,
							initialValues: {
								...initialValues,
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
								"to-migration-version":
									(initialValues["to-migration-version"] as string | undefined) ??
									"current",
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

export default migrateCommand;
