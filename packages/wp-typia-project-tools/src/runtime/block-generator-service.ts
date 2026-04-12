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
			dataStorageMode,
			persistencePolicy,
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
				noInstall,
				packageManager,
				projectDir,
				variant,
			},
		};
	}

	async validate({ plan }: ValidateBlockInput): Promise<ValidateBlockResult> {
		if (plan.target.variant) {
			throw new Error(
				`--variant is only supported for official external template configs. Received variant "${plan.target.variant}" for built-in template "${plan.spec.template.family}".`,
			);
		}

		return plan;
	}

	async render({ validated }: RenderBlockInput): Promise<RenderBlockResult> {
		const templateSource = await resolveBuiltInTemplateSource(
			validated.spec.template.family,
			{
				persistenceEnabled: validated.spec.persistence.enabled,
				persistencePolicy:
					validated.spec.persistence.enabled &&
					validated.spec.persistence.persistencePolicy === "public"
						? "public"
						: "authenticated",
			},
		);
		const variables = buildTemplateVariablesFromBlockSpec(validated.spec);
		const persistenceEnabled = validated.spec.persistence.enabled;

		return {
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
			warnings: templateSource.warnings ?? [],
		};
	}

	async apply({
		rendered,
		installDependencies,
	}: ApplyBlockInput): Promise<ScaffoldProjectResult> {
		try {
			await applyBuiltInScaffoldProjectFiles({
				allowExistingDir: rendered.target.allowExistingDir,
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
