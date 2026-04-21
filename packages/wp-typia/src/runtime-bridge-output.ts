import packageJson from "../package.json";
import { formatPackageExecCommand } from "@wp-typia/project-tools/package-managers";
import type { AlternateBufferCompletionPayload } from "./ui/alternate-buffer-lifecycle";

type PrintLine = (line: string) => void;

export type CreateProgressPayload = {
	detail: string;
	title: string;
};

type ExternalLayerSelectOption = {
	description?: string;
	extends: string[];
	id: string;
};

/**
 * Prints a formatted alternate-buffer completion payload to the provided writers.
 *
 * @param payload Structured completion payload to render.
 * @param options Optional line printers for normal output and warnings.
 * @returns Nothing.
 */
export function printCompletionPayload(
	payload: AlternateBufferCompletionPayload,
	options: {
		printLine?: PrintLine;
		warnLine?: PrintLine;
	} = {},
): void {
	const printLine = options.printLine ?? (console.log as PrintLine);
	const warnLine = options.warnLine ?? printLine;

	for (const line of payload.preambleLines ?? []) {
		printLine(line);
	}
	for (const warning of payload.warningLines ?? []) {
		warnLine(`⚠️ ${warning}`);
	}

	const hasDetails =
		(payload.summaryLines?.length ?? 0) > 0 ||
		(payload.nextSteps?.length ?? 0) > 0 ||
		(payload.optionalLines?.length ?? 0) > 0 ||
		Boolean(payload.optionalNote);
	const hasLeadingContext =
		(payload.preambleLines?.length ?? 0) > 0 ||
		(payload.warningLines?.length ?? 0) > 0;

	printLine(hasLeadingContext && hasDetails ? `\n${payload.title}` : payload.title);
	for (const line of payload.summaryLines ?? []) {
		printLine(line);
	}
	if ((payload.nextSteps?.length ?? 0) > 0) {
		printLine("Next steps:");
		for (const step of payload.nextSteps ?? []) {
			printLine(`  ${step}`);
		}
	}
	if ((payload.optionalLines?.length ?? 0) > 0) {
		printLine(`\n${payload.optionalTitle ?? "Optional:"}`);
		for (const step of payload.optionalLines ?? []) {
			printLine(`  ${step}`);
		}
	}
	if (payload.optionalNote) {
		printLine(`Note: ${payload.optionalNote}`);
	}
}

/**
 * Formats a lightweight create-progress line for fallback CLI output.
 *
 * @param payload User-facing scaffold progress payload.
 * @returns A single readable status line.
 */
export function formatCreateProgressLine(payload: CreateProgressPayload): string {
	return `⏳ ${payload.title}: ${payload.detail}`;
}

