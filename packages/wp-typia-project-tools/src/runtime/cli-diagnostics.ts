/**
 * Shared human-readable diagnostics for non-interactive `wp-typia` CLI flows.
 */
export interface CliDiagnosticMessage {
	command: string;
	detailLines: string[];
	summary: string;
}

type DoctorCheckLike = {
	detail: string;
	label: string;
	status: "pass" | "fail";
};

const DEFAULT_CLI_FAILURE_SUMMARIES: Record<string, string> = {
	add: "Unable to complete the requested add workflow.",
	create: "Unable to complete the requested create workflow.",
	doctor: "One or more doctor checks failed.",
	migrate: "Unable to complete the requested migration command.",
};

function formatCliDiagnosticBlock(message: CliDiagnosticMessage): string {
	const lines = [`wp-typia ${message.command} failed`, `Summary: ${message.summary}`];

	if (message.detailLines.length > 0) {
		lines.push("Details:");
		for (const detailLine of message.detailLines) {
			lines.push(`- ${detailLine}`);
		}
	}

	return lines.join("\n");
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

function normalizeDetailLines(detailLines: Array<string | null | undefined>): string[] {
	return detailLines
		.flatMap((detailLine) =>
			typeof detailLine === "string" ? detailLine.split("\n") : [],
		)
		.map((detailLine) => detailLine.trim())
		.filter((detailLine) => detailLine.length > 0);
}

/**
 * Structured CLI failure carrying a stable summary/detail layout.
 */
export class CliDiagnosticError extends Error {
	readonly command: string;
	readonly detailLines: string[];
	readonly summary: string;

	constructor(message: CliDiagnosticMessage, options?: ErrorOptions) {
		super(formatCliDiagnosticBlock(message), options);
		this.command = message.command;
		this.detailLines = [...message.detailLines];
		this.name = "CliDiagnosticError";
		this.summary = message.summary;
	}
}

/**
 * Narrow an unknown error to the shared CLI diagnostic error shape.
 */
export function isCliDiagnosticError(error: unknown): error is CliDiagnosticError {
	return error instanceof CliDiagnosticError;
}

/**
 * Build a shared diagnostic error for one CLI command failure.
 */
export function createCliCommandError(options: {
	command: string;
	detailLines?: string[];
	error?: unknown;
	summary?: string;
}): CliDiagnosticError {
	if (isCliDiagnosticError(options.error)) {
		return options.error;
	}

	const summary =
		options.summary ?? DEFAULT_CLI_FAILURE_SUMMARIES[options.command] ?? "Command failed.";
	const detailLines = normalizeDetailLines(
		options.detailLines ?? [options.error === undefined ? undefined : getErrorMessage(options.error)],
	);

	return new CliDiagnosticError(
		{
			command: options.command,
			detailLines,
			summary,
		},
		options.error instanceof Error ? { cause: options.error } : undefined,
	);
}

/**
 * Render a CLI diagnostic block. Non-diagnostic errors fall back to their
 * plain message so existing non-command failures keep working.
 */
export function formatCliDiagnosticError(error: unknown): string {
	if (!isCliDiagnosticError(error)) {
		return getErrorMessage(error);
	}

	return formatCliDiagnosticBlock({
		command: error.command,
		detailLines: error.detailLines,
		summary: error.summary,
	});
}

/**
 * Format one human-readable doctor check row.
 */
export function formatDoctorCheckLine(check: DoctorCheckLike): string {
	return `${check.status === "pass" ? "PASS" : "FAIL"} ${check.label}: ${check.detail}`;
}

/**
 * Return the failing doctor checks from one doctor run.
 */
export function getFailingDoctorChecks<TCheck extends DoctorCheckLike>(
	checks: readonly TCheck[],
): TCheck[] {
	return checks.filter((check) => check.status === "fail");
}

/**
 * Format the final doctor summary row.
 */
export function formatDoctorSummaryLine(checks: readonly DoctorCheckLike[]): string {
	const failedChecks = getFailingDoctorChecks(checks);
	return `${failedChecks.length === 0 ? "PASS" : "FAIL"} wp-typia doctor summary: ${checks.length - failedChecks.length}/${checks.length} checks passed`;
}

/**
 * Build detail lines for doctor failures so the non-interactive formatter can
 * restate the failed checks after the streaming rows.
 */
export function getDoctorFailureDetailLines(checks: readonly DoctorCheckLike[]): string[] {
	return getFailingDoctorChecks(checks).map((check) => `${check.label}: ${check.detail}`);
}
