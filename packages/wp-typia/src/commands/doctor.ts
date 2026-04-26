import { defineCommand } from "@bunli/core";
import { CLI_DIAGNOSTIC_CODES } from "@wp-typia/project-tools/cli-diagnostics";
import {
	emitCliDiagnosticFailure,
	prefersStructuredCliOutput,
} from "../cli-diagnostic-output";
import {
	buildCommandOptions,
	DOCTOR_OPTION_METADATA,
} from "../command-option-metadata";
import { executeDoctorCommand } from "../runtime-bridge";

export const doctorCommand = defineCommand({
	defaultFormat: "toon",
	description: "Run repository and project diagnostics.",
	handler: async (args) => {
		const prefersStructuredOutput = prefersStructuredCliOutput(args);
		if (prefersStructuredOutput) {
			const [{ getDoctorChecks }, { getDoctorFailureDetailLines }] =
				await Promise.all([
					import("@wp-typia/project-tools/cli-doctor"),
					import("@wp-typia/project-tools/cli-diagnostics"),
				]);
			const checks = await getDoctorChecks(args.cwd);
			if (checks.some((check) => check.status === "fail")) {
				emitCliDiagnosticFailure(args, {
					code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
					command: "doctor",
					detailLines: getDoctorFailureDetailLines(checks),
					extraOutput: { checks },
					summary: "One or more doctor checks failed.",
				});
				return;
			}
			args.output({ checks });
			return;
		}
		try {
			await executeDoctorCommand(args.cwd);
		} catch (error) {
			emitCliDiagnosticFailure(args, {
				command: "doctor",
				error,
			});
		}
	},
	name: "doctor",
	options: buildCommandOptions(DOCTOR_OPTION_METADATA),
});

export default doctorCommand;
