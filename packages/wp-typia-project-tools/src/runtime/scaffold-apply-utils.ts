import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
	applyGeneratedProjectDxPackageJson,
	applyLocalDevPresetFiles,
} from "./local-dev-presets.js";
import { applyMigrationUiCapability } from "./migration-ui-capability.js";
import { getPackageVersions } from "./package-versions.js";
import {
	ensureMigrationDirectories,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import {
	syncPersistenceRestArtifacts,
} from "./persistence-rest-artifacts.js";
import {
	buildGitignore,
	buildReadme,
	mergeTextLines,
} from "./scaffold-documents.js";
import {
	getStarterManifestFiles,
	stringifyStarterManifest,
} from "./starter-manifests.js";
import {
	formatNonEmptyTargetDirectoryError,
} from "./scaffold-bootstrap.js";
import {
	stringifyBuiltInBlockJsonDocument,
	type BuiltInBlockArtifact,
} from "./built-in-block-artifacts.js";
import type { BuiltInCodeArtifact } from "./built-in-block-code-artifacts.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	type BuiltInTemplateId,
} from "./template-registry.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	formatInstallCommand,
	formatPackageExecCommand,
	getPackageManager,
	transformPackageManagerText,
} from "./package-managers.js";
import {
	replaceRepositoryReferencePlaceholders,
	resolveScaffoldRepositoryReference,
} from "./scaffold-repository-reference.js";
import type {
	ScaffoldTemplateVariables,
} from "./scaffold.js";

export {
	buildGitignore,
	buildReadme,
	mergeTextLines,
} from "./scaffold-documents.js";

export interface InstallDependenciesOptions {
	packageManager: PackageManagerId;
	projectDir: string;
}

interface GeneratedPackageJson {
	dependencies?: Record<string, string>;
	scripts?: Record<string, string>;
	wpTypia?: {
		projectType?: string;
		templatePackage?: string;
	};
	packageManager?: string;
}

const EPHEMERAL_NODE_MODULES_LINK_TYPE = process.platform === "win32" ? "junction" : "dir";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCKFILES: Record<PackageManagerId, string[]> = {
	bun: ["bun.lock", "bun.lockb"],
	npm: ["package-lock.json"],
	pnpm: ["pnpm-lock.yaml"],
	yarn: ["yarn.lock"],
};

export async function ensureDirectory(targetDir: string, allowExisting = false): Promise<void> {
	if (!fs.existsSync(targetDir)) {
		await fsp.mkdir(targetDir, { recursive: true });
		return;
	}

	if (allowExisting) {
		return;
	}

	const entries = await fsp.readdir(targetDir);
	if (entries.length > 0) {
		throw new Error(formatNonEmptyTargetDirectoryError(targetDir));
	}
}

export async function writeStarterManifestFiles(
	targetDir: string,
	templateId: string,
	variables: ScaffoldTemplateVariables,
	artifacts?: readonly BuiltInBlockArtifact[],
): Promise<void> {
	const manifests = artifacts
		? artifacts.map((artifact) => ({
				document: artifact.manifestDocument,
				relativePath: `${artifact.relativeDir}/typia.manifest.json`,
			}))
		: getStarterManifestFiles(templateId, variables);

	for (const { document, relativePath } of manifests) {
		const destinationPath = path.join(targetDir, relativePath);
		await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
		await fsp.writeFile(destinationPath, stringifyStarterManifest(document), "utf8");
	}
}

async function writeBuiltInStructuralArtifacts(
	targetDir: string,
	artifacts: readonly BuiltInBlockArtifact[],
): Promise<void> {
	for (const artifact of artifacts) {
		const destinationDir = path.join(targetDir, artifact.relativeDir);
		await fsp.mkdir(destinationDir, { recursive: true });
		await fsp.writeFile(
			path.join(destinationDir, "types.ts"),
			artifact.typesSource,
			"utf8",
		);
		await fsp.writeFile(
			path.join(destinationDir, "block.json"),
			stringifyBuiltInBlockJsonDocument(artifact.blockJsonDocument),
			"utf8",
		);
	}
}

async function writeBuiltInCodeArtifacts(
	targetDir: string,
	codeArtifacts: readonly BuiltInCodeArtifact[],
): Promise<void> {
	for (const artifact of codeArtifacts) {
		const destinationPath = path.join(targetDir, artifact.relativePath);
		await fsp.mkdir(path.dirname(destinationPath), { recursive: true });
		await fsp.writeFile(destinationPath, artifact.source, "utf8");
	}
}

