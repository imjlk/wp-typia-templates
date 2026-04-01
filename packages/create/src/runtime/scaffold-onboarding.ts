import { formatRunScript } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";

interface SyncOnboardingOptions {
	compoundPersistenceEnabled?: boolean;
}

interface PhpRestExtensionOptions extends SyncOnboardingOptions {
	slug: string;
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
export function getPhpRestExtensionPointsSection(
	templateId: string,
	{ compoundPersistenceEnabled = false, slug }: PhpRestExtensionOptions,
): string | null {
	if (templateId === "persistence") {
		return `## PHP REST Extension Points

- Edit \`${slug}.php\` when you need to change storage helpers, route handlers, response shaping, or route registration.
- Edit \`inc/rest-auth.php\` or \`inc/rest-public.php\` when you need to customize write permissions or token/nonce checks for the selected policy.
- Keep \`src/api-types.ts\` as the source of truth for request and response contracts, then regenerate \`src/api-schemas/*.schema.json\`, per-contract \`src/api-schemas/*.openapi.json\`, and \`src/api.openapi.json\` with \`sync-rest\`.
- Avoid hand-editing generated schema and OpenAPI artifacts unless you are debugging generated output; they are meant to be regenerated from TypeScript contracts.`;
	}

	if (templateId === "compound" && compoundPersistenceEnabled) {
		return `## PHP REST Extension Points

- Edit \`${slug}.php\` when you need to change parent-block storage helpers, route handlers, response shaping, or route registration.
- Edit \`inc/rest-auth.php\` or \`inc/rest-public.php\` when you need to customize write permissions or token/nonce checks for the parent block.
- Keep \`src/blocks/${slug}/api-types.ts\` as the source of truth for parent REST contracts, then regenerate \`src/blocks/${slug}/api-schemas/*.schema.json\`, per-contract \`src/blocks/${slug}/api-schemas/*.openapi.json\`, and \`src/blocks/${slug}/api.openapi.json\` with \`sync-rest\`.
- The hidden child block does not own REST routes or storage. Avoid hand-editing generated schema and OpenAPI artifacts unless you are debugging generated output.`;
	}

	return null;
}
