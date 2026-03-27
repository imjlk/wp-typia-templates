import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

import {
	collectScaffoldAnswers,
	resolvePackageManagerId,
	resolveTemplateId,
	scaffoldProject,
} from "./scaffold.js";
import {
	PACKAGE_MANAGER_IDS,
	formatInstallCommand,
	formatRunScript,
	getPackageManagerSelectOptions,
} from "./package-managers.js";
import {
	TEMPLATE_IDS,
	getTemplateById,
	getTemplateSelectOptions,
	listTemplates,
} from "./template-registry.js";

function parseArgs(argv) {
	const parsed = {
		help: false,
		noInstall: false,
		packageManager: undefined,
		positionals: [],
		template: undefined,
		yes: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];

		if (!arg.startsWith("-")) {
			parsed.positionals.push(arg);
			continue;
		}

		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
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
		if (arg === "--template" || arg === "-t") {
			parsed.template = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--template=")) {
			parsed.template = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--package-manager" || arg === "-p") {
			parsed.packageManager = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg.startsWith("--package-manager=")) {
			parsed.packageManager = arg.split("=", 2)[1];
			continue;
		}

		throw new Error(`Unknown flag: ${arg}`);
	}

	return parsed;
}

function createPrompt() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return {
		async text(message, defaultValue, validate) {
			const suffix = defaultValue ? ` (${defaultValue})` : "";
			const answer = await new Promise((resolve) => {
				rl.question(`${message}${suffix}: `, resolve);
			});
			const value = String(answer).trim() || defaultValue;
			if (validate) {
				const result = validate(value);
				if (result !== true) {
					console.error(`❌ ${result}`);
					return this.text(message, defaultValue, validate);
				}
			}
			return value;
		},
		async select(message, options, defaultIndex = 1) {
			console.log(message);
			options.forEach((option, index) => {
				const hint = option.hint ? ` - ${option.hint}` : "";
				console.log(`  ${index + 1}. ${option.label}${hint}`);
			});

			const answer = await this.text("Choice", String(defaultIndex));
			const numeric = Number(answer);
			if (!Number.isNaN(numeric) && options[numeric - 1]) {
				return options[numeric - 1].value;
			}

			const direct = options.find((option) => option.value === answer);
			if (direct) {
				return direct.value;
			}

			console.error(`❌ Invalid selection: ${answer}`);
			return this.select(message, options, defaultIndex);
		},
		close() {
			rl.close();
		},
	};
}

function printHelp() {
	console.log(`Usage:
  create-wp-typia <project-dir> [--template <id>] [--yes] [--no-install] [--package-manager <id>]
  create-wp-typia templates list
  create-wp-typia templates inspect <id>
  create-wp-typia doctor

Templates: ${TEMPLATE_IDS.join(", ")}
Package managers: ${PACKAGE_MANAGER_IDS.join(", ")}`);
}

function printTemplate(template) {
	console.log(`${template.id}`);
	console.log(template.description);
	console.log(`Category: ${template.defaultCategory}`);
	console.log(`Path: ${template.templateDir}`);
	console.log(`Features: ${template.features.join(", ")}`);
}

