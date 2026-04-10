import { defineCommand } from "@bunli/core";
import { z } from "zod";

import { executeSyncCommand } from "../runtime-bridge";

export const syncCommand = defineCommand({
	description: "Run the common generated-project sync workflow.",
	handler: async (args) => {
		await executeSyncCommand({
			check: Boolean(args.flags.check),
			cwd: args.cwd,
		});
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
