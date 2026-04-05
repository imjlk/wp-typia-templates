import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { access, constants as fsConstants, rm, writeFile } from "node:fs/promises";

import { getBuiltInTemplateLayerDirs } from "./template-builtins.js";
import { listTemplates } from "./template-registry.js";

/**
 * One doctor check rendered by the CLI diagnostics flow.
 */
export interface DoctorCheck {
	/** Human-readable status detail rendered next to the label. */
	detail: string;
	/** Short label for the dependency, directory, or template check. */
	label: string;
	/** Final pass/fail status for this diagnostic row. */
	status: "pass" | "fail";
}

interface RunDoctorOptions {
	renderLine?: (check: DoctorCheck) => void;
}

function readCommandVersion(command: string, args: string[] = ["--version"]): string | null {
	try {
		return execFileSync(command, args, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

function compareMajorVersion(actualVersion: string, minimumMajor: number): boolean {
	const parsed = Number.parseInt(actualVersion.replace(/^v/, "").split(".")[0] ?? "", 10);
	return Number.isFinite(parsed) && parsed >= minimumMajor;
}

async function checkWritableDirectory(directory: string): Promise<boolean> {
	try {
		await access(directory, fsConstants.W_OK);
		return true;
	} catch {
		return false;
	}
}

async function checkTempDirectory(): Promise<boolean> {
	const tempFile = path.join(os.tmpdir(), `wp-typia-${Date.now()}.tmp`);
	try {
		await writeFile(tempFile, "ok", "utf8");
		await rm(tempFile, { force: true });
		return true;
	} catch {
		return false;
	}
}

/**
 * Collect all runtime doctor checks for the current environment.
 *
 * The returned array includes command availability checks, directory
 * writability checks, and built-in template asset checks in display order.
 *
 * @param cwd Working directory to validate for writability.
 * @returns Ordered doctor check rows ready for CLI rendering.
 */
export async function getDoctorChecks(cwd: string): Promise<DoctorCheck[]> {
	const checks: DoctorCheck[] = [];
	const bunVersion = readCommandVersion("bun");
	const nodeVersion = readCommandVersion("node");
	const gitVersion = readCommandVersion("git");
	const cwdWritable = await checkWritableDirectory(cwd);
	const tempWritable = await checkTempDirectory();

	checks.push({
		status: bunVersion && compareMajorVersion(bunVersion, 1) ? "pass" : "fail",
		label: "Bun",
		detail: bunVersion ? `Detected ${bunVersion}` : "Not available",
	});
	checks.push({
		status: nodeVersion && compareMajorVersion(nodeVersion, 20) ? "pass" : "fail",
		label: "Node",
		detail: nodeVersion ? `Detected ${nodeVersion}` : "Not available",
	});
	checks.push({
		status: gitVersion ? "pass" : "fail",
		label: "git",
		detail: gitVersion ?? "Not available",
	});
	checks.push({
		status: cwdWritable ? "pass" : "fail",
		label: "Current directory",
		detail: cwdWritable ? "Writable" : "Not writable",
	});
	checks.push({
		status: tempWritable ? "pass" : "fail",
		label: "Temp directory",
		detail: tempWritable ? "Writable" : "Not writable",
	});

	for (const template of listTemplates()) {
		const layerDirs =
			template.id === "persistence"
				? Array.from(
						new Set([
							...getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "authenticated" }),
							...getBuiltInTemplateLayerDirs(template.id, { persistencePolicy: "public" }),
						]),
					)
				: template.id === "compound"
					? Array.from(
							new Set([
								...getBuiltInTemplateLayerDirs(template.id),
								...getBuiltInTemplateLayerDirs(template.id, {
									persistenceEnabled: true,
									persistencePolicy: "authenticated",
								}),
								...getBuiltInTemplateLayerDirs(template.id, {
									persistenceEnabled: true,
									persistencePolicy: "public",
								}),
							]),
						)
					: getBuiltInTemplateLayerDirs(template.id);
		const hasAssets =
			layerDirs.every((layerDir) => fs.existsSync(layerDir)) &&
			layerDirs.some((layerDir) => fs.existsSync(path.join(layerDir, "package.json.mustache"))) &&
			layerDirs.some((layerDir) => fs.existsSync(path.join(layerDir, "src")));
		checks.push({
			status: hasAssets ? "pass" : "fail",
			label: `Template ${template.id}`,
			detail: hasAssets ? layerDirs.join(" + ") : "Missing core template assets",
		});
	}

	return checks;
}

/**
 * Run doctor checks, render each line, and fail when any check does not pass.
 *
 * @param cwd Working directory to validate.
 * @param options Optional renderer override for each emitted check row.
 * @returns The completed list of doctor checks.
 * @throws {Error} When one or more checks fail.
 */
export async function runDoctor(
	cwd: string,
	{
		renderLine = (check: DoctorCheck) =>
			console.log(`${check.status.toUpperCase()} ${check.label}: ${check.detail}`),
	}: RunDoctorOptions = {},
): Promise<DoctorCheck[]> {
	const checks = await getDoctorChecks(cwd);

	for (const check of checks) {
		renderLine(check);
	}

	if (checks.some((check) => check.status === "fail")) {
		throw new Error("Doctor found one or more failing checks.");
	}

	return checks;
}