function readCommandVersion(command, args = ["--version"]) {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

function compareMajorVersion(actualVersion, minimumMajor) {
	const parsed = Number.parseInt(actualVersion.replace(/^v/, "").split(".")[0] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= minimumMajor;
}

async function checkWritableDirectory(directory) {
	try {
		await access(directory, fsConstants.W_OK);
		return true;
	} catch {
		return false;
	}
}

async function checkTempDirectory() {
	const tempFile = path.join(os.tmpdir(), `create-wp-typia-${Date.now()}.tmp`);
	try {
		await writeFile(tempFile, "ok", "utf8");
		await rm(tempFile, { force: true });
		return true;
	} catch {
		return false;
	}
}

function printDoctorLine(status, label, detail) {
	const prefix = status === "PASS" ? "PASS" : "FAIL";
	console.log(`${prefix} ${label}: ${detail}`);
}

async function runDoctor(cwd) {
	const bunVersion = readCommandVersion("bun");
	const nodeVersion = readCommandVersion("node");
	const gitVersion = readCommandVersion("git");
	const cwdWritable = await checkWritableDirectory(cwd);
	const tempWritable = await checkTempDirectory();
	let hasFailures = false;

	printDoctorLine(
		bunVersion && compareMajorVersion(bunVersion, 1) ? "PASS" : "FAIL",
		"Bun",
		bunVersion ? `Detected ${bunVersion}` : "Not available",
	);
	hasFailures ||= !(bunVersion && compareMajorVersion(bunVersion, 1));

	printDoctorLine(
		nodeVersion && compareMajorVersion(nodeVersion, 16) ? "PASS" : "FAIL",
		"Node",
		nodeVersion ? `Detected ${nodeVersion}` : "Not available",
	);
	hasFailures ||= !(nodeVersion && compareMajorVersion(nodeVersion, 16));

	printDoctorLine(gitVersion ? "PASS" : "FAIL", "git", gitVersion ?? "Not available");
	hasFailures ||= !gitVersion;

	printDoctorLine(cwdWritable ? "PASS" : "FAIL", "Current directory", cwdWritable ? "Writable" : "Not writable");
	hasFailures ||= !cwdWritable;

	printDoctorLine(tempWritable ? "PASS" : "FAIL", "Temp directory", tempWritable ? "Writable" : "Not writable");
	hasFailures ||= !tempWritable;

	for (const template of listTemplates()) {
		const hasAssets =
			fs.existsSync(template.templateDir) &&
			fs.existsSync(path.join(template.templateDir, "package.json.mustache"));
		printDoctorLine(
			hasAssets ? "PASS" : "FAIL",
			`Template ${template.id}`,
			hasAssets ? template.templateDir : "Missing core template assets",
		);
		hasFailures ||= !hasAssets;
	}

	if (hasFailures) {
		throw new Error("Doctor found one or more failing checks.");
	}
}

async function runScaffold(parsed, cwd) {
	const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);
	const prompt = createPrompt();

	try {
		const projectInput = parsed.positionals[0];
		if (!projectInput) {
			throw new Error("Project directory is required. Usage: create-wp-typia <project-dir>");
		}

		const templateId = await resolveTemplateId({
			templateId: parsed.template,
			yes: parsed.yes,
			isInteractive,
			selectTemplate: () =>
				prompt.select("Select a template", getTemplateSelectOptions(), 1),
		});
			const packageManager = await resolvePackageManagerId({
				packageManager: parsed.packageManager,
				yes: parsed.yes,
				isInteractive,
				selectPackageManager: () =>
					prompt.select("Choose a package manager", getPackageManagerSelectOptions(), 1),
			});
			const projectDir = path.resolve(cwd, projectInput);
			const projectName = path.basename(projectDir);
			const answers = await collectScaffoldAnswers({
			projectName,
			templateId,
			yes: parsed.yes,
			promptText: (message, defaultValue, validate) =>
				prompt.text(message, defaultValue, validate),
		});
		const result = await scaffoldProject({
			answers,
			noInstall: parsed.noInstall,
			packageManager,
			projectDir,
			templateId,
		});

		console.log(`\n✅ Created ${result.variables.title} in ${projectDir}`);
		console.log("Next steps:");
		console.log(`  cd ${path.isAbsolute(projectInput) ? projectDir : projectInput}`);
		if (parsed.noInstall) {
			console.log(`  ${formatInstallCommand(packageManager)}`);
		}
		console.log(`  ${formatRunScript(packageManager, "start")}`);
	} finally {
		prompt.close();
	}
}

export async function runNodeCli(argv = process.argv.slice(2), cwd = process.cwd()) {
	const parsed = parseArgs(argv);

	if (parsed.help) {
		printHelp();
		return;
	}

	const [first, second] = parsed.positionals;
	if (first === "templates") {
		if (second === "list") {
			for (const template of listTemplates()) {
				console.log(`${template.id.padEnd(14)} ${template.description}`);
				console.log(`  ${template.features.join(" • ")}`);
			}
			return;
		}
		if (second === "inspect") {
			const templateId = parsed.positionals[2];
			if (!templateId) {
				throw new Error(`Template ID is required. Use one of: ${TEMPLATE_IDS.join(", ")}`);
			}
			printTemplate(getTemplateById(templateId));
			return;
		}
		throw new Error("Usage: create-wp-typia templates <list|inspect>");
	}

	if (first === "doctor") {
		await runDoctor(cwd);
		return;
	}

	await runScaffold(parsed, cwd);
}
