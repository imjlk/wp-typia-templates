export interface ScaffoldProjectOptions {
	projectDir: string;
	projectName: string;
	template?: string;
	yes?: boolean;
	noInstall?: boolean;
}

export interface ScaffoldProjectResult {
	projectDir: string;
	templateId: string;
	variables: Record<string, string>;
}

export function scaffoldProject(options: ScaffoldProjectOptions): Promise<ScaffoldProjectResult>;
export function runCreateCli(argv?: string[]): Promise<void>;
export function runLegacyCli(templateId: string, argv?: string[]): Promise<void>;
