import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import {
	PACKAGE_MANAGER_IDS,
	formatInstallCommand,
	formatRunScript,
	getPackageManager,
	transformPackageManagerText,
} from "./package-managers.js";
import type { PackageManagerId } from "./package-managers.js";
import { getPackageVersions } from "./package-versions.js";
import {
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
	getTemplateSourceOfTruthNote,
} from "./scaffold-onboarding.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import { TEMPLATE_IDS, getTemplateById, isBuiltInTemplateId } from "./template-registry.js";
import type { BuiltInTemplateId } from "./template-registry.js";
import { resolveTemplateSource } from "./template-source.js";

const BLOCK_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const REMOVED_BUILTIN_TEMPLATE_IDS = ["data", "persisted"] as const;
const LOCKFILES: Record<PackageManagerId, string[]> = {
	bun: ["bun.lock", "bun.lockb"],
	npm: ["package-lock.json"],
	pnpm: ["pnpm-lock.yaml"],
	yarn: ["yarn.lock"],
};

export interface ScaffoldAnswers {
	author: string;
	dataStorageMode?: DataStorageMode;
	description: string;
	namespace: string;
	persistencePolicy?: PersistencePolicy;
	slug: string;
	title: string;
}

export const DATA_STORAGE_MODES = ["post-meta", "custom-table"] as const;
export type DataStorageMode = (typeof DATA_STORAGE_MODES)[number];
export const PERSISTENCE_POLICIES = ["authenticated", "public"] as const;
export type PersistencePolicy = (typeof PERSISTENCE_POLICIES)[number];

