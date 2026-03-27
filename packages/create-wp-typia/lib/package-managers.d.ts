export type PackageManagerId = "bun" | "npm" | "pnpm" | "yarn";

export interface PackageManagerConfig {
	id: PackageManagerId;
	label: string;
	packageManagerField: string;
	installCommand: string;
	frozenInstallCommand: string;
}

export const PACKAGE_MANAGER_IDS: PackageManagerId[];
export const PACKAGE_MANAGERS: Record<PackageManagerId, PackageManagerConfig>;

export function getPackageManager(id: PackageManagerId | string): PackageManagerConfig;
export function getPackageManagerSelectOptions(): Array<{
	label: string;
	value: PackageManagerId;
	hint: string;
}>;
export function formatRunScript(
	packageManagerId: PackageManagerId,
	scriptName: string,
	extraArgs?: string,
): string;
export function formatInstallCommand(packageManagerId: PackageManagerId): string;
export function transformPackageManagerText(
	content: string,
	packageManagerId: PackageManagerId,
): string;
