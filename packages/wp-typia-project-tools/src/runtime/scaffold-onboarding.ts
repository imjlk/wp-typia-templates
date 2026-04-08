import { formatRunScript } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPrimaryDevelopmentScript } from "./local-dev-presets.js";

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
export function getOptionalOnboardingNote(
	packageManager: PackageManagerId,
	templateId = "basic",
): string {
	const developmentScript = getPrimaryDevelopmentScript(templateId);
	const failOnLossySyncCommand = formatRunScript(
		packageManager,
		"sync-types",
		"--fail-on-lossy",
	);
	const syncTypesCommand = formatRunScript(packageManager, "sync-types");
	const typecheckCommand = formatRunScript(packageManager, "typecheck");
	const strictSyncCommand = formatRunScript(
		packageManager,
		"sync-types",
		"--strict --report json",
	);

	return `${formatRunScript(packageManager, developmentScript)} ${
		developmentScript === "dev"
			? "watches the relevant sync scripts during local development."
			: "remains the primary local entry point."
	} ${formatRunScript(packageManager, "start")} still runs one-shot syncs before starting, while ${formatRunScript(packageManager, "build")} and ${typecheckCommand} verify that generated metadata/schema artifacts are already current and fail if they are stale. Run the sync scripts manually when you want to refresh generated artifacts before build, typecheck, or commit. ${syncTypesCommand} stays warn-only by default; use \`${failOnLossySyncCommand}\` to fail only on lossy WordPress projections, or \`${strictSyncCommand}\` for a CI-friendly JSON report that fails on all warnings. They do not create migration history.`;
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
			"`src/blocks/*/types.ts` files remain the source of truth for each block's `block.json`, `typia.manifest.json`, and `typia-validator.php`. Fresh scaffolds include starter `typia.manifest.json` files so editor imports resolve before the first sync.";

		if (compoundPersistenceEnabled) {
			return `${compoundBase} For persistence-enabled parents, \`src/blocks/*/api-types.ts\` files remain the source of truth for \`src/blocks/*/api-schemas/*\` when you run \`sync-rest\`.`;
		}

		return compoundBase;
	}

	if (templateId === "persistence") {
		return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`. Fresh scaffolds include a starter `typia.manifest.json` so editor imports resolve before the first sync. `src/api-types.ts` remains the source of truth for `src/api-schemas/*` when you run `sync-rest`. This scaffold is intentionally server-rendered: `src/render.php` is the canonical frontend entry, and `src/save.tsx` returns `null` so PHP can inject post context, storage-backed state, and write-policy bootstrap data before hydration.";
	}

	return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`. Fresh scaffolds include a starter `typia.manifest.json` so editor imports resolve before the first sync. The basic scaffold stays static by design: it does not generate `render.php`, `src/save.tsx` always returns stable markup, and the generated webpack config keeps the current `@wordpress/scripts` CommonJS baseline.";
}

/**
 * Returns the generated-project extension workflow for compound child blocks.
 */
export function getCompoundExtensionWorkflowSection(
	packageManager: PackageManagerId,
	templateId: string,
): string | null {
	if ( templateId !== "compound" ) {
		return null;
	}

	return `## Compound Extension Workflow

\`\`\`bash
${ formatRunScript(
		packageManager,
		"add-child",
		'--slug faq-item --title "FAQ Item"'
	) }
\`\`\`

This scaffolds a new hidden child block type, updates \`scripts/block-config.ts\` and \`src/blocks/*/children.ts\`, and leaves the default seeded child template unchanged.`;
}

function formatPhpRestExtensionPointsSection({
	apiTypesPath,
	extraNote,
	mainPhpPath,
	mainPhpScope,
}: PhpRestSectionOptions): string {
	const schemaJsonGlob = apiTypesPath.replace(/api-types\.ts$/u, "api-schemas/*.schema.json");
	const perContractOpenApiGlob = apiTypesPath.replace(
		/api-types\.ts$/u,
		"api-schemas/*.openapi.json",
	);
	const aggregateOpenApiPath = apiTypesPath.replace(/api-types\.ts$/u, "api.openapi.json");

	const lines = [
		`- Edit \`${mainPhpPath}\` when you need to ${mainPhpScope}.`,
		"- Edit `inc/rest-auth.php` or `inc/rest-public.php` when you need to customize write permissions or token/request-id/nonce checks for the selected policy.",
		`- Keep \`${apiTypesPath}\` as the source of truth for request and response contracts, then regenerate \`${schemaJsonGlob}\`, per-contract \`${perContractOpenApiGlob}\`, and \`${aggregateOpenApiPath}\` with \`sync-rest\`.`,
		"- Avoid hand-editing generated schema and OpenAPI artifacts unless you are debugging generated output; they are meant to be regenerated from TypeScript contracts.",
	];

	if (typeof extraNote === "string" && extraNote.length > 0) {
		lines.push(`- ${extraNote}`);
	}

	return `## PHP REST Extension Points\n\n${lines.join("\n")}`;
}

/**
 * Returns scaffold-local guidance for the main PHP REST customization points.
 */
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
