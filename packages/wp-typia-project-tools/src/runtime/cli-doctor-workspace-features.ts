import fs from "node:fs";
import path from "node:path";

import {
	EDITOR_PLUGIN_SLOT_IDS,
	MANUAL_REST_CONTRACT_AUTH_IDS,
	MANUAL_REST_CONTRACT_HTTP_METHOD_IDS,
	REST_RESOURCE_METHOD_IDS,
	REST_RESOURCE_NAMESPACE_PATTERN,
	assertValidPostMetaPostType,
	isGeneratedRestResourceRoutePatternCompatible,
	resolveEditorPluginSlotAlias,
} from "./cli-add-shared.js";
import {
	hasAdminViewManualSettingsRouteParameters,
	isAdminViewManualSettingsRestResource,
} from "./cli-add-workspace-admin-view-types.js";
import {
	checkExistingFiles,
	createDoctorCheck,
	resolveWorkspaceBootstrapPath,
	WORKSPACE_ABILITY_EDITOR_ASSET,
	WORKSPACE_ABILITY_EDITOR_SCRIPT,
	WORKSPACE_ABILITY_GLOB,
	WORKSPACE_ADMIN_VIEW_ASSET,
	WORKSPACE_ADMIN_VIEW_GLOB,
	WORKSPACE_ADMIN_VIEW_SCRIPT,
	WORKSPACE_ADMIN_VIEW_STYLE,
	WORKSPACE_AI_FEATURE_GLOB,
	WORKSPACE_EDITOR_PLUGIN_EDITOR_ASSET,
	WORKSPACE_EDITOR_PLUGIN_EDITOR_SCRIPT,
	WORKSPACE_EDITOR_PLUGIN_EDITOR_STYLE,
	WORKSPACE_POST_META_GLOB,
	WORKSPACE_REST_RESOURCE_GLOB,
} from "./cli-doctor-workspace-shared.js";
import { readJsonFileSync } from "./json-utils.js";
import { escapeRegex } from "./php-utils.js";

import type { DoctorCheck } from "./cli-doctor.js";
import type { WorkspaceInventory } from "./workspace-inventory.js";
import type { WorkspaceProject } from "./workspace-project.js";

function isManualRestResource(
	restResource: WorkspaceInventory["restResources"][number],
): boolean {
	return restResource.mode === "manual";
}

function getWorkspaceRestResourceRequiredFiles(
	restResource: WorkspaceInventory["restResources"][number],
): string[] {
	const schemaNames = new Set<string>();
	if (isManualRestResource(restResource)) {
		schemaNames.add("query");
		if (restResource.bodyTypeName) {
			schemaNames.add("request");
		}
		schemaNames.add("response");

		return Array.from(
			new Set([
				restResource.apiFile,
				...Array.from(schemaNames, (schemaName) =>
					path.join(
						path.dirname(restResource.typesFile),
						"api-schemas",
						`${schemaName}.schema.json`,
					),
				),
				restResource.clientFile,
				restResource.openApiFile,
				restResource.typesFile,
				restResource.validatorsFile,
			]),
		);
	}

	if (restResource.methods.includes("list")) {
		schemaNames.add("list-query");
		schemaNames.add("list-response");
	}
	if (restResource.methods.includes("read")) {
		schemaNames.add("read-query");
		schemaNames.add("read-response");
	}
	if (restResource.methods.includes("create")) {
		schemaNames.add("create-request");
		schemaNames.add("create-response");
	}
	if (restResource.methods.includes("update")) {
		schemaNames.add("update-query");
		schemaNames.add("update-request");
		schemaNames.add("update-response");
	}
	if (restResource.methods.includes("delete")) {
		schemaNames.add("delete-query");
		schemaNames.add("delete-response");
	}

	return Array.from(
		new Set([
			restResource.apiFile,
			...Array.from(schemaNames, (schemaName) =>
				path.join(
					path.dirname(restResource.typesFile),
					"api-schemas",
					`${schemaName}.schema.json`,
				),
			),
			restResource.clientFile,
			...(restResource.dataFile ? [restResource.dataFile] : []),
			restResource.openApiFile,
			...(restResource.phpFile ? [restResource.phpFile] : []),
			restResource.typesFile,
			restResource.validatorsFile,
		]),
	);
}

