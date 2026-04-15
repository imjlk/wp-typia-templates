import { defineCommand } from "@bunli/core";
import { executeDoctorCommand } from "../runtime-bridge";

export const doctorCommand = defineCommand({
	defaultFormat: "toon",
	description: "Run repository and project diagnostics.",
	handler: async (args) => {
		const prefersStructuredOutput = args.formatExplicit && args.format !== "toon";
		if (prefersStructuredOutput) {
			const [{ getDoctorChecks }, { createCliCommandError, getDoctorFailureDetailLines }] =
				await Promise.all([
					import("@wp-typia/project-tools/cli-doctor"),
					import("@wp-typia/project-tools/cli-diagnostics"),
				]);
			const checks = await getDoctorChecks(args.cwd);
			args.output({ checks });
			if (checks.some((check) => check.status === "fail")) {
				throw createCliCommandError({
					command: "doctor",
					detailLines: getDoctorFailureDetailLines(checks),
					summary: "One or more doctor checks failed.",
				});
			}
			return;
		}
		await executeDoctorCommand(args.cwd);
	},
	name: "doctor",
});

export default doctorCommand;
