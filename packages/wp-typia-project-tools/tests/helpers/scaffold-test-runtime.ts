import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { runUtf8Command } from "../../../../tests/helpers/process-utils";

export function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof runUtf8Command>[2] = {},
) {
	return runUtf8Command(command, args, options);
}

export function getCommandErrorMessage(run: () => string): string {
	try {
		run();
		return "";
	} catch (error) {
		if (typeof error === "object" && error !== null) {
			const message =
				"message" in error && typeof error.message === "string"
					? error.message
					: String(error);
			const stdout =
				"stdout" in error && typeof error.stdout === "string"
					? error.stdout
					: "";
			const stderr =
				"stderr" in error && typeof error.stderr === "string"
					? error.stderr
					: "";
			return [message, stdout, stderr].filter(Boolean).join("\n");
		}
		return String(error);
	}
}

export function runCapturedCli(
	command: string,
	args: string[],
	options: Parameters<typeof spawnSync>[2] = {},
) {
	return spawnSync(command, args, {
		...options,
		encoding: "utf8",
	});
}

export function stripPhpFunction(source: string, functionName: string): string {
	const escapedFunctionName = functionName.replace(
		/[.*+?^${}()|[\]\\]/gu,
		"\\$&",
	);
	return source.replace(
		new RegExp(
			`\\nfunction\\s+${escapedFunctionName}\\s*\\(\\)\\s*\\{[\\s\\S]*?\\n\\}`,
			"u",
		),
		"",
	);
}

export function ensureDirSymlink(targetPath: string, sourcePath: string) {
	if (fs.existsSync(targetPath)) {
		return;
	}

	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.symlinkSync(sourcePath, targetPath, "dir");
}

export function ensureFileSymlink(targetPath: string, sourcePath: string) {
	if (fs.existsSync(targetPath)) {
		return;
	}

	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.symlinkSync(sourcePath, targetPath, "file");
}
