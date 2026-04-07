export type ParsedArgs = {
	dataStorage?: string;
	help: boolean;
	namespace?: string;
	noInstall: boolean;
	packageManager?: string;
	persistencePolicy?: string;
	phpPrefix?: string;
	positionals: string[];
	template?: string;
	textDomain?: string;
	variant?: string;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	yes: boolean;
};

export function parseArgs(argv: string[]): ParsedArgs;
