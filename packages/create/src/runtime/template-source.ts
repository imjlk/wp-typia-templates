/// <reference path="./external-template-modules.d.ts" />

import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import npa from "npm-package-arg";
import semver from "semver";
import { x as extractTarball } from "tar";

import {
	BUILTIN_TEMPLATE_IDS,
	SHARED_BASE_TEMPLATE_ROOT,
	TEMPLATE_ROOT,
	isBuiltInTemplateId,
	type BuiltInTemplateId,
} from "./template-registry.js";
import { isPlainObject } from "./object-utils.js";
import { resolveBuiltInTemplateSource } from "./template-builtins.js";
import { getPackageVersions } from "./package-versions.js";
import { toSegmentPascalCase } from "./string-case.js";
import { copyRawDirectory, copyRenderedDirectory } from "./template-render.js";

const EXTERNAL_TEMPLATE_ENTRY_CANDIDATES = ["index.js", "index.cjs", "index.mjs"] as const;
const TEMPLATE_WARNING_MESSAGE =
	"wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.";
const REMOVED_BUILTIN_TEMPLATE_IDS = ["data", "persisted"] as const;

type TemplateSourceFormat = "wp-typia" | "create-block-external" | "create-block-subset";

/**
 * Public template variables exposed to external template seeds before wp-typia
 * normalizes them into a scaffold project.
 */
export interface TemplateVariableContext extends Record<string, unknown> {
	/** Version string for `@wp-typia/api-client` used in generated dependencies. */
	apiClientPackageVersion: string;
	/** Version string for `@wp-typia/block-runtime` used in generated dependencies. */
	blockRuntimePackageVersion: string;
	/** Version string for `@wp-typia/block-types` used in generated dependencies. */
	blockTypesPackageVersion: string;
	/** PascalCase block type name derived from the scaffold slug. */
	pascalCase: string;
	/** Snake_case PHP symbol prefix used for generated functions, constants, and keys. */
	phpPrefix: string;
	/** Human-readable block title. */
	title: string;
	/** Human-readable project or block description. */
	description: string;
	/** Keyword string derived from the slug for generated block metadata. */
	keyword: string;
	/** Block namespace used in generated block names such as `namespace/slug`. */
	namespace: string;
	/** Kebab-case scaffold slug used for package names, paths, and block slugs. */
	slug: string;
	/** Kebab-case text domain used for generated i18n strings and plugin headers. */
	textDomain: string;
}

export interface ResolvedTemplateSource {
	id: string;
	defaultCategory: string;
	description: string;
	features: string[];
	format: TemplateSourceFormat;
	templateDir: string;
	cleanup?: () => Promise<void>;
	selectedVariant?: string | null;
	warnings?: string[];
}

interface GitHubTemplateLocator {
	owner: string;
	repo: string;
	ref: string | null;
	sourcePath: string;
}

interface NpmTemplateLocator {
	fetchSpec: string;
	name: string;
	raw: string;
	type: string;
}

interface ExternalTemplateConfig {
	assetsPath?: string;
	blockTemplatesPath?: string;
	defaultValues?: Record<string, unknown>;
	folderName?: string;
	transformer?: (view: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
	variants?: Record<string, Record<string, unknown>>;
}

interface SeedSource {
	assetsDir?: string;
	blockDir: string;
	cleanup?: () => Promise<void>;
	rootDir: string;
	selectedVariant?: string | null;
	warnings?: string[];
}

type RemoteTemplateLocator =
	| { kind: "github"; locator: GitHubTemplateLocator }
	| { kind: "npm"; locator: NpmTemplateLocator }
	| { kind: "path"; templatePath: string };

function isTemplatePathLocator(templateId: string): boolean {
	return path.isAbsolute(templateId) || templateId.startsWith("./") || templateId.startsWith("../");
}

function getTemplateWarning(key: string): string {
	return `Ignoring external template config key "${key}": ${TEMPLATE_WARNING_MESSAGE}`;
}

function resolveSourceSubpath(sourceDir: string, relativePath: string): string {
	const targetPath = path.resolve(sourceDir, relativePath);
	const relativeTarget = path.relative(sourceDir, targetPath);
	if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
		throw new Error(`Template path "${relativePath}" must stay within ${sourceDir}.`);
	}
	return targetPath;
}

