import { defineCommand } from "@bunli/core";
import { CLI_DIAGNOSTIC_CODES } from "@wp-typia/project-tools/cli-diagnostics";
import type { DoctorExitPolicy } from "@wp-typia/project-tools/cli-doctor";
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
		const doctorExitPolicy: DoctorExitPolicy = args.flags["workspace-only"]
			? "workspace-only"
			: "strict";
		if (prefersStructuredOutput) {
			const {
				createDoctorRunSummary,
				getDoctorChecks,
				getDoctorExitFailureDetailLines,
			} = await import("@wp-typia/project-tools/cli-doctor");
			const checks = await getDoctorChecks(args.cwd);
			const summary = createDoctorRunSummary(checks, {
				exitPolicy: doctorExitPolicy,
			});
			if (summary.exitCode === 1) {
				emitCliDiagnosticFailure(args, {
					code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
					command: "doctor",
					detailLines: getDoctorExitFailureDetailLines(checks, {
						exitPolicy: doctorExitPolicy,
					}),
					extraOutput: { checks, summary },
					summary: "One or more doctor checks failed.",
				});
				return;
			}
			args.output({ checks, summary });
			return;
		}
		try {
			await executeDoctorCommand(args.cwd, { exitPolicy: doctorExitPolicy });
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
