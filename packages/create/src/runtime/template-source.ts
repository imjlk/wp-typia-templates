import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
	BUILTIN_TEMPLATE_IDS,
	CREATE_PACKAGE_ROOT,
	TEMPLATE_ROOT,
	getTemplateById,
	isBuiltInTemplateId,
	type BuiltInTemplateId,
} from "./template-registry.js";

export interface TemplateVariableContext {
	createPackageVersion: string;
	blockTypesPackageVersion: string;
	pascalCase: string;
	title: string;
	description: string;
	keyword: string;
	namespace: string;
	slug: string;
	textDomain: string;
}

export interface ResolvedTemplateSource {
	id: string;
	defaultCategory: string;
	description: string;
	features: string[];
	format: "wp-typia" | "create-block-subset";
	templateDir: string;
	cleanup?: () => Promise<void>;
}

interface GitHubTemplateLocator {
	owner: string;
	repo: string;
	ref: string | null;
	sourcePath: string;
}

type RemoteTemplateLocator =
	| { kind: "builtin"; templateId: BuiltInTemplateId }
	| { kind: "path"; templatePath: string }
	| { kind: "github"; locator: GitHubTemplateLocator };

function readPackageVersion(packageJsonPath: string): string {
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version: string };
	return `^${packageJson.version}`;
}

const CREATE_PACKAGE_VERSION = readPackageVersion(path.join(CREATE_PACKAGE_ROOT, "package.json"));
const BLOCK_TYPES_PACKAGE_VERSION = readPackageVersion(
	path.join(CREATE_PACKAGE_ROOT, "../wp-typia-block-types/package.json"),
);

function isTemplatePathLocator(templateId: string): boolean {
	return path.isAbsolute(templateId) || templateId.startsWith("./") || templateId.startsWith("../");
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

export function parseTemplateLocator(templateId: string): RemoteTemplateLocator {
	if (isBuiltInTemplateId(templateId)) {
		return { kind: "builtin", templateId };
	}

	const githubLocator = parseGitHubTemplateLocator(templateId);
	if (githubLocator) {
		return { kind: "github", locator: githubLocator };
	}

	if (isTemplatePathLocator(templateId)) {
		return { kind: "path", templatePath: templateId };
	}

	throw new Error(
		`Unknown template "${templateId}". Expected one of: ${BUILTIN_TEMPLATE_IDS.join(", ")}, a local path, or github:owner/repo/path[#ref].`,
	);
}

function getDefaultCategory(sourceDir: string): string {
	try {
		const blockJson = readRemoteBlockJson(sourceDir);
		if (typeof blockJson.category === "string" && blockJson.category.trim().length > 0) {
			return blockJson.category.trim();
		}
	} catch {
		// Ignore missing block.json during generic format detection.
	}

	return "widgets";
}

function getTemplateVariableContext(variables: { [key: string]: string }): TemplateVariableContext {
	return {
		blockTypesPackageVersion: variables.blockTypesPackageVersion ?? BLOCK_TYPES_PACKAGE_VERSION,
		createPackageVersion: variables.createPackageVersion ?? CREATE_PACKAGE_VERSION,
		description: variables.description,
		keyword: variables.keyword,
		namespace: variables.namespace,
		pascalCase: variables.pascalCase,
		slug: variables.slug,
		textDomain: variables.textDomain,
		title: variables.title,
	};
}

async function copyRawDirectory(sourceDir: string, targetDir: string): Promise<void> {
	await fsp.mkdir(path.dirname(targetDir), { recursive: true });
	await fsp.cp(sourceDir, targetDir, { recursive: true });
}

async function materializeBuiltinTemplate(templateId: BuiltInTemplateId): Promise<ResolvedTemplateSource> {
	const template = getTemplateById(templateId);
	if (templateId === "basic") {
		return {
			id: template.id,
			defaultCategory: template.defaultCategory,
			description: template.description,
			features: template.features,
			format: "wp-typia",
			templateDir: template.templateDir,
		};
	}

	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-"));
	const templateDir = path.join(tempRoot, "interactivity");
	await copyRawDirectory(path.join(TEMPLATE_ROOT, "basic"), templateDir);
	await fsp.cp(path.join(TEMPLATE_ROOT, "interactivity"), templateDir, {
		recursive: true,
		force: true,
	});

	return {
		id: template.id,
		defaultCategory: template.defaultCategory,
		description: template.description,
		features: template.features,
		format: "wp-typia",
		templateDir,
		cleanup: async () => {
			await fsp.rm(tempRoot, { force: true, recursive: true });
		},
	};
}

function detectTemplateSourceFormat(sourceDir: string): "wp-typia" | "create-block-subset" {
	if (fs.existsSync(path.join(sourceDir, "package.json.mustache"))) {
		return "wp-typia";
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
		`Unsupported template source at ${sourceDir}. Expected a wp-typia template directory or a create-block subset with block.json and src/index/edit/save files.`,
	);
}

function readRemoteBlockJson(sourceDir: string): Record<string, unknown> {
	const sourceRoot = fs.existsSync(path.join(sourceDir, "src")) ? path.join(sourceDir, "src") : sourceDir;
	for (const candidate of [path.join(sourceDir, "block.json"), path.join(sourceRoot, "block.json")]) {
		if (fs.existsSync(candidate)) {
			return JSON.parse(fs.readFileSync(candidate, "utf8")) as Record<string, unknown>;
		}
	}

	throw new Error(`Unable to locate block.json in ${sourceDir}`);
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

	if (Array.isArray(attribute.enum) && attribute.enum.length > 0) {
		// enums are rendered in the type, defaults are still useful
	}

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
		lines.push(`  ${name}?: ${renderedType};`);
	}

	lines.push("}", "");
	return lines.join("\n");
}

