import { defineCommand } from "@bunli/core";

import {
	emitCliDiagnosticFailure,
	prefersStructuredCliOutput,
} from "../cli-diagnostic-output";
import { executeInitCommand } from "../runtime-bridge";

export const initCommand = defineCommand({
	defaultFormat: "toon",
	description:
		"Preview the minimum wp-typia retrofit plan for an existing project.",
	handler: async (args) => {
		const prefersStructuredOutput = prefersStructuredCliOutput(args);

		try {
			const plan = await executeInitCommand(
				{
					cwd: args.cwd,
					projectDir: args.positional[0] as string | undefined,
				},
				{ emitOutput: !prefersStructuredOutput },
			);
			if (prefersStructuredOutput) {
				args.output({ init: plan });
			}
		} catch (error) {
			emitCliDiagnosticFailure(args, {
				command: "init",
				error,
			});
		}
	},
	name: "init",
	options: {},
});

export default initCommand;
