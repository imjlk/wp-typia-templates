import { getPackageVersions } from "./package-versions.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	BUILTIN_BLOCK_METADATA_VERSION,
	COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS,
	getBuiltInTemplateMetadataDefaults,
} from "./template-defaults.js";
import {
	getTemplateById,
	type BuiltInTemplateId,
} from "./template-registry.js";
import { resolveBuiltInTemplateSource } from "./template-builtins.js";
import {
	toPascalCase,
	toSnakeCase,
} from "./string-case.js";
import {
	applyBuiltInScaffoldProjectFiles,
	buildGitignore,
	buildReadme,
	type InstallDependenciesOptions,
} from "./scaffold-apply-utils.js";
import {
	buildBlockCssClassName,
	buildFrontendCssClassName,
	resolveScaffoldIdentifiers,
} from "./scaffold-identifiers.js";
import {
	buildBuiltInBlockArtifacts,
	type BuiltInBlockArtifact,
} from "./built-in-block-artifacts.js";
import {
	buildBuiltInCodeArtifacts,
	type BuiltInCodeArtifact,
} from "./built-in-block-code-artifacts.js";
import { getStarterManifestFiles } from "./starter-manifests.js";
import { resolveTemplateSeed, parseTemplateLocator } from "./template-source.js";
import {
	assertExternalTemplateLayersDoNotWriteProtectedOutputs,
	resolveExternalTemplateLayers,
	type ResolvedTemplateLayerEntry,
} from "./template-layers.js";
import {
	getBuiltInTemplateOverlayDir,
	getBuiltInTemplateSharedLayerDirs,
	resolveBuiltInTemplateSourceFromLayerDirs,
} from "./template-builtins.js";
import type {
	DataStorageMode,
	PersistencePolicy,
	ScaffoldAnswers,
	ScaffoldProjectResult,
	ScaffoldTemplateVariables,
} from "./scaffold.js";

export interface BlockSpec {
	block: {
		namespace: string;
		phpPrefix: string;
		slug: string;
		textDomain: string;
	};
	metadata: {
		category: string;
		description: string;
		icon: string;
		keyword: string;
		title: string;
	};
	persistence:
		| {
				enabled: false;
		  }
		| {
				dataStorageMode: DataStorageMode;
				enabled: true;
				persistencePolicy: PersistencePolicy;
				scope: "compound-parent" | "single";
		  };
	project: {
		author: string;
	};
	runtime: {
		withMigrationUi: boolean;
		withTestPreset: boolean;
		withWpEnv: boolean;
	};
	template: {
		description: string;
		family: BuiltInTemplateId;
		features: string[];
	};
}

export interface BlockGenerationTarget {
	allowExistingDir: boolean;
	cwd: string;
	externalLayerId?: string;
	externalLayerSource?: string;
	noInstall: boolean;
	packageManager: PackageManagerId;
	projectDir: string;
	variant?: string;
}

export interface PlanBlockInput {
	allowExistingDir?: boolean;
	answers: ScaffoldAnswers;
	cwd?: string;
	dataStorageMode?: DataStorageMode;
	externalLayerId?: string;
	externalLayerSource?: string;
	noInstall?: boolean;
	packageManager: PackageManagerId;
	persistencePolicy?: PersistencePolicy;
	projectDir: string;
	templateId: BuiltInTemplateId;
	variant?: string;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
}

export interface PlanBlockResult {
	spec: BlockSpec;
	target: BlockGenerationTarget;
}

export interface ValidateBlockInput {
	plan: PlanBlockResult;
}

export interface ValidateBlockResult extends PlanBlockResult {}

export interface RenderBlockInput {
	validated: ValidateBlockResult;
}

export interface RenderBlockResult extends ValidateBlockResult {
	cleanup?: () => Promise<void>;
	gitignoreContent: string;
	postRender: {
		applyLocalDevPresets: boolean;
		applyMigrationUiCapability: boolean;
		seedPersistenceArtifacts: boolean;
		seedStarterManifestFiles: boolean;
	};
	readmeContent: string;
	selectedVariant: null;
	templateDir: string;
	variables: ScaffoldTemplateVariables;
	warnings: string[];
}

export interface ApplyBlockInput {
	rendered: RenderBlockResult;
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
}

const renderedArtifactCache = new WeakMap<
	RenderBlockResult,
	{
		artifacts: BuiltInBlockArtifact[];
		codeArtifacts: BuiltInCodeArtifact[];
		variablesFingerprint: string;
	}
>();

function createVariablesFingerprint(
	variables: ScaffoldTemplateVariables,
): string {
	return JSON.stringify(variables);
}

