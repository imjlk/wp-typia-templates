import { createElement } from "react";

import { defineCommand } from "@bunli/core";
import { CLI_DIAGNOSTIC_CODES } from "@wp-typia/project-tools/cli-diagnostics";

import {
	buildCommandOptions,
	CREATE_OPTION_METADATA,
	resolveCommandOptionValues,
} from "../command-option-metadata";
import {
	emitCliDiagnosticFailure,
	prefersStructuredCliOutput,
} from "../cli-diagnostic-output";
import { buildMissingCreateProjectDirDetailLines } from "../cli-error-messages";
import { getCreateDefaults } from "../config";
import { resolveBundledModuleHref } from "../render-loader";
import { executeCreateCommand } from "../runtime-bridge";
import {
	buildStructuredCompletionSuccessPayload,
	extractCompletionProjectDir,
} from "../runtime-bridge-output";
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
		const prefersStructuredOutput = prefersStructuredCliOutput(args);
		const projectDir = args.positional[0];
		if (!projectDir) {
			emitCliDiagnosticFailure(args, {
				code: CLI_DIAGNOSTIC_CODES.MISSING_ARGUMENT,
				command: "create",
				detailLines: buildMissingCreateProjectDirDetailLines(),
			});
			return;
		}
		try {
			const completion = await executeCreateCommand({
				cwd: args.cwd,
				emitOutput: !prefersStructuredOutput,
				flags: args.flags as Record<string, unknown>,
				interactive: prefersStructuredOutput ? false : undefined,
				projectDir,
			});
			if (prefersStructuredOutput) {
				args.output(
					buildStructuredCompletionSuccessPayload("create", completion, {
						dryRun: Boolean(args.flags["dry-run"]),
						projectDir: extractCompletionProjectDir(completion) ?? projectDir,
						template:
							typeof args.flags.template === "string"
								? args.flags.template
								: undefined,
					}),
				);
			}
		} catch (error) {
			emitCliDiagnosticFailure(args, {
				command: "create",
				error,
			});
		}
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