function checkWorkspaceRestResourceConfig(
	restResource: WorkspaceInventory["restResources"][number],
): DoctorCheck {
	const hasNamespace = REST_RESOURCE_NAMESPACE_PATTERN.test(restResource.namespace);
	if (isManualRestResource(restResource)) {
		const hasAuth =
			restResource.auth == null ||
			(MANUAL_REST_CONTRACT_AUTH_IDS as readonly string[]).includes(
				restResource.auth,
			);
		const hasMethod =
			typeof restResource.method === "string" &&
			(MANUAL_REST_CONTRACT_HTTP_METHOD_IDS as readonly string[]).includes(
				restResource.method,
			);
		const hasPathPattern =
			typeof restResource.pathPattern === "string" &&
			restResource.pathPattern.startsWith("/") &&
			restResource.pathPattern.length > 1;

		return createDoctorCheck(
			`REST resource config ${restResource.slug}`,
			hasNamespace && hasAuth && hasMethod && hasPathPattern ? "pass" : "fail",
			hasNamespace && hasAuth && hasMethod && hasPathPattern
				? `Manual REST contract ${restResource.method} /${restResource.namespace}${restResource.pathPattern}`
				: "Manual REST contract namespace, auth, method, or path pattern is invalid",
		);
	}

	const hasMethods =
		restResource.methods.length > 0 &&
		restResource.methods.every((method) =>
			(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(method),
		);
	const hasGeneratedFiles =
		typeof restResource.dataFile === "string" &&
		restResource.dataFile.length > 0 &&
		typeof restResource.phpFile === "string" &&
		restResource.phpFile.length > 0;
		const hasRoutePattern =
			restResource.routePattern == null ||
			(typeof restResource.routePattern === "string" &&
				restResource.routePattern.startsWith("/") &&
				restResource.routePattern.length > 1 &&
				!/\s/u.test(restResource.routePattern) &&
				isGeneratedRestResourceRoutePatternCompatible(restResource.routePattern));

	return createDoctorCheck(
		`REST resource config ${restResource.slug}`,
		hasNamespace && hasMethods && hasGeneratedFiles && hasRoutePattern
			? "pass"
			: "fail",
		hasNamespace && hasMethods && hasGeneratedFiles && hasRoutePattern
			? `REST resource namespace ${restResource.namespace} with methods ${restResource.methods.join(", ")}`
			: "REST resource namespace, methods, dataFile, phpFile, or routePattern are invalid",
	);
}

function checkWorkspaceRestResourceBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"REST resource bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const registerFunctionName = `${phpPrefix}_register_rest_resources`;
	const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
	const hasServerGlob = source.includes(WORKSPACE_REST_RESOURCE_GLOB);
	const hasRegisterHook = source.includes(registerHook);

	return createDoctorCheck(
		"REST resource bootstrap",
		hasServerGlob && hasRegisterHook ? "pass" : "fail",
		hasServerGlob && hasRegisterHook
			? "REST resource PHP loader hook is present"
			: "Missing REST resource PHP require glob or init hook",
	);
}

function getWorkspacePostMetaRequiredFiles(
	postMeta: WorkspaceInventory["postMeta"][number],
): string[] {
	return Array.from(
		new Set([
			postMeta.phpFile,
			postMeta.schemaFile,
			postMeta.typesFile,
		]),
	);
}

