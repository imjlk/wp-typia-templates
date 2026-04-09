import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { executeTemplatesCommand, listTemplates } from "../runtime-bridge";

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
			if (effectiveSubcommand === "list") {
				args.output({ templates: listTemplates() });
				return;
			}
			if (effectiveSubcommand === "inspect" && id) {
				await executeTemplatesCommand({
					flags: { id, subcommand: effectiveSubcommand },
				}, () => {});
				const template = listTemplates().find((entry) => entry.id === id);
				args.output({ template });
				return;
			}
		}

		await executeTemplatesCommand({
			flags: { id, subcommand: effectiveSubcommand },
		});
	},
	name: "templates",
	options: {
		id: {
			description: "Template id for `templates inspect`.",
			schema: z.string().optional(),
		},
	},
});

export default templatesCommand;
