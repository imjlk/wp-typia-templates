import {
	CLI_DIAGNOSTIC_CODES,
	createCliCommandError,
	formatDoctorCheckLine,
	formatDoctorSummaryLine,
	getDoctorFailureDetailLines,
} from "./cli-diagnostics.js";
import { getEnvironmentDoctorChecks } from "./cli-doctor-environment.js";
import { getWorkspaceDoctorChecks } from "./cli-doctor-workspace.js";

/**
 * One doctor check rendered by the CLI diagnostics flow.
 */
export interface DoctorCheck {
	/** Stable machine-readable diagnostic id for structured integrations. */
	code?: string;
	/** Human-readable status detail rendered next to the label. */
	detail: string;
	/** Short label for the dependency, directory, or template check. */
	label: string;
	/** Final pass/fail/warn status for this diagnostic row. */
	status: "pass" | "fail" | "warn";
}

interface RunDoctorOptions {
	renderLine?: (check: DoctorCheck) => void;
	renderSummaryLine?: (summaryLine: string) => void;
}

/**
 * Collect all runtime doctor checks for the current environment.
 *
 * The returned array concatenates environment checks (command availability,
 * directory writability, and built-in template assets) followed by
 * workspace checks (package metadata, inventory, blocks, variations,
 * patterns, bindings, and optional migration hints) in display order.
 *
 * @param cwd Working directory to validate for writability.
 * @returns Ordered doctor check rows ready for CLI rendering.
 */
export async function getDoctorChecks(cwd: string): Promise<DoctorCheck[]> {
	return [
		...(await getEnvironmentDoctorChecks(cwd)),
		...(await getWorkspaceDoctorChecks(cwd)),
	];
}

/**
 * Run doctor checks, render each line, and fail when any check does not pass.
 *
 * @param cwd Working directory to validate.
 * @param options Optional renderer override for each emitted check row.
 * @returns The completed list of doctor checks.
 * @throws {Error} When one or more checks fail.
 */
export async function runDoctor(
	cwd: string,
	options: RunDoctorOptions = {},
): Promise<DoctorCheck[]> {
	const renderLine =
		options.renderLine ?? ((check: DoctorCheck) => console.log(formatDoctorCheckLine(check)));
	const renderSummaryLine =
		options.renderSummaryLine ??
		(options.renderLine ? () => undefined : (summaryLine: string) => console.log(summaryLine));
	const checks = await getDoctorChecks(cwd);

	for (const check of checks) {
		renderLine(check);
	}

	renderSummaryLine(formatDoctorSummaryLine(checks));

	const failureDetailLines = getDoctorFailureDetailLines(checks);
	if (failureDetailLines.length > 0) {
		throw createCliCommandError({
			code: CLI_DIAGNOSTIC_CODES.DOCTOR_CHECK_FAILED,
			command: "doctor",
			detailLines: failureDetailLines,
			summary: "One or more doctor checks failed.",
		});
	}

	return checks;
}
