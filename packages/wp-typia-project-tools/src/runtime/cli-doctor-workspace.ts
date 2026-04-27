import fs from "node:fs";
import path from "node:path";

import { parseScaffoldBlockMetadata } from "@wp-typia/block-runtime/blocks";

import {
	EDITOR_PLUGIN_SLOT_IDS,
	REST_RESOURCE_METHOD_IDS,
	REST_RESOURCE_NAMESPACE_PATTERN,
} from "./cli-add-shared.js";
import {
	HOOKED_BLOCK_ANCHOR_PATTERN,
	HOOKED_BLOCK_POSITION_SET,
} from "./hooked-blocks.js";
import { readWorkspaceInventory, type WorkspaceInventory } from "./workspace-inventory.js";
import {
	getInvalidWorkspaceProjectReason,
	parseWorkspacePackageJson,
	WORKSPACE_TEMPLATE_PACKAGE,
	tryResolveWorkspaceProject,
	type WorkspacePackageJson,
	type WorkspaceProject,
} from "./workspace-project.js";
import { escapeRegex } from "./php-utils.js";

import type { DoctorCheck } from "./cli-doctor.js";

const WORKSPACE_COLLECTION_IMPORT_LINE = "import '../../collection';";
const WORKSPACE_COLLECTION_IMPORT_PATTERN = /^\s*import\s+["']\.\.\/\.\.\/collection["']\s*;?\s*$/m;
const WORKSPACE_BINDING_SERVER_GLOB = "/src/bindings/*/server.php";
const WORKSPACE_BINDING_EDITOR_SCRIPT = "build/bindings/index.js";
const WORKSPACE_BINDING_EDITOR_ASSET = "build/bindings/index.asset.php";
const WORKSPACE_REST_RESOURCE_GLOB = "/inc/rest/*.php";
const WORKSPACE_ABILITY_GLOB = "/inc/abilities/*.php";
const WORKSPACE_ABILITY_EDITOR_SCRIPT = "build/abilities/index.js";
const WORKSPACE_ABILITY_EDITOR_ASSET = "build/abilities/index.asset.php";
const WORKSPACE_AI_FEATURE_GLOB = "/inc/ai-features/*.php";
const WORKSPACE_ADMIN_VIEW_GLOB = "/inc/admin-views/*.php";
const WORKSPACE_ADMIN_VIEW_SCRIPT = "build/admin-views/index.js";
const WORKSPACE_ADMIN_VIEW_ASSET = "build/admin-views/index.asset.php";
const WORKSPACE_ADMIN_VIEW_STYLE = "build/admin-views/style-index.css";
const WORKSPACE_EDITOR_PLUGIN_EDITOR_SCRIPT = "build/editor-plugins/index.js";
const WORKSPACE_EDITOR_PLUGIN_EDITOR_ASSET = "build/editor-plugins/index.asset.php";
const WORKSPACE_EDITOR_PLUGIN_EDITOR_STYLE = "build/editor-plugins/style-index.css";
const WORKSPACE_GENERATED_BLOCK_ARTIFACTS = [
	"block.json",
	"typia.manifest.json",
	"typia.schema.json",
	"typia-validator.php",
	"typia.openapi.json",
] as const;

function createDoctorCheck(
	label: string,
	status: DoctorCheck["status"],
	detail: string,
): DoctorCheck {
	return { detail, label, status };
}

function createDoctorScopeCheck(
	status: DoctorCheck["status"],
	detail: string,
): DoctorCheck {
	return createDoctorCheck("Doctor scope", status, detail);
}

function getWorkspaceBootstrapRelativePath(packageName: string): string {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	return `${packageBaseName}.php`;
}

function checkExistingFiles(
	projectDir: string,
	label: string,
	filePaths: Array<string | undefined>,
): DoctorCheck {
	const missing = filePaths
		.filter((filePath): filePath is string => typeof filePath === "string")
		.filter((filePath) => !fs.existsSync(path.join(projectDir, filePath)));
	return createDoctorCheck(
		label,
		missing.length === 0 ? "pass" : "fail",
		missing.length === 0 ? "All referenced files exist" : `Missing: ${missing.join(", ")}`,
	);
}

function checkWorkspacePackageMetadata(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck {
	const issues: string[] = [];
	const packageName = packageJson.name;
	const bootstrapRelativePath = getWorkspaceBootstrapRelativePath(
		typeof packageName === "string" && packageName.length > 0 ? packageName : workspace.packageName,
	);
	const wpTypia = packageJson.wpTypia;

	if (typeof packageName !== "string" || packageName.length === 0) {
		issues.push("package.json must define a string name for workspace bootstrap resolution");
	}
	if (wpTypia?.projectType !== "workspace") {
		issues.push('wpTypia.projectType must be "workspace"');
	}
	if (wpTypia?.templatePackage !== WORKSPACE_TEMPLATE_PACKAGE) {
		issues.push(`wpTypia.templatePackage must be "${WORKSPACE_TEMPLATE_PACKAGE}"`);
	}
	if (wpTypia?.namespace !== workspace.workspace.namespace) {
		issues.push(`wpTypia.namespace must equal "${workspace.workspace.namespace}"`);
	}
	if (wpTypia?.textDomain !== workspace.workspace.textDomain) {
		issues.push(`wpTypia.textDomain must equal "${workspace.workspace.textDomain}"`);
	}
	if (wpTypia?.phpPrefix !== workspace.workspace.phpPrefix) {
		issues.push(`wpTypia.phpPrefix must equal "${workspace.workspace.phpPrefix}"`);
	}
	if (!fs.existsSync(path.join(workspace.projectDir, bootstrapRelativePath))) {
		issues.push(`Missing bootstrap file ${bootstrapRelativePath}`);
	}

	return createDoctorCheck(
		"Workspace package metadata",
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `package.json metadata aligns with ${workspace.packageName} and ${bootstrapRelativePath}`
			: issues.join("; "),
	);
}

function getWorkspaceBlockRequiredFiles(
	block: WorkspaceInventory["blocks"][number],
): string[] {
	const blockDir = path.join("src", "blocks", block.slug);

	return Array.from(
		new Set(
			[
				block.typesFile,
				block.apiTypesFile,
				block.openApiFile,
				path.join(blockDir, "index.tsx"),
				...WORKSPACE_GENERATED_BLOCK_ARTIFACTS.map((fileName) => path.join(blockDir, fileName)),
			].filter((filePath): filePath is string => typeof filePath === "string"),
		),
	);
}

function checkWorkspaceBlockMetadata(
	projectDir: string,
	workspace: WorkspaceProject,
	block: WorkspaceInventory["blocks"][number],
): DoctorCheck {
	const blockJsonRelativePath = path.join("src", "blocks", block.slug, "block.json");
	const blockJsonPath = path.join(projectDir, blockJsonRelativePath);

	if (!fs.existsSync(blockJsonPath)) {
		return createDoctorCheck(
			`Block metadata ${block.slug}`,
			"fail",
			`Missing ${blockJsonRelativePath}`,
		);
	}

	let blockJson: { name: string; textdomain?: string };
	try {
		blockJson = parseScaffoldBlockMetadata<{ textdomain?: string }>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		return createDoctorCheck(
			`Block metadata ${block.slug}`,
			"fail",
			error instanceof Error ? error.message : String(error),
		);
	}

	const expectedName = `${workspace.workspace.namespace}/${block.slug}`;
	const issues: string[] = [];
	if (blockJson.name !== expectedName) {
		issues.push(`block.json name must equal "${expectedName}"`);
	}
	if (blockJson.textdomain !== workspace.workspace.textDomain) {
		issues.push(`block.json textdomain must equal "${workspace.workspace.textDomain}"`);
	}

	return createDoctorCheck(
		`Block metadata ${block.slug}`,
		issues.length === 0 ? "pass" : "fail",
		issues.length === 0
			? `block.json matches ${expectedName} and ${workspace.workspace.textDomain}`
			: issues.join("; "),
	);
}

function checkWorkspaceBlockHooks(
	projectDir: string,
	blockSlug: string,
): DoctorCheck {
	const blockJsonRelativePath = path.join("src", "blocks", blockSlug, "block.json");
	const blockJsonPath = path.join(projectDir, blockJsonRelativePath);

	if (!fs.existsSync(blockJsonPath)) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			`Missing ${blockJsonRelativePath}`,
		);
	}

	let blockJson: Record<string, unknown> & { blockHooks?: unknown };
	try {
		blockJson = parseScaffoldBlockMetadata<Record<string, unknown> & { blockHooks?: unknown }>(
			JSON.parse(fs.readFileSync(blockJsonPath, "utf8")),
		);
	} catch (error) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			error instanceof Error ? error.message : String(error),
		);
	}

	const blockHooks = blockJson.blockHooks;
	if (blockHooks === undefined) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"pass",
			"No blockHooks metadata configured",
		);
	}
	if (!blockHooks || typeof blockHooks !== "object" || Array.isArray(blockHooks)) {
		return createDoctorCheck(
			`Block hooks ${blockSlug}`,
			"fail",
			`${blockJsonRelativePath} must define blockHooks as an object when present.`,
		);
	}

	const blockName =
		typeof blockJson.name === "string" && blockJson.name.trim().length > 0
			? blockJson.name.trim()
			: null;
	const invalidEntries = Object.entries(blockHooks).filter(
		([anchor, position]) =>
			(blockName !== null && anchor.trim() === blockName) ||
			anchor.trim().length === 0 ||
			anchor !== anchor.trim() ||
			!HOOKED_BLOCK_ANCHOR_PATTERN.test(anchor) ||
			typeof position !== "string" ||
			!HOOKED_BLOCK_POSITION_SET.has(position),
	);

	return createDoctorCheck(
		`Block hooks ${blockSlug}`,
		invalidEntries.length === 0 ? "pass" : "fail",
		invalidEntries.length === 0
			? `blockHooks metadata is valid${Object.keys(blockHooks).length > 0 ? ` (${Object.keys(blockHooks).join(", ")})` : ""}`
			: `Invalid blockHooks entries: ${invalidEntries
					.map(([anchor, position]) => `${anchor || "<empty>"} => ${String(position)}`)
					.join(", ")}`,
	);
}

