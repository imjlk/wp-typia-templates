// @ts-nocheck
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
import { TEMPLATE_IDS, getTemplateById } from "./template-registry.js";

const BLOCK_SLUG_PATTERN = /^[a-z][a-z0-9-]*$/;
const LOCKFILES = {
	bun: ["bun.lock", "bun.lockb"],
	npm: ["package-lock.json"],
	pnpm: ["pnpm-lock.yaml"],
	yarn: ["yarn.lock"],
};

function toKebabCase(input) {
	return input
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[^A-Za-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-")
		.toLowerCase();
}

function toSnakeCase(input) {
	return toKebabCase(input).replace(/-/g, "_");
}

function toPascalCase(input) {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join("");
}

function toTitle(input) {
	return toKebabCase(input)
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function validateBlockSlug(input) {
	return BLOCK_SLUG_PATTERN.test(input) || "Use lowercase letters, numbers, and hyphens only";
}

export function detectAuthor() {
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

export function getDefaultAnswers(projectName, templateId) {
	const template = getTemplateById(templateId);
	const slugDefault = toKebabCase(projectName || "my-wp-typia-block");
	return {
		author: detectAuthor(),
		description: template.description,
		namespace: "create-block",
		slug: slugDefault,
		title: toTitle(slugDefault),
	};
}

export async function resolveTemplateId({
	templateId,
	yes = false,
	isInteractive = false,
	selectTemplate,
}) {
	if (templateId) {
		return getTemplateById(templateId).id;
	}

	if (yes) {
		return "basic";
	}

	if (!isInteractive || !selectTemplate) {
		throw new Error(`Template is required in non-interactive mode. Use --template <${TEMPLATE_IDS.join("|")}>.`);
	}

	return selectTemplate();
}

export async function resolvePackageManagerId({
	packageManager,
	yes = false,
	isInteractive = false,
	selectPackageManager,
}) {
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
	promptText,
}) {
	const defaults = getDefaultAnswers(projectName, templateId);

	if (yes) {
		return defaults;
	}

	if (!promptText) {
		throw new Error("Interactive answers require a promptText callback.");
	}

	const slug = toKebabCase(
		await promptText("Block slug", defaults.slug, validateBlockSlug),
	);

	return {
		author: await promptText("Author", defaults.author),
		description: await promptText("Description", defaults.description),
		namespace: await promptText("Namespace", defaults.namespace),
		slug,
		title: await promptText("Block title", toTitle(slug)),
	};
}

export function getTemplateVariables(templateId, answers) {
	const template = getTemplateById(templateId);
	const slug = toKebabCase(answers.slug);
	const slugSnakeCase = toSnakeCase(slug);
	const pascalCase = toPascalCase(slug);
	const title = answers.title.trim();
	const namespace = answers.namespace.trim();
	const description = answers.description.trim();

	return {
		author: answers.author.trim(),
		category: template.defaultCategory,
		cssClassName: `wp-block-${slug}`,
		dashCase: slug,
		dashicon: "smiley",
		description,
		keyword: slug.replace(/-/g, " "),
		namespace,
		needsMigration: "{{needsMigration}}",
		pascalCase,
		slug,
		slugCamelCase: pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1),
		slugKebabCase: slug,
		slugSnakeCase,
		textDomain: slugSnakeCase,
		textdomain: slugSnakeCase,
		title,
		titleCase: pascalCase,
	};
}

function replaceVariables(content, variables) {
	return content.replace(/\{\{([^}]+)\}\}/g, (match, rawKey) => {
		const key = rawKey.trim();
		return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
	});
}

async function ensureDirectory(targetDir, allowExisting = false) {
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

async function copyTemplateDir(sourceDir, targetDir, variables) {
	const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
	for (const entry of entries) {
		const sourcePath = path.join(sourceDir, entry.name);
		const destinationName = entry.name.endsWith(".mustache")
			? entry.name.slice(0, -".mustache".length)
			: entry.name;
		const destinationPath = path.join(targetDir, destinationName);

		if (entry.isDirectory()) {
			await fsp.mkdir(destinationPath, { recursive: true });
			await copyTemplateDir(sourcePath, destinationPath, variables);
			continue;
		}

		const content = await fsp.readFile(sourcePath, "utf8");
		await fsp.writeFile(destinationPath, replaceVariables(content, variables), "utf8");
	}
}

function buildReadme(templateId, variables, packageManager) {
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

## Type Sync

\`\`\`bash
${formatRunScript(packageManager, "sync-types")}
\`\`\`

\`src/types.ts\` remains the source of truth for \`block.json\` and \`typia.manifest.json\`.
`;
}

function buildGitignore() {
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

async function normalizePackageManagerFiles(targetDir, packageManagerId) {
	const yarnRcPath = path.join(targetDir, ".yarnrc.yml");

	if (packageManagerId === "yarn") {
		await fsp.writeFile(yarnRcPath, "nodeLinker: node-modules\n", "utf8");
		return;
	}

	if (fs.existsSync(yarnRcPath)) {
		await fsp.rm(yarnRcPath, { force: true });
	}
}

async function normalizePackageJson(targetDir, packageManagerId) {
	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageManager = getPackageManager(packageManagerId);
	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8"));
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

async function removeUnexpectedLockfiles(targetDir, packageManagerId) {
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

async function replaceTextRecursively(targetDir, packageManagerId) {
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

	async function visit(currentPath) {
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
			.replace(/yourusername\/wp-typia-boilerplate/g, "imjlk/wp-typia-templates")
			.replace(/@wp-typia\/basic/g, "wp-typia-basic")
			.replace(/@wp-typia\/full/g, "wp-typia-full")
			.replace(/@wp-typia\/interactivity/g, "wp-typia-interactivity")
			.replace(/@wp-typia\/advanced/g, "wp-typia-advanced");

		if (nextContent !== content) {
			await fsp.writeFile(currentPath, nextContent, "utf8");
		}
	}

	await visit(targetDir);
}

async function defaultInstallDependencies({ projectDir, packageManager }) {
	execSync(formatInstallCommand(packageManager), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

export async function scaffoldProject({
	projectDir,
	templateId,
	answers,
	packageManager,
	allowExistingDir = false,
	noInstall = false,
	installDependencies = undefined,
}) {
	const template = getTemplateById(templateId);
	const resolvedPackageManager = getPackageManager(packageManager).id;

	await ensureDirectory(projectDir, allowExistingDir);

	const variables = getTemplateVariables(template.id, answers);

	await copyTemplateDir(template.templateDir, projectDir, variables);
	const readmePath = path.join(projectDir, "README.md");
	if (!fs.existsSync(readmePath)) {
		await fsp.writeFile(
			readmePath,
			buildReadme(template.id, variables, resolvedPackageManager),
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
		templateId: template.id,
		packageManager: resolvedPackageManager,
		variables,
	};
}

export async function runLegacyCli(templateId, argv = process.argv.slice(2)) {
	const { runLegacyCli: runLegacyCliImpl } = await import("./cli-core.js");
	return runLegacyCliImpl(templateId, argv);
}
