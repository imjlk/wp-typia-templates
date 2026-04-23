import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type PackageManagerId = "bun" | "npm" | "pnpm" | "yarn";
type SyncScriptName = "sync" | "sync-rest" | "sync-types";

type SyncExecutionInput = {
	captureOutput?: boolean;
	check?: boolean;
	cwd: string;
	dryRun?: boolean;
};

type SyncProjectContext = {
	cwd: string;
	packageJsonPath: string;
	packageManager: PackageManagerId;
	scripts: Partial<Record<SyncScriptName, string>>;
};

export type SyncPlannedCommand = {
	args: string[];
	command: string;
	displayCommand: string;
	scriptName: SyncScriptName;
};

export type SyncExecutedCommand = SyncPlannedCommand & {
	exitCode: number;
	stderr?: string;
	stdout?: string;
};

export type SyncExecutionResult = {
	check: boolean;
	dryRun: boolean;
	executedCommands?: SyncExecutedCommand[];
	packageJsonPath: string;
	packageManager: PackageManagerId;
	plannedCommands: SyncPlannedCommand[];
	projectDir: string;
};

const SYNC_INSTALL_MARKERS = ["node_modules", ".pnp.cjs", ".pnp.loader.mjs"] as const;
const LOCAL_SYNC_TOOL_PATTERN = /(^|[\s;&|()])(?:tsx|wp-scripts)(?=($|[\s;&|()]))/u;
const CAPTURED_SYNC_OUTPUT_MAX_BUFFER = 16 * 1024 * 1024;

function formatRunScript(
	packageManagerId: PackageManagerId,
	scriptName: string,
	extraArgs = "",
) {
	const args = extraArgs.trim();
	if (packageManagerId === "bun") {
		return args ? `bun run ${scriptName} ${args}` : `bun run ${scriptName}`;
	}
	if (packageManagerId === "npm") {
		return args ? `npm run ${scriptName} -- ${args}` : `npm run ${scriptName}`;
	}
	if (packageManagerId === "pnpm") {
		return args ? `pnpm run ${scriptName} ${args}` : `pnpm run ${scriptName}`;
	}
	return args ? `yarn run ${scriptName} ${args}` : `yarn run ${scriptName}`;
}

function formatInstallCommand(packageManagerId: PackageManagerId): string {
	switch (packageManagerId) {
		case "bun":
			return "bun install";
		case "pnpm":
			return "pnpm install";
		case "yarn":
			return "yarn install";
		default:
			return "npm install";
	}
}

function getSyncRootError(cwd: string): Error {
	return new Error(
		`No generated wp-typia project root was found at ${cwd}. Run \`wp-typia sync\` from a scaffolded project or official workspace root that already contains generated sync scripts. If you expected this directory to work, cd into the scaffold root first or rerun the scaffold before syncing.`,
	);
}

function inferSyncPackageManager(cwd: string, packageManagerField?: string): PackageManagerId {
	const field = String(packageManagerField ?? "");
	if (field.startsWith("bun@")) return "bun";
	if (field.startsWith("npm@")) return "npm";
	if (field.startsWith("pnpm@")) return "pnpm";
	if (field.startsWith("yarn@")) return "yarn";

	if (
		fs.existsSync(path.join(cwd, "bun.lock")) ||
		fs.existsSync(path.join(cwd, "bun.lockb"))
	) {
		return "bun";
	}
	if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
		return "pnpm";
	}
	if (
		fs.existsSync(path.join(cwd, "yarn.lock")) ||
		fs.existsSync(path.join(cwd, ".pnp.cjs")) ||
		fs.existsSync(path.join(cwd, ".pnp.loader.mjs")) ||
		fs.existsSync(path.join(cwd, ".yarnrc.yml"))
	) {
		return "yarn";
	}
	if (
		fs.existsSync(path.join(cwd, "package-lock.json")) ||
		fs.existsSync(path.join(cwd, "npm-shrinkwrap.json"))
	) {
		return "npm";
	}

	return "npm";
}

function resolveSyncProjectContext(cwd: string): SyncProjectContext {
	const packageJsonPath = path.join(cwd, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		throw getSyncRootError(cwd);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
		packageManager?: string;
		scripts?: Record<string, unknown>;
	};
	const scripts = packageJson.scripts ?? {};
	const syncScripts = {
		sync: typeof scripts.sync === "string" ? scripts.sync : undefined,
		"sync-rest":
			typeof scripts["sync-rest"] === "string" ? scripts["sync-rest"] : undefined,
		"sync-types":
			typeof scripts["sync-types"] === "string" ? scripts["sync-types"] : undefined,
	} satisfies SyncProjectContext["scripts"];

	if (!syncScripts.sync && !syncScripts["sync-types"]) {
		throw new Error(
			`Expected ${packageJsonPath} to define either a \`sync\` or \`sync-types\` script.`,
		);
	}

	return {
		cwd,
		packageJsonPath,
		packageManager: inferSyncPackageManager(cwd, packageJson.packageManager),
		scripts: syncScripts,
	};
}

function findInstalledDependencyMarkerDir(projectDir: string): string | null {
	let currentDir = path.resolve(projectDir);

	while (true) {
		if (
			SYNC_INSTALL_MARKERS.some((marker) =>
				fs.existsSync(path.join(currentDir, marker)),
			)
		) {
			return currentDir;
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			return null;
		}
		currentDir = parentDir;
	}
}

