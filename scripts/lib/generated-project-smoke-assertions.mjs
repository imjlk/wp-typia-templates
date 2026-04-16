import fs from "node:fs";
import path from "node:path";

import {
	hasPhpBinary,
	normalizeBlockSlug,
	run,
} from "./generated-project-smoke-core.mjs";

function listSourceBlockSlugs(projectDir) {
	const sourceBlocksDir = path.join(projectDir, "src", "blocks");
	if (!fs.existsSync(sourceBlocksDir)) {
		return [];
	}

	return fs
		.readdirSync(sourceBlocksDir, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

function assertBuildArtifacts(projectDir, projectName) {
	const blockSlugs = listSourceBlockSlugs(projectDir);
	if (blockSlugs.length > 0) {
		for (const blockSlug of blockSlugs) {
			const buildDir = path.join(projectDir, "build", "blocks", blockSlug);
			for (const artifact of [
				"block.json",
				"typia.manifest.json",
				"typia-validator.php",
			]) {
				if (!fs.existsSync(path.join(buildDir, artifact))) {
					throw new Error(
						`Expected ${buildDir} to include ${artifact} for example-project smoke`,
					);
				}
			}
		}

		return;
	}

	const candidateDirs = [
		path.join(projectDir, "build", projectName),
		path.join(projectDir, "build"),
	];

	for (const artifact of ["block.json", "typia.manifest.json", "typia-validator.php"]) {
		const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
		if (!found) {
			throw new Error(
				`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`,
			);
		}
	}
}

export function collectProjectFilePaths(projectDir, fileName) {
	const pending = [projectDir];
	const matchedPaths = [];

	while (pending.length > 0) {
		const currentDir = pending.pop();
		if (!currentDir) {
			continue;
		}

		for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
			if (entry.name === "node_modules") {
				continue;
			}

			const entryPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				pending.push(entryPath);
				continue;
			}
			if (entry.isFile() && entry.name === fileName) {
				matchedPaths.push(entryPath);
			}
		}
	}

	return matchedPaths.sort();
}

const blockMetadataFileFields = [
	"editorScript",
	"script",
	"scriptModule",
	"viewScript",
	"viewScriptModule",
	"style",
	"editorStyle",
	"render",
];

function collectBlockMetadataPaths(buildRoot) {
	if (!fs.existsSync(buildRoot)) {
		return [];
	}

	const pending = [buildRoot];
	const blockMetadataPaths = [];

	while (pending.length > 0) {
		const currentDir = pending.pop();
		for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
			const entryPath = path.join(currentDir, entry.name);
			if (entry.isDirectory()) {
				pending.push(entryPath);
				continue;
			}
			if (entry.isFile() && entry.name === "block.json") {
				blockMetadataPaths.push(entryPath);
			}
		}
	}

	return blockMetadataPaths.sort();
}

function normalizeBlockMetadataFileRefs(value) {
	if (typeof value === "string") {
		return value.startsWith("file:./") ? [value.slice("file:./".length)] : [];
	}
	if (Array.isArray(value)) {
		return value.flatMap((item) => normalizeBlockMetadataFileRefs(item));
	}

	return [];
}

function assertBlockMetadataFileReferences(projectDir) {
	const buildRoot = path.join(projectDir, "build");

	for (const blockMetadataPath of collectBlockMetadataPaths(buildRoot)) {
		const blockMetadata = JSON.parse(fs.readFileSync(blockMetadataPath, "utf8"));
		const blockDir = path.dirname(blockMetadataPath);

		for (const field of blockMetadataFileFields) {
			for (const relativePath of normalizeBlockMetadataFileRefs(blockMetadata[field])) {
				const assetPath = path.join(blockDir, relativePath);
				if (!fs.existsSync(assetPath)) {
					throw new Error(
						`Expected ${field} asset ${relativePath} referenced by ${blockMetadataPath} to exist at ${assetPath}`,
					);
				}
			}
		}
	}
}

