import { defineCommand } from "@bunli/core";

import {
	CLI_DIAGNOSTIC_CODES,
} from "@wp-typia/project-tools/cli-diagnostics";
import {
	buildCommandOptions,
	TEMPLATES_OPTION_METADATA,
} from "../command-option-metadata";
import {
	emitCliDiagnosticFailure,
	prefersStructuredCliOutput,
} from "../cli-diagnostic-output";
import { executeTemplatesCommand, listTemplatesForRuntime } from "../runtime-bridge";

export const templatesCommand = defineCommand({
	defaultFormat: "json",
	description: "Inspect built-in and external scaffold templates.",
	handler: async (args) => {
		const subcommand = (args.positional[0] ?? "list") as string;
		const id = args.positional[1] ?? (args.flags.id as string | undefined);
		const effectiveSubcommand =
			subcommand === "list" && typeof id === "string" && id.length > 0
				? "inspect"
				: subcommand;
		const prefersStructuredOutput = prefersStructuredCliOutput(args);

		try {
			if (prefersStructuredOutput) {
				const templates = await listTemplatesForRuntime();
				if (effectiveSubcommand === "list") {
					args.output({ templates });
					return;
				}
				if (effectiveSubcommand === "inspect" && id) {
					const { getTemplateById } = await import("@wp-typia/project-tools/cli-templates");
					let template;
					try {
						template = getTemplateById(id);
					} catch (lookupError) {
						const message =
							lookupError instanceof Error ? lookupError.message : String(lookupError);
						if (!message.startsWith("Unknown template")) {
							throw lookupError;
						}
						emitCliDiagnosticFailure(args, {
							code: CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
							command: "templates",
							detailLines: [`Unknown template "${id}".`],
						});
						return;
					}
					args.output({ template });
					return;
				}
			}

			await executeTemplatesCommand({
				flags: { id, subcommand: effectiveSubcommand },
			});
		} catch (error) {
			emitCliDiagnosticFailure(args, {
				command: "templates",
				error,
			});
		}
	},
	name: "templates",
	options: buildCommandOptions(TEMPLATES_OPTION_METADATA),
});

export default templatesCommand;
