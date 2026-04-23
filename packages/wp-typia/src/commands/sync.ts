import { defineCommand } from "@bunli/core";

import { createCliCommandError } from "@wp-typia/project-tools/cli-diagnostics";
import {
	buildCommandOptions,
	SYNC_OPTION_METADATA,
} from "../command-option-metadata";
import { executeSyncCommand } from "../runtime-bridge";
import {
	buildSyncDryRunPayload,
	printCompletionPayload,
} from "../runtime-bridge-output";

export const syncCommand = defineCommand({
	description:
		"Run the generated-project sync workflow from a scaffolded project or official workspace root.",
	handler: async (args) => {
		const check = Boolean(args.flags.check);
		const dryRun = Boolean(args.flags["dry-run"]);
		const prefersStructuredOutput =
			(args.formatExplicit && args.format !== "toon") ||
			args.agent ||
			Boolean(args.context?.store?.isAIAgent);

		try {
			const sync = await executeSyncCommand({
				captureOutput: prefersStructuredOutput && !dryRun,
				check,
				cwd: args.cwd,
				dryRun,
			});
			if (prefersStructuredOutput) {
				args.output({ sync });
				return;
			}
			if (dryRun) {
				printCompletionPayload(
					buildSyncDryRunPayload({
						check: sync.check,
						packageManager: sync.packageManager,
						plannedCommands: sync.plannedCommands,
						projectDir: sync.projectDir,
					}),
				);
			}
		} catch (error) {
			throw createCliCommandError({
				command: "sync",
				error,
			});
		}
	},
	name: "sync",
	options: buildCommandOptions(SYNC_OPTION_METADATA),
});

export default syncCommand;
