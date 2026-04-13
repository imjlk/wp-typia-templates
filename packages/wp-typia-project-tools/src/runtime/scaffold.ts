import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import {
	PACKAGE_MANAGER_IDS,
	formatPackageExecCommand,
	formatInstallCommand,
	formatRunScript,
	getPackageManager,
	transformPackageManagerText,
} from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	applyGeneratedProjectDxPackageJson,
	applyLocalDevPresetFiles,
	getPrimaryDevelopmentScript,
} from "./local-dev-presets.js";
import { applyMigrationUiCapability } from "./migration-ui-capability.js";
import { getPackageVersions } from "./package-versions.js";
import {
	ensureMigrationDirectories,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import { syncPersistenceRestArtifacts } from "./persistence-rest-artifacts.js";
import {
	getCompoundExtensionWorkflowSection,
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
	getPhpRestExtensionPointsSection,
	getTemplateSourceOfTruthNote,
} from "./scaffold-onboarding.js";
import { getStarterManifestFiles, stringifyStarterManifest } from "./starter-manifests.js";
import {
	toKebabCase,
	toPascalCase,
	toSnakeCase,
	toTitleCase,
} from "./string-case.js";
import {
	BUILTIN_BLOCK_METADATA_VERSION,
	COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS,
	getBuiltInTemplateMetadataDefaults,
	getRemovedBuiltInTemplateMessage,
	isRemovedBuiltInTemplateId,
} from "./template-defaults.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	PROJECT_TOOLS_PACKAGE_ROOT,
	TEMPLATE_IDS,
	getTemplateById,
	isBuiltInTemplateId,
} from "./template-registry.js";
import type { BuiltInTemplateId } from "./template-registry.js";
import { resolveTemplateSource } from "./template-source.js";
import {
	BlockGeneratorService,
	buildTemplateVariablesFromBlockSpec,
	createBuiltInBlockSpec,
} from "./block-generator-service.js";

const BLOCK_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const PHP_PREFIX_PATTERN = /^[a-z_][a-z0-9_]*$/;
const PHP_PREFIX_MAX_LENGTH = 50;
const WORKSPACE_TEMPLATE_ALIAS = "workspace";
const EPHEMERAL_NODE_MODULES_LINK_TYPE = process.platform === "win32" ? "junction" : "dir";
const LOCKFILES: Record<PackageManagerId, string[]> = {
	bun: ["bun.lock", "bun.lockb"],
	npm: ["package-lock.json"],
	pnpm: ["pnpm-lock.yaml"],
	yarn: ["yarn.lock"],
};

/**
 * User-facing scaffold answers before template rendering.
 *
 * `namespace`, `textDomain`, and `phpPrefix` are normalized before use so
 * callers can pass human-entered values while generated output stays
 * predictable.
 */
export interface ScaffoldAnswers {
	author: string;
	dataStorageMode?: DataStorageMode;
	description: string;
	/** Block namespace used in generated block names such as `namespace/slug`. */
	namespace: string;
	persistencePolicy?: PersistencePolicy;
	/** Snake_case PHP symbol prefix used for generated functions, constants, and keys. */
	phpPrefix?: string;
	slug: string;
	/** Kebab-case WordPress text domain used in block metadata and i18n strings. */
	textDomain?: string;
	title: string;
}

export const DATA_STORAGE_MODES = ["post-meta", "custom-table"] as const;
export type DataStorageMode = (typeof DATA_STORAGE_MODES)[number];
export const PERSISTENCE_POLICIES = ["authenticated", "public"] as const;
export type PersistencePolicy = (typeof PERSISTENCE_POLICIES)[number];

/**
 * Normalized template variables shared by built-in and remote scaffold flows.
 */
export interface ScaffoldTemplateVariables extends Record<string, string> {
	apiClientPackageVersion: string;
	author: string;
	blockRuntimePackageVersion: string;
	blockMetadataVersion: string;
	blockTypesPackageVersion: string;
	category: string;
	icon: string;
	compoundChildTitle: string;
	compoundChildCategory: string;
	compoundChildCssClassName: string;
	compoundChildIcon: string;
	compoundChildTitleJson: string;
	compoundPersistenceEnabled: "false" | "true";
	projectToolsPackageVersion: string;
	cssClassName: string;
	dashCase: string;
	dataStorageMode: DataStorageMode;
	description: string;
	frontendCssClassName: string;
	keyword: string;
	namespace: string;
	needsMigration: string;
	pascalCase: string;
	phpPrefix: string;
	phpPrefixUpper: string;
	isAuthenticatedPersistencePolicy: "false" | "true";
	isPublicPersistencePolicy: "false" | "true";
	bootstrapCredentialDeclarations: string;
	persistencePolicyDescriptionJson: string;
	publicWriteRequestIdDeclaration: string;
	restPackageVersion: string;
	restWriteAuthIntent: "authenticated" | "public-write-protected";
	restWriteAuthMechanism: "public-signed-token" | "rest-nonce";
	restWriteAuthMode: "authenticated-rest-nonce" | "public-signed-token";
	slug: string;
	slugCamelCase: string;
	slugKebabCase: string;
	slugSnakeCase: string;
	textDomain: string;
	textdomain: string;
	title: string;
	titleJson: string;
	titleCase: string;
	persistencePolicy: PersistencePolicy;
}

