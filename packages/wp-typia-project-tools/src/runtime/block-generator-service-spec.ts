import { getPackageVersions } from "./package-versions.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	BUILTIN_BLOCK_METADATA_VERSION,
	COMPOUND_CHILD_BLOCK_METADATA_DEFAULTS,
	getBuiltInTemplateMetadataDefaults,
} from "./template-defaults.js";
import {
	formatAlternateRenderTargets,
	parseAlternateRenderTargets,
	type AlternateRenderTargetId,
} from "./alternate-render-targets.js";
import {
	getTemplateById,
	type BuiltInTemplateId,
} from "./template-registry.js";
import {
	toPascalCase,
	toSnakeCase,
} from "./string-case.js";
import type { InstallDependenciesOptions } from "./scaffold-apply-utils.js";
import {
	buildBlockCssClassName,
	buildFrontendCssClassName,
	resolveScaffoldIdentifiers,
} from "./scaffold-identifiers.js";
import type {
	DataStorageMode,
	PersistencePolicy,
	ScaffoldAnswers,
	ScaffoldProgressEvent,
	ScaffoldTemplateVariables,
} from "./scaffold.js";

export interface BlockSpec {
	alternateRenderTargets: readonly AlternateRenderTargetId[];
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
	queryLoop: {
		allowedControls: readonly string[];
		enabled: boolean;
		postType: string;
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
	externalLayerSourceLabel?: string;
	noInstall: boolean;
	packageManager: PackageManagerId;
	projectDir: string;
	repositoryReference?: string;
	variant?: string;
}

export interface PlanBlockInput {
	allowExistingDir?: boolean;
	alternateRenderTargets?: string;
	answers: ScaffoldAnswers;
	cwd?: string;
	dataStorageMode?: DataStorageMode;
	externalLayerId?: string;
	externalLayerSource?: string;
	externalLayerSourceLabel?: string;
	noInstall?: boolean;
	packageManager: PackageManagerId;
	persistencePolicy?: PersistencePolicy;
	projectDir: string;
	repositoryReference?: string;
	templateId: BuiltInTemplateId;
	variant?: string;
	withMigrationUi?: boolean;
	queryPostType?: string;
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
	onProgress?: ((event: ScaffoldProgressEvent) => void | Promise<void>) | undefined;
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

const DEFAULT_QUERY_LOOP_ALLOWED_CONTROLS = [
	"inherit",
	"postType",
	"order",
	"sticky",
	"taxQuery",
	"author",
	"search",
] as const;

export function createBuiltInBlockSpec({
	alternateRenderTargets,
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
	const parsedAlternateRenderTargets =
		parseAlternateRenderTargets(alternateRenderTargets);

	return {
		alternateRenderTargets: parsedAlternateRenderTargets,
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
		queryLoop:
			templateId === "query-loop"
				? {
						allowedControls: DEFAULT_QUERY_LOOP_ALLOWED_CONTROLS,
						enabled: true,
						postType: (answers.queryPostType ?? "post").trim() || "post",
				  }
				: {
						allowedControls: [],
						enabled: false,
						postType: "post",
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
	const alternateRenderTargets = [...spec.alternateRenderTargets];
	const hasAlternateEmailRenderTarget = alternateRenderTargets.includes("email");
	const hasAlternateMjmlRenderTarget = alternateRenderTargets.includes("mjml");
	const hasAlternatePlainTextRenderTarget =
		alternateRenderTargets.includes("plain-text");
	const compoundChildTitle = `${title} Item`;
	const cssClassName = buildBlockCssClassName(namespace, slug);
	const compoundChildCssClassName = buildBlockCssClassName(namespace, `${slug}-item`);
	const persistenceEnabled = spec.persistence.enabled;
	const dataStorageMode = persistenceEnabled ? spec.persistence.dataStorageMode : "custom-table";
	const persistencePolicy = persistenceEnabled
		? spec.persistence.persistencePolicy
		: "authenticated";
	const queryVariationNamespace = `${namespace}/${slug}`;

	return {
		alternateRenderTargetsCsv: formatAlternateRenderTargets(
			alternateRenderTargets,
		),
		alternateRenderTargetsJson: JSON.stringify(alternateRenderTargets),
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
		hasAlternateEmailRenderTarget: hasAlternateEmailRenderTarget
			? "true"
			: "false",
		hasAlternateMjmlRenderTarget: hasAlternateMjmlRenderTarget
			? "true"
			: "false",
		hasAlternatePlainTextRenderTarget: hasAlternatePlainTextRenderTarget
			? "true"
			: "false",
		hasAlternateRenderTargets: alternateRenderTargets.length > 0
			? "true"
			: "false",
		projectToolsPackageVersion,
		cssClassName,
		dashCase: slug,
		dataStorageMode,
		description: spec.metadata.description,
		descriptionJson: JSON.stringify(spec.metadata.description),
		frontendCssClassName: buildFrontendCssClassName(cssClassName),
		queryAllowedControlsJson: JSON.stringify(
			spec.queryLoop.enabled ? spec.queryLoop.allowedControls : [],
			null,
			2,
		),
		queryPostType: spec.queryLoop.enabled ? spec.queryLoop.postType : "post",
		queryPostTypeJson: JSON.stringify(
			spec.queryLoop.enabled ? spec.queryLoop.postType : "post",
		),
		queryVariationNamespace,
		queryVariationNamespaceJson: JSON.stringify(queryVariationNamespace),
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
