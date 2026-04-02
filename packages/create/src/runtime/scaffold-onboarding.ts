import { formatRunScript } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";

interface SyncOnboardingOptions {
	compoundPersistenceEnabled?: boolean;
}

interface PhpRestExtensionOptions extends SyncOnboardingOptions {
	slug: string;
}

interface PhpRestSectionOptions {
	apiTypesPath: string;
	extraNote?: string;
	mainPhpPath: string;
	mainPhpScope: string;
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

/**
 * Returns scaffold-local guidance for the main PHP REST customization points.
 */
function formatPhpRestExtensionPointsSection({
	apiTypesPath,
	extraNote,
	mainPhpPath,
	mainPhpScope,
}: PhpRestSectionOptions): string {
	const lines = [
		`- Edit \`${mainPhpPath}\` when you need to ${mainPhpScope}.`,
		"- Edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to customize write permissions or token/nonce checks for the selected policy.",
		`- Keep \`${apiTypesPath}\` as the source of truth for request and response contracts, then regenerate \`${apiTypesPath.replace(/api-types\.ts$/u, "api-schemas/*.schema.json")}\`, per-contract \`${apiTypesPath.replace(/api-types\.ts$/u, "api-schemas/*.openapi.json")}\`, and \`${apiTypesPath.replace(/api-types\.ts$/u, "api.openapi.json")}\` with \`sync-rest\`.`,
		"- Avoid hand-editing generated schema and OpenAPI artifacts unless you are debugging generated output; they are meant to be regenerated from TypeScript contracts.",
	];

	if (typeof extraNote === "string" && extraNote.length > 0) {
		lines.push(`- ${extraNote}`);
	}

	return `## PHP REST Extension Points\n\n${lines.join("\n")}`;
}

export function getPhpRestExtensionPointsSection(
	templateId: string,
	{ compoundPersistenceEnabled = false, slug }: PhpRestExtensionOptions,
): string | null {
	if (templateId === "persistence") {
		return formatPhpRestExtensionPointsSection({
			apiTypesPath: "src/api-types.ts",
			mainPhpPath: `${slug}.php`,
			mainPhpScope: "change storage helpers, route handlers, response shaping, or route registration",
		});
	}

	if (templateId === "compound" && compoundPersistenceEnabled) {
		return formatPhpRestExtensionPointsSection({
			apiTypesPath: `src/blocks/${slug}/api-types.ts`,
			extraNote: "The hidden child block does not own REST routes or storage.",
			mainPhpPath: `${slug}.php`,
			mainPhpScope:
				"change parent-block storage helpers, route handlers, response shaping, or route registration",
		});
	}

	return null;
}
