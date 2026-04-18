#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readJson, repoRoot as defaultRepoRoot } from "./publish-package-utils.mjs";

function toPosixPath(filePath) {
	return filePath.split(path.sep).join(path.posix.sep);
}

function runGit(repoRoot, args, { allowFailure = false } = {}) {
	try {
		return execFileSync("git", args, {
			cwd: repoRoot,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		}).trim();
	} catch (error) {
		if (allowFailure) {
			return null;
		}
		throw error;
	}
}

function readGitManifest(repoRoot, baseRef, relativePath) {
	const manifestSource = runGit(
		repoRoot,
		["show", `${baseRef}:${toPosixPath(relativePath)}`],
		{ allowFailure: true },
	);

	if (!manifestSource) {
		return null;
	}

	return JSON.parse(manifestSource);
}

function listChangedPackageManifestPaths(repoRoot, baseRef) {
	const diffOutput =
		runGit(repoRoot, ["diff", "--name-only", "--relative", baseRef, "--", "packages"]) ?? "";

	return diffOutput
		.split(/\r?\n/u)
		.map((entry) => entry.trim())
		.filter((entry) => entry.startsWith("packages/") && entry.endsWith("/package.json"));
}

export function collectReleasePackageVersions({
	repoRoot = defaultRepoRoot,
	baseRef = "HEAD",
} = {}) {
	return listChangedPackageManifestPaths(repoRoot, baseRef)
		.map((relativeManifestPath) => {
			const currentManifest = readJson(path.join(repoRoot, relativeManifestPath));

			if (
				currentManifest.private === true ||
				typeof currentManifest.name !== "string" ||
				typeof currentManifest.version !== "string"
			) {
				return null;
			}

			const previousManifest = readGitManifest(repoRoot, baseRef, relativeManifestPath);
			const previousVersion =
				previousManifest && typeof previousManifest.version === "string"
					? previousManifest.version
					: null;

			if (previousVersion === currentManifest.version) {
				return null;
			}

			return {
				packageDir: path.dirname(relativeManifestPath),
				packageName: currentManifest.name,
				previousVersion,
				nextVersion: currentManifest.version,
			};
		})
		.filter(Boolean)
		.sort((left, right) => left.packageName.localeCompare(right.packageName));
}

function formatVersionTransition(previousVersion, nextVersion) {
	return previousVersion ? `${previousVersion} -> ${nextVersion}` : `new at ${nextVersion}`;
}

export function renderReleasePackageVersionBlock(changes) {
	const lines = ["## Published package versions", ""];

	if (changes.length === 0) {
		lines.push("- No publishable package version changes were detected.");
		return lines.join("\n");
	}

	lines.push("| Package | Version |");
	lines.push("| --- | --- |");

	for (const change of changes) {
		lines.push(
			`| \`${change.packageName}\` | \`${formatVersionTransition(change.previousVersion, change.nextVersion)}\` |`,
		);
	}

	return lines.join("\n");
}

function parseArgs(argv) {
	const options = {
		baseRef: "HEAD",
		outputPath: null,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === "--base-ref") {
			options.baseRef = argv[index + 1] ?? options.baseRef;
			index += 1;
			continue;
		}

		if (argument === "--output") {
			options.outputPath = argv[index + 1] ?? null;
			index += 1;
			continue;
		}

		throw new Error(`Unknown argument: ${argument}`);
	}

	return options;
}

function isMainModule() {
	const currentFilePath = fileURLToPath(import.meta.url);
	return process.argv[1] ? path.resolve(process.argv[1]) === currentFilePath : false;
}

if (isMainModule()) {
	const { baseRef, outputPath } = parseArgs(process.argv.slice(2));
	const changes = collectReleasePackageVersions({ baseRef });
	const markdown = `${renderReleasePackageVersionBlock(changes)}\n`;

	if (outputPath) {
		const absoluteOutputPath = path.resolve(defaultRepoRoot, outputPath);
		fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
		fs.writeFileSync(absoluteOutputPath, markdown, "utf8");
		console.log(
			`Wrote ${changes.length} publishable package version entries to ${path.relative(defaultRepoRoot, absoluteOutputPath)}.`,
		);
	} else {
		process.stdout.write(markdown);
	}
}