function assertGeneratedRuntimeImports(projectDir) {
	const pending = [
		path.join(projectDir, "src"),
		path.join(projectDir, "scripts"),
		path.join(projectDir, "webpack.config.js"),
	];

	while (pending.length > 0) {
		const currentPath = pending.pop();
		if (!currentPath || !fs.existsSync(currentPath)) {
			continue;
		}

		const stat = fs.statSync(currentPath);
		if (stat.isDirectory()) {
			for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
				pending.push(path.join(currentPath, entry.name));
			}
			continue;
		}

		if (!/\.(?:[cm]?[jt]sx?|json)$/.test(currentPath)) {
			continue;
		}

		const contents = fs.readFileSync(currentPath, "utf8");
		if (contents.includes("@wp-typia/project-tools/runtime/")) {
			throw new Error(`Found deprecated generated runtime import in ${currentPath}`);
		}
		if (contents.includes("@wp-typia/project-tools/schema-core")) {
			throw new Error(`Found deprecated generated schema-core import in ${currentPath}`);
		}
		if (contents.includes("@wp-typia/create/")) {
			throw new Error(`Found deprecated legacy create import in ${currentPath}`);
		}
	}
}

function assertGeneratedPackageBoundary(projectDir) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

	if (packageJson.dependencies?.["@wp-typia/project-tools"]) {
		throw new Error("Expected generated project dependencies to omit @wp-typia/project-tools");
	}
	if (packageJson.devDependencies?.["@wp-typia/project-tools"]) {
		throw new Error("Expected generated project devDependencies to omit @wp-typia/project-tools");
	}
	for (const [scriptName, scriptValue] of Object.entries(packageJson.scripts ?? {})) {
		if (typeof scriptValue !== "string") {
			continue;
		}
		if (!scriptValue.includes("wp-typia")) {
			continue;
		}
		if (scriptName.startsWith("migration:")) {
			if (!/wp-typia@\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?/u.test(scriptValue)) {
				throw new Error(
					`Expected generated migration script "${scriptName}" to pin wp-typia`,
				);
			}
			continue;
		}
		if (scriptValue.includes("wp-typia")) {
			throw new Error(
				`Expected generated project script "${scriptName}" to avoid wp-typia`,
			);
		}
	}
}

function assertBasicTemplateScaffold(projectDir) {
	const blockJsonPath = path.join(projectDir, "src", "block.json");
	const savePath = path.join(projectDir, "src", "save.tsx");
	const blockJson = JSON.parse(fs.readFileSync(blockJsonPath, "utf8"));
	const saveSource = fs.readFileSync(savePath, "utf8");

	if (blockJson.editorStyle !== "file:./index.css") {
		throw new Error("Expected basic scaffold block.json to include editorStyle: file:./index.css");
	}
	if ("version" in (blockJson.attributes ?? {})) {
		throw new Error("Expected basic scaffold attributes to use schemaVersion instead of version");
	}
	if (!("schemaVersion" in (blockJson.attributes ?? {}))) {
		throw new Error("Expected basic scaffold attributes to include schemaVersion");
	}
	if (saveSource.includes("return null;")) {
		throw new Error("Expected basic scaffold save.tsx to serialize stable markup instead of returning null");
	}
}

function assertPersistenceTemplateArtifacts(projectDir, projectName) {
	const candidateDirs = [
		path.join(projectDir, "build", projectName),
		path.join(projectDir, "build"),
	];

	for (const artifact of [
		path.join("api-schemas", "bootstrap-query.schema.json"),
		path.join("api-schemas", "bootstrap-response.schema.json"),
		"typia.schema.json",
		"typia.openapi.json",
		path.join("api-schemas", "state-query.schema.json"),
		path.join("api-schemas", "state-response.schema.json"),
		path.join("api-schemas", "write-state-request.schema.json"),
	]) {
		const found = candidateDirs.some((dir) => fs.existsSync(path.join(dir, artifact)));
		if (!found) {
			throw new Error(`Expected ${artifact} in one of: ${candidateDirs.join(", ")}`);
		}
	}
}

function findFirstExistingPath(paths) {
	return paths.find((candidatePath) => fs.existsSync(candidatePath));
}

