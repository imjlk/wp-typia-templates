import fs from "node:fs";
import path from "node:path";

export function normalizeOptionalCliString(value?: string): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function looksLikeLocalCliPath(value: string): boolean {
	return path.isAbsolute(value) || value.startsWith("./") || value.startsWith("../");
}

export function resolveLocalCliPathOption(options: {
	cwd: string;
	label: string;
	value?: string;
}): string | undefined {
	const normalizedValue = normalizeOptionalCliString(options.value);
	if (!normalizedValue || !looksLikeLocalCliPath(normalizedValue)) {
		return normalizedValue;
	}

	const resolvedPath = path.resolve(options.cwd, normalizedValue);
	if (!fs.existsSync(resolvedPath)) {
		throw new Error(
			`\`${options.label}\` path does not exist: ${resolvedPath}. Check the path relative to ${options.cwd}.`,
		);
	}

	return resolvedPath;
}

export function assertExternalLayerCompositionOptions(options: {
	externalLayerId?: string;
	externalLayerSource?: string;
}): void {
	if (options.externalLayerId && !options.externalLayerSource) {
		throw new Error(
			"externalLayerId requires externalLayerSource when composing built-in template layers.",
		);
	}
}

export function createBuiltInVariantErrorMessage(options: {
	templateId: string;
	variant: string;
}): string {
	return `--variant is only supported for official external template configs. Received variant "${options.variant}" for built-in template "${options.templateId}".`;
}

export function assertBuiltInTemplateVariantAllowed(options: {
	templateId: string;
	variant?: string;
}): void {
	if (!options.variant) {
		return;
	}

	throw new Error(
		createBuiltInVariantErrorMessage({
			templateId: options.templateId,
			variant: options.variant,
		}),
	);
}