function resolveScaffoldGeneratorNodeModulesPath(): string | null {
	const projectToolsPackageRoot = path.resolve(__dirname, "..", "..");
	const candidates = [
		path.join(projectToolsPackageRoot, "node_modules"),
		path.resolve(projectToolsPackageRoot, "..", ".."),
		path.resolve(projectToolsPackageRoot, "..", "..", "node_modules"),
	];

	for (const candidate of candidates) {
		if (fs.existsSync(path.join(candidate, "typia", "package.json"))) {
			return candidate;
		}
	}

	return null;
}

async function withEphemeralScaffoldNodeModules(
	targetDir: string,
	callback: () => Promise<void>,
): Promise<void> {
	const targetNodeModulesPath = path.join(targetDir, "node_modules");
	if (fs.existsSync(targetNodeModulesPath)) {
		await callback();
		return;
	}

	const sourceNodeModulesPath = resolveScaffoldGeneratorNodeModulesPath();
	if (!sourceNodeModulesPath) {
		throw new Error(
			"Unable to resolve a node_modules directory with typia for scaffold-time REST artifact generation.",
		);
	}

	await fsp.symlink(sourceNodeModulesPath, targetNodeModulesPath, EPHEMERAL_NODE_MODULES_LINK_TYPE);

	try {
		await callback();
	} finally {
		await fsp.rm(targetNodeModulesPath, { force: true, recursive: true });
	}
}

/**
 * Seed REST-derived persistence artifacts into a newly scaffolded built-in
 * project before the first manual `sync-rest` run.
 */
export async function seedBuiltInPersistenceArtifacts(
	targetDir: string,
	templateId: BuiltInTemplateId,
	variables: ScaffoldTemplateVariables,
): Promise<void> {
	const needsPersistenceArtifacts =
		templateId === "persistence" ||
		(templateId === "compound" && variables.compoundPersistenceEnabled === "true");

	if (!needsPersistenceArtifacts) {
		return;
	}

	await withEphemeralScaffoldNodeModules(targetDir, async () => {
		if (templateId === "persistence") {
			await syncPersistenceRestArtifacts({
				apiTypesFile: path.join("src", "api-types.ts"),
				outputDir: "src",
				projectDir: targetDir,
				variables,
			});
			return;
		}

		await syncPersistenceRestArtifacts({
			apiTypesFile: path.join("src", "blocks", variables.slugKebabCase, "api-types.ts"),
			outputDir: path.join("src", "blocks", variables.slugKebabCase),
			projectDir: targetDir,
			variables,
		});
	});
}

