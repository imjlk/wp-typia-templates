import { formatRunScript } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPrimaryDevelopmentScript } from "./local-dev-presets.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	isBuiltInTemplateId,
} from "./template-registry.js";

interface SyncOnboardingOptions {
	availableScripts?: string[];
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
	transportPath: string;
}

const INITIAL_COMMIT_COMMANDS = [
	"git init",
	"git add .",
	'git commit -m "Initial scaffold"',
] as const;

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
	const availableScripts = new Set(options.availableScripts ?? []);
	if (availableScripts.has("sync")) {
		return ["sync"];
	}

	const fallbackScripts = ["sync-types", "sync-rest"].filter((scriptName) =>
		availableScripts.has(scriptName),
	);
	if (fallbackScripts.length > 0) {
		return fallbackScripts;
	}

	if (
		!isBuiltInTemplateId(templateId) &&
		templateId !== OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
	) {
		return [];
	}

	return ["sync"];
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
 * Returns the quick-start note explaining the scaffold's primary local loop.
 */
export function getQuickStartWorkflowNote(
	packageManager: PackageManagerId,
	templateId = "basic",
	options: SyncOnboardingOptions = {},
): string {
	const developmentScript = getPrimaryDevelopmentScript(templateId);
	const devCommand = formatRunScript(packageManager, developmentScript);
	const startCommand = formatRunScript(packageManager, "start");

	if (developmentScript !== "dev") {
		return `${devCommand} is the primary local entry point for this template. Use ${startCommand} when you want the scaffold's one-shot startup flow instead of the watch-oriented workflow.`;
	}

	if (templateHasPersistenceSync(templateId, options)) {
		return `${devCommand} keeps the editor, type-derived artifacts, and REST-derived artifacts moving together during local development. Use ${startCommand} when you want a one-shot sync plus editor startup without the long-running watch loop.`;
	}

	return `${devCommand} keeps the editor and type-derived artifacts moving together during local development. Use ${startCommand} when you want a one-shot sync plus editor startup without the long-running watch loop.`;
}

/**
 * Returns the onboarding note explaining when manual sync is optional.
 */
export function getOptionalOnboardingNote(
	packageManager: PackageManagerId,
	templateId = "basic",
	options: SyncOnboardingOptions = {},
): string {
	const optionalSyncScripts = getOptionalSyncScriptNames(templateId, options);
	const hasUnifiedSync = optionalSyncScripts.includes("sync");
	const syncSteps = optionalSyncScripts.map((scriptName) =>
		formatRunScript(packageManager, scriptName),
	);
	const developmentScript = getPrimaryDevelopmentScript(templateId);
	const syncCommand = formatRunScript(
		packageManager,
		hasUnifiedSync ? "sync" : "sync-types",
	);
	const syncCheckCommand = formatRunScript(
		packageManager,
		hasUnifiedSync ? "sync" : "sync-types",
		"--check",
	);
	const failOnLossySyncCommand = formatRunScript(
		packageManager,
		"sync-types",
		"--fail-on-lossy",
	);
	const syncTypesCommand = formatRunScript(packageManager, "sync-types");
	const syncRestCommand = formatRunScript(packageManager, "sync-rest");
	const typecheckCommand = formatRunScript(packageManager, "typecheck");
	const strictSyncCommand = formatRunScript(
		packageManager,
		"sync-types",
		"--strict --report json",
	);
	const advancedPersistenceNote = templateHasPersistenceSync(templateId, options)
		? ` ${syncRestCommand} remains available for advanced REST-only refreshes, but it now fails fast when type-derived artifacts are stale; run \`${syncCommand}\` or \`${syncTypesCommand}\` first.`
		: "";
	const fallbackCustomTemplateNote =
		!hasUnifiedSync &&
		syncSteps.length > 0 &&
		!isBuiltInTemplateId(templateId) &&
		templateId !== OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
			? `Run ${syncSteps.join(" then ")} manually before build, typecheck, or commit. ${syncCheckCommand} verifies the current type-derived artifacts without rewriting them.${optionalSyncScripts.includes("sync-rest") ? ` ${syncRestCommand} remains available for REST-only refreshes after ${syncTypesCommand}.` : ""}`
			: null;

	if (fallbackCustomTemplateNote) {
		return fallbackCustomTemplateNote;
	}

	return `You usually do not need to run ${syncCommand} during a normal ${formatRunScript(packageManager, developmentScript)} session. Run ${syncCommand} manually when you want a reviewable artifact refresh before ${formatRunScript(packageManager, "build")}, ${typecheckCommand}, or your first commit. ${syncTypesCommand} stays warn-only by default; use \`${failOnLossySyncCommand}\` to fail only on lossy WordPress projections, or \`${strictSyncCommand}\` for the stricter CI-oriented report.${advancedPersistenceNote} They do not create migration history. If this directory is new, create your first Git commit after that refresh.`;
}