function checkWorkspacePostMetaConfig(
	postMeta: WorkspaceInventory["postMeta"][number],
): DoctorCheck {
	let hasPostType = false;
	try {
		hasPostType = assertValidPostMetaPostType(postMeta.postType) === postMeta.postType;
	} catch {
		hasPostType = false;
	}
	const hasMetaKey =
		typeof postMeta.metaKey === "string" &&
		postMeta.metaKey.trim().length > 0 &&
		!/\s/u.test(postMeta.metaKey);
	const hasRestExposure = typeof postMeta.showInRest === "boolean";

	return createDoctorCheck(
		`Post meta config ${postMeta.slug}`,
		hasPostType && hasMetaKey && hasRestExposure ? "pass" : "fail",
		hasPostType && hasMetaKey && hasRestExposure
			? `Post meta ${postMeta.metaKey} targets ${postMeta.postType}`
			: "Post meta postType, metaKey, or showInRest configuration is invalid",
	);
}

function checkWorkspacePostMetaBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Post meta bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const registerFunctionName = `${phpPrefix}_register_post_meta_contracts`;
	const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
	const hasServerGlob = source.includes(WORKSPACE_POST_META_GLOB);
	const hasRegisterHook = source.includes(registerHook);

	return createDoctorCheck(
		"Post meta bootstrap",
		hasServerGlob && hasRegisterHook ? "pass" : "fail",
		hasServerGlob && hasRegisterHook
			? "Post meta PHP loader hook is present"
			: "Missing post meta PHP require glob or init hook",
	);
}

function checkWorkspacePostMetaPhp(
	projectDir: string,
	postMeta: WorkspaceInventory["postMeta"][number],
): DoctorCheck {
	const phpPath = path.join(projectDir, postMeta.phpFile);
	if (!fs.existsSync(phpPath)) {
		return createDoctorCheck(
			`Post meta PHP ${postMeta.slug}`,
			"fail",
			`Missing ${postMeta.phpFile}`,
		);
	}

	const source = fs.readFileSync(phpPath, "utf8");
	const hasRegisterPostMeta = source.includes("register_post_meta");
	const hasPostType = source.includes(postMeta.postType);
	const hasMetaKey = source.includes(postMeta.metaKey);
	const hasSchemaFile = source.includes(postMeta.schemaFile);
	const hasRestExposure = source.includes("'show_in_rest'");

	return createDoctorCheck(
		`Post meta PHP ${postMeta.slug}`,
		hasRegisterPostMeta && hasPostType && hasMetaKey && hasSchemaFile && hasRestExposure
			? "pass"
			: "fail",
		hasRegisterPostMeta && hasPostType && hasMetaKey && hasSchemaFile && hasRestExposure
			? "Post meta registration, schema path, and REST exposure flag are wired"
			: "Missing register_post_meta, post type, meta key, schema path, or show_in_rest wiring",
	);
}

function getWorkspaceAbilityRequiredFiles(
	ability: WorkspaceInventory["abilities"][number],
): string[] {
	return Array.from(
		new Set([
			ability.clientFile,
			ability.configFile,
			ability.dataFile,
			ability.inputSchemaFile,
			ability.outputSchemaFile,
			ability.phpFile,
			ability.typesFile,
		]),
	);
}

function checkWorkspaceAbilityConfig(
	projectDir: string,
	ability: WorkspaceInventory["abilities"][number],
): DoctorCheck {
	const configPath = path.join(projectDir, ability.configFile);
	if (!fs.existsSync(configPath)) {
		return createDoctorCheck(
			`Ability config ${ability.slug}`,
			"fail",
			`Missing ${ability.configFile}`,
		);
	}

	try {
		const config = readJsonFileSync<{
			abilityId?: unknown;
			category?: { slug?: unknown };
		}>(configPath, {
			context: "workspace ability config",
		});
		const abilityId =
			typeof config.abilityId === "string" ? config.abilityId.trim() : "";
		const categorySlug =
			typeof config.category?.slug === "string"
				? config.category.slug.trim()
				: "";
		const hasValidAbilityId = /^[a-z0-9-]+\/[a-z0-9-]+$/u.test(abilityId);
		const hasValidCategorySlug = /^[a-z0-9-]+$/u.test(categorySlug);

		return createDoctorCheck(
			`Ability config ${ability.slug}`,
			hasValidAbilityId && hasValidCategorySlug ? "pass" : "fail",
			hasValidAbilityId && hasValidCategorySlug
				? `Ability id ${abilityId} in category ${categorySlug} is valid`
				: "Ability config must define a valid abilityId (`namespace/ability-name`) and category.slug.",
		);
	} catch (error) {
		return createDoctorCheck(
			`Ability config ${ability.slug}`,
			"fail",
			error instanceof Error ? error.message : String(error),
		);
	}
}

function checkWorkspaceAbilityBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Ability bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const loadFunctionName = `${phpPrefix}_load_workflow_abilities`;
	const enqueueFunctionName = `${phpPrefix}_enqueue_workflow_abilities`;
	const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
	const adminEnqueueHook = `add_action( 'admin_enqueue_scripts', '${enqueueFunctionName}' );`;
	const editorEnqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
	const hasLoaderHook = source.includes(loadHook);
	const hasAdminEnqueueHook = source.includes(adminEnqueueHook);
	const hasEditorEnqueueHook = source.includes(editorEnqueueHook);
	const hasServerGlob = source.includes(WORKSPACE_ABILITY_GLOB);
	const hasEditorScript = source.includes(WORKSPACE_ABILITY_EDITOR_SCRIPT);
	const hasEditorAsset = source.includes(WORKSPACE_ABILITY_EDITOR_ASSET);
	const hasScriptModuleEnqueue = source.includes("wp_enqueue_script_module");

	return createDoctorCheck(
		"Ability bootstrap",
		hasLoaderHook &&
			hasAdminEnqueueHook &&
			hasEditorEnqueueHook &&
			hasServerGlob &&
			hasEditorScript &&
			hasEditorAsset &&
			hasScriptModuleEnqueue
			? "pass"
			: "fail",
		hasLoaderHook &&
			hasAdminEnqueueHook &&
			hasEditorEnqueueHook &&
			hasServerGlob &&
			hasEditorScript &&
			hasEditorAsset &&
			hasScriptModuleEnqueue
			? "Ability loader and admin/editor script-module bootstrap hooks are present"
			: "Missing ability loader hook, script-module enqueue, or build/abilities asset references",
	);
}

function checkWorkspaceAbilityIndex(
	projectDir: string,
	abilities: WorkspaceInventory["abilities"],
): DoctorCheck {
	const indexRelativePath = [
		path.join("src", "abilities", "index.ts"),
		path.join("src", "abilities", "index.js"),
	].find((relativePath) => fs.existsSync(path.join(projectDir, relativePath)));

	if (!indexRelativePath) {
		return createDoctorCheck(
			"Abilities index",
			"fail",
			"Missing src/abilities/index.ts or src/abilities/index.js",
		);
	}

	const indexPath = path.join(projectDir, indexRelativePath);
	const source = fs.readFileSync(indexPath, "utf8");
	const missingExports = abilities.filter((ability) => {
		const exportPattern = new RegExp(
			`^\\s*export\\s+(?:\\*\\s+from|\\{[^}]+\\}\\s+from)\\s+['"\`]\\./${escapeRegex(
				ability.slug,
			)}\\/client['"\`]`,
			"mu",
		);
		return !exportPattern.test(source);
	});

	return createDoctorCheck(
		"Abilities index",
		missingExports.length === 0 ? "pass" : "fail",
		missingExports.length === 0
			? "Ability client helpers are aggregated"
			: `Missing ability exports for: ${missingExports.map((entry) => entry.slug).join(", ")}`,
	);
}

