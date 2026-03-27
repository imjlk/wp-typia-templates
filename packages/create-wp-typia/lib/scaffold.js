import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ROOT = path.join(__dirname, "..", "templates");
const PACKAGE_MANAGER = "bun@1.3.10";
const TEMPLATE_IDS = ["basic", "full", "interactivity", "advanced"];
const TEMPLATE_DEFAULTS = {
	basic: {
		description: "A lightweight WordPress block with Typia validation",
		category: "text",
	},
	full: {
		description: "A full-featured WordPress block with Typia validation and utilities",
		category: "widgets",
	},
	interactivity: {
		description: "An interactive WordPress block with Typia validation and Interactivity API",
		category: "widgets",
	},
	advanced: {
		description: "An advanced WordPress block with Typia validation and migration tooling",
		category: "widgets",
	},
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

function parseArgs(argv) {
	const parsed = {
		positionals: [],
		template: undefined,
		yes: false,
		noInstall: false,
		help: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (!arg.startsWith("-")) {
			parsed.positionals.push(arg);
			continue;
		}

		if (arg === "--yes" || arg === "-y") {
			parsed.yes = true;
			continue;
		}
		if (arg === "--no-install") {
			parsed.noInstall = true;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
			continue;
		}
		if (arg === "--template" || arg === "-t") {
			parsed.template = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--template=")) {
			parsed.template = arg.split("=", 2)[1];
			continue;
		}
		throw new Error(`Unknown flag: ${arg}`);
	}

	return parsed;
}

function getTemplateVariables(templateId, answers) {
	const slug = toKebabCase(answers.slug);
	const slugSnakeCase = toSnakeCase(slug);
	const pascalCase = toPascalCase(slug);
	const title = answers.title.trim();
	const namespace = answers.namespace.trim();
	const description = answers.description.trim();
	const category = TEMPLATE_DEFAULTS[templateId]?.category ?? "widgets";

	return {
		author: answers.author.trim(),
		category,
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

async function prompt(question, defaultValue) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const suffix = defaultValue ? ` (${defaultValue})` : "";
	const answer = await new Promise((resolve) => {
		rl.question(`${question}${suffix}: `, resolve);
	});
	rl.close();

	const result = String(answer).trim();
	return result || defaultValue;
}

function detectAuthor() {
	try {
		return execSync("git config user.name", {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim() || "Your Name";
	} catch {
		return "Your Name";
	}
}

async function selectTemplate(templateId, yes) {
	if (templateId) {
		if (!TEMPLATE_IDS.includes(templateId)) {
			throw new Error(`Unknown template "${templateId}". Expected one of: ${TEMPLATE_IDS.join(", ")}`);
		}
		return templateId;
	}

	if (yes) {
		return "basic";
	}

	console.log("Select a template:");
	TEMPLATE_IDS.forEach((id, index) => {
		console.log(`  ${index + 1}. ${id}`);
	});

	const answer = await prompt("Template", "1");
	const numericChoice = Number(answer);
	if (!Number.isNaN(numericChoice) && TEMPLATE_IDS[numericChoice - 1]) {
		return TEMPLATE_IDS[numericChoice - 1];
	}
	if (TEMPLATE_IDS.includes(answer)) {
		return answer;
	}
	throw new Error(`Invalid template selection: ${answer}`);
}

async function collectAnswers({ projectName, templateId, yes }) {
	const slugDefault = toKebabCase(projectName || "my-wp-typia-block");
	const titleDefault = toTitle(slugDefault);
	const descriptionDefault = TEMPLATE_DEFAULTS[templateId]?.description ?? "WordPress block with Typia validation";
	const namespaceDefault = "create-block";
	const authorDefault = detectAuthor();

	if (yes) {
		return {
			author: authorDefault,
			description: descriptionDefault,
			namespace: namespaceDefault,
			slug: slugDefault,
			title: titleDefault,
		};
	}

	const slug = toKebabCase(await prompt("Block slug", slugDefault));
	return {
		author: await prompt("Author", authorDefault),
		description: await prompt("Description", descriptionDefault),
		namespace: await prompt("Namespace", namespaceDefault),
		slug,
		title: await prompt("Block title", toTitle(slug)),
	};
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

function buildReadme(templateId, variables) {
	return `# ${variables.title}

${variables.description}

## Template

${templateId}

## Development

\`\`\`bash
bun install
bun run start
\`\`\`

## Build

\`\`\`bash
bun run build
\`\`\`

## Type Sync

\`\`\`bash
bun run sync-types
\`\`\`

\`src/types.ts\` remains the source of truth for \`block.json\` and \`typia.manifest.json\`.
`;
}

function buildGitignore() {
	return `# Dependencies
node_modules/

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

async function normalizePackageJson(targetDir) {
	const packageJsonPath = path.join(targetDir, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		return;
	}

	const packageJson = JSON.parse(await fsp.readFile(packageJsonPath, "utf8"));
	packageJson.packageManager = PACKAGE_MANAGER;

	if (packageJson.scripts) {
		for (const [key, value] of Object.entries(packageJson.scripts)) {
			if (typeof value === "string") {
				packageJson.scripts[key] = value
					.replace(/\bnpm install\b/g, "bun install")
					.replace(/\bnpm run\b/g, "bun run")
					.replace(/\bnpm start\b/g, "bun run start");
			}
		}
	}

	await fsp.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`, "utf8");
}

async function replaceTextRecursively(targetDir) {
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

		if (!textExtensions.has(path.extname(currentPath))) {
			return;
		}

		const content = await fsp.readFile(currentPath, "utf8");
		const nextContent = content
			.replace(/\bnpm install\b/g, "bun install")
			.replace(/\bnpm ci\b/g, "bun install --frozen-lockfile")
			.replace(/\bnpm run\b/g, "bun run")
			.replace(/\bnpm start\b/g, "bun run start")
			.replace(/wp-typia-templates/g, "wp-typia-templates")
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

function getTemplateDir(templateId) {
	return path.join(TEMPLATE_ROOT, templateId);
}

async function runInstall(targetDir) {
	execSync("bun install", {
		cwd: targetDir,
		stdio: "inherit",
	});
}

export async function scaffoldProject({
	projectDir,
	projectName,
	template,
	yes = false,
	noInstall = false,
	allowExistingDir = false,
}) {
	const templateId = await selectTemplate(template, yes);
	const templateDir = getTemplateDir(templateId);
	if (!fs.existsSync(templateDir)) {
		throw new Error(`Template assets are missing for "${templateId}"`);
	}

	await ensureDirectory(projectDir, allowExistingDir);

	const answers = await collectAnswers({
		projectName,
		templateId,
		yes,
	});
	const variables = getTemplateVariables(templateId, answers);

	await copyTemplateDir(templateDir, projectDir, variables);
	const readmePath = path.join(projectDir, "README.md");
	if (!fs.existsSync(readmePath)) {
		await fsp.writeFile(readmePath, buildReadme(templateId, variables), "utf8");
	}
	await fsp.writeFile(path.join(projectDir, ".gitignore"), buildGitignore(), "utf8");
	await normalizePackageJson(projectDir);
	await replaceTextRecursively(projectDir);

	if (!noInstall) {
		runInstall(projectDir);
	}

	return {
		projectDir,
		templateId,
		variables,
	};
}

export async function runCreateCli(argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	if (args.help) {
		console.log(`Usage: create-wp-typia <project-dir> [--template <id>] [--yes] [--no-install]

Templates: ${TEMPLATE_IDS.join(", ")}`);
		return;
	}

	const projectName = args.positionals[0];
	if (!projectName) {
		throw new Error("Project directory is required. Usage: create-wp-typia <project-dir>");
	}

	const projectDir = path.resolve(process.cwd(), projectName);
	const result = await scaffoldProject({
		noInstall: args.noInstall,
		projectDir,
		projectName,
		template: args.template,
		yes: args.yes,
	});

	console.log(`\n✅ Created ${result.variables.title} in ${projectDir}`);
	console.log("Next steps:");
	console.log(`  cd ${projectName}`);
	if (args.noInstall) {
		console.log("  bun install");
	}
	console.log("  bun run start");
}

export async function runLegacyCli(templateId, argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	if (args.help) {
		console.log(`Usage: wp-typia-${templateId} [--yes] [--no-install]`);
		return;
	}

	const projectDir = process.cwd();
	const projectName = path.basename(projectDir);
	const result = await scaffoldProject({
		allowExistingDir: true,
		noInstall: args.noInstall,
		projectDir,
		projectName,
		template: templateId,
		yes: args.yes,
	});

	console.log(`\n✅ Scaffolded ${result.variables.title} in the current directory`);
	console.log("Next steps:");
	if (args.noInstall) {
		console.log("  bun install");
	}
	console.log("  bun run start");
}
