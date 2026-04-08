import { defineCommand } from "@bunli/core";

import { getDoctorChecks, runDoctor } from "@wp-typia/project-tools";

export const doctorCommand = defineCommand({
	description: "Run repository and project diagnostics.",
	handler: async (args) => {
		const prefersStructuredOutput =
			!args.formatExplicit && (args.agent || Boolean(args.context?.store?.isAIAgent));
		if (prefersStructuredOutput) {
			args.output({ checks: await getDoctorChecks(args.cwd) });
			return;
		}
		await runDoctor(args.cwd);
	},
	name: "doctor",
});

export default doctorCommand;