/**
 * Resolve scaffold template input from either built-in template ids or custom
 * template identifiers such as local paths, GitHub refs, and npm packages.
 *
 * The callback returns `Promise<string>` on purpose so interactive selection
 * can surface custom ids. Downstream code uses `isBuiltInTemplateId()` to
 * distinguish built-in templates from custom sources.
 */
interface ResolveTemplateOptions {
	isInteractive?: boolean;
	selectTemplate?: () => Promise<string>;
	templateId?: string;
	yes?: boolean;
}

interface ResolvePackageManagerOptions {
	isInteractive?: boolean;
	packageManager?: string;
	selectPackageManager?: () => Promise<PackageManagerId>;
	yes?: boolean;
}

interface CollectScaffoldAnswersOptions {
	dataStorageMode?: DataStorageMode;
	namespace?: string;
	phpPrefix?: string;
	projectName: string;
	promptText?: (
		message: string,
		defaultValue: string,
		validate?: (value: string) => true | string,
	) => Promise<string>;
	persistencePolicy?: PersistencePolicy;
	textDomain?: string;
	templateId: string;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	yes?: boolean;
}

interface InstallDependenciesOptions {
	packageManager: PackageManagerId;
	projectDir: string;
}

interface ScaffoldProjectOptions {
	allowExistingDir?: boolean;
	answers: ScaffoldAnswers;
	cwd?: string;
	dataStorageMode?: DataStorageMode;
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
	noInstall?: boolean;
	packageManager: PackageManagerId;
	persistencePolicy?: PersistencePolicy;
	projectDir: string;
	templateId: string;
	variant?: string;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
}

export interface ScaffoldProjectResult {
	packageManager: PackageManagerId;
	projectDir: string;
	selectedVariant: string | null;
	templateId: string;
	variables: ScaffoldTemplateVariables;
	warnings: string[];
}

interface GeneratedPackageJson {
	dependencies?: Record<string, string>;
	scripts?: Record<string, string>;
	wpTypia?: {
		projectType?: string;
		templatePackage?: string;
	};
}

function validateBlockSlug(input: string): true | string {
	return BLOCK_SLUG_PATTERN.test(input) || "Use lowercase letters, numbers, and hyphens only";
}

function validateNamespace(input: string): true | string {
	return BLOCK_SLUG_PATTERN.test(toKebabCase(input))
		? true
		: "Use lowercase letters, numbers, and hyphens only";
}

function validateTextDomain(input: string): true | string {
	return BLOCK_SLUG_PATTERN.test(toKebabCase(input))
		? true
		: "Use lowercase letters, numbers, and hyphens only";
}

function validatePhpPrefix(input: string): true | string {
	const normalizedPrefix = toSnakeCase(input);
	if (normalizedPrefix.length > PHP_PREFIX_MAX_LENGTH) {
		return `Use ${PHP_PREFIX_MAX_LENGTH} characters or fewer to keep generated database identifiers within MySQL limits`;
	}

	return PHP_PREFIX_PATTERN.test(normalizedPrefix)
		? true
		: "Use letters, numbers, and underscores only, starting with a letter";
}

function assertValidIdentifier(
	label: string,
	value: string,
	validate: (value: string) => true | string,
): string {
	const result = validate(value);
	if (result !== true) {
		throw new Error(typeof result === "string" ? `${label}: ${result}` : `${label} is invalid`);
	}

	return value;
}

function normalizeBlockSlug(input: string): string {
	return toKebabCase(input);
}

function resolveValidatedBlockSlug(value: string): string {
	return assertValidIdentifier("Block slug", normalizeBlockSlug(value), validateBlockSlug);
}

function resolveValidatedNamespace(value: string): string {
	return assertValidIdentifier("Namespace", toKebabCase(value), validateNamespace);
}

function resolveValidatedTextDomain(value: string): string {
	return assertValidIdentifier("Text domain", toKebabCase(value), validateTextDomain);
}

function resolveValidatedPhpPrefix(value: string): string {
	return assertValidIdentifier("PHP prefix", toSnakeCase(value), validatePhpPrefix);
}

/**
 * Builds the generated WordPress wrapper CSS class for a scaffolded block.
 *
 * Returns `wp-block-{namespace}-{slug}` when a non-empty namespace is present,
 * or `wp-block-{slug}` when the namespace is empty or undefined. When the
 * normalized namespace equals the normalized slug, appends `-block` so the
 * generated class avoids repeated namespace segments without colliding with the
 * default core wrapper classes. Both inputs are normalized and validated with
 * the same scaffold identifier rules used for block names.
 */