function readJsonFile(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assertPersistenceRestOpenApi(projectDir, projectName, namespace, persistencePolicy) {
	const candidatePath = findFirstExistingPath([
		path.join(projectDir, "build", projectName, "api.openapi.json"),
		path.join(projectDir, "build", "api.openapi.json"),
	]);

	if (!candidatePath) {
		throw new Error("Expected aggregate REST OpenAPI document for persistence scaffold");
	}

	const openApi = readJsonFile(candidatePath);
	const routePath = `/${namespace}/v1/${projectName}/state`;
	const bootstrapPath = `/${namespace}/v1/${projectName}/bootstrap`;
	const pathItem = openApi.paths?.[routePath];
	const bootstrapPathItem = openApi.paths?.[bootstrapPath];
	const getOperation = pathItem?.get;
	const postOperation = pathItem?.post;
	const bootstrapOperation = bootstrapPathItem?.get;

	if (!getOperation || !postOperation) {
		throw new Error(`Expected GET and POST operations for ${routePath} in ${candidatePath}`);
	}
	if (!bootstrapOperation) {
		throw new Error(`Expected GET operation for ${bootstrapPath} in ${candidatePath}`);
	}

	if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${routePath} GET`);
	}
	if (bootstrapOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${bootstrapPath} GET`);
	}

	if (persistencePolicy === "public") {
		if (postOperation["x-wp-typia-authPolicy"] !== "public-signed-token") {
			throw new Error(`Expected public-signed-token auth policy on ${routePath} POST`);
		}
		if (postOperation["x-wp-typia-publicTokenField"] !== "publicWriteToken") {
			throw new Error(`Expected publicWriteToken metadata on ${routePath} POST`);
		}
	} else {
		const securityScheme = openApi.components?.securitySchemes?.wpRestNonce;
		if (!securityScheme) {
			throw new Error("Expected wpRestNonce security scheme in aggregate REST OpenAPI");
		}
		if (postOperation["x-wp-typia-authPolicy"] !== "authenticated-rest-nonce") {
			throw new Error(`Expected authenticated-rest-nonce auth policy on ${routePath} POST`);
		}
	}
}

function assertCompoundTemplateArtifacts(projectDir, projectName) {
	const parentDir = path.join(projectDir, "build", "blocks", projectName);
	const childDir = path.join(projectDir, "build", "blocks", `${projectName}-item`);

	for (const dir of [parentDir, childDir]) {
		for (const artifact of ["block.json", "typia.manifest.json", "typia-validator.php"]) {
			if (!fs.existsSync(path.join(dir, artifact))) {
				throw new Error(`Expected ${artifact} in ${dir}`);
			}
		}
	}
}

function assertCompoundPersistenceArtifacts(projectDir, projectName) {
	const parentDir = path.join(projectDir, "build", "blocks", projectName);

	for (const artifact of [
		path.join("api-schemas", "bootstrap-query.schema.json"),
		path.join("api-schemas", "bootstrap-response.schema.json"),
		"typia.schema.json",
		"typia.openapi.json",
		path.join("api-schemas", "state-query.schema.json"),
		path.join("api-schemas", "state-response.schema.json"),
		path.join("api-schemas", "write-state-request.schema.json"),
	]) {
		if (!fs.existsSync(path.join(parentDir, artifact))) {
			throw new Error(`Expected ${artifact} in ${parentDir}`);
		}
	}
}

