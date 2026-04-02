export interface ParsedChangesetEntry {
	packageId: string;
	releaseType: string;
}

export interface SampoChangesetValidationResult {
	allowedPackageIds: string[];
	errors: string[];
	files: string[];
	valid: boolean;
}

export interface RunCliOptions {
	cwd?: string;
	stderr?: {
		write(chunk: string): unknown;
	};
	stdout?: {
		write(chunk: string): unknown;
	};
}

export declare function findPublishablePackageIds(repoRoot: string): string[];
export declare function parseChangesetFrontmatter(
	source: string,
	filePath?: string,
): ParsedChangesetEntry[];
export declare function validateSampoChangesets(
	repoRoot: string,
): SampoChangesetValidationResult;
export declare function runCli(options?: RunCliOptions): number;