function buildProtectedTemplateOutputPaths({
	codeArtifacts,
	spec,
	variables,
	artifacts,
}: {
	artifacts: readonly BuiltInBlockArtifact[];
	codeArtifacts: readonly BuiltInCodeArtifact[];
	spec: BlockSpec;
	variables: ScaffoldTemplateVariables;
}): Set<string> {
	const protectedOutputs = new Set<string>([
		".gitignore",
		"package.json",
		"scripts/add-compound-child.ts",
		"scripts/block-config.ts",
		"scripts/sync-project.ts",
		"scripts/sync-rest-contracts.ts",
		"scripts/sync-types-to-block-json.ts",
		"tsconfig.json",
		"webpack.config.js",
		`${variables.slugKebabCase}.php`,
	]);

	for (const artifact of codeArtifacts) {
		protectedOutputs.add(artifact.relativePath);
	}

	for (const artifact of artifacts) {
		protectedOutputs.add(`${artifact.relativeDir}/block.json`);
		protectedOutputs.add(`${artifact.relativeDir}/types.ts`);
	}

	for (const manifest of getStarterManifestFiles(spec.template.family, variables)) {
		protectedOutputs.add(manifest.relativePath);
	}

	return protectedOutputs;
}

function buildCombinedTemplateLayerDirs({
	baseLayerDirs,
	externalEntries,
	templateId,
}: {
	baseLayerDirs: readonly string[];
	externalEntries: readonly ResolvedTemplateLayerEntry[];
	templateId: BuiltInTemplateId;
}): string[] {
	const orderedLayerDirs: string[] = [];
	const seenLayerDirs = new Set<string>();

	for (const layerDir of baseLayerDirs) {
		if (seenLayerDirs.has(layerDir)) {
			continue;
		}
		orderedLayerDirs.push(layerDir);
		seenLayerDirs.add(layerDir);
	}

	for (const entry of externalEntries) {
		if (seenLayerDirs.has(entry.dir)) {
			continue;
		}
		orderedLayerDirs.push(entry.dir);
		seenLayerDirs.add(entry.dir);
	}

	const overlayDir = getBuiltInTemplateOverlayDir(templateId);
	if (!seenLayerDirs.has(overlayDir)) {
		orderedLayerDirs.push(overlayDir);
	}

	return orderedLayerDirs;
}

function getBuiltInPersistenceSpec({
	templateId,
	dataStorageMode,
	persistencePolicy,
}: {
	dataStorageMode?: DataStorageMode;
	persistencePolicy?: PersistencePolicy;
	templateId: BuiltInTemplateId;
}): BlockSpec["persistence"] {
	if (templateId === "persistence") {
		return {
			dataStorageMode: dataStorageMode ?? "custom-table",
			enabled: true,
			persistencePolicy: persistencePolicy ?? "authenticated",
			scope: "single",
		};
	}

	if (templateId === "compound" && (dataStorageMode || persistencePolicy)) {
		return {
			dataStorageMode: dataStorageMode ?? "custom-table",
			enabled: true,
			persistencePolicy: persistencePolicy ?? "authenticated",
			scope: "compound-parent",
		};
	}

	return {
		enabled: false,
	};
}

export function createBuiltInBlockSpec({
	answers,
	dataStorageMode,
	persistencePolicy,
	templateId,
	withMigrationUi = false,
	withTestPreset = false,
	withWpEnv = false,
}: Omit<PlanBlockInput, "allowExistingDir" | "cwd" | "noInstall" | "packageManager" | "projectDir" | "variant">): BlockSpec {
	const template = getTemplateById(templateId);
	const metadataDefaults = getBuiltInTemplateMetadataDefaults(templateId);
	const identifiers = resolveScaffoldIdentifiers({
		namespace: answers.namespace,
		phpPrefix: answers.phpPrefix,
		slug: answers.slug,
		textDomain: answers.textDomain,
	});
	const resolvedDataStorageMode = dataStorageMode ?? answers.dataStorageMode;
	const resolvedPersistencePolicy = persistencePolicy ?? answers.persistencePolicy;

	return {
		block: identifiers,
		metadata: {
			category: metadataDefaults.category,
			description: answers.description.trim(),
			icon: metadataDefaults.icon,
			keyword: identifiers.slug.replace(/-/g, " "),
			title: answers.title.trim(),
		},
		persistence: getBuiltInPersistenceSpec({
			dataStorageMode: resolvedDataStorageMode,
			persistencePolicy: resolvedPersistencePolicy,
			templateId,
		}),
		project: {
			author: answers.author.trim(),
		},
		runtime: {
			withMigrationUi,
			withTestPreset,
			withWpEnv,
		},
		template: {
			description: template.description,
			family: templateId,
			features: [...template.features],
		},
	};
}

