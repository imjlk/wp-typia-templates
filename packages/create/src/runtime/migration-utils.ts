import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import { formatRunScript } from "./package-managers.js";
import type { JsonValue, ManifestAttribute, JsonObject } from "./migration-types.js";
export { cloneJsonValue } from "./json-utils.js";

export function getValueAtPath(input: Record<string, unknown>, pathLabel: string): unknown {
	return String(pathLabel)
		.split(".")
		.reduce<unknown>(
			(value, segment) =>
				value && typeof value === "object" ? (value as Record<string, unknown>)[segment] : undefined,
			input,
		);
}

export function setValueAtPath(input: Record<string, unknown>, pathLabel: string, value: unknown): void {
	const segments = String(pathLabel).split(".");
	let target: Record<string, unknown> = input;
	while (segments.length > 1) {
		const segment = segments.shift();
		if (!segment) {
			continue;
		}
		if (!target[segment] || typeof target[segment] !== "object" || Array.isArray(target[segment])) {
			target[segment] = {};
		}
		target = target[segment] as Record<string, unknown>;
	}
	target[segments[0]!] = value;
}

export function deleteValueAtPath(input: Record<string, unknown>, pathLabel: string): void {
	const segments = String(pathLabel).split(".");
	let target: Record<string, unknown> = input;
	while (segments.length > 1) {
		const segment = segments.shift();
		if (!segment || !target[segment] || typeof target[segment] !== "object") {
			return;
		}
		target = target[segment] as Record<string, unknown>;
	}
	delete target[segments[0]!];
}

export function createFixtureScalarValue(pathLabel: string): JsonValue {
	const normalized = String(pathLabel).toLowerCase();
	if (normalized.includes("id")) {
		return "00000000-0000-4000-8000-000000000000";
	}
	if (normalized.includes("count") || normalized.includes("number")) {
		return 1;
	}
	if (normalized.includes("visible") || normalized.startsWith("is")) {
		return true;
	}
	return `legacy:${pathLabel}`;
}

export function createTransformFixtureValue(attribute: ManifestAttribute | null | undefined, pathLabel: string): JsonValue {
	switch (attribute?.ts?.kind) {
		case "number":
			return "42";
		case "boolean":
			return "1";
		case "union":
			return { kind: "unknown" };
		default:
			return createFixtureScalarValue(pathLabel);
	}
}

export function readJson<T = unknown>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function renderPhpValue(value: unknown, indentLevel: number): string {
	const indent = "\t".repeat(indentLevel);
	const nestedIndent = "\t".repeat(indentLevel + 1);

	if (value === null) {
		return "null";
	}
	if (typeof value === "string") {
		return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return "[]";
		}
		const items = value.map((item) => `${nestedIndent}${renderPhpValue(item, indentLevel + 1)}`);
		return `[\n${items.join(",\n")}\n${indent}]`;
	}
	if (typeof value === "object") {
		const entries = Object.entries(value);
		if (entries.length === 0) {
			return "[]";
		}
		const items = entries.map(
			([key, item]) =>
				`${nestedIndent}'${String(key).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' => ${renderPhpValue(item, indentLevel + 1)}`,
		);
		return `[\n${items.join(",\n")}\n${indent}]`;
	}

	throw new Error(`Unable to encode PHP migration registry value for ${String(value)}`);
}

export function copyFile(sourcePath: string, targetPath: string): void {
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.copyFileSync(sourcePath, targetPath);
}

export function sanitizeSaveSnapshotSource(source: string): string {
	return source
		.replace(/^import\s+\{[^}]+\}\s+from\s+['"]\.\/types['"];?\n?/gm, "")
		.replace(/^interface\s+SaveProps\s*\{[\s\S]*?\}\n?/m, "")
		.replace(/: SaveProps/g, ": { attributes: any }")
		.replace(/attributes:\s*[A-Za-z0-9_<>{}\[\]|&,\s]+;/g, "attributes: any;")
		.replace(/\(\{\s*attributes\s*\}:\s*\{\s*attributes:\s*any\s*\}\)/g, "({ attributes }: { attributes: any })")
		.replace(/\n{3,}/g, "\n\n")
		.trimEnd()
		.concat("\n");
}

export function sanitizeSnapshotBlockJson(blockJson: JsonObject): JsonObject {
	const snapshot = { ...blockJson };
	for (const key of [
		"editorScript",
		"script",
		"scriptModule",
		"viewScript",
		"viewScriptModule",
		"style",
		"editorStyle",
		"render",
	]) {
		delete snapshot[key];
	}
	return snapshot;
}

export function runProjectScriptIfPresent(projectDir: string, scriptName: string): void {
	const packageJson = readJson<{ packageManager?: string; scripts?: Record<string, string> }>(
		path.join(projectDir, "package.json"),
	);
	if (!packageJson.scripts?.[scriptName]) {
		return;
	}

	const packageManagerId = detectPackageManagerId(projectDir);
	execSync(formatRunScript(packageManagerId, scriptName), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

export function detectPackageManagerId(projectDir: string): "bun" | "npm" | "pnpm" | "yarn" {
	const packageJson = readJson<{ packageManager?: string }>(path.join(projectDir, "package.json"));
	const field = String(packageJson.packageManager ?? "");

	if (field.startsWith("bun@")) return "bun";
	if (field.startsWith("npm@")) return "npm";
	if (field.startsWith("pnpm@")) return "pnpm";
	if (field.startsWith("yarn@")) return "yarn";
	return "bun";
}

export function getLocalTsxBinary(projectDir: string): string {
	const filename = process.platform === "win32" ? "tsx.cmd" : "tsx";
	const binaryPath = path.join(projectDir, "node_modules", ".bin", filename);

	if (!fs.existsSync(binaryPath)) {
		throw new Error("Local tsx binary was not found. Install project dependencies before running migration verification.");
	}

	return binaryPath;
}

/**
 * Returns whether isInteractiveTerminal() is running with both stdin and stdout
 * attached to a TTY so CLI and migration flows can safely prompt the user.
 */
export function isInteractiveTerminal(): boolean {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

export function resolveTargetVersion(currentVersion: string, value: string): string {
	return value === "current" ? currentVersion : value;
}

export function assertSemver(value: string, label: string): void {
	if (!/^\d+\.\d+\.\d+$/.test(value)) {
		throw new Error(`Invalid ${label}: ${value}. Expected x.y.z`);
	}
}

export function compareSemver(left: string, right: string): number {
	const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
	const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));

	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
		const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
		if (delta !== 0) {
			return delta;
		}
	}

	return 0;
}

export function escapeForCode(value: unknown): string {
	return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function renderObjectKey(key: string): string {
	return JSON.stringify(String(key));
}

export function isNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}