export interface ScaffoldTemplateVariables {
	author: string;
	blockTypesPackageVersion: string;
	category: string;
	compoundChildTitle: string;
	compoundChildTitleJson: string;
	compoundPersistenceEnabled: "false" | "true";
	createPackageVersion: string;
	cssClassName: string;
	dashCase: string;
	dashicon: string;
	dataStorageMode: DataStorageMode;
	description: string;
	keyword: string;
	namespace: string;
	needsMigration: string;
	pascalCase: string;
	restPackageVersion: string;
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

interface ResolveTemplateOptions {
	isInteractive?: boolean;
	selectTemplate?: () => Promise<BuiltInTemplateId>;
	templateId?: string;
	yes?: boolean;
}

interface ResolvePackageManagerOptions {
	isInteractive?: boolean;
	packageManager?: string;
	selectPackageManager?: () => Promise<PackageManagerId>;
	yes?: boolean;
}

interface CollectScaffoldAnswersOptions {
	dataStorageMode?: DataStorageMode;
	projectName: string;
	promptText?: (
		message: string,
		defaultValue: string,
		validate?: (value: string) => true | string,
	) => Promise<string>;
	persistencePolicy?: PersistencePolicy;
	templateId: string;
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
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
	noInstall?: boolean;
	packageManager: PackageManagerId;
	persistencePolicy?: PersistencePolicy;
	projectDir: string;
	templateId: string;
	variant?: string;
}

export interface ScaffoldProjectResult {
	packageManager: PackageManagerId;
	projectDir: string;
	selectedVariant: string | null;
	templateId: string;
	variables: ScaffoldTemplateVariables;
	warnings: string[];
}

function toKebabCase(input: string): string {
	return input
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.toLowerCase();
}

function toSnakeCase(input: string): string {
	return toKebabCase(input).replace(/-/g, "_");
}

function toPascalCase(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join("");
}

function toTitle(input: string): string {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function validateBlockSlug(input: string): true | string {
	return BLOCK_SLUG_PATTERN.test(input) || "Use lowercase letters, numbers, and hyphens only";
}

export function isDataStorageMode(value: string): value is DataStorageMode {
	return (DATA_STORAGE_MODES as readonly string[]).includes(value);
}

export function isPersistencePolicy(value: string): value is PersistencePolicy {
	return (PERSISTENCE_POLICIES as readonly string[]).includes(value);
}

export function detectAuthor(): string {
	try {
		return (
			execSync("git config user.name", {
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			}).trim() || "Your Name"
		);
	} catch {
		return "Your Name";
	}
}

export function getDefaultAnswers(
	projectName: string,
	templateId: string,
): ScaffoldAnswers {
	const template = isBuiltInTemplateId(templateId) ? getTemplateById(templateId) : null;
	const slugDefault = toKebabCase(projectName || "my-wp-typia-block");
	return {
		author: detectAuthor(),
		dataStorageMode: templateId === "persistence" ? "custom-table" : undefined,
		description: template?.description ?? "A WordPress block scaffolded from a remote template",
		namespace: "create-block",
		persistencePolicy: templateId === "persistence" ? "authenticated" : undefined,
		slug: slugDefault,
		title: toTitle(slugDefault),
	};
}

export async function resolveTemplateId({
	templateId,
	yes = false,
	isInteractive = false,
	selectTemplate,
}: ResolveTemplateOptions): Promise<string> {
	if (templateId) {
		if ((REMOVED_BUILTIN_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
			throw new Error(
				`Built-in template "${templateId}" was removed. Use --template persistence --persistence-policy ${
					templateId === "data" ? "public" : "authenticated"
				} instead.`,
			);
		}
		if (isBuiltInTemplateId(templateId)) {
			return getTemplateById(templateId).id;
		}
		return templateId;
	}

	if (yes) {
		return "basic";
	}

	if (!isInteractive || !selectTemplate) {
		throw new Error(
			`Template is required in non-interactive mode. Use --template <${TEMPLATE_IDS.join("|")}|./path|github:owner/repo/path[#ref]|npm-package>.`,
		);
	}

	return selectTemplate();
}

export async function resolvePackageManagerId({
	packageManager,
	yes = false,
	isInteractive = false,
	selectPackageManager,
}: ResolvePackageManagerOptions): Promise<PackageManagerId> {
	if (packageManager) {
		return getPackageManager(packageManager).id;
	}

	if (yes) {
		throw new Error(
			`Package manager is required when using --yes. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
		);
	}

	if (!isInteractive || !selectPackageManager) {
		throw new Error(
			`Package manager is required in non-interactive mode. Use --package-manager <${PACKAGE_MANAGER_IDS.join("|")}>.`,
		);
	}

	return selectPackageManager();
}

export async function collectScaffoldAnswers({
	projectName,
	templateId,
	yes = false,
	dataStorageMode,
	persistencePolicy,
	promptText,
}: CollectScaffoldAnswersOptions): Promise<ScaffoldAnswers> {
	const defaults = getDefaultAnswers(projectName, templateId);

	if (yes) {
		return {
			...defaults,
			dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
			persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
		};
	}

	if (!promptText) {
		throw new Error("Interactive answers require a promptText callback.");
	}

	const slug = toKebabCase(
		await promptText("Block slug", defaults.slug, validateBlockSlug),
	);

	return {
		author: await promptText("Author", defaults.author),
		dataStorageMode: dataStorageMode ?? defaults.dataStorageMode,
		description: await promptText("Description", defaults.description),
		namespace: await promptText("Namespace", defaults.namespace),
		persistencePolicy: persistencePolicy ?? defaults.persistencePolicy,
		slug,
		title: await promptText("Block title", toTitle(slug)),
	};
}

export function getTemplateVariables(
	templateId: string,
	answers: ScaffoldAnswers,
): ScaffoldTemplateVariables {
	const { blockTypesPackageVersion, createPackageVersion, restPackageVersion } = getPackageVersions();
	const template = isBuiltInTemplateId(templateId) ? getTemplateById(templateId) : null;
	const slug = toKebabCase(answers.slug);
	const slugSnakeCase = toSnakeCase(slug);
	const pascalCase = toPascalCase(slug);
	const title = answers.title.trim();
	const namespace = answers.namespace.trim();
	const description = answers.description.trim();
	const compoundChildTitle = `${title} Item`;
	const compoundPersistenceEnabled =
		templateId === "persistence"
			? true
			: templateId === "compound"
				? Boolean(answers.dataStorageMode || answers.persistencePolicy)
				: false;
	const dataStorageMode =
		templateId === "persistence" || compoundPersistenceEnabled
			? answers.dataStorageMode ?? "custom-table"
			: "custom-table";
	const persistencePolicy =
		templateId === "persistence" || compoundPersistenceEnabled
			? answers.persistencePolicy ?? "authenticated"
			: "authenticated";

	return {
		author: answers.author.trim(),
		blockTypesPackageVersion,
		category: template?.defaultCategory ?? "widgets",
		compoundChildTitle,
		compoundChildTitleJson: JSON.stringify(compoundChildTitle),
		compoundPersistenceEnabled: compoundPersistenceEnabled ? "true" : "false",
		createPackageVersion,
		cssClassName: `wp-block-${slug}`,
		dataStorageMode,
		dashCase: slug,
		dashicon: "smiley",
		description,
		keyword: slug.replace(/-/g, " "),
		namespace,
		needsMigration: "{{needsMigration}}",
		pascalCase,
		restPackageVersion,
		slug,
		slugCamelCase: pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1),
		slugKebabCase: slug,
		slugSnakeCase,
		textDomain: slugSnakeCase,
		textdomain: slugSnakeCase,
		title,
		titleJson: JSON.stringify(title),
		titleCase: pascalCase,
		persistencePolicy,
	};
}

async function ensureDirectory(targetDir: string, allowExisting = false): Promise<void> {
	if (!fs.existsSync(targetDir)) {
		await fsp.mkdir(targetDir, { recursive: true });
		return;
	}

	if (allowExisting) {
		return;
	}

	const entries = await fsp.readdir(targetDir);
	if (entries.length > 0) {
		throw new Error(`Target directory is not empty: ${targetDir}`);
	}
}

function buildReadme(
	templateId: string,
	variables: ScaffoldTemplateVariables,
	packageManager: PackageManagerId,
): string {
	const optionalOnboardingSteps = getOptionalOnboardingSteps(packageManager, templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});
	const sourceOfTruthNote = getTemplateSourceOfTruthNote(templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});

	return `# ${variables.title}

${variables.description}

## Template

${templateId}

## Development

\`\`\`bash
${formatInstallCommand(packageManager)}
${formatRunScript(packageManager, "start")}
\`\`\`

## Build

\`\`\`bash
${formatRunScript(packageManager, "build")}
\`\`\`

## Optional First Sync

\`\`\`bash
${optionalOnboardingSteps.join("\n")}
\`\`\`

${getOptionalOnboardingNote(packageManager)}

${sourceOfTruthNote}
`;
}

function buildGitignore(): string {
	return `# Dependencies
node_modules/
.yarn/
.pnp.*

# Build
build/
dist/

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# WordPress
*.log
.wp-env/
`;
}

async function normalizePackageManagerFiles(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const yarnRcPath = path.join(targetDir, ".yarnrc.yml");

	if (packageManagerId === "yarn") {
		await fsp.writeFile(yarnRcPath, "nodeLinker: node-modules\n", "utf8");
		return;
	}

	if (fs.existsSync(yarnRcPath)) {
		await fsp.rm(yarnRcPath, { force: true });
	}
}

async function normalizePackageJson(targetDir: string, packageManagerId: PackageManagerId): Promise<void> {
	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageManager = getPackageManager(packageManagerId);
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as {
		packageManager?: string;
		scripts?: Record<string, string>;
	};
	packageJson.packageManager = packageManager.packageManagerField;

	if (packageJson.scripts) {
		for (const [key, value] of Object.entries(packageJson.scripts)) {
			if (typeof value === "string") {
				packageJson.scripts[key] = transformPackageManagerText(value, packageManagerId);
			}
		}
	}

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

async function removeUnexpectedLockfiles(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const keep = new Set(LOCKFILES[packageManagerId] ?? []);
	const allLockfiles = Object.values(LOCKFILES).flat();

	await Promise.all(
		allLockfiles.map(async (filename) => {
			if (keep.has(filename)) {
				return;
			}

			const filePath = path.join(targetDir, filename);
			if (fs.existsSync(filePath)) {
				await fsp.rm(filePath, { force: true });
			}
		}),
	);
}

async function replaceTextRecursively(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const textExtensions = new Set([
		".css",
		".js",
		".json",
		".jsx",
		".md",
		".php",
		".scss",
		".ts",
		".tsx",
		".txt",
	]);

	async function visit(currentPath: string): Promise<void> {
		const stats = await fsp.stat(currentPath);
		if (stats.isDirectory()) {
			const entries = await fsp.readdir(currentPath);
			for (const entry of entries) {
				await visit(path.join(currentPath, entry));
			}
			return;
		}

		if (path.basename(currentPath) === "package.json" || !textExtensions.has(path.extname(currentPath))) {
			return;
		}

		const content = await fsp.readFile(currentPath, "utf8");
		const nextContent = transformPackageManagerText(content, packageManagerId)
			.replace(/yourusername\/wp-typia-boilerplate/g, "imjlk/wp-typia")
			.replace(/yourusername\/wp-typia/g, "imjlk/wp-typia");

		if (nextContent !== content) {
			await fsp.writeFile(currentPath, nextContent, "utf8");
		}
	}

	await visit(targetDir);
}

async function defaultInstallDependencies({
	projectDir,
	packageManager,
}: InstallDependenciesOptions): Promise<void> {
	execSync(formatInstallCommand(packageManager), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

export async function scaffoldProject({
	projectDir,
	templateId,
	answers,
	dataStorageMode,
	persistencePolicy,
	packageManager,
	cwd = process.cwd(),
	allowExistingDir = false,
	noInstall = false,
	installDependencies = undefined,
	variant,
}: ScaffoldProjectOptions): Promise<ScaffoldProjectResult> {
	const resolvedPackageManager = getPackageManager(packageManager).id;

	await ensureDirectory(projectDir, allowExistingDir);

	const variables = getTemplateVariables(templateId, {
		...answers,
		dataStorageMode: dataStorageMode ?? answers.dataStorageMode,
		persistencePolicy: persistencePolicy ?? answers.persistencePolicy,
	});
	const templateSource = await resolveTemplateSource(
		templateId,
		cwd,
		variables as unknown as Record<string, string>,
		variant,
	);

	try {
		await copyInterpolatedDirectory(
			templateSource.templateDir,
			projectDir,
			variables as unknown as Record<string, string>,
		);
	} finally {
		if (templateSource.cleanup) {
			await templateSource.cleanup();
		}
	}
	const readmePath = path.join(projectDir, "README.md");
	if (!fs.existsSync(readmePath)) {
		await fsp.writeFile(
			readmePath,
			buildReadme(templateId, variables, resolvedPackageManager),
			"utf8",
		);
	}
	await fsp.writeFile(path.join(projectDir, ".gitignore"), buildGitignore(), "utf8");
	await normalizePackageJson(projectDir, resolvedPackageManager);
	await normalizePackageManagerFiles(projectDir, resolvedPackageManager);
	await removeUnexpectedLockfiles(projectDir, resolvedPackageManager);
	await replaceTextRecursively(projectDir, resolvedPackageManager);

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
		templateId,
		packageManager: resolvedPackageManager,
		variables,
		warnings: templateSource.warnings ?? [],
	};
}
