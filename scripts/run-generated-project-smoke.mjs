#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../packages/create");
const entryPath = path.resolve(packageRoot, "dist/cli.js");
const PACKAGE_MANAGERS = {
	bun: {
		packageManagerField: "bun@1.3.10",
	},
	npm: {
		packageManagerField: "npm@11.6.1",
	},
	pnpm: {
		packageManagerField: "pnpm@8.3.1",
	},
	yarn: {
		packageManagerField: "yarn@3.2.4",
	},
};

function parseArgs(argv) {
	const parsed = {
		dataStorage: undefined,
		namespace: undefined,
		packageManager: undefined,
		persistencePolicy: undefined,
		phpPrefix: undefined,
		projectName: undefined,
		runtime: undefined,
		template: undefined,
		textDomain: undefined,
		variant: undefined,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		if (arg === "--runtime") {
			parsed.runtime = next;
			index += 1;
			continue;
		}
		if (arg === "--template") {
			parsed.template = next;
			index += 1;
			continue;
		}
		if (arg === "--package-manager") {
			parsed.packageManager = next;
			index += 1;
			continue;
		}
		if (arg === "--namespace") {
			parsed.namespace = next;
			index += 1;
			continue;
		}
		if (arg === "--text-domain") {
			parsed.textDomain = next;
			index += 1;
			continue;
		}
		if (arg === "--php-prefix") {
			parsed.phpPrefix = next;
			index += 1;
			continue;
		}
		if (arg === "--data-storage") {
			parsed.dataStorage = next;
			index += 1;
			continue;
		}
		if (arg === "--variant") {
			parsed.variant = next;
			index += 1;
			continue;
		}
		if (arg === "--project-name") {
			parsed.projectName = next;
			index += 1;
			continue;
		}
		if (arg === "--persistence-policy") {
			parsed.persistencePolicy = next;
			index += 1;
			continue;
		}

		throw new Error(`Unknown argument: ${arg}`);
	}

	return parsed;
}

function run(command, args, options = {}) {
	return execFileSync(command, args, {
		stdio: "inherit",
		...options,
	});
}

function getPackageManager(packageManager) {
	const manager = PACKAGE_MANAGERS[packageManager];
	if (!manager) {
		throw new Error(`Unknown package manager: ${packageManager}`);
	}

	return manager;
}

