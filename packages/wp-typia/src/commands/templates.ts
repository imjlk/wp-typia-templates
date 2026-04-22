import { defineCommand } from "@bunli/core";

import {
	CLI_DIAGNOSTIC_CODES,
	createCliCommandError,
} from "@wp-typia/project-tools/cli-diagnostics";
import {
	buildCommandOptions,
	TEMPLATES_OPTION_METADATA,
} from "../command-option-metadata";
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
		const prefersStructuredOutput =
			(args.formatExplicit && args.format !== "toon") ||
			args.agent ||
			Boolean(args.context?.store?.isAIAgent);

		if (prefersStructuredOutput) {
			const templates = await listTemplatesForRuntime();
			if (effectiveSubcommand === "list") {
				args.output({ templates });
				return;
			}
			if (effectiveSubcommand === "inspect" && id) {
				const template = templates.find((entry) => entry.id === id);
				if (!template) {
					throw createCliCommandError({
						code: CLI_DIAGNOSTIC_CODES.INVALID_ARGUMENT,
						command: "templates",
						detailLines: [`Unknown template "${id}".`],
					});
				}
				args.output({ template });
				return;
			}
		}

		await executeTemplatesCommand({
			flags: { id, subcommand: effectiveSubcommand },
		});
	},
	name: "templates",
	options: buildCommandOptions(TEMPLATES_OPTION_METADATA),
});

export default templatesCommand;