export function buildBlockCssClassName(
	namespace: string | undefined,
	slug: string,
): string {
	const normalizedSlug = resolveValidatedBlockSlug(slug);
	const normalizedNamespace =
		typeof namespace === "string" && namespace.trim().length > 0
			? resolveValidatedNamespace(namespace)
			: "";

	if (normalizedNamespace === normalizedSlug) {
		return `wp-block-${normalizedSlug}-block`;
	}

	return normalizedNamespace.length > 0
		? `wp-block-${normalizedNamespace}-${normalizedSlug}`
		: `wp-block-${normalizedSlug}`;
}

function buildFrontendCssClassName(blockCssClassName: string): string {
	return `${blockCssClassName}-frontend`;
}

function resolveScaffoldIdentifiers({
	namespace,
	phpPrefix,
	slug,
	textDomain,
}: {
	namespace: string;
	phpPrefix?: string;
	slug: string;
	textDomain?: string;
}): {
	namespace: string;
	phpPrefix: string;
	slug: string;
	textDomain: string;
} {
	const normalizedSlug = resolveValidatedBlockSlug(slug);

	return {
		namespace: resolveValidatedNamespace(namespace),
		phpPrefix: resolveValidatedPhpPrefix(phpPrefix ?? normalizedSlug),
		slug: normalizedSlug,
		textDomain: resolveValidatedTextDomain(textDomain ?? normalizedSlug),
	};
}

export function isDataStorageMode(value: string): value is DataStorageMode {
	return (DATA_STORAGE_MODES as readonly string[]).includes(value);
}

export function isPersistencePolicy(value: string): value is PersistencePolicy {
	return (PERSISTENCE_POLICIES as readonly string[]).includes(value);
}

export function detectAuthor(): string {
	try {
		return (
			execSync("git config user.name", {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			}).trim() || "Your Name"
		);
	} catch {
		return "Your Name";
	}
}

export function getDefaultAnswers(
	projectName: string,
	templateId: string,
): ScaffoldAnswers {
	const template = isBuiltInTemplateId(templateId) ? getTemplateById(templateId) : null;
	const slugDefault = normalizeBlockSlug(projectName) || "my-wp-typia-block";
	return {
		author: detectAuthor(),
		dataStorageMode: templateId === "persistence" ? "custom-table" : undefined,
		description: template?.description ?? "A WordPress block scaffolded from a remote template",
		namespace: slugDefault,
		persistencePolicy: templateId === "persistence" ? "authenticated" : undefined,
		phpPrefix: toSnakeCase(slugDefault),
		slug: slugDefault,
		textDomain: slugDefault,
		title: toTitleCase(slugDefault),
	};
}

function normalizeTemplateSelection(templateId: string): string {
	return templateId === WORKSPACE_TEMPLATE_ALIAS
		? OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
		: templateId;
}

export async function resolveTemplateId({
	templateId,
	yes = false,
	isInteractive = false,
	selectTemplate,
}: ResolveTemplateOptions): Promise<string> {
	if (templateId) {
		const normalizedTemplateId = normalizeTemplateSelection(templateId);
		if (isRemovedBuiltInTemplateId(templateId)) {
			throw new Error(getRemovedBuiltInTemplateMessage(templateId));
		}
		if (isBuiltInTemplateId(normalizedTemplateId)) {
			return getTemplateById(normalizedTemplateId).id;
		}
		return normalizedTemplateId;
	}

	if (yes) {
		return "basic";
	}

	if (!isInteractive || !selectTemplate) {
		throw new Error(
			`Template is required in non-interactive mode. Use --template <${TEMPLATE_IDS.join("|")}|./path|github:owner/repo/path[#ref]|npm-package>.`,
		);
	}

	return normalizeTemplateSelection(await selectTemplate());
}

export async function resolvePackageManagerId({
	packageManager,
	yes = false,
	isInteractive = false,
	selectPackageManager,
}: ResolvePackageManagerOptions): Promise<PackageManagerId> {
	if (packageManager) {
		return getPackageManager(packageManager).id;
	}

	if (yes) {
		throw new Error(
			`Package manager is required when using --yes. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
		);
	}

	if (!isInteractive || !selectPackageManager) {
		throw new Error(
			`Package manager is required in non-interactive mode. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
		);
	}

	return selectPackageManager();
}