function scriptsLikelyNeedInstalledDependencies(project: SyncProjectContext): boolean {
	const candidateScripts = project.scripts.sync
		? [project.scripts.sync]
		: [project.scripts["sync-types"], project.scripts["sync-rest"]];

	return candidateScripts.some(
		(script): script is string =>
			typeof script === "string" && LOCAL_SYNC_TOOL_PATTERN.test(script),
	);
}

function assertSyncDependenciesInstalled(project: SyncProjectContext): void {
	if (!scriptsLikelyNeedInstalledDependencies(project)) {
		return;
	}
	const markerDir = findInstalledDependencyMarkerDir(project.cwd);
	if (markerDir) {
		return;
	}

	throw new Error(
		`Project dependencies have not been installed yet. Run \`${formatInstallCommand(project.packageManager)}\` from the project root before \`wp-typia sync\`. The generated sync scripts rely on local tools such as \`tsx\`.`,
	);
}

function getPackageManagerRunInvocation(
	packageManager: PackageManagerId,
	scriptName: string,
	extraArgs: string[],
): { args: string[]; command: string } {
	switch (packageManager) {
		case "bun":
			return { args: ["run", scriptName, ...extraArgs], command: "bun" };
		case "npm":
			return {
				args: ["run", scriptName, ...(extraArgs.length > 0 ? ["--", ...extraArgs] : [])],
				command: "npm",
			};
		case "pnpm":
			return { args: ["run", scriptName, ...extraArgs], command: "pnpm" };
		case "yarn":
			return { args: ["run", scriptName, ...extraArgs], command: "yarn" };
	}
}

function createSyncPlannedCommand(
	project: SyncProjectContext,
	scriptName: SyncScriptName,
	extraArgs: string[],
): SyncPlannedCommand | null {
	const script = project.scripts[scriptName];
	if (!script) {
		return null;
	}

	const invocation = getPackageManagerRunInvocation(
		project.packageManager,
		scriptName,
		extraArgs,
	);

	return {
		args: invocation.args,
		command: invocation.command,
		displayCommand: formatRunScript(
			project.packageManager,
			scriptName,
			extraArgs.join(" "),
		),
		scriptName,
	};
}

function buildSyncPlannedCommands(
	project: SyncProjectContext,
	extraArgs: string[],
): SyncPlannedCommand[] {
	if (project.scripts.sync) {
		return [createSyncPlannedCommand(project, "sync", extraArgs)!];
	}

	const plannedCommands = [createSyncPlannedCommand(project, "sync-types", extraArgs)!];
	const syncRestCommand = createSyncPlannedCommand(project, "sync-rest", extraArgs);
	if (syncRestCommand) {
		plannedCommands.push(syncRestCommand);
	}

	return plannedCommands;
}

function runProjectScript(
	project: SyncProjectContext,
	plannedCommand: SyncPlannedCommand,
	options: {
		captureOutput: boolean;
	},
): SyncExecutedCommand {
	const result = spawnSync(plannedCommand.command, plannedCommand.args, {
		cwd: project.cwd,
		encoding: options.captureOutput ? "utf8" : undefined,
		...(options.captureOutput ? { maxBuffer: CAPTURED_SYNC_OUTPUT_MAX_BUFFER } : {}),
		shell: process.platform === "win32",
		stdio: options.captureOutput ? "pipe" : "inherit",
	});
	const stderr =
		options.captureOutput && typeof result.stderr === "string"
			? result.stderr
			: undefined;
	const stdout =
		options.captureOutput && typeof result.stdout === "string"
			? result.stdout
			: undefined;

	if (result.error || result.status !== 0) {
		throw new Error(
			`\`${plannedCommand.displayCommand}\` failed.`,
			{
				cause: result.error ?? (stderr ? new Error(stderr.trim()) : undefined),
			},
		);
	}

	return {
		...plannedCommand,
		exitCode: result.status ?? 0,
		...(stderr !== undefined ? { stderr } : {}),
		...(stdout !== undefined ? { stdout } : {}),
	};
}

/**
 * Executes the generated-project sync flow through the local project scripts.
 *
 * @param options Sync execution options including cwd, optional `--check`, and
 * optional `--dry-run` preview mode.
 * @returns A promise that resolves with the planned sync commands and any
 * executed command output metadata.
 */
export async function executeSyncCommand({
	captureOutput = false,
	check = false,
	cwd,
	dryRun = false,
}: SyncExecutionInput): Promise<SyncExecutionResult> {
	const project = resolveSyncProjectContext(cwd);
	const extraArgs = check ? ["--check"] : [];
	const plannedCommands = buildSyncPlannedCommands(project, extraArgs);
	const result: SyncExecutionResult = {
		check,
		dryRun,
		packageJsonPath: project.packageJsonPath,
		packageManager: project.packageManager,
		plannedCommands,
		projectDir: project.cwd,
	};

	if (dryRun) {
		return result;
	}

	assertSyncDependenciesInstalled(project);
	result.executedCommands = plannedCommands.map((plannedCommand) =>
		runProjectScript(project, plannedCommand, {
			captureOutput,
		}),
	);
	return result;
}
