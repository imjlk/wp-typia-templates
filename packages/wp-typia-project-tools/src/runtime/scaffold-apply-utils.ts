import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
	applyGeneratedProjectDxPackageJson,
	applyLocalDevPresetFiles,
	getPrimaryDevelopmentScript,
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
	getCompoundExtensionWorkflowSection,
	getOptionalOnboardingNote,
	getOptionalOnboardingSteps,
	getPhpRestExtensionPointsSection,
	getTemplateSourceOfTruthNote,
} from "./scaffold-onboarding.js";
import {
	getStarterManifestFiles,
	stringifyStarterManifest,
} from "./starter-manifests.js";
import {
	stringifyBuiltInBlockJsonDocument,
	type BuiltInBlockArtifact,
} from "./built-in-block-artifacts.js";
import {
	OFFICIAL_WORKSPACE_TEMPLATE_PACKAGE,
	type BuiltInTemplateId,
} from "./template-registry.js";
import { copyInterpolatedDirectory } from "./template-render.js";
import type { PackageManagerId } from "./package-managers.js";
import {
	formatInstallCommand,
	formatPackageExecCommand,
	formatRunScript,
	getPackageManager,
	transformPackageManagerText,
} from "./package-managers.js";
import type {
	ScaffoldTemplateVariables,
} from "./scaffold.js";

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
		throw new Error(`Target directory is not empty: ${targetDir}`);
	}
}

export function buildReadme(
	templateId: string,
	variables: ScaffoldTemplateVariables,
	packageManager: PackageManagerId,
	{
		withMigrationUi = false,
		withTestPreset = false,
		withWpEnv = false,
	}: {
		withMigrationUi?: boolean;
		withTestPreset?: boolean;
		withWpEnv?: boolean;
	} = {},
): string {
	const optionalOnboardingSteps = getOptionalOnboardingSteps(packageManager, templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});
	const sourceOfTruthNote = getTemplateSourceOfTruthNote(templateId, {
		compoundPersistenceEnabled: variables.compoundPersistenceEnabled === "true",
	});
	const compoundPersistenceEnabled = variables.compoundPersistenceEnabled === "true";
	const publicPersistencePolicyNote =
		variables.isPublicPersistencePolicy === "true"
			? "Public persistence writes use signed short-lived tokens, per-request ids, and coarse rate limiting by default. Add application-specific abuse controls before using the same pattern for high-value metrics or experiments."
			: null;
	const compoundExtensionWorkflowSection = getCompoundExtensionWorkflowSection(
		packageManager,
		templateId,
	);
	const phpRestExtensionPointsSection = getPhpRestExtensionPointsSection(templateId, {
		compoundPersistenceEnabled,
		slug: variables.slug,
	});
	const developmentScript = getPrimaryDevelopmentScript(templateId);
	const wpEnvSection = withWpEnv
		? `## Local WordPress\n\n\`\`\`bash\n${formatRunScript(packageManager, "wp-env:start")}\n${formatRunScript(packageManager, "wp-env:stop")}\n${formatRunScript(packageManager, "wp-env:reset")}\n\`\`\``
		: "";
	const testPresetSection = withTestPreset
		? `## Local Test Preset\n\n\`\`\`bash\n${formatRunScript(packageManager, "wp-env:start:test")}\n${formatRunScript(packageManager, "wp-env:wait:test")}\n${formatRunScript(packageManager, "test:e2e")}\n\`\`\`\n\nThe generated smoke test uses \`.wp-env.test.json\` and verifies that the scaffolded block registers in the WordPress editor.`
		: "";
	const migrationSection = withMigrationUi
		? `## Migration UI\n\nThis scaffold already includes an initialized migration workspace at \`v1\`, generated deprecated/runtime artifacts, and an editor-embedded migration dashboard. Migration versions are schema lineage labels and are separate from your package or plugin release version. Use the existing CLI commands to snapshot, diff, scaffold, verify, and fuzz future schema changes.\n\n\`\`\`bash\n${formatRunScript(packageManager, "migration:doctor")}\n${formatRunScript(packageManager, "migration:verify")}\n${formatRunScript(packageManager, "migration:fuzz")}\n\`\`\`\n\nRun \`migration:init\` only when retrofitting migration support into an older project that was not scaffolded with \`--with-migration-ui\`.`
		: "";

	return `# ${variables.title}

${variables.description}

## Template

${templateId}

## Development

\`\`\`bash
${formatInstallCommand(packageManager)}
${formatRunScript(packageManager, developmentScript)}
\`\`\`

## Build

\`\`\`bash
${formatRunScript(packageManager, "build")}
\`\`\`

## Optional First Sync

\`\`\`bash
${optionalOnboardingSteps.join("\n")}
\`\`\`

${getOptionalOnboardingNote(packageManager, templateId, {
		compoundPersistenceEnabled,
	})}

${sourceOfTruthNote}${publicPersistencePolicyNote ? `\n\n${publicPersistencePolicyNote}` : ""}${migrationSection ? `\n\n${migrationSection}` : ""}${compoundExtensionWorkflowSection ? `\n\n${compoundExtensionWorkflowSection}` : ""}${wpEnvSection ? `\n\n${wpEnvSection}` : ""}${testPresetSection ? `\n\n${testPresetSection}` : ""}${phpRestExtensionPointsSection ? `\n\n${phpRestExtensionPointsSection}` : ""}
`;
}

export function buildGitignore(): string {
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

export function mergeTextLines(primaryContent: string, existingContent: string): string {
	const normalizedPrimary = primaryContent.replace(/\r\n/g, "\n").trimEnd();
	const normalizedExisting = existingContent.replace(/\r\n/g, "\n").trimEnd();
	const mergedLines: string[] = [];
	const seen = new Set<string>();

	for (const line of [...normalizedPrimary.split("\n"), ...normalizedExisting.split("\n")]) {
		if (line.length === 0 && mergedLines[mergedLines.length - 1] === "") {
			continue;
		}
		if (line.length > 0 && seen.has(line)) {
			continue;
		}
		if (line.length > 0) {
			seen.add(line);
		}
		mergedLines.push(line);
	}

	return `${mergedLines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
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

export async function replaceTextRecursively(
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

export async function applyBuiltInScaffoldProjectFiles({
	projectDir,
	templateDir,
	templateId,
	variables,
	artifacts,
	readmeContent,
	gitignoreContent,
	allowExistingDir = false,
	packageManager,
	withMigrationUi = false,
	withTestPreset = false,
	withWpEnv = false,
	noInstall = false,
	installDependencies,
}: {
	projectDir: string;
	templateDir: string;
	templateId: BuiltInTemplateId;
	variables: ScaffoldTemplateVariables;
	artifacts?: readonly BuiltInBlockArtifact[];
	readmeContent?: string;
	gitignoreContent?: string;
	allowExistingDir?: boolean;
	packageManager: PackageManagerId;
	withMigrationUi?: boolean;
	withTestPreset?: boolean;
	withWpEnv?: boolean;
	noInstall?: boolean;
	installDependencies?: ((options: InstallDependenciesOptions) => Promise<void>) | undefined;
}): Promise<void> {
	await ensureDirectory(projectDir, allowExistingDir);
	await copyInterpolatedDirectory(templateDir, projectDir, variables);
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
	await normalizePackageManagerFiles(projectDir, packageManager);
	await removeUnexpectedLockfiles(projectDir, packageManager);
	await replaceTextRecursively(projectDir, packageManager);

	if (!noInstall) {
		const installer = installDependencies ?? defaultInstallDependencies;
		await installer({
			projectDir,
			packageManager,
		});
	}
}