function assertCompoundRestOpenApi(projectDir, projectName, namespace, persistencePolicy) {
	const parentDir = path.join(projectDir, "build", "blocks", projectName);
	const openApiPath = path.join(parentDir, "api.openapi.json");

	if (!fs.existsSync(openApiPath)) {
		throw new Error(`Expected aggregate REST OpenAPI document in ${parentDir}`);
	}

	const openApi = readJsonFile(openApiPath);
	const routePath = `/${namespace}/v1/${projectName}/state`;
	const bootstrapPath = `/${namespace}/v1/${projectName}/bootstrap`;
	const pathItem = openApi.paths?.[routePath];
	const bootstrapPathItem = openApi.paths?.[bootstrapPath];
	const getOperation = pathItem?.get;
	const postOperation = pathItem?.post;
	const bootstrapOperation = bootstrapPathItem?.get;

	if (!getOperation || !postOperation) {
		throw new Error(`Expected GET and POST operations for ${routePath} in ${openApiPath}`);
	}
	if (!bootstrapOperation) {
		throw new Error(`Expected GET operation for ${bootstrapPath} in ${openApiPath}`);
	}

	if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${routePath} GET`);
	}
	if (bootstrapOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${bootstrapPath} GET`);
	}

	if (persistencePolicy === "public") {
		if (postOperation["x-wp-typia-authPolicy"] !== "public-signed-token") {
			throw new Error(`Expected public-signed-token auth policy on ${routePath} POST`);
		}
		if (postOperation["x-wp-typia-publicTokenField"] !== "publicWriteToken") {
			throw new Error(`Expected publicWriteToken metadata on ${routePath} POST`);
		}
	} else {
		const securityScheme = openApi.components?.securitySchemes?.wpRestNonce;
		if (!securityScheme) {
			throw new Error(`Expected wpRestNonce security scheme in aggregate REST OpenAPI for ${routePath}`);
		}
		if (postOperation["x-wp-typia-authPolicy"] !== "authenticated-rest-nonce") {
			throw new Error(`Expected authenticated-rest-nonce auth policy on ${routePath} POST`);
		}
	}
}

function lintPhpArtifact(filePath) {
	if (!hasPhpBinary()) {
		return;
	}

	run("php", ["-l", filePath], {
		stdio: "ignore",
	});
}

function assertPluginBootstrapHardening(filePath) {
	const source = fs.readFileSync(filePath, "utf8");

	for (const expectedSnippet of [
		"Tested up to:",
		"Domain Path:",
		"load_plugin_textdomain(",
	]) {
		if (!source.includes(expectedSnippet)) {
			throw new Error(`Expected ${filePath} to include "${expectedSnippet}"`);
		}
	}
}

function assertPluginBootstrapExists(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`Expected generated project to include plugin bootstrap: ${filePath}`);
	}
}

function assertWorkspaceTemplateScaffold(projectDir) {
	const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));

	if (packageJson.wpTypia?.projectType !== "workspace") {
		throw new Error("Expected generated workspace package.json to include wpTypia.projectType = workspace");
	}
	if (
		packageJson.wpTypia?.templatePackage !== "@wp-typia/create-workspace-template"
	) {
		throw new Error("Expected generated workspace package.json to record the official workspace template package");
	}
	if (!fs.existsSync(path.join(projectDir, "scripts", "build-workspace.mjs"))) {
		throw new Error("Expected official workspace template to include scripts/build-workspace.mjs");
	}
}

function isWorkspaceTemplateRequest(template, packageJson) {
	return (
		template === "workspace" ||
		template === "@wp-typia/create-workspace-template" ||
		packageJson.wpTypia?.projectType === "workspace"
	);
}

function assertWorkspaceBlockArtifacts(projectDir, blockSlugs) {
	for (const slug of blockSlugs) {
		const blockDir = path.join(projectDir, "build", "blocks", slug);
		if (!fs.existsSync(path.join(blockDir, "block.json"))) {
			throw new Error(`Expected workspace build to include ${slug}/block.json`);
		}
		if (!fs.existsSync(path.join(blockDir, "typia.manifest.json"))) {
			throw new Error(`Expected workspace build to include ${slug}/typia.manifest.json`);
		}
		if (!fs.existsSync(path.join(blockDir, "typia-validator.php"))) {
			throw new Error(`Expected workspace build to include ${slug}/typia-validator.php`);
		}
	}

	if (!fs.existsSync(path.join(projectDir, "build", "blocks-manifest.php"))) {
		throw new Error("Expected workspace build to include blocks-manifest.php");
	}
}

function assertWorkspaceVariationArtifacts(projectDir, blockSlug, variationSlug) {
	const variationPath = path.join(
		projectDir,
		"src",
		"blocks",
		blockSlug,
		"variations",
		`${variationSlug}.ts`,
	);
	if (!fs.existsSync(variationPath)) {
		throw new Error(`Expected workspace variation to exist at ${variationPath}`);
	}
}

