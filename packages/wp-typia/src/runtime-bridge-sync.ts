import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

type PackageManagerId = "bun" | "npm" | "pnpm" | "yarn";

type SyncExecutionInput = {
	check?: boolean;
	cwd: string;
};

type SyncProjectContext = {
	cwd: string;
	packageJsonPath: string;
	packageManager: PackageManagerId;
	scripts: Partial<Record<"sync" | "sync-rest" | "sync-types", string>>;
};

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

function getSyncRootError(cwd: string): Error {
	return new Error(
		`No generated wp-typia project root was found at ${cwd}. Run \`wp-typia sync\` from a scaffolded project or official workspace root.`,
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

function runProjectScript(
	project: SyncProjectContext,
	scriptName: "sync" | "sync-rest" | "sync-types",
	extraArgs: string[],
): void {
	const script = project.scripts[scriptName];
	if (!script) {
		return;
	}

	const invocation = getPackageManagerRunInvocation(
		project.packageManager,
		scriptName,
		extraArgs,
	);

	const result = spawnSync(invocation.command, invocation.args, {
		cwd: project.cwd,
		shell: process.platform === "win32",
		stdio: "inherit",
	});

	if (result.error || result.status !== 0) {
		throw new Error(
			`\`${formatRunScript(project.packageManager, scriptName, extraArgs.join(" "))}\` failed.`,
			{
				cause: result.error,
			},
		);
	}
}

/**
 * Executes the generated-project sync flow through the local project scripts.
 *
 * @param options Sync execution options including cwd and optional `--check`.
 * @returns A promise that resolves after the relevant sync scripts complete.
 */
export async function executeSyncCommand({
	check = false,
	cwd,
}: SyncExecutionInput): Promise<void> {
	const project = resolveSyncProjectContext(cwd);
	const extraArgs = check ? ["--check"] : [];

	if (project.scripts.sync) {
		runProjectScript(project, "sync", extraArgs);
		return;
	}

	runProjectScript(project, "sync-types", extraArgs);

	if (project.scripts["sync-rest"]) {
		runProjectScript(project, "sync-rest", extraArgs);
	}
}
