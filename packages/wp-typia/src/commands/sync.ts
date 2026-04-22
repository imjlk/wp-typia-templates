import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { createCliCommandError } from "@wp-typia/project-tools/cli-diagnostics";
import { executeSyncCommand } from "../runtime-bridge";

export const syncCommand = defineCommand({
	description:
		"Run the generated-project sync workflow from a scaffolded project or official workspace root.",
	handler: async (args) => {
		try {
			await executeSyncCommand({
				check: Boolean(args.flags.check),
				cwd: args.cwd,
			});
		} catch (error) {
			throw createCliCommandError({
				command: "sync",
				error,
			});
		}
	},
	name: "sync",
	options: {
		check: {
			argumentKind: "flag" as const,
			description:
				"Check generated artifacts without writing changes. Advanced sync-types-only flags stay on sync-types.",
			schema: z.boolean().default(false),
		},
	},
});

export default syncCommand;