function assertWorkspacePatternArtifacts(projectDir, patternSlug) {
	const patternPath = path.join(projectDir, "src", "patterns", `${patternSlug}.php`);
	if (!fs.existsSync(patternPath)) {
		throw new Error(`Expected workspace pattern to exist at ${patternPath}`);
	}

	lintPhpArtifact(patternPath);
}

function assertWorkspaceBindingSourceArtifacts(projectDir, bindingSourceSlug) {
	const bindingSourceDir = path.join(projectDir, "src", "bindings", bindingSourceSlug);
	const serverPath = path.join(bindingSourceDir, "server.php");
	const editorPath = path.join(bindingSourceDir, "editor.ts");

	if (!fs.existsSync(serverPath)) {
		throw new Error(`Expected workspace binding source server file at ${serverPath}`);
	}
	if (!fs.existsSync(editorPath)) {
		throw new Error(`Expected workspace binding source editor file at ${editorPath}`);
	}
	if (!fs.existsSync(path.join(projectDir, "build", "bindings", "index.js"))) {
		throw new Error("Expected workspace build to include build/bindings/index.js");
	}
	if (!fs.existsSync(path.join(projectDir, "build", "bindings", "index.asset.php"))) {
		throw new Error("Expected workspace build to include build/bindings/index.asset.php");
	}

	lintPhpArtifact(serverPath);
}

function assertWorkspaceHookedBlockArtifacts(projectDir, blockSlug, anchorBlockName, position) {
	const blockJsonPath = path.join(projectDir, "src", "blocks", blockSlug, "block.json");
	if (!fs.existsSync(blockJsonPath)) {
		throw new Error(`Expected hooked workspace block metadata at ${blockJsonPath}`);
	}

	const blockJson = readJsonFile(blockJsonPath);
	if (blockJson.blockHooks?.[anchorBlockName] !== position) {
		throw new Error(
			`Expected ${blockJsonPath} to define blockHooks.${anchorBlockName} = ${position}`,
		);
	}
}