function getExternalTemplateEntry(sourceDir: string): string | null {
	for (const filename of EXTERNAL_TEMPLATE_ENTRY_CANDIDATES) {
		const candidate = path.join(sourceDir, filename);
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}

	return null;
}

function selectRegistryVersion(
	metadata: Record<string, unknown>,
	locator: NpmTemplateLocator,
): string {
	const distTags = isPlainObject(metadata["dist-tags"]) ? metadata["dist-tags"] : {};
	const versions = isPlainObject(metadata.versions) ? metadata.versions : {};
	const versionKeys = Object.keys(versions);

	if (locator.type === "version") {
		if (!versions[locator.fetchSpec]) {
			throw new Error(`npm template package version not found: ${locator.raw}`);
		}
		return locator.fetchSpec;
	}

	if (locator.type === "tag") {
		const taggedVersion = distTags[locator.fetchSpec];
		if (typeof taggedVersion !== "string") {
			throw new Error(`npm template package tag not found: ${locator.raw}`);
		}
		return taggedVersion;
	}

	const range = locator.fetchSpec.trim().length > 0 ? locator.fetchSpec : "*";
	const matchedVersion = semver.maxSatisfying(versionKeys, range);
	if (matchedVersion) {
		return matchedVersion;
	}

	if (locator.fetchSpec.trim().length > 0) {
		throw new Error(
			`Unable to resolve npm template version for ${locator.raw}. Requested "${locator.fetchSpec}" but available versions are: ${versionKeys.join(", ") || "(none)"}.`,
		);
	}

	const latestVersion = distTags.latest;
	if (typeof latestVersion === "string" && versions[latestVersion]) {
		return latestVersion;
	}

	throw new Error(`Unable to resolve a published npm template version for ${locator.raw}.`);
}

async function fetchNpmTemplateSource(locator: NpmTemplateLocator): Promise<SeedSource> {
	const registryBase = (process.env.NPM_CONFIG_REGISTRY ?? "https://registry.npmjs.org").replace(/\/$/, "");
	const metadataResponse = await fetch(`${registryBase}/${encodeURIComponent(locator.name)}`);
	if (!metadataResponse.ok) {
		throw new Error(`Failed to fetch npm template metadata for ${locator.raw}: ${metadataResponse.status}`);
	}

	const metadata = (await metadataResponse.json()) as Record<string, unknown>;
	const resolvedVersion = selectRegistryVersion(metadata, locator);
	const versions = isPlainObject(metadata.versions) ? metadata.versions : {};
	const versionMetadata = versions[resolvedVersion];
	if (!isPlainObject(versionMetadata) || !isPlainObject(versionMetadata.dist)) {
		throw new Error(`npm template metadata is missing dist information for ${locator.raw}@${resolvedVersion}.`);
	}

	const tarballUrl = versionMetadata.dist.tarball;
	if (typeof tarballUrl !== "string" || tarballUrl.length === 0) {
		throw new Error(`npm template metadata is missing tarball URL for ${locator.raw}@${resolvedVersion}.`);
	}

	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-source-"));
	const cleanup = async () => {
		await fsp.rm(tempRoot, { force: true, recursive: true });
	};

	try {
		const tarballResponse = await fetch(tarballUrl);
		if (!tarballResponse.ok) {
			throw new Error(`Failed to download npm template tarball for ${locator.raw}: ${tarballResponse.status}`);
		}

		const tarballPath = path.join(tempRoot, "template.tgz");
		const unpackDir = path.join(tempRoot, "source");
		await fsp.mkdir(unpackDir, { recursive: true });
		await fsp.writeFile(tarballPath, Buffer.from(await tarballResponse.arrayBuffer()));
		await extractTarball({
			cwd: unpackDir,
			file: tarballPath,
			strip: 1,
		});
		await assertNoSymlinks(unpackDir);

		return {
			blockDir: unpackDir,
			cleanup,
			rootDir: unpackDir,
		};
	} catch (error) {
		await cleanup();
		throw error;
	}
}