export async function normalizePackageManagerFiles(
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

export async function normalizePackageJson(
	targetDir: string,
	packageManagerId: PackageManagerId,
): Promise<void> {
	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageManager = getPackageManager(packageManagerId);
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8")) as GeneratedPackageJson;
	if (packageManagerId === "npm") {
		delete packageJson.packageManager;
	} else {
		packageJson.packageManager = packageManager.packageManagerField;
	}

	if (packageJson.scripts) {
		for (const [key, value] of Object.entries(packageJson.scripts)) {
			if (typeof value === "string") {
				packageJson.scripts[key] = transformPackageManagerText(value, packageManagerId);
			}
		}
	}

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

export async function removeUnexpectedLockfiles(
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

/**
 * Recursively normalizes generated text files for the selected package manager
 * and repository reference.
 */
export async function replaceTextRecursively(
	targetDir: string,
	packageManagerId: PackageManagerId,
	{
		repositoryManifestPaths,
		repositoryReference,
	}: {
		repositoryManifestPaths?: readonly string[];
		repositoryReference?: string;
	} = {},
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
	const resolvedRepositoryReference =
		repositoryReference ??
		resolveScaffoldRepositoryReference({
			manifestPaths: repositoryManifestPaths,
		});

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
		const nextContent = replaceRepositoryReferencePlaceholders(
			transformPackageManagerText(content, packageManagerId),
			resolvedRepositoryReference,
		);

		if (nextContent !== content) {
			await fsp.writeFile(currentPath, nextContent, "utf8");
		}
	}

	await visit(targetDir);
}

export async function defaultInstallDependencies({
	projectDir,
	packageManager,
}: InstallDependenciesOptions): Promise<void> {
	execSync(formatInstallCommand(packageManager), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

export function isOfficialWorkspaceProject(projectDir: string): boolean {
	const packageJsonPath = path.join(projectDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return false;
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as GeneratedPackageJson;
	return (
		packageJson.wpTypia?.projectType === "workspace" &&
		packageJson.wpTypia?.templatePackage === OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE
	);
}

export async function applyWorkspaceMigrationCapability(
	projectDir: string,
	packageManager: PackageManagerId,
): Promise<void> {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(
		await fsp.readFile(packageJsonPath, "utf8"),
	) as GeneratedPackageJson;
	const wpTypiaPackageVersion = getPackageVersions().wpTypiaPackageVersion;
	const canonicalCliSpecifier =
		wpTypiaPackageVersion === "^0.0.0"
			? "wp-typia"
			: `wp-typia@${wpTypiaPackageVersion.replace(/^[~^]/u, "")}`;
	const migrationCli = (args: string) =>
		formatPackageExecCommand(packageManager, canonicalCliSpecifier, `migrate ${args}`);

	packageJson.scripts = {
		...(packageJson.scripts ?? {}),
		"migration:init": migrationCli("init --current-migration-version v1"),
		"migration:snapshot": migrationCli("snapshot"),
		"migration:diff": migrationCli("diff"),
		"migration:scaffold": migrationCli("scaffold"),
		"migration:doctor": migrationCli("doctor --all"),
		"migration:fixtures": migrationCli("fixtures --all"),
		"migration:verify": migrationCli("verify --all"),
		"migration:fuzz": migrationCli("fuzz --all"),
	};

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");

	writeMigrationConfig(projectDir, {
		blocks: [],
		currentMigrationVersion: "v1",
		snapshotDir: "src/migrations/versions",
		supportedMigrationVersions: ["v1"],
	});
	ensureMigrationDirectories(projectDir, []);
	writeInitialMigrationScaffold(projectDir, "v1", []);
}

/**
 * Applies a built-in scaffold into the target directory, including generated
 * code artifacts, starter manifests, preset files, and placeholder rewrites.
 */
export async function applyBuiltInScaffoldProjectFiles({
	projectDir,
	templateDir,
	templateId,
	variables,
	artifacts,
	codeArtifacts,
	readmeContent,
	gitignoreContent,
	allowExistingDir = false,
	packageManager,
	withMigrationUi = false,
	withTestPreset = false,
	withWpEnv = false,
	noInstall = false,
	installDependencies,
	repositoryReference,
}: {
	projectDir: string;
	templateDir: string;
	templateId: BuiltInTemplateId;
	variables: ScaffoldTemplateVariables;
	artifacts?: readonly BuiltInBlockArtifact[];
	codeArtifacts?: readonly BuiltInCodeArtifact[];
	readmeContent?: string;
	gitignoreContent?: string;
	allowExistingDir?: boolean;
	packageManager: PackageManagerId;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	noInstall?: boolean;
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
	repositoryReference?: string;
}): Promise<void> {
	await ensureDirectory(projectDir, allowExistingDir);
	await copyInterpolatedDirectory(templateDir, projectDir, variables);
	if (codeArtifacts && codeArtifacts.length > 0) {
		await writeBuiltInCodeArtifacts(projectDir, codeArtifacts);
	}
	if (artifacts && artifacts.length > 0) {
		await writeBuiltInStructuralArtifacts(projectDir, artifacts);
	}
	await writeStarterManifestFiles(projectDir, templateId, variables, artifacts);
	await seedBuiltInPersistenceArtifacts(projectDir, templateId, variables);
	await applyLocalDevPresetFiles({
		projectDir,
		variables,
		withTestPreset,
		withWpEnv,
	});
	if (withMigrationUi) {
		await applyMigrationUiCapability({
			packageManager,
			projectDir,
			templateId,
			variables,
		});
	}

	const readmePath = path.join(projectDir, "README.md");
	if (!fs.existsSync(readmePath)) {
		await fsp.writeFile(
			readmePath,
			readmeContent ??
				buildReadme(templateId, variables, packageManager, {
					withMigrationUi,
					withTestPreset,
					withWpEnv,
				}),
			"utf8",
		);
	}
	const gitignorePath = path.join(projectDir, ".gitignore");
	const existingGitignore = fs.existsSync(gitignorePath)
		? await fsp.readFile(gitignorePath, "utf8")
		: "";
	await fsp.writeFile(
		gitignorePath,
		mergeTextLines(gitignoreContent ?? buildGitignore(), existingGitignore),
		"utf8",
	);
	await normalizePackageJson(projectDir, packageManager);
	await applyGeneratedProjectDxPackageJson({
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
		packageManager,
		projectDir,
		templateId,
		withTestPreset,
		withWpEnv,
	});
	if (templateId === "query-loop") {
		await fsp.rm(path.join(projectDir, "src", "validator-toolkit.ts"), {
			force: true,
		});
	}
	await normalizePackageManagerFiles(projectDir, packageManager);
	await removeUnexpectedLockfiles(projectDir, packageManager);
	await replaceTextRecursively(projectDir, packageManager, {
		repositoryReference,
	});

	if (!noInstall) {
		const installer = installDependencies ?? defaultInstallDependencies;
		await installer({
			projectDir,
			packageManager,
		});
	}
}
