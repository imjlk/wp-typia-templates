import { formatRunScript } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";

interface SyncOnboardingOptions {
	compoundPersistenceEnabled?: boolean;
}

function templateHasPersistenceSync(
	templateId: string,
	{ compoundPersistenceEnabled = false }: SyncOnboardingOptions = {},
): boolean {
	return templateId === "persistence" || (templateId === "compound" && compoundPersistenceEnabled);
}

/**
 * Returns the optional sync script names to suggest for a template.
 */
export function getOptionalSyncScriptNames(
	templateId: string,
	options: SyncOnboardingOptions = {},
): string[] {
	return templateHasPersistenceSync(templateId, options)
		? ["sync-types", "sync-rest"]
		: ["sync-types"];
}

/**
 * Formats optional onboarding sync commands for the selected package manager.
 */
export function getOptionalOnboardingSteps(
	packageManager: PackageManagerId,
	templateId: string,
	options: SyncOnboardingOptions = {},
): string[] {
	return getOptionalSyncScriptNames(templateId, options).map((scriptName) =>
		formatRunScript(packageManager, scriptName),
	);
}

/**
 * Returns the onboarding note explaining when manual sync is optional.
 */
export function getOptionalOnboardingNote(packageManager: PackageManagerId): string {
	return `${formatRunScript(packageManager, "start")} and ${formatRunScript(packageManager, "build")} already run the relevant sync scripts. Run them manually only if you want generated metadata/schema artifacts committed before your first start/build cycle. They do not create migration history.`;
}

/**
 * Returns source-of-truth guidance for generated artifacts by template mode.
 */
export function getTemplateSourceOfTruthNote(
	templateId: string,
	{ compoundPersistenceEnabled = false }: SyncOnboardingOptions = {},
): string {
	if (templateId === "compound") {
		const compoundBase =
			"`src/blocks/*/types.ts` files remain the source of truth for each block's `block.json`, `typia.manifest.json`, and `typia-validator.php`.";

		if (compoundPersistenceEnabled) {
			return `${compoundBase} For persistence-enabled parents, \`src/blocks/*/api-types.ts\` files remain the source of truth for \`src/blocks/*/api-schemas/*\` when you run \`sync-rest\`.`;
		}

		return compoundBase;
	}

	if (templateId === "persistence") {
		return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`. `src/api-types.ts` remains the source of truth for `src/api-schemas/*` when you run `sync-rest`.";
	}

	return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`.";
}
