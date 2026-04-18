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

const MIN_CLI_WRAP_COLUMNS = 32;

function parseCliColumns(value: string | undefined): number | null {
	if (typeof value !== "string" || value.trim().length === 0) {
		return null;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed >= MIN_CLI_WRAP_COLUMNS ? parsed : null;
}

function resolveCliWrapColumns(streamColumns: number | undefined): number | null {
	return parseCliColumns(process.env.COLUMNS) ??
		(typeof streamColumns === "number" && streamColumns >= MIN_CLI_WRAP_COLUMNS
			? streamColumns
			: null);
}

function wrapCliText(text: string, maxWidth: number): string[] {
	const words = text.trim().split(/\s+/u).filter((word) => word.length > 0);

	if (words.length === 0) {
		return [""];
	}

	const lines: string[] = [];
	let currentLine = words[0] ?? "";

	for (const word of words.slice(1)) {
		const nextLine = `${currentLine} ${word}`;
		if (nextLine.length <= maxWidth) {
			currentLine = nextLine;
			continue;
		}

		lines.push(currentLine);
		currentLine = word;
	}

	lines.push(currentLine);
	return lines;
}

function formatWrappedPrefixedLine(
	prefix: string,
	text: string,
	columns: number | null,
	continuationIndent = "  ",
): string[] {
	const singleLine = `${prefix}${text}`;
	if (columns === null || singleLine.length <= columns) {
		return [singleLine];
	}

	const words = text.trim().split(/\s+/u).filter((word) => word.length > 0);
	if (words.length === 0) {
		return [prefix.trimEnd()];
	}

	const continuationWidth = Math.max(1, columns - continuationIndent.length);
	const firstLineWidth = columns - prefix.length;
	if (firstLineWidth <= 0 || (words[0]?.length ?? 0) > firstLineWidth) {
		return [
			prefix.trimEnd(),
			...wrapCliText(text, continuationWidth).map((line) => `${continuationIndent}${line}`),
		];
	}

	const lines: string[] = [];
	let currentPrefix = prefix;
	let currentWidth = Math.max(1, columns - currentPrefix.length);
	let currentLine = words[0] ?? "";

	for (const word of words.slice(1)) {
		const nextLine = `${currentLine} ${word}`;
		if (nextLine.length <= currentWidth) {
			currentLine = nextLine;
			continue;
		}

		lines.push(`${currentPrefix}${currentLine}`);
		currentPrefix = continuationIndent;
		currentWidth = continuationWidth;
		currentLine = word;
	}

	lines.push(`${currentPrefix}${currentLine}`);
	return lines;
}

function formatCliDiagnosticBlock(message: CliDiagnosticMessage): string {
	const columns = resolveCliWrapColumns(process.stderr.columns);
	const lines = [
		`wp-typia ${message.command} failed`,
		...formatWrappedPrefixedLine("Summary: ", message.summary, columns),
	];

	if (message.detailLines.length > 0) {
		lines.push("Details:");
		for (const detailLine of message.detailLines) {
			lines.push(...formatWrappedPrefixedLine("- ", detailLine, columns));
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
	return formatWrappedPrefixedLine(
		`${check.status === "pass" ? "PASS" : "FAIL"} ${check.label}: `,
		check.detail,
		resolveCliWrapColumns(process.stdout.columns),
	).join("\n");
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
	return formatWrappedPrefixedLine(
		`${failedChecks.length === 0 ? "PASS" : "FAIL"} wp-typia doctor summary: `,
		`${checks.length - failedChecks.length}/${checks.length} checks passed`,
		resolveCliWrapColumns(process.stdout.columns),
	).join("\n");
}

/**
 * Build detail lines for doctor failures so the non-interactive formatter can
 * restate the failed checks after the streaming rows.
 */
export function getDoctorFailureDetailLines(checks: readonly DoctorCheckLike[]): string[] {
	return getFailingDoctorChecks(checks).map((check) => `${check.label}: ${check.detail}`);
}