export function parseGitHubTemplateLocator(templateId: string): GitHubTemplateLocator | null {
	if (!templateId.startsWith("github:")) {
		return null;
	}

	const [locatorBody, refSegment] = templateId.slice("github:".length).split("#", 2);
	const segments = locatorBody.split("/").filter(Boolean);
	if (segments.length < 3) {
		throw new Error(
			`GitHub template locators must look like github:owner/repo/path[#ref]. Received: ${templateId}`,
		);
	}

	const [owner, repo, ...sourcePathSegments] = segments;
	return {
		owner,
		repo,
		ref: refSegment ?? null,
		sourcePath: sourcePathSegments.join("/"),
	};
}

export function parseNpmTemplateLocator(templateId: string): NpmTemplateLocator | null {
	if (isBuiltInTemplateId(templateId) || isTemplatePathLocator(templateId) || templateId.startsWith("github:")) {
		return null;
	}

	try {
		const parsed = npa(templateId);
		if (!parsed.registry || !parsed.name) {
			return null;
		}

		return {
			fetchSpec: typeof parsed.fetchSpec === "string" ? parsed.fetchSpec : "",
			name: parsed.name,
			raw: templateId,
			type: parsed.type,
		};
	} catch {
		return null;
	}
}

export function parseTemplateLocator(templateId: string): RemoteTemplateLocator {
	if ((REMOVED_BUILTIN_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
		throw new Error(
			`Built-in template "${templateId}" was removed. Use --template persistence --persistence-policy ${
				templateId === "data" ? "public" : "authenticated"
			} instead.`,
		);
	}

	const githubLocator = parseGitHubTemplateLocator(templateId);
	if (githubLocator) {
		return { kind: "github", locator: githubLocator };
	}

	if (isTemplatePathLocator(templateId)) {
		return { kind: "path", templatePath: templateId };
	}

	const npmLocator = parseNpmTemplateLocator(templateId);
	if (npmLocator) {
		return { kind: "npm", locator: npmLocator };
	}

	throw new Error(
		`Unknown template "${templateId}". Expected one of: ${BUILTIN_TEMPLATE_IDS.join(", ")}, a local path, github:owner/repo/path[#ref], or an npm package spec.`,
	);
}

function getDefaultCategoryFromBlockJson(blockJson: Record<string, unknown>): string {
	return typeof blockJson.category === "string" && blockJson.category.trim().length > 0
		? blockJson.category.trim()
		: "widgets";
}

function getDefaultCategory(sourceDir: string): string {
	try {
		const blockJson = readRemoteBlockJson(sourceDir);
		return getDefaultCategoryFromBlockJson(blockJson);
	} catch {
		return "widgets";
	}
}

function getTemplateVariableContext(variables: { [key: string]: string }): TemplateVariableContext {
	const {
		apiClientPackageVersion,
		blockRuntimePackageVersion,
		blockTypesPackageVersion,
		createPackageVersion,
		restPackageVersion,
	} = getPackageVersions();
	return {
		...variables,
		apiClientPackageVersion: variables.apiClientPackageVersion ?? apiClientPackageVersion,
		blockRuntimePackageVersion:
			variables.blockRuntimePackageVersion ?? blockRuntimePackageVersion,
		blockTypesPackageVersion: variables.blockTypesPackageVersion ?? blockTypesPackageVersion,
		createPackageVersion: variables.createPackageVersion ?? createPackageVersion,
		description: variables.description,
		keyword: variables.keyword,
		namespace: variables.namespace,
		pascalCase: variables.pascalCase,
		phpPrefix: variables.phpPrefix,
		restPackageVersion: variables.restPackageVersion ?? restPackageVersion,
		slug: variables.slug,
		textDomain: variables.textDomain,
		title: variables.title,
	};
}

async function detectTemplateSourceFormat(sourceDir: string): Promise<TemplateSourceFormat> {
	if (fs.existsSync(path.join(sourceDir, "package.json.mustache"))) {
		return "wp-typia";
	}

	if (getExternalTemplateEntry(sourceDir)) {
		return "create-block-external";
	}

	const sourceRoot = fs.existsSync(path.join(sourceDir, "src")) ? path.join(sourceDir, "src") : sourceDir;
	const blockJsonCandidates = [
		path.join(sourceDir, "block.json"),
		path.join(sourceRoot, "block.json"),
	];
	const hasBlockJson = blockJsonCandidates.some((candidate) => fs.existsSync(candidate));
	const hasIndexFile = ["index.js", "index.jsx", "index.ts", "index.tsx"].some((filename) =>
		fs.existsSync(path.join(sourceRoot, filename)),
	);
	const hasEditFile = ["edit.js", "edit.jsx", "edit.ts", "edit.tsx"].some((filename) =>
		fs.existsSync(path.join(sourceRoot, filename)),
	);
	const hasSaveFile = ["save.js", "save.jsx", "save.ts", "save.tsx"].some((filename) =>
		fs.existsSync(path.join(sourceRoot, filename)),
	);

	if (hasBlockJson && hasIndexFile && hasEditFile && hasSaveFile) {
		return "create-block-subset";
	}

	throw new Error(
		`Unsupported template source at ${sourceDir}. Expected a wp-typia template directory, an official create-block external template config, or a create-block subset with block.json and src/index/edit/save files.`,
	);
}

function readRemoteBlockJson(blockDir: string): Record<string, unknown> {
	const sourceRoot = fs.existsSync(path.join(blockDir, "src")) ? path.join(blockDir, "src") : blockDir;
	for (const candidate of [path.join(blockDir, "block.json"), path.join(sourceRoot, "block.json")]) {
		if (fs.existsSync(candidate)) {
			return JSON.parse(fs.readFileSync(candidate, "utf8")) as Record<string, unknown>;
		}
	}

	throw new Error(`Unable to locate block.json in ${blockDir}`);
}

async function assertNoSymlinks(sourceDir: string): Promise<void> {
	const stats = await fsp.lstat(sourceDir);
	if (stats.isSymbolicLink()) {
		throw new Error(`Template sources may not include symbolic links: ${sourceDir}`);
	}

	if (!stats.isDirectory()) {
		return;
	}

	for (const entry of await fsp.readdir(sourceDir)) {
		await assertNoSymlinks(path.join(sourceDir, entry));
	}
}

function renderTypeScriptLiteral(value: unknown): string {
	if (typeof value === "string") {
		return JSON.stringify(value);
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return "undefined";
}

function renderTagsForAttribute(attribute: Record<string, unknown>): string[] {
	const tags: string[] = [];
	if (typeof attribute.default === "string" || typeof attribute.default === "number" || typeof attribute.default === "boolean") {
		tags.push(`tags.Default<${renderTypeScriptLiteral(attribute.default)}>`); 
	}
	return tags;
}

function renderAttributeBaseType(attributeName: string, attribute: Record<string, unknown>): string {
	if (Array.isArray(attribute.enum) && attribute.enum.length > 0) {
		return attribute.enum.map((item) => renderTypeScriptLiteral(item)).join(" | ");
	}

	switch (attribute.type) {
		case "string":
			return "string";
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "array":
			return "unknown[]";
		case "object":
			return "Record<string, unknown>";
		default:
			if (typeof attributeName === "string" && attributeName.toLowerCase().includes("class")) {
				return "string";
			}
			return "unknown";
	}
}

function buildRemoteTypesSource(
	blockJson: Record<string, unknown>,
	context: TemplateVariableContext,
): string {
	const attributes = (blockJson.attributes ?? {}) as Record<string, Record<string, unknown>>;
	const lines = ['import { tags } from "typia";', "", `export interface ${context.pascalCase}Attributes {`];

	for (const [name, attribute] of Object.entries(attributes)) {
		const baseType = renderAttributeBaseType(name, attribute);
		const tagList = renderTagsForAttribute(attribute);
		const baseTypeWithGrouping =
			tagList.length > 0 && baseType.includes(" | ") ? `(${baseType})` : baseType;
		const renderedType = [baseTypeWithGrouping, ...tagList].join(" & ");
		lines.push(`  ${JSON.stringify(name)}?: ${renderedType};`);
	}

	lines.push("}", "");
	return lines.join("\n");
}

function buildRemoteBlockJsonTemplate(blockJson: Record<string, unknown>): string {
	const merged: Record<string, unknown> = {
		...blockJson,
		description: "{{description}}",
		name: "{{namespace}}/{{slug}}",
		textdomain: "{{textDomain}}",
		title: "{{title}}",
	};

	if (!Array.isArray(merged.keywords) || merged.keywords.length === 0) {
		merged.keywords = ["{{keyword}}", "typia", "block"];
	}

	return `${JSON.stringify(merged, null, "\t")}\n`;
}

async function rewriteBlockJsonImports(directory: string): Promise<void> {
	const textExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
	const targetBlockJsonPath = path.join(directory, "block.json");

	async function visit(currentPath: string): Promise<void> {
		const stats = await fsp.stat(currentPath);
		if (stats.isDirectory()) {
			const entries = await fsp.readdir(currentPath);
			for (const entry of entries) {
				await visit(path.join(currentPath, entry));
			}
			return;
		}

		if (!textExtensions.has(path.extname(currentPath))) {
			return;
		}

		const content = await fsp.readFile(currentPath, "utf8");
		const relativeSpecifier = path.relative(path.dirname(currentPath), targetBlockJsonPath).replace(/\\/g, "/");
		const normalizedSpecifier = relativeSpecifier.startsWith(".") ? relativeSpecifier : `./${relativeSpecifier}`;
		const next = content.replace(/(['"])\.{1,2}\/[^'"]*block\.json\1/g, `$1${normalizedSpecifier}$1`);
		if (next !== content) {
			await fsp.writeFile(currentPath, next, "utf8");
		}
	}

	await visit(directory);
}

async function patchRemotePackageJson(templateDir: string, needsInteractivity: boolean): Promise<void> {
	const packageJsonPath = path.join(templateDir, "package.json.mustache");
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
	};

	packageJson.devDependencies = {
		"@wp-typia/block-runtime": "{{blockRuntimePackageVersion}}",
		"@wp-typia/block-types": "{{blockTypesPackageVersion}}",
		...(packageJson.devDependencies ?? {}),
	};

	if (needsInteractivity) {
		packageJson.dependencies = {
			...(packageJson.dependencies ?? {}),
			"@wordpress/interactivity": "^6.29.0",
		};
	}

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8");
}

function getSeedSourceRoot(blockDir: string): string {
	return fs.existsSync(path.join(blockDir, "src")) ? path.join(blockDir, "src") : blockDir;
}

function findSeedRenderPhp(seed: SeedSource): string | null {
	for (const candidate of [path.join(seed.blockDir, "render.php"), path.join(seed.rootDir, "render.php")]) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return null;
}

async function removeSeedEntryConflicts(templateDir: string): Promise<void> {
	for (const filename of [
		"block.json",
		"block.json.mustache",
		"edit.js",
		"edit.jsx",
		"edit.ts",
		"edit.tsx",
		"edit.tsx.mustache",
		"hooks.ts",
		"hooks.ts.mustache",
		"index.js",
		"index.jsx",
		"index.ts",
		"index.tsx",
		"index.tsx.mustache",
		"save.js",
		"save.jsx",
		"save.ts",
		"save.tsx",
		"save.tsx.mustache",
		"style.css",
		"style.scss",
		"style.scss.mustache",
		"types.ts",
		"types.ts.mustache",
		"validators.ts",
		"validators.ts.mustache",
		"view.js",
		"view.jsx",
		"view.ts",
		"view.tsx",
	]) {
		await fsp.rm(path.join(templateDir, "src", filename), { force: true });
	}
}

async function normalizeCreateBlockSubset(
	seed: SeedSource,
	context: TemplateVariableContext,
): Promise<ResolvedTemplateSource> {
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-remote-template-"));
	const templateDir = path.join(tempRoot, "template");
	const blockJson = readRemoteBlockJson(seed.blockDir);
	const sourceRoot = getSeedSourceRoot(seed.blockDir);

	await fsp.mkdir(templateDir, { recursive: true });
	for (const layerDir of [SHARED_BASE_TEMPLATE_ROOT, path.join(TEMPLATE_ROOT, "basic")]) {
		await fsp.cp(layerDir, templateDir, {
			recursive: true,
			force: true,
		});
	}
	await removeSeedEntryConflicts(templateDir);
	await fsp.cp(sourceRoot, path.join(templateDir, "src"), { recursive: true, force: true });

	const remoteRenderPath = findSeedRenderPhp(seed);
	if (remoteRenderPath) {
		await fsp.copyFile(remoteRenderPath, path.join(templateDir, "render.php"));
	}

	if (seed.assetsDir && fs.existsSync(seed.assetsDir)) {
		await fsp.cp(seed.assetsDir, path.join(templateDir, "assets"), { recursive: true, force: true });
	}

	await fsp.writeFile(path.join(templateDir, "src", "types.ts"), buildRemoteTypesSource(blockJson, context), "utf8");
	await fsp.writeFile(path.join(templateDir, "src", "block.json"), buildRemoteBlockJsonTemplate(blockJson), "utf8");
	await rewriteBlockJsonImports(path.join(templateDir, "src"));

	const needsInteractivity =
		typeof blockJson.viewScriptModule === "string" ||
		typeof blockJson.viewScript === "string" ||
		fs.existsSync(path.join(templateDir, "src", "view.js")) ||
		fs.existsSync(path.join(templateDir, "src", "view.ts")) ||
		fs.existsSync(path.join(templateDir, "src", "view.tsx")) ||
		fs.existsSync(path.join(templateDir, "src", "interactivity.js")) ||
		fs.existsSync(path.join(templateDir, "src", "interactivity.ts"));

	await patchRemotePackageJson(templateDir, needsInteractivity);

	return {
		id: "remote:create-block-subset",
		defaultCategory: getDefaultCategoryFromBlockJson(blockJson),
		description: "A wp-typia scaffold normalized from a create-block subset source",
		features: ["Remote source", "create-block adapter", "Typia metadata pipeline"],
		format: "create-block-subset",
		selectedVariant: seed.selectedVariant ?? null,
		templateDir,
		warnings: seed.warnings ?? [],
		cleanup: async () => {
			await fsp.rm(tempRoot, { force: true, recursive: true });
			if (seed.cleanup) {
				await seed.cleanup();
			}
		},
	};
}

async function loadExternalTemplateConfig(sourceDir: string): Promise<{
	config: ExternalTemplateConfig;
	warnings: string[];
}> {
	const entryPath = getExternalTemplateEntry(sourceDir);
	if (!entryPath) {
		throw new Error(`No external template config entry found in ${sourceDir}.`);
	}

	const moduleUrl = `${pathToFileURL(entryPath).href}?mtime=${fs.statSync(entryPath).mtimeMs}`;
	const loadedModule = (await import(moduleUrl)) as Record<string, unknown>;
	const loadedConfig = loadedModule.default ?? loadedModule;
	if (!isPlainObject(loadedConfig)) {
		throw new Error(`External template config must export an object: ${entryPath}`);
	}

	const warnings: string[] = [];
	for (const ignoredKey of [
		"pluginTemplatesPath",
		"wpScripts",
		"wpEnv",
		"customScripts",
		"npmDependencies",
		"npmDevDependencies",
		"customPackageJSON",
		"pluginReadme",
		"pluginHeader",
	]) {
		if (ignoredKey in loadedConfig) {
			warnings.push(getTemplateWarning(ignoredKey));
		}
	}

	return {
		config: loadedConfig as unknown as ExternalTemplateConfig,
		warnings,
	};
}

function getVariantFlagName(variantName: string): string {
	return `is${toSegmentPascalCase(variantName)}Variant`;
}

function getVariantKeys(config: ExternalTemplateConfig): string[] {
	return isPlainObject(config.variants) ? Object.keys(config.variants) : [];
}

function getVariantConfig(
	config: ExternalTemplateConfig,
	requestedVariant?: string,
): {
	selectedVariant: string | null;
	variantConfig: Record<string, unknown>;
} {
	const variantKeys = getVariantKeys(config);
	if (variantKeys.length === 0) {
		if (requestedVariant) {
			throw new Error(
				`Variant "${requestedVariant}" was requested, but the external template does not define any variants.`,
			);
		}

		return {
			selectedVariant: null,
			variantConfig: {},
		};
	}

	const selectedVariant = requestedVariant ?? variantKeys[0];
	if (!selectedVariant || !isPlainObject(config.variants?.[selectedVariant])) {
		throw new Error(
			`Unknown template variant "${requestedVariant}". Expected one of: ${variantKeys.join(", ")}`,
		);
	}

	return {
		selectedVariant,
		variantConfig: config.variants?.[selectedVariant] as Record<string, unknown>,
	};
}

function extractVariantRenderValues(variantConfig: Record<string, unknown>): Record<string, unknown> {
	const values = { ...variantConfig };
	delete values.assetsPath;
	delete values.blockTemplatesPath;
	delete values.folderName;
	delete values.transformer;
	return values;
}

async function buildExternalTemplateView(
	context: TemplateVariableContext,
	config: ExternalTemplateConfig,
	selectedVariant: string | null,
	variantConfig: Record<string, unknown>,
): Promise<Record<string, unknown>> {
	const mergedView: Record<string, unknown> = {
		...(config.defaultValues ?? {}),
		...extractVariantRenderValues(variantConfig),
		...context,
	};

	if (selectedVariant) {
		mergedView.variant = selectedVariant;
		mergedView[getVariantFlagName(selectedVariant)] = true;
	}

	if (!config.transformer) {
		return mergedView;
	}

	const transformed = await config.transformer(mergedView);
	if (!isPlainObject(transformed)) {
		throw new Error("External template transformer(view) must return an object.");
	}

	return {
		...mergedView,
		...transformed,
	};
}

async function renderCreateBlockExternalTemplate(
	sourceDir: string,
	context: TemplateVariableContext,
	requestedVariant?: string,
): Promise<SeedSource> {
	const { config, warnings } = await loadExternalTemplateConfig(sourceDir);
	const { selectedVariant, variantConfig } = getVariantConfig(config, requestedVariant);

	const blockTemplatesPath =
		(typeof variantConfig.blockTemplatesPath === "string" ? variantConfig.blockTemplatesPath : config.blockTemplatesPath) ??
		null;
	if (!blockTemplatesPath) {
		throw new Error("External template config must define blockTemplatesPath.");
	}

	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-create-block-external-"));
	const cleanup = async () => {
		await fsp.rm(tempRoot, { force: true, recursive: true });
	};

	try {
		const renderedRoot = path.join(tempRoot, "rendered");
		const folderName =
			(typeof variantConfig.folderName === "string" ? variantConfig.folderName : config.folderName) || ".";
		const blockDir = resolveSourceSubpath(renderedRoot, folderName);
		const view = await buildExternalTemplateView(context, config, selectedVariant, variantConfig);
		const blockTemplateDir = resolveSourceSubpath(sourceDir, blockTemplatesPath);
		await copyRenderedDirectory(blockTemplateDir, blockDir, view);

		const assetsPath =
			typeof variantConfig.assetsPath === "string" ? variantConfig.assetsPath : config.assetsPath;
		if (typeof assetsPath === "string" && assetsPath.trim().length > 0) {
			await copyRawDirectory(resolveSourceSubpath(sourceDir, assetsPath), path.join(tempRoot, "assets"));
		}

		return {
			assetsDir: fs.existsSync(path.join(tempRoot, "assets")) ? path.join(tempRoot, "assets") : undefined,
			blockDir,
			cleanup,
			rootDir: tempRoot,
			selectedVariant,
			warnings,
		};
	} catch (error) {
		await cleanup();
		throw error;
	}
}

async function resolveGitHubTemplateSource(locator: GitHubTemplateLocator): Promise<SeedSource> {
	const remoteRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-source-"));
	const cleanup = async () => {
		await fsp.rm(remoteRoot, { force: true, recursive: true });
	};
	const checkoutDir = path.join(remoteRoot, "source");

	try {
		const args = ["clone", "--depth", "1"];
		if (locator.ref) {
			args.push("--branch", locator.ref);
		}
		args.push(`https://github.com/${locator.owner}/${locator.repo}.git`, checkoutDir);
		execFileSync("git", args, { stdio: "ignore" });

		const sourceDir = path.resolve(checkoutDir, locator.sourcePath);
		const relativeSourceDir = path.relative(checkoutDir, sourceDir);
		if (relativeSourceDir.startsWith("..") || path.isAbsolute(relativeSourceDir)) {
			throw new Error("GitHub template path must stay within the cloned repository.");
		}
		if (!fs.existsSync(sourceDir)) {
			throw new Error(`GitHub template path does not exist: ${locator.sourcePath}`);
		}
		await assertNoSymlinks(sourceDir);

		return {
			blockDir: sourceDir,
			cleanup,
			rootDir: sourceDir,
		};
	} catch (error) {
		await cleanup();
		throw error;
	}
}

async function resolveTemplateSeed(
	locator: RemoteTemplateLocator,
	cwd: string,
): Promise<SeedSource> {
	if (locator.kind === "path") {
		const sourceDir = path.resolve(cwd, locator.templatePath);
		if (!fs.existsSync(sourceDir)) {
			throw new Error(`Template path does not exist: ${sourceDir}`);
		}
		await assertNoSymlinks(sourceDir);
		return {
			blockDir: sourceDir,
			rootDir: sourceDir,
		};
	}

	if (locator.kind === "github") {
		return resolveGitHubTemplateSource(locator.locator);
	}

	return fetchNpmTemplateSource(locator.locator);
}

export async function resolveTemplateSource(
	templateId: string,
	cwd: string,
	variables: { [key: string]: string },
	variant?: string,
): Promise<ResolvedTemplateSource> {
	if (isBuiltInTemplateId(templateId)) {
		if (variant) {
			throw new Error(`--variant is only supported for official external template configs. Received variant "${variant}" for built-in template "${templateId}".`);
		}
		return resolveBuiltInTemplateSource(
			templateId,
			{
				persistenceEnabled: variables.compoundPersistenceEnabled === "true",
				persistencePolicy: variables.persistencePolicy === "public" ? "public" : "authenticated",
			},
		);
	}

	const locator = parseTemplateLocator(templateId);
	const context = getTemplateVariableContext(variables);
	const seed = await resolveTemplateSeed(locator, cwd);
	let normalizedSeed: SeedSource | null = null;

	try {
		const format = await detectTemplateSourceFormat(seed.blockDir);
		if (format === "wp-typia") {
			if (variant) {
				throw new Error(`--variant is only supported for official external template configs. Received variant "${variant}" for "${templateId}".`);
			}
			return {
				id: templateId,
				defaultCategory: getDefaultCategory(seed.blockDir),
				description: "A remote wp-typia template source",
				features: ["Remote source", "wp-typia format"],
				format,
				templateDir: seed.blockDir,
				cleanup: seed.cleanup,
			};
		}

		normalizedSeed =
			format === "create-block-external"
				? await renderCreateBlockExternalTemplate(seed.blockDir, context, variant)
				: variant
					? (() => {
						throw new Error(`--variant is only supported for official external template configs. Received variant "${variant}" for "${templateId}".`);
					})()
					: seed;

			if (format === "create-block-external") {
				const normalized = await normalizeCreateBlockSubset(normalizedSeed, context);
				return {
					...normalized,
					cleanup: async () => {
						await normalized.cleanup?.();
						await seed.cleanup?.();
					},
					description: "A wp-typia scaffold normalized from an official create-block external template",
					features: ["Remote source", "official external template", "Typia metadata pipeline"],
					format,
				id: "remote:create-block-external",
				selectedVariant: normalizedSeed.selectedVariant ?? null,
				warnings: normalizedSeed.warnings ?? [],
			};
		}

		return normalizeCreateBlockSubset(normalizedSeed, context);
	} catch (error) {
		if (normalizedSeed?.cleanup && normalizedSeed !== seed) {
			await normalizedSeed.cleanup();
		}
		if (seed.cleanup) {
			await seed.cleanup();
		}
		throw error;
	}
}