/**
 * Returns the recommended version-control commands for a fresh scaffold.
 */
export function getInitialCommitCommands(): string[] {
	return [...INITIAL_COMMIT_COMMANDS];
}

/**
 * Returns the version-control note shown after the initial scaffold.
 */
export function getInitialCommitNote(): string {
	return "Skip `git init` if this directory already lives inside an existing repository. If you want generated artifacts refreshed before the first checkpoint, run your manual sync step first and then create the commit.";
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
			return `${compoundBase} For persistence-enabled parents, \`src/blocks/*/api-types.ts\` files remain the source of truth for \`src/blocks/*/api-schemas/*\` when you run \`sync\` or \`sync-rest\`, while \`src/blocks/*/transport.ts\` is the first-class transport seam for editor and frontend requests.`;
		}

		return compoundBase;
	}

	if (templateId === "persistence") {
		return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`. Fresh scaffolds include a starter `typia.manifest.json` so editor imports resolve before the first sync. `src/api-types.ts` remains the source of truth for `src/api-schemas/*` when you run `sync` or `sync-rest`, while `src/transport.ts` is the first-class transport seam for editor and frontend requests. This scaffold is intentionally server-rendered: `src/render.php` is the canonical frontend entry, `src/save.tsx` returns `null`, and session-only write data now refreshes through the dedicated `/bootstrap` endpoint after hydration instead of being frozen into markup.";
	}

	return "`src/types.ts` remains the source of truth for `block.json`, `typia.manifest.json`, and `typia-validator.php`. Fresh scaffolds include a starter `typia.manifest.json` so editor imports resolve before the first sync. The basic scaffold stays static by design: `src/render.php` is only an opt-in server placeholder, `src/save.tsx` remains the canonical frontend output, and the generated webpack config keeps the current `@wordpress/scripts` CommonJS baseline unless you intentionally add `render` to `block.json`.";
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
	transportPath,
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
		`- Edit \`${transportPath}\` when you need to switch between direct WordPress REST and a contract-compatible proxy or BFF without changing the endpoint contracts.`,
		`- Keep \`${apiTypesPath}\` as the source of truth for request and response contracts, then regenerate \`${schemaJsonGlob}\`, per-contract \`${perContractOpenApiGlob}\`, and \`${aggregateOpenApiPath}\` with \`sync\` (or \`sync-rest\` after \`sync-types\` when you only need the REST layer).`,
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
			transportPath: "src/transport.ts",
			extraNote: "Keep durable state on the `/state` endpoints and treat the dedicated `/bootstrap` endpoint as the place to return fresh session-only write access data such as nonces or public write tokens.",
		});
	}

	if (templateId === "compound" && compoundPersistenceEnabled) {
		return formatPhpRestExtensionPointsSection({
			apiTypesPath: `src/blocks/${slug}/api-types.ts`,
			extraNote: "The hidden child block does not own REST routes or storage. Keep durable parent-block state on the `/state` endpoints and return fresh session-only write access data from the dedicated `/bootstrap` endpoint.",
			mainPhpPath: `${slug}.php`,
			mainPhpScope:
				"change parent-block storage helpers, route handlers, response shaping, or route registration",
			transportPath: `src/blocks/${slug}/transport.ts`,
		});
	}

	return null;
}
