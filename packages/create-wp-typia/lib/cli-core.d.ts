import type { PackageManagerId } from "./package-managers.js";
import type { ScaffoldProjectResult } from "./scaffold.js";
import type { TemplateDefinition } from "./template-registry.js";

export function createReadlinePrompt(): {
	text(
		message: string,
		defaultValue: string,
		validate?: (input: string) => boolean | string,
	): Promise<string>;
	select(
		message: string,
		options: Array<{ label: string; value: string; hint?: string }>,
		defaultValue?: number,
	): Promise<string>;
	close(): void;
};

export function formatHelpText(): string;
export function formatTemplateSummary(template: TemplateDefinition): string;
export function formatTemplateFeatures(template: TemplateDefinition): string;
export function formatTemplateDetails(template: TemplateDefinition): string;

export function getDoctorChecks(cwd: string): Promise<
	Array<{ status: "pass" | "fail"; label: string; detail: string }>
>;
export function runDoctor(
	cwd: string,
	options: {
		renderLine(check: { status: "pass" | "fail"; label: string; detail: string }): void;
	},
): Promise<Array<{ status: "pass" | "fail"; label: string; detail: string }>>;

export function getNextSteps(options: {
	projectInput: string;
	projectDir: string;
	packageManager: PackageManagerId;
	noInstall?: boolean;
}): string[];

export function runScaffoldFlow(options: {
	projectInput: string;
	cwd?: string;
	templateId?: string;
	packageManager?: PackageManagerId;
	yes?: boolean;
	noInstall?: boolean;
	isInteractive?: boolean;
	allowExistingDir?: boolean;
	selectTemplate?: () => Promise<string> | string;
	selectPackageManager?: () => Promise<PackageManagerId> | PackageManagerId;
	promptText?: (
		message: string,
		defaultValue: string,
		validate?: (input: string) => boolean | string,
	) => Promise<string>;
	installDependencies?: (context: {
		projectDir: string;
		packageManager: PackageManagerId;
	}) => Promise<void> | void;
}): Promise<{
	projectDir: string;
	projectInput: string;
	packageManager: PackageManagerId;
	result: ScaffoldProjectResult;
	nextSteps: string[];
}>;

export function runLegacyCli(templateId: string, argv?: string[]): Promise<void>;

export { getTemplateById, getTemplateSelectOptions, listTemplates };
