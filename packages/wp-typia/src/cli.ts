import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createCLI, type CLI } from "@bunli/core";
import { aiAgentPlugin } from "@bunli/plugin-ai-detect";
import { completionsPlugin } from "@bunli/plugin-completions";
import { configMergerPlugin } from "@bunli/plugin-config";
import { skillsPlugin } from "@bunli/plugin-skills";

import packageJson from "../package.json";
import { bunliConfig } from "../bunli.config";
import { writeStructuredCliDiagnosticError } from "./cli-diagnostic-output";
import {
	normalizeCliOutputFormatArgv,
	validateCliOutputFormatArgv,
} from "./cli-output-format";
import { normalizeWpTypiaArgv } from "./command-contract";
import { WP_TYPIA_CONFIG_SOURCES } from "./config";
import { extractWpTypiaConfigOverride } from "./config-override";
import { createWpTypiaSkillsMetadataPlugin } from "./plugins/wp-typia-skills";
import { wpTypiaUserConfigPlugin } from "./plugins/wp-typia-user-config";

function applyStandaloneSupportLayoutEnv(): void {
	if (process.env.WP_TYPIA_PROJECT_TOOLS_PACKAGE_ROOT) {
		return;
	}

	const executableDir = path.dirname(process.execPath);
	const candidateRoots = [
		path.join(executableDir, ".wp-typia", "share", "wp-typia-project-tools"),
		path.resolve(
			executableDir,
			"..",
			".wp-typia",
			"share",
			"wp-typia-project-tools",
		),
	];

	for (const candidateRoot of candidateRoots) {
		if (fs.existsSync(path.join(candidateRoot, "package.json"))) {
			process.env.WP_TYPIA_PROJECT_TOOLS_PACKAGE_ROOT = candidateRoot;
			return;
		}
	}
}

function resolveGeneratedMetadataPath(moduleUrl: string): string {
	const candidates = [
		new URL("./.bunli/commands.gen.js", moduleUrl),
		new URL("../lib/.bunli/commands.gen.js", moduleUrl),
		new URL("../.bunli/commands.gen.ts", moduleUrl),
	];

	for (const candidate of candidates) {
		const candidatePath = fileURLToPath(candidate);
		if (fs.existsSync(candidatePath)) {
			return candidatePath;
		}
	}

	return fileURLToPath(new URL("../.bunli/commands.gen.ts", moduleUrl));
}

async function formatCliError(error: unknown): Promise<string> {
	try {
		const { formatCliDiagnosticError } = await import("@wp-typia/project-tools/cli-diagnostics");
		return formatCliDiagnosticError(error);
	} catch {
		return error instanceof Error ? error.message : String(error);
	}
}

export async function createWpTypiaCli(options: {
	configOverridePath?: string;
} = {}): Promise<CLI> {
	applyStandaloneSupportLayoutEnv();
	const { wpTypiaCommands } = await import("./command-list");

	const cli = await createCLI({
		...bunliConfig,
		description: packageJson.description,
		name: packageJson.name,
		plugins: [
			configMergerPlugin({
				mergeStrategy: "deep",
				sources: [...WP_TYPIA_CONFIG_SOURCES],
			}),
			wpTypiaUserConfigPlugin({
				overrideSource: options.configOverridePath,
			}),
			aiAgentPlugin({}),
			createWpTypiaSkillsMetadataPlugin(wpTypiaCommands),
			skillsPlugin({
				description: packageJson.description,
			}),
			completionsPlugin({
				commandName: "wp-typia",
				executable: "wp-typia",
				generatedPath: resolveGeneratedMetadataPath(import.meta.url),
			}),
		],
		version: packageJson.version,
	});

	for (const command of wpTypiaCommands) {
		cli.command(command);
	}

	return cli;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
	const normalizedArgv = normalizeWpTypiaArgv(argv);
	const { argv: cliArgv, configOverridePath } = extractWpTypiaConfigOverride(normalizedArgv);
	validateCliOutputFormatArgv(cliArgv);
	const cli = await createWpTypiaCli({ configOverridePath });
	await cli.run(normalizeCliOutputFormatArgv(cliArgv));
}

export async function runCliEntrypoint(argv = process.argv.slice(2)): Promise<void> {
	try {
		await main(argv);
	} catch (error) {
		if (writeStructuredCliDiagnosticError(argv, error)) {
			return;
		}
		console.error(`Error: ${await formatCliError(error)}`);
		process.exitCode = 1;
	}
}

if (import.meta.main) {
	void runCliEntrypoint();
}

export default createWpTypiaCli;