function getWorkspaceAiFeatureRequiredFiles(
	aiFeature: WorkspaceInventory["aiFeatures"][number],
): string[] {
	return Array.from(
		new Set([
			aiFeature.aiSchemaFile,
			aiFeature.apiFile,
			path.join(
				path.dirname(aiFeature.typesFile),
				"api-schemas",
				"feature-request.schema.json",
			),
			path.join(
				path.dirname(aiFeature.typesFile),
				"api-schemas",
				"feature-response.schema.json",
			),
			path.join(
				path.dirname(aiFeature.typesFile),
				"api-schemas",
				"feature-result.schema.json",
			),
			aiFeature.clientFile,
			aiFeature.dataFile,
			aiFeature.openApiFile,
			aiFeature.phpFile,
			aiFeature.typesFile,
			aiFeature.validatorsFile,
		]),
	);
}

function checkWorkspaceAiFeatureConfig(
	aiFeature: WorkspaceInventory["aiFeatures"][number],
): DoctorCheck {
	const hasNamespace = REST_RESOURCE_NAMESPACE_PATTERN.test(aiFeature.namespace);

	return createDoctorCheck(
		`AI feature config ${aiFeature.slug}`,
		hasNamespace ? "pass" : "fail",
		hasNamespace
			? `AI feature namespace ${aiFeature.namespace} is valid`
			: "AI feature namespace is invalid",
	);
}

function checkWorkspaceAiFeatureBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"AI feature bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const registerFunctionName = `${phpPrefix}_register_ai_features`;
	const registerHook = `add_action( 'init', '${registerFunctionName}', 20 );`;
	const hasServerGlob = source.includes(WORKSPACE_AI_FEATURE_GLOB);
	const hasRegisterHook = source.includes(registerHook);

	return createDoctorCheck(
		"AI feature bootstrap",
		hasServerGlob && hasRegisterHook ? "pass" : "fail",
		hasServerGlob && hasRegisterHook
			? "AI feature PHP loader hook is present"
			: "Missing AI feature PHP require glob or init hook",
	);
}

function getWorkspaceEditorPluginRequiredFiles(
	editorPlugin: WorkspaceInventory["editorPlugins"][number],
): string[] {
	const editorPluginDir = path.join("src", "editor-plugins", editorPlugin.slug);
	const surfaceFile =
		editorPlugin.slot === "PluginSidebar"
			? path.join(editorPluginDir, "Sidebar.tsx")
			: path.join(editorPluginDir, "Surface.tsx");

	return Array.from(
		new Set([
			editorPlugin.file,
			surfaceFile,
			path.join(editorPluginDir, "data.ts"),
			path.join(editorPluginDir, "types.ts"),
			path.join(editorPluginDir, "style.scss"),
		]),
	);
}

function checkWorkspaceEditorPluginConfig(
	editorPlugin: WorkspaceInventory["editorPlugins"][number],
): DoctorCheck {
	const normalizedSlot = resolveEditorPluginSlotAlias(editorPlugin.slot);
	const isValidSlot = Boolean(normalizedSlot);

	return createDoctorCheck(
		`Editor plugin config ${editorPlugin.slug}`,
		isValidSlot ? "pass" : "fail",
		isValidSlot
			? `Editor plugin slot ${editorPlugin.slot} is supported as ${normalizedSlot}`
			: `Unsupported editor plugin slot "${editorPlugin.slot}". Expected one of: ${EDITOR_PLUGIN_SLOT_IDS.join(", ")} or legacy aliases PluginSidebar, PluginDocumentSettingPanel.`,
	);
}

function checkWorkspaceEditorPluginBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Editor plugin bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const enqueueFunctionName = `${phpPrefix}_enqueue_editor_plugins_editor`;
	const enqueueHook = `add_action( 'enqueue_block_editor_assets', '${enqueueFunctionName}' );`;
	const hasEditorEnqueueHook = source.includes(enqueueHook);
	const hasEditorScript = source.includes(WORKSPACE_EDITOR_PLUGIN_EDITOR_SCRIPT);
	const hasEditorAsset = source.includes(WORKSPACE_EDITOR_PLUGIN_EDITOR_ASSET);
	const hasEditorStyle = source.includes(WORKSPACE_EDITOR_PLUGIN_EDITOR_STYLE);

	return createDoctorCheck(
		"Editor plugin bootstrap",
		hasEditorEnqueueHook && hasEditorScript && hasEditorAsset && hasEditorStyle ? "pass" : "fail",
		hasEditorEnqueueHook && hasEditorScript && hasEditorAsset && hasEditorStyle
			? "Editor plugin enqueue hook is present"
			: "Missing editor plugin enqueue hook or build/editor-plugins script/style asset references",
	);
}

