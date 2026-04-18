import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import {
	PACKAGE_MANAGER_IDS,
	getPackageManager,
} from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	buildGitignore,
	buildReadme,
	mergeTextLines,
	replaceTextRecursively,
} from "./scaffold-apply-utils.js";
import {
	buildBlockCssClassName,
	buildFrontendCssClassName,
	normalizeBlockSlug,
	resolveScaffoldIdentifiers,
	validateBlockSlug,
	validateNamespace,
} from "./scaffold-identifiers.js";
import {
	applyGeneratedProjectDxPackageJson,
	applyLocalDevPresetFiles,
} from "./local-dev-presets.js";
import { applyMigrationUiCapability } from "./migration-ui-capability.js";
import { getPackageVersions } from "./package-versions.js";
import {
	applyWorkspaceMigrationCapability,
	ensureScaffoldDirectory,
	isOfficialWorkspaceProject,
	seedBuiltInPersistenceArtifacts,
	writeStarterManifestFiles,
} from "./scaffold-bootstrap.js";
import {
	defaultInstallDependencies,
	normalizePackageJson,
	normalizePackageManagerFiles,
	removeUnexpectedLockfiles,
} from "./scaffold-package-manager-files.js";
import {
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
	TEMPLATE_IDS,
	getTemplateById,
	isBuiltInTemplateId,
} from "./template-registry.js";
import { resolveTemplateSource } from "./template-source.js";
import {
	BlockGeneratorService,
	buildTemplateVariablesFromBlockSpec,
	createBuiltInBlockSpec,
} from "./block-generator-service.js";

const WORKSPACE_TEMPLATE_ALIAS = "workspace";

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
	externalLayerId?: string;
	externalLayerSource?: string;
	externalLayerSourceLabel?: string;
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
	noInstall?: boolean;
	packageManager: PackageManagerId;
	persistencePolicy?: PersistencePolicy;
	projectDir: string;
	repositoryReference?: string;
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
export { buildBlockCssClassName } from "./scaffold-identifiers.js";

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
		return "npm";
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

export async function scaffoldProject({
	projectDir,
	templateId,
	answers,
	dataStorageMode,
	persistencePolicy,
	packageManager,
	externalLayerId,
	externalLayerSource,
	externalLayerSourceLabel,
	repositoryReference,
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

	if (externalLayerId && !externalLayerSource) {
		throw new Error(
			"externalLayerId requires externalLayerSource when composing built-in template layers.",
		);
	}

	if (isBuiltInTemplate) {
		const blockGeneratorService = new BlockGeneratorService();
		const plan = await blockGeneratorService.plan({
			allowExistingDir,
			answers,
			cwd,
			dataStorageMode: dataStorageMode ?? answers.dataStorageMode,
			externalLayerId,
			externalLayerSource,
			externalLayerSourceLabel,
			noInstall,
			packageManager: resolvedPackageManager,
			persistencePolicy: persistencePolicy ?? answers.persistencePolicy,
			projectDir,
			repositoryReference,
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

	if (externalLayerSource || externalLayerId) {
		throw new Error(
			"External template layers currently compose only with built-in templates via `wp-typia create --template <basic|interactivity|persistence|compound>` or `wp-typia add block --template <family>`.",
		);
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
		await ensureScaffoldDirectory(projectDir, allowExistingDir);
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
	await replaceTextRecursively(projectDir, resolvedPackageManager, {
		repositoryReference,
	});

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