export function buildTemplateVariablesFromBlockSpec(spec: BlockSpec): ScaffoldTemplateVariables {
	const {
		apiClientPackageVersion,
		blockRuntimePackageVersion,
		blockTypesPackageVersion,
		projectToolsPackageVersion,
		restPackageVersion,
	} = getPackageVersions();
	const slug = spec.block.slug;
	const slugSnakeCase = toSnakeCase(slug);
	const pascalCase = toPascalCase(slug);
	const title = spec.metadata.title;
	const namespace = spec.block.namespace;
	const textDomain = spec.block.textDomain;
	const phpPrefix = spec.block.phpPrefix;
	const phpPrefixUpper = phpPrefix.toUpperCase();
	const compoundChildTitle = `${title} Item`;
	const cssClassName = buildBlockCssClassName(namespace, slug);
	const compoundChildCssClassName = buildBlockCssClassName(namespace, `${slug}-item`);
	const persistenceEnabled = spec.persistence.enabled;
	const dataStorageMode = persistenceEnabled ? spec.persistence.dataStorageMode : "custom-table";
	const persistencePolicy = persistenceEnabled
		? spec.persistence.persistencePolicy
		: "authenticated";

	return {
		apiClientPackageVersion,
		author: spec.project.author,
		blockRuntimePackageVersion,
		blockMetadataVersion: BUILTIN_BLOCK_METADATA_VERSION,
		blockTypesPackageVersion,
		category: spec.metadata.category,
		icon: spec.metadata.icon,
		compoundChildTitle,
		compoundChildCategory: COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS.category,
		compoundChildCssClassName,
		compoundChildIcon: COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS.icon,
		compoundChildTitleJson: JSON.stringify(compoundChildTitle),
		compoundPersistenceEnabled:
			spec.template.family === "compound" && persistenceEnabled ? "true" : "false",
		projectToolsPackageVersion,
		cssClassName,
		dashCase: slug,
		dataStorageMode,
		description: spec.metadata.description,
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
		keyword: spec.metadata.keyword,
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

export class BlockGeneratorService {
	async plan({
		allowExistingDir = false,
		answers,
		cwd = process.cwd(),
		dataStorageMode,
		externalLayerId,
		externalLayerSource,
		noInstall = false,
		packageManager,
		persistencePolicy,
		projectDir,
		templateId,
		variant,
		withMigrationUi = false,
		withTestPreset = false,
		withWpEnv = false,
	}: PlanBlockInput): Promise<PlanBlockResult> {
		return {
			spec: createBuiltInBlockSpec({
				answers,
				dataStorageMode,
				persistencePolicy,
				templateId,
				withMigrationUi,
				withTestPreset,
				withWpEnv,
			}),
			target: {
				allowExistingDir,
				cwd,
				externalLayerId,
				externalLayerSource,
				noInstall,
				packageManager,
				projectDir,
				variant,
			},
		};
	}

	async validate({ plan }: ValidateBlockInput): Promise<ValidateBlockResult> {
		if (plan.target.externalLayerId && !plan.target.externalLayerSource) {
			throw new Error(
				"externalLayerId requires externalLayerSource when composing built-in template layers.",
			);
		}

		if (plan.target.variant) {
			throw new Error(
				`--variant is only supported for official external template configs. Received variant "${plan.target.variant}" for built-in template "${plan.spec.template.family}".`,
			);
		}

		return plan;
	}

	async render({ validated }: RenderBlockInput): Promise<RenderBlockResult> {
		const variables = buildTemplateVariablesFromBlockSpec(validated.spec);
		const persistenceEnabled = validated.spec.persistence.enabled;
		const artifacts = buildBuiltInBlockArtifacts({
			templateId: validated.spec.template.family,
			variables,
		});
		const codeArtifacts = buildBuiltInCodeArtifacts({
			templateId: validated.spec.template.family,
			variables,
		});
		const templateVariantOptions = {
			persistenceEnabled,
			persistencePolicy:
				validated.spec.persistence.enabled &&
				validated.spec.persistence.persistencePolicy === "public"
					? "public"
					: "authenticated",
		} as const;
		let templateSource = await resolveBuiltInTemplateSource(
			validated.spec.template.family,
			templateVariantOptions,
		);
		const warnings = [...(templateSource.warnings ?? [])];

		if (validated.target.externalLayerSource) {
			const layerSeed = await resolveTemplateSeed(
				parseTemplateLocator(validated.target.externalLayerSource),
				validated.target.cwd,
			);

			try {
				const resolvedLayers = await resolveExternalTemplateLayers({
					externalLayerId: validated.target.externalLayerId,
					sourceRoot: layerSeed.rootDir,
				});
				const baseLayerDirs = getBuiltInTemplateSharedLayerDirs(
					validated.spec.template.family,
					templateVariantOptions,
				);
				await assertExternalTemplateLayersDoNotWriteProtectedOutputs({
					externalEntries: resolvedLayers.entries,
					protectedOutputPaths: buildProtectedTemplateOutputPaths({
						artifacts,
						codeArtifacts,
						spec: validated.spec,
						variables,
					}),
					view: variables,
				});

				await templateSource.cleanup?.();
				templateSource = await resolveBuiltInTemplateSourceFromLayerDirs(
					validated.spec.template.family,
					buildCombinedTemplateLayerDirs({
						baseLayerDirs,
						externalEntries: resolvedLayers.entries,
						templateId: validated.spec.template.family,
					}),
				);
				const layerSourceCleanup = layerSeed.cleanup;
				const templateCleanup = templateSource.cleanup;
				templateSource.cleanup = async () => {
					await templateCleanup?.();
					await layerSourceCleanup?.();
				};
				warnings.push(
					`Applied external layer "${resolvedLayers.selectedLayerId}" from "${validated.target.externalLayerSource}".`,
				);
			} catch (error) {
				await templateSource.cleanup?.();
				await layerSeed.cleanup?.();
				throw error;
			}
		}

		const rendered: RenderBlockResult = {
			...validated,
			cleanup: templateSource.cleanup,
			gitignoreContent: buildGitignore(),
			postRender: {
				applyLocalDevPresets: true,
				applyMigrationUiCapability: validated.spec.runtime.withMigrationUi,
				seedPersistenceArtifacts:
					validated.spec.template.family === "persistence" ||
					(validated.spec.template.family === "compound" && persistenceEnabled),
				seedStarterManifestFiles: true,
			},
			readmeContent: buildReadme(
				validated.spec.template.family,
				variables,
				validated.target.packageManager,
				{
					withMigrationUi: validated.spec.runtime.withMigrationUi,
					withTestPreset: validated.spec.runtime.withTestPreset,
					withWpEnv: validated.spec.runtime.withWpEnv,
				},
			),
			selectedVariant: null,
			templateDir: templateSource.templateDir,
			variables,
			warnings,
		};

		renderedArtifactCache.set(rendered, {
			artifacts,
			codeArtifacts,
			variablesFingerprint: createVariablesFingerprint(variables),
		});

		return rendered;
	}

	async apply({
		rendered,
		installDependencies,
	}: ApplyBlockInput): Promise<ScaffoldProjectResult> {
		const cachedArtifacts = renderedArtifactCache.get(rendered);
		const currentVariablesFingerprint = createVariablesFingerprint(
			rendered.variables,
		);
		const artifacts =
			cachedArtifacts &&
			cachedArtifacts.variablesFingerprint === currentVariablesFingerprint
				? cachedArtifacts.artifacts
				: buildBuiltInBlockArtifacts({
						templateId: rendered.spec.template.family,
						variables: rendered.variables,
					});
		const codeArtifacts =
			cachedArtifacts &&
			cachedArtifacts.variablesFingerprint === currentVariablesFingerprint
				? cachedArtifacts.codeArtifacts
				: buildBuiltInCodeArtifacts({
						templateId: rendered.spec.template.family,
						variables: rendered.variables,
					});

		try {
			await applyBuiltInScaffoldProjectFiles({
				allowExistingDir: rendered.target.allowExistingDir,
				artifacts,
				codeArtifacts,
				installDependencies,
				noInstall: rendered.target.noInstall,
				packageManager: rendered.target.packageManager,
				projectDir: rendered.target.projectDir,
				gitignoreContent: rendered.gitignoreContent,
				readmeContent: rendered.readmeContent,
				templateDir: rendered.templateDir,
				templateId: rendered.spec.template.family,
				variables: rendered.variables,
				withMigrationUi: rendered.spec.runtime.withMigrationUi,
				withTestPreset: rendered.spec.runtime.withTestPreset,
				withWpEnv: rendered.spec.runtime.withWpEnv,
			});
		} finally {
			await rendered.cleanup?.();
		}

		return {
			packageManager: rendered.target.packageManager,
			projectDir: rendered.target.projectDir,
			selectedVariant: rendered.selectedVariant,
			templateId: rendered.spec.template.family,
			variables: rendered.variables,
			warnings: rendered.warnings,
		};
	}
}