export async function collectScaffoldAnswers({
	projectName,
	templateId,
	yes = false,
	dataStorageMode,
	namespace,
	persistencePolicy,
	phpPrefix,
	promptText,
	textDomain,
}: CollectScaffoldAnswersOptions): Promise<ScaffoldAnswers> {
	const defaults = getDefaultAnswers(projectName, templateId);

	if (yes) {
		const identifiers = resolveScaffoldIdentifiers({
			namespace: namespace ?? defaults.namespace,
			phpPrefix,
			slug: defaults.slug,
			textDomain,
		});
		return {
			...defaults,
			dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
			namespace: identifiers.namespace,
			persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
			phpPrefix: identifiers.phpPrefix,
			textDomain: identifiers.textDomain,
		};
	}

	if (!promptText) {
		throw new Error("Interactive answers require a promptText callback.");
	}

	const identifiers = resolveScaffoldIdentifiers({
		namespace:
			namespace ?? (await promptText("Namespace", defaults.namespace, validateNamespace)),
		phpPrefix,
		slug: await promptText("Block slug", defaults.slug, validateBlockSlug),
		textDomain,
	});

	return {
		author: await promptText("Author", defaults.author),
		dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
		description: await promptText("Description", defaults.description),
		namespace: identifiers.namespace,
		persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
		phpPrefix: identifiers.phpPrefix,
		slug: identifiers.slug,
		textDomain: identifiers.textDomain,
		title: await promptText("Block title", toTitleCase(identifiers.slug)),
	};
}

export function getTemplateVariables(
	templateId: string,
	answers: ScaffoldAnswers,
): ScaffoldTemplateVariables {
	if (isBuiltInTemplateId(templateId)) {
		return buildTemplateVariablesFromBlockSpec(
			createBuiltInBlockSpec({
				answers,
				dataStorageMode: answers.dataStorageMode,
				persistencePolicy: answers.persistencePolicy,
				templateId,
			}),
		);
	}

	const {
		apiClientPackageVersion,
		blockRuntimePackageVersion,
		blockTypesPackageVersion,
		projectToolsPackageVersion,
		restPackageVersion,
	} = getPackageVersions();
	const template = isBuiltInTemplateId(templateId) ? getTemplateById(templateId) : null;
	const metadataDefaults = isBuiltInTemplateId(templateId)
		? getBuiltInTemplateMetadataDefaults(templateId)
		: null;
	const identifiers = resolveScaffoldIdentifiers({
		namespace: answers.namespace,
		phpPrefix: answers.phpPrefix,
		slug: answers.slug,
		textDomain: answers.textDomain,
	});
	const slug = identifiers.slug;
	const slugSnakeCase = toSnakeCase(slug);
	const pascalCase = toPascalCase(slug);
	const title = answers.title.trim();
	const namespace = identifiers.namespace;
	const description = answers.description.trim();
	const textDomain = identifiers.textDomain;
	const phpPrefix = identifiers.phpPrefix;
	const phpPrefixUpper = phpPrefix.toUpperCase();
	const compoundChildTitle = `${title} Item`;
	const cssClassName = buildBlockCssClassName(namespace, slug);
	const compoundChildCssClassName = buildBlockCssClassName(namespace, `${slug}-item`);
	const compoundPersistenceEnabled =
		templateId === "persistence"
			? true
			: templateId === "compound"
				? Boolean(answers.dataStorageMode || answers.persistencePolicy)
				: false;
	const dataStorageMode =
		templateId === "persistence" || compoundPersistenceEnabled
			? answers.dataStorageMode ?? "custom-table"
			: "custom-table";
	const persistencePolicy =
		templateId === "persistence" || compoundPersistenceEnabled
			? answers.persistencePolicy ?? "authenticated"
			: "authenticated";

	return {
		apiClientPackageVersion,
		author: answers.author.trim(),
		blockRuntimePackageVersion,
		blockMetadataVersion: BUILTIN_BLOCK_METADATA_VERSION,
		blockTypesPackageVersion,
		category: metadataDefaults?.category ?? template?.defaultCategory ?? "widgets",
		icon: metadataDefaults?.icon ?? "smiley",
		compoundChildTitle,
		compoundChildCategory: COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS.category,
		compoundChildCssClassName,
		compoundChildIcon: COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS.icon,
		compoundChildTitleJson: JSON.stringify(compoundChildTitle),
		compoundPersistenceEnabled: compoundPersistenceEnabled ? "true" : "false",
		projectToolsPackageVersion,
		cssClassName,
		dataStorageMode,
		dashCase: slug,
		description,
		frontendCssClassName: buildFrontendCssClassName(cssClassName),
		isAuthenticatedPersistencePolicy:
			persistencePolicy === "authenticated" ? "true" : "false",
		isPublicPersistencePolicy: persistencePolicy === "public" ? "true" : "false",
		bootstrapCredentialDeclarations:
			persistencePolicy === "public"
				? "publicWriteExpiresAt?: number & tags.Type< 'uint32' >;\n\tpublicWriteToken?: string & tags.MinLength< 1 > & tags.MaxLength< 512 >;"
				: "restNonce?: string & tags.MinLength< 1 > & tags.MaxLength< 128 >;",
		persistencePolicyDescriptionJson: JSON.stringify(
			persistencePolicy === "authenticated"
				? "Writes require a logged-in user and a valid REST nonce."
				: "Anonymous writes use signed short-lived public tokens, per-request ids, and coarse rate limiting.",
		),
		keyword: slug.replace(/-/g, " "),
		namespace,
		needsMigration: "{{needsMigration}}",
		pascalCase,
		phpPrefix,
		phpPrefixUpper,
		restPackageVersion,
		publicWriteRequestIdDeclaration:
			persistencePolicy === "public"
				? "publicWriteRequestId: string & tags.MinLength< 1 > & tags.MaxLength< 128 >;"
				: "publicWriteRequestId?: string & tags.MinLength< 1 > & tags.MaxLength< 128 >;",
		restWriteAuthIntent:
			persistencePolicy === "public"
				? "public-write-protected"
				: "authenticated",
		restWriteAuthMechanism:
			persistencePolicy === "public" ? "public-signed-token" : "rest-nonce",
		restWriteAuthMode:
			persistencePolicy === "public" ? "public-signed-token" : "authenticated-rest-nonce",
		slug,
		slugCamelCase: pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1),
		slugKebabCase: slug,
		slugSnakeCase,
		textDomain,
		textdomain: textDomain,
		title,
		titleJson: JSON.stringify(title),
		titleCase: pascalCase,
		persistencePolicy,
	};
}

