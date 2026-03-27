export interface ParsedMigrationCommand {
	command: string | undefined;
	flags: {
		all: boolean;
		currentVersion?: string;
		from?: string;
		to?: string;
		version?: string;
	};
}

export interface MigrationDiffItem {
	detail: string;
	kind: string;
	path: string;
	status: "auto" | "manual";
}

export interface MigrationDiffReport {
	currentTypeName: string;
	fromVersion: string;
	summary: {
		auto: number;
		autoItems: MigrationDiffItem[];
		manual: number;
		manualItems: MigrationDiffItem[];
	};
	toVersion: string;
}

export declare function formatMigrationHelpText(): string;
export declare function parseMigrationArgs(argv: string[]): ParsedMigrationCommand;
export declare function formatDiffReport(diff: MigrationDiffReport): string;
export declare function runMigrationCommand(
	command: ParsedMigrationCommand,
	cwd: string,
	options?: { renderLine?: (line: string) => void },
): unknown;
