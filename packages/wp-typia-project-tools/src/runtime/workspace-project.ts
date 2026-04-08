import fs from "node:fs";
import path from "node:path";

import type { PackageManagerId } from "./package-managers.js";

export const WORKSPACE_TEMPLATE_PACKAGE = "@wp-typia/create-workspace-template";

export interface WorkspacePackageJson {
	author?: string;
	name?: string;
	packageManager?: string;
	wpTypia?: {
		namespace?: string;
		phpPrefix?: string;
		projectType?: string;
		templatePackage?: string;
		textDomain?: string;
	};
}

export interface WorkspaceProject {
	author: string;
	packageManager: PackageManagerId;
	packageName: string;
	projectDir: string;
	workspace: Required<NonNullable<WorkspacePackageJson["wpTypia"]>>;
}

/**
 * Parse a package-manager identifier from a `packageManager` field.
 *
 * @param packageManagerField Raw package-manager field such as `bun@1.3.11`.
 * @returns A normalized `PackageManagerId`, defaulting to `"bun"` when the
 * field is missing or unsupported.
 */
export function parseWorkspacePackageManagerId(
	packageManagerField: string | undefined,
): PackageManagerId {
	const packageManagerId = packageManagerField?.split("@", 1)[0];
	switch (packageManagerId) {
		case "bun":
		case "npm":
		case "pnpm":
		case "yarn":
			return packageManagerId;
		default:
			return "bun";
	}
}

/**
 * Try to resolve the nearest official wp-typia workspace from `startDir`.
 *
 * @param startDir Directory to begin walking upward from.
 * @returns The resolved `WorkspaceProject`, or `null` when no
 * `WORKSPACE_TEMPLATE_PACKAGE` workspace is found.
 * @throws {Error} When a discovered `package.json` cannot be parsed.
 */
export function tryResolveWorkspaceProject(startDir: string): WorkspaceProject | null {
	let currentDir = path.resolve(startDir);

	while (true) {
		const packageJsonPath = path.join(currentDir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			let packageJson: WorkspacePackageJson;
			try {
				packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				) as WorkspacePackageJson;
			} catch (error) {
				throw new Error(
					`Failed to parse workspace package manifest at ${packageJsonPath}: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
			}

			if (
				packageJson.wpTypia?.projectType === "workspace" &&
				packageJson.wpTypia?.templatePackage === WORKSPACE_TEMPLATE_PACKAGE &&
				typeof packageJson.wpTypia.namespace === "string" &&
				typeof packageJson.wpTypia.textDomain === "string" &&
				typeof packageJson.wpTypia.phpPrefix === "string"
			) {
				return {
					author: typeof packageJson.author === "string" ? packageJson.author : "Your Name",
					packageManager: parseWorkspacePackageManagerId(packageJson.packageManager),
					packageName:
						typeof packageJson.name === "string"
							? packageJson.name
							: path.basename(currentDir),
					projectDir: currentDir,
					workspace: {
						namespace: packageJson.wpTypia.namespace,
						phpPrefix: packageJson.wpTypia.phpPrefix,
						projectType: "workspace",
						templatePackage: WORKSPACE_TEMPLATE_PACKAGE,
						textDomain: packageJson.wpTypia.textDomain,
					},
				};
			}
		}

		const parentDir = path.dirname(currentDir);
		if (parentDir === currentDir) {
			break;
		}
		currentDir = parentDir;
	}

	return null;
}

/**
 * Resolve the nearest official wp-typia workspace from `startDir`.
 *
 * @param startDir Directory to begin walking upward from.
 * @returns The resolved `WorkspaceProject`.
 * @throws {Error} When no `WORKSPACE_TEMPLATE_PACKAGE` workspace can be found.
 */
export function resolveWorkspaceProject(startDir: string): WorkspaceProject {
	const workspace = tryResolveWorkspaceProject(startDir);
	if (workspace) {
		return workspace;
	}

	throw new Error(
		`This command must run inside a ${WORKSPACE_TEMPLATE_PACKAGE} project. Create one with \`wp-typia create my-plugin --template ${WORKSPACE_TEMPLATE_PACKAGE}\` first.`,
	);
}
