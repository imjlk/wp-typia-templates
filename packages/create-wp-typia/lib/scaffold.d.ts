export interface ScaffoldProjectOptions {
	projectDir: string;
	templateId: string;
	answers: {
		author: string;
		description: string;
		namespace: string;
		slug: string;
		title: string;
	};
	packageManager: "bun" | "npm" | "pnpm" | "yarn";
	allowExistingDir?: boolean;
	noInstall?: boolean;
	installDependencies?: (context: {
		projectDir: string;
		packageManager: "bun" | "npm" | "pnpm" | "yarn";
	}) => Promise<void> | void;
}

export interface ScaffoldProjectResult {
	projectDir: string;
	templateId: string;
	packageManager: "bun" | "npm" | "pnpm" | "yarn";
	variables: Record<string, string>;
}

export function detectAuthor(): string;
export function collectScaffoldAnswers(options: {
	projectName: string;
	templateId: string;
	yes?: boolean;
	promptText?: (
		message: string,
		defaultValue: string,
		validate?: (input: string) => boolean | string,
	) => Promise<string>;
}): Promise<{
	author: string;
	description: string;
	namespace: string;
	slug: string;
	title: string;
}>;
export function getDefaultAnswers(projectName: string, templateId: string): {
	author: string;
	description: string;
	namespace: string;
	slug: string;
	title: string;
};
export function resolveTemplateId(options: {
	templateId?: string;
	yes?: boolean;
	isInteractive?: boolean;
	selectTemplate?: () => Promise<string> | string;
}): Promise<string>;
export function resolvePackageManagerId(options: {
	packageManager?: "bun" | "npm" | "pnpm" | "yarn";
	yes?: boolean;
	isInteractive?: boolean;
	selectPackageManager?: () => Promise<"bun" | "npm" | "pnpm" | "yarn"> | "bun" | "npm" | "pnpm" | "yarn";
}): Promise<"bun" | "npm" | "pnpm" | "yarn">;
export function scaffoldProject(options: ScaffoldProjectOptions): Promise<ScaffoldProjectResult>;
export function runLegacyCli(templateId: string, argv?: string[]): Promise<void>;