function assertNoRawRenderedContentEcho(filePath) {
	const source = fs.readFileSync(filePath, "utf8");
	if (/echo\s*\(?\s*\$content\b/.test(source)) {
		throw new Error(`Expected ${filePath} to avoid raw $content echoes`);
	}
}

export function assertExampleProjectScaffold(projectDir, exampleProject) {
	const packageJson = readJsonFile(path.join(projectDir, "package.json"));
	const blockJsonPath = path.join(projectDir, "block.json");
	const pluginBootstrapPath = path.join(projectDir, `${exampleProject}.php`);
	const blockSlugs = listSourceBlockSlugs(projectDir);

	if (blockSlugs.length === 0 && !fs.existsSync(blockJsonPath)) {
		throw new Error(`Expected example project block.json at ${blockJsonPath}`);
	}
	if (!fs.existsSync(pluginBootstrapPath)) {
		throw new Error(`Expected example project bootstrap at ${pluginBootstrapPath}`);
	}
	if (
		exampleProject === "my-typia-block" &&
		typeof packageJson.scripts?.["migration:doctor"] !== "string"
	) {
		throw new Error("Expected example project to expose migration:doctor");
	}

	assertPluginBootstrapExists(pluginBootstrapPath);
	assertPluginBootstrapHardening(pluginBootstrapPath);
	for (const renderPath of collectProjectFilePaths(projectDir, "render.php")) {
		assertNoRawRenderedContentEcho(renderPath);
	}
	assertBuildArtifacts(projectDir, exampleProject);
	assertBlockMetadataFileReferences(projectDir);
	assertGeneratedRuntimeImports(projectDir);
}

export function shouldRunMigrationSmoke(projectDir, packageJson) {
	return (
		typeof packageJson.scripts?.["migration:doctor"] === "string" ||
		fs.existsSync(path.join(projectDir, "src", "migrations", "config.ts"))
	);
}

export function assertGeneratedProjectScaffold({
	addBindingSourceName,
	addBlockName,
	addHookedBlockAnchor,
	addHookedBlockPosition,
	addHookedBlockSlug,
	addPatternName,
	addTemplate,
	addVariationBlock,
	addVariationName,
	dataStorage,
	namespace,
	packageJson,
	persistencePolicy,
	projectDir,
	projectName,
	template,
}) {
	if (isWorkspaceTemplateRequest(template, packageJson)) {
		assertWorkspaceTemplateScaffold(projectDir);
		assertWorkspaceBlockArtifacts(
			projectDir,
			addTemplate === "compound"
				? [
						normalizeBlockSlug(addBlockName ?? ""),
						`${normalizeBlockSlug(addBlockName ?? "")}-item`,
					].filter(Boolean)
				: addBlockName
					? [normalizeBlockSlug(addBlockName)]
					: [],
		);
		if (addVariationName && addVariationBlock) {
			assertWorkspaceVariationArtifacts(
				projectDir,
				normalizeBlockSlug(addVariationBlock),
				normalizeBlockSlug(addVariationName),
			);
		}
		if (addPatternName) {
			assertWorkspacePatternArtifacts(projectDir, normalizeBlockSlug(addPatternName));
		}
		if (addBindingSourceName) {
			assertWorkspaceBindingSourceArtifacts(
				projectDir,
				normalizeBlockSlug(addBindingSourceName),
			);
		}
		if (addHookedBlockSlug && addHookedBlockAnchor && addHookedBlockPosition) {
			assertWorkspaceHookedBlockArtifacts(
				projectDir,
				normalizeBlockSlug(addHookedBlockSlug),
				addHookedBlockAnchor,
				addHookedBlockPosition,
			);
		}
	} else if (template === "compound") {
		assertCompoundTemplateArtifacts(projectDir, projectName);
	} else {
		assertBuildArtifacts(projectDir, projectName);
	}

	assertBlockMetadataFileReferences(projectDir);
	assertGeneratedRuntimeImports(projectDir);
	assertGeneratedPackageBoundary(projectDir);
	if (template === "basic") {
		assertBasicTemplateScaffold(projectDir);
	}
	if (template === "persistence") {
		assertPersistenceTemplateArtifacts(projectDir, projectName);
		assertPersistenceRestOpenApi(
			projectDir,
			projectName,
			namespace ?? normalizeBlockSlug(projectName),
			persistencePolicy ?? "authenticated",
		);
	}
	if (template === "compound" && (dataStorage || persistencePolicy)) {
		assertCompoundPersistenceArtifacts(projectDir, projectName);
		assertCompoundRestOpenApi(
			projectDir,
			projectName,
			namespace ?? normalizeBlockSlug(projectName),
			persistencePolicy ?? "authenticated",
		);
	}

	const pluginBootstrapPath = path.join(projectDir, `${projectName}.php`);
	assertPluginBootstrapExists(pluginBootstrapPath);
	for (const artifact of [
		pluginBootstrapPath,
		path.join(projectDir, "inc", "rest-shared.php"),
		path.join(projectDir, "inc", "rest-auth.php"),
		path.join(projectDir, "inc", "rest-public.php"),
		path.join(projectDir, "src", "render.php"),
		path.join(projectDir, "src", "blocks", projectName, "render.php"),
		path.join(projectDir, "build", projectName, "typia-validator.php"),
		path.join(projectDir, "build", projectName, "render.php"),
		path.join(projectDir, "build", "typia-validator.php"),
		path.join(projectDir, "build", "render.php"),
		path.join(projectDir, "build", "blocks", projectName, "typia-validator.php"),
		path.join(projectDir, "build", "blocks", projectName, "render.php"),
		path.join(projectDir, "build", "blocks", `${projectName}-item`, "typia-validator.php"),
		path.join(projectDir, "build", "blocks", `${projectName}-item`, "render.php"),
	]) {
		if (fs.existsSync(artifact)) {
			lintPhpArtifact(artifact);
			if (artifact === path.join(projectDir, `${projectName}.php`)) {
				assertPluginBootstrapHardening(artifact);
			}
			if (artifact.endsWith("render.php")) {
				assertNoRawRenderedContentEcho(artifact);
			}
		}
	}
}