/**
 * Builds the completion payload shown after a create flow succeeds.
 *
 * @param flow Resolved create-flow data including onboarding steps and warnings.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildCreateCompletionPayload(flow: {
	nextSteps: string[];
	optionalOnboarding: {
		note: string;
		steps: string[];
	};
	packageManager: string;
	projectDir: string;
	result: {
		selectedVariant?: string | null;
		variables: {
			title: string;
		};
		warnings: string[];
	};
}): AlternateBufferCompletionPayload {
	const verificationSteps = [
		formatPackageExecCommand(
			flow.packageManager as "bun" | "npm" | "pnpm" | "yarn",
			`wp-typia@${packageJson.version}`,
			"doctor",
		),
		...flow.optionalOnboarding.steps,
	];

	return {
		nextSteps: flow.nextSteps,
		optionalLines: verificationSteps,
		optionalNote: flow.optionalOnboarding.note,
		optionalTitle: "Verify and sync (optional):",
		preambleLines: flow.result.selectedVariant
			? [`Template variant: ${flow.result.selectedVariant}`]
			: undefined,
		summaryLines: [`Project directory: ${flow.projectDir}`],
		title: `✅ Created ${flow.result.variables.title} in ${flow.projectDir}`,
		warningLines: flow.result.warnings,
	};
}

/**
 * Builds the completion payload shown after a dry-run create flow succeeds.
 *
 * @param flow Resolved create-flow data including the non-mutating scaffold plan.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildCreateDryRunPayload(flow: {
	packageManager: string;
	plan: {
		dependencyInstall: "skipped-by-flag" | "would-install";
		files: string[];
	};
	projectDir: string;
	result: {
		selectedVariant?: string | null;
		templateId: string;
		variables: {
			title: string;
		};
		warnings: string[];
	};
}): AlternateBufferCompletionPayload {
	let dependencyInstallLine: string;
	switch (flow.plan.dependencyInstall) {
		case "skipped-by-flag":
			dependencyInstallLine = "Dependency install: already skipped via --no-install";
			break;
		case "would-install":
			dependencyInstallLine = "Dependency install: would run during a real scaffold";
			break;
	}

	return {
		optionalLines: flow.plan.files.map((relativePath) => `write ${relativePath}`),
		optionalNote:
			"No files were written because --dry-run was enabled. Re-run without --dry-run to materialize this scaffold.",
		optionalTitle: `Planned files (${flow.plan.files.length}):`,
		preambleLines: flow.result.selectedVariant
			? [`Template variant: ${flow.result.selectedVariant}`]
			: undefined,
		summaryLines: [
			`Project directory: ${flow.projectDir}`,
			`Template: ${flow.result.templateId}`,
			`Package manager: ${flow.packageManager}`,
			dependencyInstallLine,
		],
		title: `🧪 Dry run for ${flow.result.variables.title} at ${flow.projectDir}`,
		warningLines: flow.result.warnings,
	};
}

/**
 * Builds the completion payload shown after a migrate command succeeds.
 *
 * @param options Completed migrate command metadata plus rendered lines.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildMigrationCompletionPayload(options: {
	command: string;
	lines: string[];
}): AlternateBufferCompletionPayload {
	const summaryLines = options.lines.filter((line) => line.trim().length > 0);

	return {
		summaryLines,
		title: `✅ Completed wp-typia migrate ${options.command}`,
	};
}

/**
 * Builds the completion payload shown after an add flow succeeds.
 *
 * @param options Add-flow kind plus normalized values to summarize.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildAddCompletionPayload(options: {
	kind:
		| "binding-source"
		| "block"
		| "editor-plugin"
		| "hooked-block"
		| "pattern"
		| "rest-resource"
		| "variation";
	projectDir: string;
	values: Record<string, string>;
	warnings?: string[];
}): AlternateBufferCompletionPayload {
	switch (options.kind) {
		case "variation":
			return {
				summaryLines: [
					`Variation: ${options.values.variationSlug}`,
					`Target block: ${options.values.blockSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace variation",
			};
		case "pattern":
			return {
				summaryLines: [
					`Pattern: ${options.values.patternSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace pattern",
			};
		case "binding-source":
			return {
				summaryLines: [
					`Binding source: ${options.values.bindingSourceSlug}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added binding source",
			};
		case "rest-resource":
			return {
				summaryLines: [
					`REST resource: ${options.values.restResourceSlug}`,
					`Namespace: ${options.values.namespace}`,
					`Methods: ${options.values.methods}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added plugin-level REST resource",
			};
		case "editor-plugin":
			return {
				summaryLines: [
					`Editor plugin: ${options.values.editorPluginSlug}`,
					`Slot: ${options.values.slot}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added editor plugin",
			};
		case "hooked-block":
			return {
				summaryLines: [
					`Block: ${options.values.blockSlug}`,
					`Anchor: ${options.values.anchorBlockName}`,
					`Position: ${options.values.position}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added blockHooks metadata",
			};
		default:
			return {
				summaryLines: [
					`Blocks: ${options.values.blockSlugs}`,
					`Template family: ${options.values.templateId}`,
					`Project directory: ${options.projectDir}`,
				],
				title: "✅ Added workspace block",
				warningLines: options.warnings,
			};
	}
}

/**
 * Builds the completion payload shown after a dry-run add flow succeeds.
 *
 * @param options Existing add completion metadata plus the planned file updates.
 * @returns A structured alternate-buffer completion payload.
 */
export function buildAddDryRunPayload(options: {
	completion: AlternateBufferCompletionPayload;
	fileOperations: string[];
}): AlternateBufferCompletionPayload {
	const normalizedTitle = options.completion.title.replace(/^✅\s*Added\s*/u, "");

	return {
		optionalLines: options.fileOperations,
		optionalNote:
			"No workspace files were changed because --dry-run was enabled. Re-run without --dry-run to apply this add command.",
		optionalTitle: `Planned workspace updates (${options.fileOperations.length}):`,
		preambleLines: options.completion.preambleLines,
		summaryLines: options.completion.summaryLines,
		title: `🧪 Dry run for ${normalizedTitle || "workspace add command"}`,
		warningLines: options.completion.warningLines,
	};
}

/**
 * Prints a block of text lines using a shared line printer.
 *
 * @param lines Lines to print in order.
 * @param printLine Line printer to use.
 * @returns Nothing.
 */
export function printBlock(lines: string[], printLine: PrintLine): void {
	for (const line of lines) {
		printLine(line);
	}
}

function formatExternalLayerSelectHint(option: ExternalLayerSelectOption): string | undefined {
	const details = [
		option.description,
		option.extends.length > 0 ? `extends ${option.extends.join(", ")}` : undefined,
	].filter((value): value is string => typeof value === "string" && value.length > 0);

	return details.length > 0 ? details.join(" · ") : undefined;
}

/**
 * Converts external layer options into prompt-compatible select items.
 *
 * @param options External layer options returned by the block generator.
 * @returns Prompt select options with labels and hints.
 */
export function toExternalLayerPromptOptions(options: ExternalLayerSelectOption[]) {
	return options.map((option) => ({
		hint: formatExternalLayerSelectHint(option),
		label: option.id,
		value: option.id,
	}));
}
