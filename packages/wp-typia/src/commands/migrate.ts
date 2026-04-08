import { createElement } from "react";

import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { resolveBundledModuleHref } from "../render-loader";
import { executeMigrateCommand } from "../runtime-bridge";
import { LazyFlow } from "../ui/lazy-flow";

const supportsInteractiveTui = typeof Bun !== "undefined";

function loadMigrateFlow() {
	return import(
		resolveBundledModuleHref(import.meta.url, [
			"./ui/migrate-flow.js",
			"../ui/migrate-flow.js",
			"../ui/migrate-flow.tsx",
		]),
	).then((module) => ({ default: module.MigrateFlow }));
}

const migrateOptions = {
	all: {
		argumentKind: "flag" as const,
		description: "Run across every configured migration version and block target.",
		schema: z.boolean().default(false),
	},
	"current-migration-version": {
		description: "Current migration version label for `migrate init`.",
		schema: z.string().optional(),
	},
	force: {
		argumentKind: "flag" as const,
		description: "Force overwrite behavior where supported.",
		schema: z.boolean().default(false),
	},
	"from-migration-version": {
		description: "Source migration version label.",
		schema: z.string().optional(),
	},
	iterations: {
		description: "Iteration count for `migrate fuzz`.",
		schema: z.string().optional(),
	},
	"migration-version": {
		description: "Version label to capture with `migrate snapshot`.",
		schema: z.string().optional(),
	},
	seed: {
		description: "Deterministic fuzz seed.",
		schema: z.string().optional(),
	},
	"to-migration-version": {
		description: "Target migration version label.",
		schema: z.string().optional(),
	},
};

export const migrateCommand = defineCommand({
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
	...(supportsInteractiveTui
		? {
				render: (args: any) =>
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
								"current-migration-version":
									(args.flags["current-migration-version"] as string | undefined) ??
									"",
								force: Boolean(args.flags.force ?? false),
								"from-migration-version":
									(args.flags["from-migration-version"] as string | undefined) ??
									"",
								iterations: (args.flags.iterations as string | undefined) ?? "",
								"migration-version":
									(args.flags["migration-version"] as string | undefined) ?? "",
								seed: (args.flags.seed as string | undefined) ?? "",
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
