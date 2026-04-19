import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";

import { getPackageManager } from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	buildGitignore,
	buildReadme,
	mergeTextLines,
	replaceTextRecursively,
} from "./scaffold-apply-utils.js";
import {
	applyGeneratedProjectDxPackageJson,
	applyLocalDevPresetFiles,
} from "./local-dev-presets.js";
import { applyMigrationUiCapability } from "./migration-ui-capability.js";
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
import { copyInterpolatedDirectory } from "./template-render.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	isBuiltInTemplateId,
} from "./template-registry.js";
import { resolveTemplateSource } from "./template-source.js";
import {
	BlockGeneratorService,
} from "./block-generator-service.js";
import {
	collectScaffoldAnswers,
	detectAuthor,
	getDefaultAnswers,
	resolvePackageManagerId,
	resolveTemplateId,
} from "./scaffold-answer-resolution.js";
import { getTemplateVariables } from "./scaffold-template-variables.js";

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
export interface ResolveTemplateOptions {
	isInteractive?: boolean;
	selectTemplate?: () => Promise<string>;
	templateId?: string;
	yes?: boolean;
}

export interface ResolvePackageManagerOptions {
	isInteractive?: boolean;
	packageManager?: string;
	selectPackageManager?: () => Promise<PackageManagerId>;
	yes?: boolean;
}

export interface CollectScaffoldAnswersOptions {
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
export {
	collectScaffoldAnswers,
	detectAuthor,
	getDefaultAnswers,
	resolvePackageManagerId,
	resolveTemplateId,
} from "./scaffold-answer-resolution.js";
export { getTemplateVariables } from "./scaffold-template-variables.js";

export function isDataStorageMode(value: string): value is DataStorageMode {
	return (DATA_STORAGE_MODES as readonly string[]).includes(value);
}

export function isPersistencePolicy(value: string): value is PersistencePolicy {
	return (PERSISTENCE_POLICIES as readonly string[]).includes(value);
}

function normalizeTemplateSelection(templateId: string): string {
	return templateId === WORKSPACE_TEMPLATE_ALIAS
		? OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
		: templateId;
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
