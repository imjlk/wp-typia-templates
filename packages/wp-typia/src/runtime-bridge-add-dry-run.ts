import { promises as fsp } from "node:fs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type WorkspaceFileOperation = `update ${string}` | `write ${string}`;

const SKIPPED_COPY_ROOT_ENTRIES = new Set([".git", "node_modules"]);
const SKIPPED_COMPARE_ROOT_ENTRIES = new Set([
	".git",
	".pnp.cjs",
	".pnp.loader.mjs",
	"node_modules",
]);

async function copyWorkspaceProject(sourceDir: string, targetDir: string): Promise<void> {
	await fsp.cp(sourceDir, targetDir, {
		filter: (sourcePath) => {
			const relativePath = path.relative(sourceDir, sourcePath);
			if (relativePath === "") {
				return true;
			}

			const [rootEntry] = relativePath.split(path.sep);
			return !SKIPPED_COPY_ROOT_ENTRIES.has(rootEntry ?? "");
		},
		recursive: true,
	});
}

function ensureWorkspaceInstallMarkers(sourceDir: string, targetDir: string): void {
	const sourceNodeModules = path.join(sourceDir, "node_modules");
	if (fs.existsSync(sourceNodeModules)) {
		fs.symlinkSync(sourceNodeModules, path.join(targetDir, "node_modules"), "junction");
	}

	for (const marker of [".pnp.cjs", ".pnp.loader.mjs"] as const) {
		const sourceMarker = path.join(sourceDir, marker);
		if (!fs.existsSync(sourceMarker)) {
			continue;
		}

		fs.symlinkSync(sourceMarker, path.join(targetDir, marker));
	}
}

async function listWorkspaceFiles(rootDir: string): Promise<Map<string, string>> {
	const files = new Map<string, string>();

	async function visit(currentDir: string): Promise<void> {
		const entries = await fsp.readdir(currentDir, { withFileTypes: true });
		for (const entry of entries) {
			const absolutePath = path.join(currentDir, entry.name);
			const relativePath = path.relative(rootDir, absolutePath);
			const [rootEntry] = relativePath.split(path.sep);
			if (SKIPPED_COMPARE_ROOT_ENTRIES.has(rootEntry ?? "")) {
				continue;
			}

			if (entry.isDirectory()) {
				await visit(absolutePath);
				continue;
			}

			if (!entry.isFile()) {
				continue;
			}

			files.set(
				relativePath.replace(path.sep === "\\" ? /\\/gu : /\//gu, "/"),
				await fsp.readFile(absolutePath, "utf8"),
			);
		}
	}

	await visit(rootDir);
	return files;
}

async function collectWorkspaceFileOperations(
	sourceDir: string,
	simulatedDir: string,
): Promise<WorkspaceFileOperation[]> {
	const [sourceFiles, simulatedFiles] = await Promise.all([
		listWorkspaceFiles(sourceDir),
		listWorkspaceFiles(simulatedDir),
	]);
	const operations: WorkspaceFileOperation[] = [];

	for (const [relativePath, simulatedSource] of simulatedFiles) {
		const originalSource = sourceFiles.get(relativePath);
		if (originalSource === undefined) {
			operations.push(`write ${relativePath}`);
			continue;
		}

		if (originalSource !== simulatedSource) {
			operations.push(`update ${relativePath}`);
		}
	}

	return operations.sort((left, right) => left.localeCompare(right));
}

/**
 * Runs a mutating workspace add command against a temporary clone and reports
 * the file operations that would be applied to the real workspace.
 *
 * @param options Workspace add dry-run options.
 * @returns The simulated command result plus normalized file operations.
 */
export async function simulateWorkspaceAddDryRun<T>({
	cwd,
	execute,
}: {
	cwd: string;
	execute: (simulatedCwd: string) => Promise<T>;
}): Promise<{
	fileOperations: WorkspaceFileOperation[];
	result: T;
}> {
	const { resolveWorkspaceProject } = await import("@wp-typia/project-tools/workspace-project");
	const workspace = resolveWorkspaceProject(cwd);
	const relativeCwd = path.relative(workspace.projectDir, path.resolve(cwd));
	const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "wp-typia-add-plan-"));
	const simulatedProjectDir = path.join(tempRoot, "workspace");

	try {
		await copyWorkspaceProject(workspace.projectDir, simulatedProjectDir);
		ensureWorkspaceInstallMarkers(workspace.projectDir, simulatedProjectDir);

		const simulatedCwd =
			relativeCwd.length > 0 ? path.join(simulatedProjectDir, relativeCwd) : simulatedProjectDir;
		const result = await execute(simulatedCwd);
		const fileOperations = await collectWorkspaceFileOperations(
			workspace.projectDir,
			simulatedProjectDir,
		);

		return {
			fileOperations,
			result,
		};
	} finally {
		await fsp.rm(tempRoot, { force: true, recursive: true });
	}
}