async function ensureDirectory(targetDir: string, allowExisting = false): Promise<void> {
	if (!fs.existsSync(targetDir)) {
		await fsp.mkdir(targetDir, { recursive: true });
		return;
	}

	if (allowExisting) {
		return;
	}

	const entries = await fsp.readdir(targetDir);
	if (entries.length > 0) {
		throw new Error(`Target directory is not empty: ${targetDir}`);
	}
}

function buildReadme(
	templateId: string,
	variables: ScaffoldTemplateVariables,
	packageManager: PackageManagerId,
	{
		withMigrationUi = false,
		withTestPreset = false,
		withWpEnv = false,
	}: {
		withMigrationUi?: boolean;
		withTestPreset?: boolean;
		withWpEnv?: boolean;
	} = {},
): string {
	const optionalOnboardingSteps = getOptionalOnboardingSteps(packageManager, templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});
	const sourceOfTruthNote = getTemplateSourceOfTruthNote(templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});
	const compoundPersistenceEnabled = variables.compoundPersistenceEnabled === "true";
	const publicPersistencePolicyNote =
		variables.isPublicPersistencePolicy === "true"
			? "Public persistence writes use signed short-lived tokens, per-request ids, and coarse rate limiting by default. Add application-specific abuse controls before using the same pattern for high-value metrics or experiments."
			: null;
	const compoundExtensionWorkflowSection = getCompoundExtensionWorkflowSection(
		packageManager,
		templateId,
	);
	const phpRestExtensionPointsSection = getPhpRestExtensionPointsSection(templateId, {
		compoundPersistenceEnabled,
		slug: variables.slug,
	});
	const developmentScript = getPrimaryDevelopmentScript(templateId);
	const wpEnvSection = withWpEnv
		? `## Local WordPress\n\n\`\`\`bash\n${formatRunScript(packageManager, "wp-env:start")}\n${formatRunScript(packageManager, "wp-env:stop")}\n${formatRunScript(packageManager, "wp-env:reset")}\n\`\`\``
		: "";
	const testPresetSection = withTestPreset
		? `## Local Test Preset\n\n\`\`\`bash\n${formatRunScript(packageManager, "wp-env:start:test")}\n${formatRunScript(packageManager, "wp-env:wait:test")}\n${formatRunScript(packageManager, "test:e2e")}\n\`\`\`\n\nThe generated smoke test uses \`.wp-env.test.json\` and verifies that the scaffolded block registers in the WordPress editor.`
		: "";
	const migrationSection = withMigrationUi
		? `## Migration UI\n\nThis scaffold already includes an initialized migration workspace at \`v1\`, generated deprecated/runtime artifacts, and an editor-embedded migration dashboard. Migration versions are schema lineage labels and are separate from your package or plugin release version. Use the existing CLI commands to snapshot, diff, scaffold, verify, and fuzz future schema changes.\n\n\`\`\`bash\n${formatRunScript(packageManager, "migration:doctor")}\n${formatRunScript(packageManager, "migration:verify")}\n${formatRunScript(packageManager, "migration:fuzz")}\n\`\`\`\n\nRun \`migration:init\` only when retrofitting migration support into an older project that was not scaffolded with \`--with-migration-ui\`.`
		: "";

	return `# ${variables.title}

${variables.description}

## Template

${templateId}

## Development

\`\`\`bash
${formatInstallCommand(packageManager)}
${formatRunScript(packageManager, developmentScript)}
\`\`\`

## Build

\`\`\`bash
${formatRunScript(packageManager, "build")}
\`\`\`

## Optional First Sync

\`\`\`bash
${optionalOnboardingSteps.join("\n")}
\`\`\`

${getOptionalOnboardingNote(packageManager, templateId, {
		compoundPersistenceEnabled,
	})}

${sourceOfTruthNote}${publicPersistencePolicyNote ? `\n\n${publicPersistencePolicyNote}` : ""}${migrationSection ? `\n\n${migrationSection}` : ""}${compoundExtensionWorkflowSection ? `\n\n${compoundExtensionWorkflowSection}` : ""}${wpEnvSection ? `\n\n${wpEnvSection}` : ""}${testPresetSection ? `\n\n${testPresetSection}` : ""}${phpRestExtensionPointsSection ? `\n\n${phpRestExtensionPointsSection}` : ""}
`;
}