function ensureCreateWpTypiaBuilt() {
	const apiClientDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-api-client/dist/index.js",
	);
	const blockTypesDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-block-types/dist/index.js",
	);
	const blockRuntimeDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-block-runtime/dist/index.js",
	);
	const restDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-rest/dist/index.js",
	);
	const restReactDistPath = path.resolve(
		__dirname,
		"../packages/wp-typia-rest/dist/react.js",
	);
	const restReactDtsPath = path.resolve(
		__dirname,
		"../packages/wp-typia-rest/dist/react.d.ts",
	);
	if (
		fs.existsSync(entryPath) &&
		fs.existsSync(apiClientDistPath) &&
		fs.existsSync(blockRuntimeDistPath) &&
		fs.existsSync(blockTypesDistPath) &&
		fs.existsSync(restDistPath) &&
		fs.existsSync(restReactDistPath) &&
		fs.existsSync(restReactDtsPath)
	) {
		return;
	}

	run("bun", ["run", "--filter", "@wp-typia/api-client", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/block-types", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/block-runtime", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/rest", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
	run("bun", ["run", "--filter", "@wp-typia/create", "build"], {
		cwd: path.resolve(__dirname, ".."),
	});
}

function hasPhpBinary() {
	try {
		execFileSync("php", ["-v"], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function getRunCommand(packageManager) {
	switch (packageManager) {
		case "bun":
			return ["bun", ["run", "build"]];
		case "npm":
			return ["npm", ["run", "build"]];
		case "pnpm":
			return ["corepack", ["pnpm", "run", "build"]];
		default:
			return ["corepack", ["yarn", "run", "build"]];
	}
}

function getRunScriptCommand(packageManager, scriptName, extraArgs = []) {
	const scriptArgs = extraArgs.length > 0 ? [scriptName, "--", ...extraArgs] : [scriptName];

	switch (packageManager) {
		case "bun":
			return ["bun", ["run", ...scriptArgs]];
		case "npm":
			return ["npm", ["run", ...scriptArgs]];
		case "pnpm":
			return ["corepack", ["pnpm", "run", ...scriptArgs]];
		default:
			return ["corepack", ["yarn", "run", ...scriptArgs]];
	}
}

function getInstallCommand(packageManager) {
	switch (packageManager) {
		case "bun":
			return ["bun", ["install"]];
		case "npm":
			return ["npm", ["install"]];
		case "pnpm":
			return ["corepack", ["pnpm", "install"]];
		default:
			return ["corepack", ["yarn", "install"]];
	}
}

function ensureCorepackPackageManager(packageManager) {
	if (packageManager !== "pnpm" && packageManager !== "yarn") {
		return;
	}

	run("corepack", ["prepare", getPackageManager(packageManager).packageManagerField, "--activate"]);
}

function assertBuildArtifacts(projectDir, projectName) {
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
		if (contents.includes("@wp-typia/create/runtime/")) {
			throw new Error(`Found deprecated generated runtime import in ${currentPath}`);
		}
		if (contents.includes("@wp-typia/create/metadata-core")) {
			throw new Error(`Found deprecated generated metadata-core import in ${currentPath}`);
		}
	}
}

function assertGeneratedPackageBoundary(projectDir) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

	if (packageJson.dependencies?.["@wp-typia/create"]) {
		throw new Error("Expected generated project dependencies to omit @wp-typia/create");
	}
	if (packageJson.devDependencies?.["@wp-typia/create"]) {
		throw new Error("Expected generated project devDependencies to omit @wp-typia/create");
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
	const pathItem = openApi.paths?.[routePath];
	const getOperation = pathItem?.get;
	const postOperation = pathItem?.post;

	if (!getOperation || !postOperation) {
		throw new Error(`Expected GET and POST operations for ${routePath} in ${candidatePath}`);
	}

	if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${routePath} GET`);
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
	const pathItem = openApi.paths?.[routePath];
	const getOperation = pathItem?.get;
	const postOperation = pathItem?.post;

	if (!getOperation || !postOperation) {
		throw new Error(`Expected GET and POST operations for ${routePath} in ${openApiPath}`);
	}

	if (getOperation["x-wp-typia-authPolicy"] !== "public-read") {
		throw new Error(`Expected public-read auth policy on ${routePath} GET`);
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

function assertNoRawRenderedContentEcho(filePath) {
	const source = fs.readFileSync(filePath, "utf8");
	if (/echo\s*\(?\s*\$content\b/.test(source)) {
		throw new Error(`Expected ${filePath} to avoid raw $content echoes`);
	}
}

function rewriteWorkspaceDependencies(projectDir) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	const localApiClientDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-api-client")}`;
	const localBlockRuntimeDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-block-runtime")}`;
	const localBlockTypesDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-block-types")}`;
	const localRestDependency = `file:${path.resolve(__dirname, "../packages/wp-typia-rest")}`;

	if (packageJson.devDependencies?.["@wp-typia/api-client"]) {
		packageJson.devDependencies["@wp-typia/api-client"] = localApiClientDependency;
	}
	if (packageJson.devDependencies?.["@wp-typia/block-runtime"]) {
		packageJson.devDependencies["@wp-typia/block-runtime"] = localBlockRuntimeDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/api-client"]) {
		packageJson.dependencies["@wp-typia/api-client"] = localApiClientDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/block-runtime"]) {
		packageJson.dependencies["@wp-typia/block-runtime"] = localBlockRuntimeDependency;
	}
	if (packageJson.devDependencies?.["@wp-typia/block-types"]) {
		packageJson.devDependencies["@wp-typia/block-types"] = localBlockTypesDependency;
	}
	if (packageJson.devDependencies?.["@wp-typia/rest"]) {
		packageJson.devDependencies["@wp-typia/rest"] = localRestDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/block-types"]) {
		packageJson.dependencies["@wp-typia/block-types"] = localBlockTypesDependency;
	}
	if (packageJson.dependencies?.["@wp-typia/rest"]) {
		packageJson.dependencies["@wp-typia/rest"] = localRestDependency;
	}

	packageJson.overrides = {
		...(packageJson.overrides ?? {}),
		"@wp-typia/block-runtime": localBlockRuntimeDependency,
		"@wp-typia/api-client": localApiClientDependency,
		"@wp-typia/block-types": localBlockTypesDependency,
		"@wp-typia/rest": localRestDependency,
	};
	packageJson.pnpm = {
		...(packageJson.pnpm ?? {}),
		overrides: {
			...(packageJson.pnpm?.overrides ?? {}),
			"@wp-typia/block-runtime": localBlockRuntimeDependency,
			"@wp-typia/api-client": localApiClientDependency,
			"@wp-typia/block-types": localBlockTypesDependency,
			"@wp-typia/rest": localRestDependency,
		},
	};
	packageJson.resolutions = {
		...(packageJson.resolutions ?? {}),
		"@wp-typia/block-runtime": localBlockRuntimeDependency,
		"@wp-typia/api-client": localApiClientDependency,
		"@wp-typia/block-types": localBlockTypesDependency,
		"@wp-typia/rest": localRestDependency,
	};

	fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function main() {
	const {
		runtime,
		template,
		packageManager,
		projectName,
		variant,
		dataStorage,
		persistencePolicy,
		namespace,
		textDomain,
		phpPrefix,
	} = parseArgs(process.argv.slice(2));

	if (!runtime || !template || !packageManager || !projectName) {
		throw new Error(
			"Usage: node scripts/run-generated-project-smoke.mjs --runtime <node|bun> --template <id> [--variant <name>] [--namespace <value>] [--text-domain <value>] [--php-prefix <value>] [--data-storage <post-meta|custom-table>] [--persistence-policy <authenticated|public>] --package-manager <id> --project-name <name>",
		);
	}

	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-generated-smoke-"));
	const projectDir = path.join(tempRoot, projectName);

	try {
		ensureCreateWpTypiaBuilt();

		run(runtime, [
			entryPath,
			projectDir,
			"--template",
			template,
			...(variant ? ["--variant", variant] : []),
			...(namespace ? ["--namespace", namespace] : []),
			...(textDomain ? ["--text-domain", textDomain] : []),
			...(phpPrefix ? ["--php-prefix", phpPrefix] : []),
			...(dataStorage ? ["--data-storage", dataStorage] : []),
			...(persistencePolicy ? ["--persistence-policy", persistencePolicy] : []),
			"--yes",
			"--no-install",
			"--package-manager",
			packageManager,
		]);

		const packageJson = JSON.parse(fs.readFileSync(path.join(projectDir, "package.json"), "utf8"));
		const expectedPackageManager = getPackageManager(packageManager).packageManagerField;
		if (packageJson.packageManager !== expectedPackageManager) {
			throw new Error(
				`Expected packageManager ${expectedPackageManager}, received ${packageJson.packageManager}`,
			);
		}

		rewriteWorkspaceDependencies(projectDir);

		ensureCorepackPackageManager(packageManager);

		const [installCommand, installArgs] = getInstallCommand(packageManager);
		run(installCommand, installArgs, {
			cwd: projectDir,
			env: {
				...process.env,
				...(packageManager === "yarn"
					? { YARN_ENABLE_IMMUTABLE_INSTALLS: "false" }
					: {}),
			},
		});

		const [buildCommand, buildArgs] = getRunCommand(packageManager);
		run(buildCommand, buildArgs, { cwd: projectDir });

		if (template === "compound") {
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
				namespace ?? projectName,
				persistencePolicy ?? "authenticated",
			);
		}
		if (template === "compound" && (dataStorage || persistencePolicy)) {
			assertCompoundPersistenceArtifacts(projectDir, projectName);
			assertCompoundRestOpenApi(
				projectDir,
				projectName,
				namespace ?? projectName,
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
	} finally {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	}
}

main();