function checkWorkspaceEditorPluginIndex(
	projectDir: string,
	editorPlugins: WorkspaceInventory["editorPlugins"],
): DoctorCheck {
	const indexRelativePath = [
		path.join("src", "editor-plugins", "index.ts"),
		path.join("src", "editor-plugins", "index.js"),
	].find((relativePath) => fs.existsSync(path.join(projectDir, relativePath)));

	if (!indexRelativePath) {
		return createDoctorCheck(
			"Editor plugins index",
			"fail",
			"Missing src/editor-plugins/index.ts or src/editor-plugins/index.js",
		);
	}

	const indexPath = path.join(projectDir, indexRelativePath);
	const source = fs.readFileSync(indexPath, "utf8");
	const missingImports = editorPlugins.filter((editorPlugin) => {
		const importPattern = new RegExp(
			`['"\`]\\./${escapeRegex(editorPlugin.slug)}(?:/[^'"\`]*)?['"\`]`,
			"u",
		);
		return !importPattern.test(source);
	});

	return createDoctorCheck(
		"Editor plugins index",
		missingImports.length === 0 ? "pass" : "fail",
		missingImports.length === 0
			? "Editor plugin registrations are aggregated"
			: `Missing editor plugin imports for: ${missingImports
					.map((entry) => entry.slug)
					.join(", ")}`,
	);
}

function getWorkspaceAdminViewRequiredFiles(
	adminView: WorkspaceInventory["adminViews"][number],
): string[] {
	const adminViewDir = path.join("src", "admin-views", adminView.slug);

	return Array.from(
		new Set([
			adminView.file,
			adminView.phpFile,
			path.join(adminViewDir, "Screen.tsx"),
			path.join(adminViewDir, "config.ts"),
			path.join(adminViewDir, "data.ts"),
			path.join(adminViewDir, "style.scss"),
			path.join(adminViewDir, "types.ts"),
		]),
	);
}

function checkWorkspaceAdminViewConfig(
	adminView: WorkspaceInventory["adminViews"][number],
	inventory: WorkspaceInventory,
): DoctorCheck {
	if (adminView.source === undefined) {
		return createDoctorCheck(
			`Admin view config ${adminView.slug}`,
			"pass",
			"Admin view uses a replaceable local fetcher",
		);
	}

	const source = adminView.source.trim();
	const restSourceMatch = /^rest-resource:([a-z][a-z0-9-]*)$/u.exec(source);
	const coreDataSourceMatch =
		/^core-data:(postType|taxonomy)\/([a-z0-9][a-z0-9_-]*)$/u.exec(source);
	const restResourceSlug = restSourceMatch?.[1];
	const restResource = restResourceSlug
		? inventory.restResources.find((entry) => entry.slug === restResourceSlug)
		: undefined;
	const isListCapableRestResource = Boolean(restResource?.methods.includes("list"));
	const isManualSettingsRestResource =
		isAdminViewManualSettingsRestResource(restResource);
	const hasManualSettingsRouteParameters =
		isManualSettingsRestResource &&
		hasAdminViewManualSettingsRouteParameters(restResource);
	const isValid =
		isListCapableRestResource ||
		(isManualSettingsRestResource && !hasManualSettingsRouteParameters) ||
		Boolean(coreDataSourceMatch);
	const failDetail = hasManualSettingsRouteParameters
		? `Admin view source ${source} uses route parameters or regex groups and cannot scaffold a singleton settings form`
		: "Admin view source must use rest-resource:<slug> with a list-capable REST resource, a manual settings contract with a body type, or core-data:<postType|taxonomy>/<name>";

	return createDoctorCheck(
		`Admin view config ${adminView.slug}`,
		isValid ? "pass" : "fail",
		isValid
			? `Admin view source ${source} is ${
					isManualSettingsRestResource
						? "settings-form capable"
						: coreDataSourceMatch
							? "core-data capable"
							: "list-capable"
				}`
			: failDetail,
	);
}

function checkWorkspaceAdminViewBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const bootstrapPath = resolveWorkspaceBootstrapPath(projectDir, packageName);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Admin view bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const loadFunctionName = `${phpPrefix}_load_admin_views`;
	const loadHook = `add_action( 'plugins_loaded', '${loadFunctionName}' );`;
	const hasLoaderHook = source.includes(loadHook);
	const hasServerGlob = source.includes(WORKSPACE_ADMIN_VIEW_GLOB);

	return createDoctorCheck(
		"Admin view bootstrap",
		hasLoaderHook && hasServerGlob ? "pass" : "fail",
		hasLoaderHook && hasServerGlob
			? "Admin view PHP loader hook is present"
			: "Missing admin view PHP require glob or plugins_loaded hook",
	);
}

function checkWorkspaceAdminViewIndex(
	projectDir: string,
	adminViews: WorkspaceInventory["adminViews"],
): DoctorCheck {
	const indexRelativePath = [
		path.join("src", "admin-views", "index.ts"),
		path.join("src", "admin-views", "index.js"),
	].find((relativePath) => fs.existsSync(path.join(projectDir, relativePath)));

	if (!indexRelativePath) {
		return createDoctorCheck(
			"Admin views index",
			"fail",
			"Missing src/admin-views/index.ts or src/admin-views/index.js",
		);
	}

	const indexPath = path.join(projectDir, indexRelativePath);
	const source = fs.readFileSync(indexPath, "utf8");
	const missingImports = adminViews.filter((adminView) => {
		const importPattern = new RegExp(
			`['"\`]\\./${escapeRegex(adminView.slug)}(?:/[^'"\`]*)?['"\`]`,
			"u",
		);
		return !importPattern.test(source);
	});

	return createDoctorCheck(
		"Admin views index",
		missingImports.length === 0 ? "pass" : "fail",
		missingImports.length === 0
			? "Admin view registrations are aggregated"
			: `Missing admin view imports for: ${missingImports
					.map((entry) => entry.slug)
					.join(", ")}`,
	);
}

function checkWorkspaceAdminViewPhp(
	projectDir: string,
	adminView: WorkspaceInventory["adminViews"][number],
): DoctorCheck {
	const phpPath = path.join(projectDir, adminView.phpFile);
	if (!fs.existsSync(phpPath)) {
		return createDoctorCheck(
			`Admin view PHP ${adminView.slug}`,
			"fail",
			`Missing ${adminView.phpFile}`,
		);
	}

	const source = fs.readFileSync(phpPath, "utf8");
	const hasAdminMenu = source.includes("add_submenu_page");
	const hasAdminEnqueue = source.includes("admin_enqueue_scripts");
	const hasScript = source.includes(WORKSPACE_ADMIN_VIEW_SCRIPT);
	const hasAsset = source.includes(WORKSPACE_ADMIN_VIEW_ASSET);
	const hasStyle = source.includes(WORKSPACE_ADMIN_VIEW_STYLE);
	const hasComponentsStyleDependency = source.includes("'wp-components'");

	return createDoctorCheck(
		`Admin view PHP ${adminView.slug}`,
		hasAdminMenu &&
			hasAdminEnqueue &&
			hasScript &&
			hasAsset &&
			hasStyle &&
			hasComponentsStyleDependency
			? "pass"
			: "fail",
		hasAdminMenu &&
			hasAdminEnqueue &&
			hasScript &&
			hasAsset &&
			hasStyle &&
			hasComponentsStyleDependency
			? "Admin menu, script, style, and wp-components style dependency are wired"
			: "Missing admin menu, enqueue hook, build/admin-views asset reference, or wp-components style dependency",
	);
}