function buildRemoteBlockJsonTemplate(
	blockJson: Record<string, unknown>,
): string {
	const merged: Record<string, unknown> = {
		...blockJson,
		name: "{{namespace}}/{{slug}}",
		title: "{{title}}",
		description: "{{description}}",
		textdomain: "{{textDomain}}",
	};

	if (!Array.isArray(merged.keywords) || merged.keywords.length === 0) {
		merged.keywords = ["{{keyword}}", "typia", "block"];
	}

	return `${JSON.stringify(merged, null, "\t")}\n`;
}

async function rewriteBlockJsonImports(directory: string): Promise<void> {
	const textExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

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
		const next = content.replace(/\.\.\/block\.json/g, "./block.json");
		if (next !== content) {
			await fsp.writeFile(currentPath, next, "utf8");
		}
	}

	await visit(directory);
}

async function patchRemotePackageJson(templateDir: string, needsInteractivity: boolean): Promise<void> {
	const packageJsonPath = path.join(templateDir, "package.json.mustache");
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as {
		devDependencies?: Record<string, string>;
		dependencies?: Record<string, string>;
	};

	packageJson.devDependencies = {
		"@wp-typia/block-types": "{{blockTypesPackageVersion}}",
		"@wp-typia/create": "{{createPackageVersion}}",
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

async function normalizeCreateBlockSubset(
	sourceDir: string,
	context: TemplateVariableContext,
): Promise<ResolvedTemplateSource> {
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-remote-template-"));
	const templateDir = path.join(tempRoot, "template");
	const blockJson = readRemoteBlockJson(sourceDir);
	const sourceRoot = fs.existsSync(path.join(sourceDir, "src")) ? path.join(sourceDir, "src") : sourceDir;

	await copyRawDirectory(path.join(TEMPLATE_ROOT, "basic"), templateDir);
	await fsp.cp(sourceRoot, path.join(templateDir, "src"), { recursive: true, force: true });

	const remoteRenderPath = path.join(sourceDir, "render.php");
	if (fs.existsSync(remoteRenderPath)) {
		await fsp.copyFile(remoteRenderPath, path.join(templateDir, "render.php"));
	}

	await fsp.writeFile(
		path.join(templateDir, "src", "types.ts"),
		buildRemoteTypesSource(blockJson, context),
		"utf8",
	);
	await fsp.writeFile(
		path.join(templateDir, "src", "block.json"),
		buildRemoteBlockJsonTemplate(blockJson),
		"utf8",
	);
	await rewriteBlockJsonImports(path.join(templateDir, "src"));

	const needsInteractivity =
		typeof blockJson.viewScriptModule === "string" ||
		typeof blockJson.viewScript === "string" ||
		fs.existsSync(path.join(templateDir, "src", "view.js")) ||
		fs.existsSync(path.join(templateDir, "src", "view.ts")) ||
		fs.existsSync(path.join(templateDir, "src", "view.tsx")) ||
		fs.existsSync(path.join(templateDir, "src", "interactivity.ts"));

	await patchRemotePackageJson(templateDir, needsInteractivity);

	return {
		id: "remote:create-block-subset",
		defaultCategory: typeof blockJson.category === "string" ? blockJson.category : "widgets",
		description: "A wp-typia scaffold normalized from a create-block subset source",
		features: ["Remote source", "create-block adapter", "Typia metadata pipeline"],
		format: "create-block-subset",
		templateDir,
		cleanup: async () => {
			await fsp.rm(tempRoot, { force: true, recursive: true });
		},
	};
}

export async function resolveTemplateSource(
	templateId: string,
	cwd: string,
	variables: { [key: string]: string },
): Promise<ResolvedTemplateSource> {
	const locator = parseTemplateLocator(templateId);
	const context = getTemplateVariableContext(variables);

	if (locator.kind === "builtin") {
		return materializeBuiltinTemplate(locator.templateId);
	}

	let sourceDir: string;
	let cleanupRemote: (() => Promise<void>) | undefined;

	if (locator.kind === "path") {
		sourceDir = path.resolve(cwd, locator.templatePath);
		if (!fs.existsSync(sourceDir)) {
			throw new Error(`Template path does not exist: ${sourceDir}`);
		}
	} else {
		const remoteRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-template-source-"));
		const checkoutDir = path.join(remoteRoot, "source");
		const args = ["clone", "--depth", "1"];
		if (locator.locator.ref) {
			args.push("--branch", locator.locator.ref);
		}
		args.push(`https://github.com/${locator.locator.owner}/${locator.locator.repo}.git`, checkoutDir);
		execFileSync("git", args, { stdio: "ignore" });
		sourceDir = path.resolve(checkoutDir, locator.locator.sourcePath);
		const relativeSourceDir = path.relative(checkoutDir, sourceDir);
		if (relativeSourceDir.startsWith("..") || path.isAbsolute(relativeSourceDir)) {
			throw new Error("GitHub template path must stay within the cloned repository.");
		}
		if (!fs.existsSync(sourceDir)) {
			throw new Error(`GitHub template path does not exist: ${locator.locator.sourcePath}`);
		}
		await assertNoSymlinks(sourceDir);
		cleanupRemote = async () => {
			await fsp.rm(remoteRoot, { force: true, recursive: true });
		};
	}

	const format = detectTemplateSourceFormat(sourceDir);
	if (format === "wp-typia") {
		return {
			id: templateId,
			defaultCategory: getDefaultCategory(sourceDir),
			description: "A remote wp-typia template source",
			features: ["Remote source", "wp-typia format"],
			format,
			templateDir: sourceDir,
			cleanup: cleanupRemote,
		};
	}

	const normalized = await normalizeCreateBlockSubset(sourceDir, context);
	const originalCleanup = normalized.cleanup;
	return {
		...normalized,
		cleanup: async () => {
			if (originalCleanup) {
				await originalCleanup();
			}
			if (cleanupRemote) {
				await cleanupRemote();
			}
		},
	};
}