function checkWorkspaceBlockCollectionImport(
	projectDir: string,
	blockSlug: string,
): DoctorCheck {
	const entryRelativePath = path.join("src", "blocks", blockSlug, "index.tsx");
	const entryPath = path.join(projectDir, entryRelativePath);

	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Block collection ${blockSlug}`,
			"fail",
			`Missing ${entryRelativePath}`,
		);
	}

	const source = fs.readFileSync(entryPath, "utf8");
	const hasCollectionImport = WORKSPACE_COLLECTION_IMPORT_PATTERN.test(source);
	return createDoctorCheck(
		`Block collection ${blockSlug}`,
		hasCollectionImport ? "pass" : "fail",
		hasCollectionImport
			? "Shared block collection import is present"
			: `Missing a shared collection import like ${WORKSPACE_COLLECTION_IMPORT_LINE}`,
	);
}

function checkWorkspacePatternBootstrap(projectDir: string, packageName: string): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck("Pattern bootstrap", "fail", `Missing ${path.basename(bootstrapPath)}`);
	}
	const source = fs.readFileSync(bootstrapPath, "utf8");
	const hasCategoryAnchor = source.includes("register_block_pattern_category");
	const hasPatternGlob = source.includes("/src/patterns/*.php");
	return createDoctorCheck(
		"Pattern bootstrap",
		hasCategoryAnchor && hasPatternGlob ? "pass" : "fail",
		hasCategoryAnchor && hasPatternGlob
			? "Pattern category and loader hooks are present"
			: "Missing pattern category registration or src/patterns loader hook",
	);
}

function checkWorkspaceBindingBootstrap(projectDir: string, packageName: string): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
	if (!fs.existsSync(bootstrapPath)) {
		return createDoctorCheck(
			"Binding bootstrap",
			"fail",
			`Missing ${path.basename(bootstrapPath)}`,
		);
	}

	const source = fs.readFileSync(bootstrapPath, "utf8");
	const hasServerGlob = source.includes(WORKSPACE_BINDING_SERVER_GLOB);
	const hasEditorEnqueueHook = source.includes("enqueue_block_editor_assets");
	const hasEditorScript = source.includes(WORKSPACE_BINDING_EDITOR_SCRIPT);
	const hasEditorAsset = source.includes(WORKSPACE_BINDING_EDITOR_ASSET);

	return createDoctorCheck(
		"Binding bootstrap",
		hasServerGlob && hasEditorEnqueueHook && hasEditorScript && hasEditorAsset ? "pass" : "fail",
		hasServerGlob && hasEditorEnqueueHook && hasEditorScript && hasEditorAsset
			? "Binding source PHP and editor bootstrap hooks are present"
			: "Missing binding source PHP require glob or editor enqueue hook",
	);
}

function checkWorkspaceBindingSourcesIndex(
	projectDir: string,
	bindingSources: WorkspaceInventory["bindingSources"],
): DoctorCheck {
	const indexRelativePath = [path.join("src", "bindings", "index.ts"), path.join("src", "bindings", "index.js")].find(
		(relativePath) => fs.existsSync(path.join(projectDir, relativePath)),
	);

	if (!indexRelativePath) {
		return createDoctorCheck(
			"Binding sources index",
			"fail",
			"Missing src/bindings/index.ts or src/bindings/index.js",
		);
	}

	const indexPath = path.join(projectDir, indexRelativePath);
	const source = fs.readFileSync(indexPath, "utf8");
	const missingImports = bindingSources.filter(
		(bindingSource) => !source.includes(`./${bindingSource.slug}/editor`),
	);

	return createDoctorCheck(
		"Binding sources index",
		missingImports.length === 0 ? "pass" : "fail",
		missingImports.length === 0
			? "Binding source editor registrations are aggregated"
			: `Missing editor imports for: ${missingImports.map((entry) => entry.slug).join(", ")}`,
	);
}

function getWorkspaceRestResourceRequiredFiles(
	restResource: WorkspaceInventory["restResources"][number],
): string[] {
	const schemaNames = new Set<string>();
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
			restResource.dataFile,
			restResource.openApiFile,
			restResource.phpFile,
			restResource.typesFile,
			restResource.validatorsFile,
		]),
	);
}

function checkWorkspaceRestResourceConfig(
	restResource: WorkspaceInventory["restResources"][number],
): DoctorCheck {
	const hasNamespace = REST_RESOURCE_NAMESPACE_PATTERN.test(restResource.namespace);
	const hasMethods =
		restResource.methods.length > 0 &&
		restResource.methods.every((method) =>
			(REST_RESOURCE_METHOD_IDS as readonly string[]).includes(method),
		);

	return createDoctorCheck(
		`REST resource config ${restResource.slug}`,
		hasNamespace && hasMethods ? "pass" : "fail",
		hasNamespace && hasMethods
			? `REST resource namespace ${restResource.namespace} with methods ${restResource.methods.join(", ")}`
			: "REST resource namespace or methods are invalid",
	);
}

function checkWorkspaceRestResourceBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
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
		const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
			abilityId?: unknown;
			category?: { slug?: unknown };
		};
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
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
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
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
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

	return Array.from(
		new Set([
			editorPlugin.file,
			path.join(editorPluginDir, "Sidebar.tsx"),
			path.join(editorPluginDir, "data.ts"),
			path.join(editorPluginDir, "types.ts"),
			path.join(editorPluginDir, "style.scss"),
		]),
	);
}

function checkWorkspaceEditorPluginConfig(
	editorPlugin: WorkspaceInventory["editorPlugins"][number],
): DoctorCheck {
	const validSlots = new Set<string>(EDITOR_PLUGIN_SLOT_IDS);
	const isValidSlot = validSlots.has(editorPlugin.slot);

	return createDoctorCheck(
		`Editor plugin config ${editorPlugin.slug}`,
		isValidSlot ? "pass" : "fail",
		isValidSlot
			? `Editor plugin slot ${editorPlugin.slot} is supported`
			: `Unsupported editor plugin slot "${editorPlugin.slot}". Expected one of: ${EDITOR_PLUGIN_SLOT_IDS.join(", ")}`,
	);
}

function checkWorkspaceEditorPluginBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
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
	if (!adminView.source) {
		return createDoctorCheck(
			`Admin view config ${adminView.slug}`,
			"pass",
			"Admin view uses a replaceable local fetcher",
		);
	}

	const sourceMatch = /^rest-resource:([a-z][a-z0-9-]*)$/u.exec(adminView.source);
	const restResourceSlug = sourceMatch?.[1];
	const restResource = restResourceSlug
		? inventory.restResources.find((entry) => entry.slug === restResourceSlug)
		: undefined;
	const isValid = Boolean(restResource?.methods.includes("list"));

	return createDoctorCheck(
		`Admin view config ${adminView.slug}`,
		isValid ? "pass" : "fail",
		isValid
			? `Admin view source ${adminView.source} is list-capable`
			: "Admin view source must use rest-resource:<slug> and reference a list-capable REST resource",
	);
}

function checkWorkspaceAdminViewBootstrap(
	projectDir: string,
	packageName: string,
	phpPrefix: string,
): DoctorCheck {
	const packageBaseName = packageName.split("/").pop() ?? packageName;
	const bootstrapPath = path.join(projectDir, `${packageBaseName}.php`);
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

function checkVariationEntrypoint(projectDir: string, blockSlug: string): DoctorCheck {
	const entryPath = path.join(projectDir, "src", "blocks", blockSlug, "index.tsx");
	if (!fs.existsSync(entryPath)) {
		return createDoctorCheck(
			`Variation entrypoint ${blockSlug}`,
			"fail",
			`Missing ${path.relative(projectDir, entryPath)}`,
		);
	}
	const source = fs.readFileSync(entryPath, "utf8");
	const hasImport = source.includes("./variations");
	const hasCall = source.includes("registerWorkspaceVariations()");
	return createDoctorCheck(
		`Variation entrypoint ${blockSlug}`,
		hasImport && hasCall ? "pass" : "fail",
		hasImport && hasCall
			? "Variations registration hook is present"
			: "Missing ./variations import or registerWorkspaceVariations() call",
	);
}

function checkMigrationWorkspaceHint(
	workspace: WorkspaceProject,
	packageJson: WorkspacePackageJson,
): DoctorCheck | null {
	const hasMigrationScript = typeof packageJson.scripts?.["migration:doctor"] === "string";
	const migrationConfigRelativePath = path.join("src", "migrations", "config.ts");
	const hasMigrationConfig = fs.existsSync(
		path.join(workspace.projectDir, migrationConfigRelativePath),
	);

	if (!hasMigrationScript && !hasMigrationConfig) {
		return null;
	}

	return createDoctorCheck(
		"Migration workspace",
		hasMigrationConfig ? "pass" : "fail",
		hasMigrationConfig
			? "Run `wp-typia migrate doctor --all` for migration target, snapshot, fixture, and generated artifact checks"
			: `Missing ${migrationConfigRelativePath} for the configured migration workspace`,
	);
}

/**
 * Collect workspace-scoped doctor checks for the given working directory.
 *
 * When the directory is not an official workspace, the function returns a
 * "Doctor scope" row explaining that only environment checks ran, plus a
 * failing workspace metadata row when a nearby candidate workspace is invalid.
 * When workspace resolution or metadata parsing throws, the corresponding
 * failing rows are returned early and the remaining checks are skipped.
 * When an official workspace is detected, a passing "Doctor scope" row is
 * emitted first so the remaining package metadata, inventory, source-tree
 * drift, and optional migration hint rows are clearly framed as workspace
 * diagnostics for that run.
 *
 * @param cwd Working directory expected to host an official workspace.
 * @returns Ordered workspace check rows ready for CLI rendering.
 */
export function getWorkspaceDoctorChecks(cwd: string): DoctorCheck[] {
	const checks: DoctorCheck[] = [];

	let workspace: WorkspaceProject | null = null;
	let invalidWorkspaceReason: string | null = null;
	try {
		invalidWorkspaceReason = getInvalidWorkspaceProjectReason(cwd);
		workspace = tryResolveWorkspaceProject(cwd);
	} catch (error) {
		checks.push(
			createDoctorScopeCheck(
				"fail",
				"Scope: blocked before workspace checks. Environment checks ran, but workspace discovery could not continue. Fix the nearby workspace package metadata and rerun `wp-typia doctor`.",
			),
		);
		checks.push(
			createDoctorCheck(
				"Workspace package metadata",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
		return checks;
	}
	if (!workspace) {
		if (invalidWorkspaceReason) {
			checks.push(
				createDoctorScopeCheck(
					"fail",
					"Scope: blocked before workspace checks. Environment checks ran, but workspace diagnostics could not continue because a nearby wp-typia workspace candidate is invalid. Fix the workspace package metadata and rerun `wp-typia doctor`.",
				),
			);
			checks.push(
				createDoctorCheck(
					"Workspace package metadata",
					"fail",
					invalidWorkspaceReason,
				),
			);
		} else {
			checks.push(
				createDoctorScopeCheck(
					"pass",
					"Scope: environment-only. No official wp-typia workspace root was detected, so this run only covered environment readiness. Re-run `wp-typia doctor` from a workspace root if you expected package metadata, inventory, or generated artifact checks.",
				),
			);
		}
		return checks;
	}

	checks.push(
		createDoctorScopeCheck(
			"pass",
			`Scope: full workspace diagnostics for ${workspace.workspace.namespace}. Environment readiness checks ran and workspace-scoped diagnostics are enabled for the package metadata, inventory, source-tree drift, and any configured migration hint rows below.`,
		),
	);

	let workspacePackageJson: WorkspacePackageJson;
	try {
		workspacePackageJson = parseWorkspacePackageJson(workspace.projectDir);
	} catch (error) {
		checks.push(
			createDoctorCheck(
				"Workspace package metadata",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
		return checks;
	}

	checks.push(checkWorkspacePackageMetadata(workspace, workspacePackageJson));

	try {
		const inventory = readWorkspaceInventory(workspace.projectDir);
		checks.push(
			createDoctorCheck(
				"Workspace inventory",
				"pass",
				`${inventory.blocks.length} block(s), ${inventory.variations.length} variation(s), ${inventory.patterns.length} pattern(s), ${inventory.bindingSources.length} binding source(s), ${inventory.restResources.length} REST resource(s), ${inventory.abilities.length} ability scaffold(s), ${inventory.aiFeatures.length} AI feature(s), ${inventory.editorPlugins.length} editor plugin(s), ${inventory.adminViews.length} admin view(s)`,
			),
		);

		for (const block of inventory.blocks) {
			checks.push(
				checkExistingFiles(
					workspace.projectDir,
					`Block ${block.slug}`,
					getWorkspaceBlockRequiredFiles(block),
				),
			);
			checks.push(checkWorkspaceBlockMetadata(workspace.projectDir, workspace, block));
			checks.push(checkWorkspaceBlockHooks(workspace.projectDir, block.slug));
			checks.push(checkWorkspaceBlockCollectionImport(workspace.projectDir, block.slug));
		}

		const registeredBlockSlugs = new Set(inventory.blocks.map((block) => block.slug));
		const variationTargetBlocks = new Set<string>();
		for (const variation of inventory.variations) {
			if (!registeredBlockSlugs.has(variation.block)) {
				checks.push(
					createDoctorCheck(
						`Variation ${variation.block}/${variation.slug}`,
						"fail",
						`Variation references unknown block "${variation.block}"`,
					),
				);
				continue;
			}

			variationTargetBlocks.add(variation.block);
			checks.push(
				checkExistingFiles(
					workspace.projectDir,
					`Variation ${variation.block}/${variation.slug}`,
					[variation.file],
				),
			);
		}
		for (const blockSlug of variationTargetBlocks) {
			checks.push(checkVariationEntrypoint(workspace.projectDir, blockSlug));
		}

		const shouldCheckPatternBootstrap =
			inventory.patterns.length > 0 ||
			fs.existsSync(path.join(workspace.projectDir, "src", "patterns"));
		if (shouldCheckPatternBootstrap) {
			checks.push(checkWorkspacePatternBootstrap(workspace.projectDir, workspace.packageName));
		}
		for (const pattern of inventory.patterns) {
			checks.push(
				checkExistingFiles(workspace.projectDir, `Pattern ${pattern.slug}`, [pattern.file]),
			);
		}

		if (inventory.bindingSources.length > 0) {
			checks.push(checkWorkspaceBindingBootstrap(workspace.projectDir, workspace.packageName));
			checks.push(
				checkWorkspaceBindingSourcesIndex(workspace.projectDir, inventory.bindingSources),
			);
		}
		for (const bindingSource of inventory.bindingSources) {
			checks.push(
				checkExistingFiles(workspace.projectDir, `Binding source ${bindingSource.slug}`, [
					bindingSource.serverFile,
					bindingSource.editorFile,
				]),
			);
		}

		if (inventory.restResources.length > 0) {
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

		const migrationWorkspaceCheck = checkMigrationWorkspaceHint(
			workspace,
			workspacePackageJson,
		);
		if (migrationWorkspaceCheck) {
			checks.push(migrationWorkspaceCheck);
		}
	} catch (error) {
		checks.push(
			createDoctorCheck(
				"Workspace inventory",
				"fail",
				error instanceof Error ? error.message : String(error),
			),
		);
	}

	return checks;
}