/**
 * Collect workspace doctor checks for REST resources, abilities, AI features, editor plugins, and admin views.
 *
 * @param workspace Resolved workspace metadata and filesystem paths.
 * @param inventory Parsed workspace inventory from `scripts/block-config.ts`.
 * @returns Ordered `DoctorCheck[]` rows for extracted workspace feature diagnostics.
 */
export function getWorkspaceFeatureDoctorChecks(
	workspace: WorkspaceProject,
	inventory: WorkspaceInventory,
): DoctorCheck[] {
	const checks: DoctorCheck[] = [];

	if (inventory.restResources.some((restResource) => !isManualRestResource(restResource))) {
		checks.push(
			checkWorkspaceRestResourceBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
	}
	for (const restResource of inventory.restResources) {
		checks.push(checkWorkspaceRestResourceConfig(restResource));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`REST resource ${restResource.slug}`,
				getWorkspaceRestResourceRequiredFiles(restResource),
			),
		);
	}

	if (inventory.postMeta.length > 0) {
		checks.push(
			checkWorkspacePostMetaBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
	}
	for (const postMeta of inventory.postMeta) {
		checks.push(checkWorkspacePostMetaConfig(postMeta));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Post meta ${postMeta.slug}`,
				getWorkspacePostMetaRequiredFiles(postMeta),
			),
		);
		checks.push(checkWorkspacePostMetaPhp(workspace.projectDir, postMeta));
	}

	if (inventory.abilities.length > 0) {
		checks.push(
			checkWorkspaceAbilityBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
		checks.push(
			checkWorkspaceAbilityIndex(workspace.projectDir, inventory.abilities),
		);
	}
	for (const ability of inventory.abilities) {
		checks.push(checkWorkspaceAbilityConfig(workspace.projectDir, ability));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Ability ${ability.slug}`,
				getWorkspaceAbilityRequiredFiles(ability),
			),
		);
	}

	if (inventory.aiFeatures.length > 0) {
		checks.push(
			checkWorkspaceAiFeatureBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
	}
	for (const aiFeature of inventory.aiFeatures) {
		checks.push(checkWorkspaceAiFeatureConfig(aiFeature));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`AI feature ${aiFeature.slug}`,
				getWorkspaceAiFeatureRequiredFiles(aiFeature),
			),
		);
	}

	if (inventory.editorPlugins.length > 0) {
		checks.push(
			checkWorkspaceEditorPluginBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
		checks.push(
			checkWorkspaceEditorPluginIndex(workspace.projectDir, inventory.editorPlugins),
		);
	}
	for (const editorPlugin of inventory.editorPlugins) {
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Editor plugin ${editorPlugin.slug}`,
				getWorkspaceEditorPluginRequiredFiles(editorPlugin),
			),
		);
		checks.push(checkWorkspaceEditorPluginConfig(editorPlugin));
	}

	if (inventory.adminViews.length > 0) {
		checks.push(
			checkWorkspaceAdminViewBootstrap(
				workspace.projectDir,
				workspace.packageName,
				workspace.workspace.phpPrefix,
			),
		);
		checks.push(
			checkWorkspaceAdminViewIndex(workspace.projectDir, inventory.adminViews),
		);
	}
	for (const adminView of inventory.adminViews) {
		checks.push(checkWorkspaceAdminViewConfig(adminView, inventory));
		checks.push(
			checkExistingFiles(
				workspace.projectDir,
				`Admin view ${adminView.slug}`,
				getWorkspaceAdminViewRequiredFiles(adminView),
			),
		);
		checks.push(checkWorkspaceAdminViewPhp(workspace.projectDir, adminView));
	}

	return checks;
}
