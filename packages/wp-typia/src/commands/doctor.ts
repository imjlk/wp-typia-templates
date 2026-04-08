import { defineCommand } from "@bunli/core";

import { getDoctorChecks, runDoctor } from "@wp-typia/project-tools";

export const doctorCommand = defineCommand({
	description: "Run repository and project diagnostics.",
	handler: async (args) => {
		const prefersStructuredOutput =
			(args.formatExplicit && args.format !== "toon") ||
			args.agent ||
			Boolean(args.context?.store?.isAIAgent);
		if (prefersStructuredOutput) {
			const checks = await getDoctorChecks(args.cwd);
			args.output({ checks });
			if (checks.some((check) => check.status === "fail")) {
				throw new Error("Doctor found one or more failing checks.");
			}
			return;
		}
		await runDoctor(args.cwd);
	},
	name: "doctor",
});

export default doctorCommand;