function buildGitignore(): string {
	return `# Dependencies
node_modules/
.yarn/
.pnp.*

# Build
build/
dist/

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# WordPress
*.log
.wp-env/
`;
}

function mergeTextLines(primaryContent: string, existingContent: string): string {
	const normalizedPrimary = primaryContent.replace(/\r\n/g, "\n").trimEnd();
	const normalizedExisting = existingContent.replace(/\r\n/g, "\n").trimEnd();
	const mergedLines: string[] = [];
	const seen = new Set<string>();

	for (const line of [...normalizedPrimary.split("\n"), ...normalizedExisting.split("\n")]) {
		if (line.length === 0 && mergedLines[mergedLines.length - 1] === "") {
			continue;
		}
		if (line.length > 0 && seen.has(line)) {
			continue;
		}
		if (line.length > 0) {
			seen.add(line);
		}
		mergedLines.push(line);
	}

	return `${mergedLines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

async function writeStarterManifestFiles(
	targetDir: string,
	templateId: string,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const manifests = getStarterManifestFiles(templateId, variables);

	for (const { document, relativePath } of manifests) {
		const destinationPath = path.join(targetDir, relativePath);
		await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
		await fsp.writeFile(destinationPath, stringifyStarterManifest(document), "utf8");
	}
}

/**
 * Seed REST-derived persistence artifacts into a newly scaffolded built-in
 * project before the first manual `sync-rest` run.
 *
 * @param targetDir Absolute scaffold target directory.
 * @param templateId Built-in template id being scaffolded.
 * @param variables Resolved scaffold template variables for the project.
 * @returns A promise that resolves after any required persistence artifacts are generated.
 */
async function seedBuiltInPersistenceArtifacts(
	targetDir: string,
	templateId: BuiltInTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const needsPersistenceArtifacts =
		templateId === "persistence" ||
		(templateId === "compound" && variables.compoundPersistenceEnabled === "true");

	if (!needsPersistenceArtifacts) {
		return;
	}

	await withEphemeralScaffoldNodeModules(targetDir, async () => {
		if (templateId === "persistence") {
			await syncPersistenceRestArtifacts({
				apiTypesFile: path.join("src", "api-types.ts"),
				outputDir: "src",
				projectDir: targetDir,
				variables,
			});
			return;
		}

		await syncPersistenceRestArtifacts({
			apiTypesFile: path.join("src", "blocks", variables.slugKebabCase, "api-types.ts"),
			outputDir: path.join("src", "blocks", variables.slugKebabCase),
			projectDir: targetDir,
			variables,
		});
	});
}

/**
 * Locate a node_modules directory containing `typia` relative to the project
 * tools package root.
 *
 * Search order:
 * 1. `PROJECT_TOOLS_PACKAGE_ROOT/node_modules`
 * 2. The monorepo root resolved from `PROJECT_TOOLS_PACKAGE_ROOT`
 * 3. The monorepo root `node_modules`
 *
 * @returns The first matching path, or `null` when no candidate contains `typia`.
 */
function resolveScaffoldGeneratorNodeModulesPath(): string | null {
	const candidates = [
		path.join(PROJECT_TOOLS_PACKAGE_ROOT, "node_modules"),
		path.resolve(PROJECT_TOOLS_PACKAGE_ROOT, "..", ".."),
		path.resolve(PROJECT_TOOLS_PACKAGE_ROOT, "..", "..", "node_modules"),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(path.join(candidate, "typia", "package.json"))) {
			return candidate;
		}
	}

	return null;
}

/**
 * Temporarily symlink a scaffold generator node_modules directory into the
 * target project while running an async callback.
 *
 * The helper resolves the source path via `resolveScaffoldGeneratorNodeModulesPath()`
 * and uses `EPHEMERAL_NODE_MODULES_LINK_TYPE` for the symlink. The temporary
 * link is removed in the `finally` block so cleanup still happens if the
 * callback throws.
 *
 * @param targetDir Absolute scaffold target directory.
 * @param callback Async work that requires a resolvable `node_modules`.
 * @returns A promise that resolves after the callback and cleanup complete.
 */
async function withEphemeralScaffoldNodeModules(
	targetDir: string,
	callback: () => Promise<void>,
): Promise<void> {
	const targetNodeModulesPath = path.join(targetDir, "node_modules");
	if (fs.existsSync(targetNodeModulesPath)) {
		await callback();
		return;
	}

	const sourceNodeModulesPath = resolveScaffoldGeneratorNodeModulesPath();
	if (!sourceNodeModulesPath) {
		throw new Error(
			"Unable to resolve a node_modules directory with typia for scaffold-time REST artifact generation.",
		);
	}

	await fsp.symlink(sourceNodeModulesPath, targetNodeModulesPath, EPHEMERAL_NODE_MODULES_LINK_TYPE);

	try {
		await callback();
	} finally {
		await fsp.rm(targetNodeModulesPath, { force: true, recursive: true });
	}
}

async function normalizePackageManagerFiles(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const yarnRcPath = path.join(targetDir, ".yarnrc.yml");

	if (packageManagerId === "yarn") {
		await fsp.writeFile(yarnRcPath, "nodeLinker: node-modules\n", "utf8");
		return;
	}

	if (fs.existsSync(yarnRcPath)) {
		await fsp.rm(yarnRcPath, { force: true });
	}
}

async function normalizePackageJson(targetDir: string, packageManagerId: PackageManagerId): Promise<void> {
	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageManager = getPackageManager(packageManagerId);
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as {
		packageManager?: string;
		scripts?: Record<string, string>;
	};
	packageJson.packageManager = packageManager.packageManagerField;

	if (packageJson.scripts) {
		for (const [key, value] of Object.entries(packageJson.scripts)) {
			if (typeof value === "string") {
				packageJson.scripts[key] = transformPackageManagerText(value, packageManagerId);
			}
		}
	}

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

async function removeUnexpectedLockfiles(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const keep = new Set(LOCKFILES[packageManagerId] ?? []);
	const allLockfiles = Object.values(LOCKFILES).flat();

	await Promise.all(
		allLockfiles.map(async (filename) => {
			if (keep.has(filename)) {
				return;
			}

			const filePath = path.join(targetDir, filename);
			if (fs.existsSync(filePath)) {
				await fsp.rm(filePath, { force: true });
			}
		}),
	);
}

async function replaceTextRecursively(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const textExtensions = new Set([
		".css",
		".js",
		".json",
		".jsx",
		".md",
		".php",
		".scss",
		".ts",
		".tsx",
		".txt",
	]);

	async function visit(currentPath: string): Promise<void> {
		const stats = await fsp.stat(currentPath);
		if (stats.isDirectory()) {
			const entries = await fsp.readdir(currentPath);
			for (const entry of entries) {
				await visit(path.join(currentPath, entry));
			}
			return;
		}

		if (path.basename(currentPath) === "package.json" || !textExtensions.has(path.extname(currentPath))) {
			return;
		}

		const content = await fsp.readFile(currentPath, "utf8");
		const nextContent = transformPackageManagerText(content, packageManagerId)
			.replace(/yourusername\/wp-typia-boilerplate/g, "imjlk/wp-typia")
			.replace(/yourusername\/wp-typia/g, "imjlk/wp-typia");

		if (nextContent !== content) {
			await fsp.writeFile(currentPath, nextContent, "utf8");
		}
	}

	await visit(targetDir);
}

async function defaultInstallDependencies({
	projectDir,
	packageManager,
}: InstallDependenciesOptions): Promise<void> {
	execSync(formatInstallCommand(packageManager), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

function isOfficialWorkspaceProject(projectDir: string): boolean {
	const packageJsonPath = path.join(projectDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return false;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as GeneratedPackageJson;
	return (
		packageJson.wpTypia?.projectType === "workspace" &&
		packageJson.wpTypia?.templatePackage === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
	);
}

async function applyWorkspaceMigrationCapability(
	projectDir: string,
	packageManager: PackageManagerId,
): Promise<void> {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(
		await fsp.readFile(packageJsonPath, "utf8"),
	) as GeneratedPackageJson;
	const wpTypiaPackageVersion = getPackageVersions().wpTypiaPackageVersion;
	const canonicalCliSpecifier =
		wpTypiaPackageVersion === "^0.0.0"
			? "wp-typia"
			: `wp-typia@${wpTypiaPackageVersion.replace(/^[~^]/u, "")}`;
	const migrationCli = (args: string) =>
		formatPackageExecCommand(packageManager, canonicalCliSpecifier, `migrate ${args}`);

	packageJson.scripts = {
		...(packageJson.scripts ?? {}),
		"migration:init": migrationCli("init --current-migration-version v1"),
		"migration:snapshot": migrationCli("snapshot"),
		"migration:diff": migrationCli("diff"),
		"migration:scaffold": migrationCli("scaffold"),
		"migration:doctor": migrationCli("doctor --all"),
		"migration:fixtures": migrationCli("fixtures --all"),
		"migration:verify": migrationCli("verify --all"),
		"migration:fuzz": migrationCli("fuzz --all"),
	};

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");

	writeMigrationConfig(projectDir, {
		blocks: [],
		currentMigrationVersion: "v1",
		snapshotDir: "src/migrations/versions",
		supportedMigrationVersions: ["v1"],
	});
	ensureMigrationDirectories(projectDir, []);
	writeInitialMigrationScaffold(projectDir, "v1", []);
}

export async function scaffoldProject({
	projectDir,
	templateId,
	answers,
	dataStorageMode,
	persistencePolicy,
	packageManager,
	cwd = process.cwd(),
	allowExistingDir = false,
	noInstall = false,
	installDependencies = undefined,
	variant,
	withMigrationUi = false,
	withTestPreset = false,
	withWpEnv = false,
}: ScaffoldProjectOptions): Promise<ScaffoldProjectResult> {
	const resolvedTemplateId = normalizeTemplateSelection(templateId);
	const resolvedPackageManager = getPackageManager(packageManager).id;
	const isBuiltInTemplate = isBuiltInTemplateId(resolvedTemplateId);

	if (isBuiltInTemplate) {
		const blockGeneratorService = new BlockGeneratorService();
		const plan = await blockGeneratorService.plan({
			allowExistingDir,
			answers,
			cwd,
			dataStorageMode: dataStorageMode ?? answers.dataStorageMode,
			noInstall,
			packageManager: resolvedPackageManager,
			persistencePolicy: persistencePolicy ?? answers.persistencePolicy,
			projectDir,
			templateId: resolvedTemplateId,
			variant,
			withMigrationUi,
			withTestPreset,
			withWpEnv,
		});
		const validated = await blockGeneratorService.validate({ plan });
		const rendered = await blockGeneratorService.render({ validated });
		return blockGeneratorService.apply({
			installDependencies,
			rendered,
		});
	}

	const variables = getTemplateVariables(resolvedTemplateId, {
		...answers,
		dataStorageMode: dataStorageMode ?? answers.dataStorageMode,
		persistencePolicy: persistencePolicy ?? answers.persistencePolicy,
	});
	const templateSource = await resolveTemplateSource(
		resolvedTemplateId,
		cwd,
		variables,
		variant,
	);
	const supportsMigrationUi = isBuiltInTemplate || templateSource.isOfficialWorkspaceTemplate === true;
	if (withMigrationUi && !supportsMigrationUi) {
		await templateSource.cleanup?.();
		throw new Error(
			"`--with-migration-ui` is currently supported only for built-in templates and @wp-typia/create-workspace-template.",
		);
	}

	try {
		await ensureDirectory(projectDir, allowExistingDir);
		await copyInterpolatedDirectory(
			templateSource.templateDir,
			projectDir,
			variables,
		);
	} finally {
		if (templateSource.cleanup) {
			await templateSource.cleanup();
		}
	}
	const isOfficialWorkspace = isOfficialWorkspaceProject(projectDir);
	if (isBuiltInTemplate) {
		await writeStarterManifestFiles(projectDir, resolvedTemplateId, variables);
		await seedBuiltInPersistenceArtifacts(projectDir, resolvedTemplateId, variables);
		await applyLocalDevPresetFiles({
			projectDir,
			variables,
			withTestPreset,
			withWpEnv,
		});
		if (withMigrationUi) {
			await applyMigrationUiCapability({
				packageManager: resolvedPackageManager,
				projectDir,
				templateId: resolvedTemplateId,
				variables,
			});
		}
	} else if (withMigrationUi && isOfficialWorkspace) {
		await applyWorkspaceMigrationCapability(projectDir, resolvedPackageManager);
	}
	const readmePath = path.join(projectDir, "README.md");
	if (!fs.existsSync(readmePath)) {
		await fsp.writeFile(
			readmePath,
			buildReadme(resolvedTemplateId, variables, resolvedPackageManager, {
				withMigrationUi:
					isBuiltInTemplate || isOfficialWorkspace ? withMigrationUi : false,
				withTestPreset: isBuiltInTemplate ? withTestPreset : false,
				withWpEnv: isBuiltInTemplate ? withWpEnv : false,
			}),
			"utf8",
		);
	}
	const gitignorePath = path.join(projectDir, ".gitignore");
	const existingGitignore = fs.existsSync(gitignorePath)
		? await fsp.readFile(gitignorePath, "utf8")
		: "";
	await fsp.writeFile(
		gitignorePath,
		mergeTextLines(buildGitignore(), existingGitignore),
		"utf8",
	);
	await normalizePackageJson(projectDir, resolvedPackageManager);
	if (isBuiltInTemplate) {
		await applyGeneratedProjectDxPackageJson({
			compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
			packageManager: resolvedPackageManager,
			projectDir,
			templateId: resolvedTemplateId,
			withTestPreset,
			withWpEnv,
		});
	}
	await normalizePackageManagerFiles(projectDir, resolvedPackageManager);
	await removeUnexpectedLockfiles(projectDir, resolvedPackageManager);
	await replaceTextRecursively(projectDir, resolvedPackageManager);

	if (!noInstall) {
		const installer = installDependencies ?? defaultInstallDependencies;
		await installer({
			projectDir,
			packageManager: resolvedPackageManager,
		});
	}

	return {
		projectDir,
		selectedVariant: templateSource.selectedVariant ?? null,
		templateId: resolvedTemplateId,
		packageManager: resolvedPackageManager,
		variables,
		warnings: templateSource.warnings ?? [],
	};
}
