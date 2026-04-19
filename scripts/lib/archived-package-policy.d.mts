export interface ArchivedNpmEntrypoint {
	deprecationRange: string;
	description: string;
	keywords: readonly string[];
	packageDir: string;
	packageName: string;
	private: boolean;
	replacementCommands: readonly [string, string];
}

export declare const ARCHIVED_NPM_ENTRYPOINTS: readonly ArchivedNpmEntrypoint[];

export declare function getArchivedNpmEntrypoint(
	packageName: string,
): ArchivedNpmEntrypoint | null;

export declare function renderArchivedNpmDeprecationMessage(
	entry: ArchivedNpmEntrypoint,
): string;

export declare function renderArchivedNpmDeprecationCommand(
	entry: ArchivedNpmEntrypoint,
): string;

export declare function renderArchivedNpmDeprecationPlan(
	entries?: readonly ArchivedNpmEntrypoint[],
): string;
