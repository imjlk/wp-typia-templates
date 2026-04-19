#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	ARCHIVED_NPM_ENTRYPOINTS,
	getArchivedNpmEntrypoint,
	renderArchivedNpmDeprecationCommand,
	renderArchivedNpmDeprecationMessage,
	renderArchivedNpmDeprecationPlan,
} from "./lib/archived-package-policy.mjs";

function parseArgs(argv) {
	let apply = false;
	let packageName = null;

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];

		if (argument === "--apply") {
			apply = true;
			continue;
		}

		if (argument === "--package") {
			const nextArgument = argv[index + 1];
			if (!nextArgument || nextArgument.startsWith("-")) {
				throw new Error("--package requires an archived npm entrypoint name.");
			}
			packageName = nextArgument;
			index += 1;
			continue;
		}

		throw new Error(
			`Unknown argument: ${argument}. Supported flags: --apply, --package <name>.`,
		);
	}

	return { apply, packageName };
}

function selectEntries(packageName) {
	if (!packageName) {
		return ARCHIVED_NPM_ENTRYPOINTS;
	}

	const entry = getArchivedNpmEntrypoint(packageName);
	if (!entry) {
		throw new Error(
			`Unknown archived npm entrypoint: ${packageName}. Supported values: ${ARCHIVED_NPM_ENTRYPOINTS.map(({ packageName: name }) => name).join(", ")}.`,
		);
	}

	return [entry];
}

export function runCli({
	argv = process.argv.slice(2),
	stdout = process.stdout,
	stderr = process.stderr,
} = {}) {
	try {
		const { apply, packageName } = parseArgs(argv);
		const entries = selectEntries(packageName);

		if (!apply) {
			stdout.write(`${renderArchivedNpmDeprecationPlan(entries)}\n`);
			stdout.write(
				"\nRun again with --apply from an npm-authenticated shell to execute the commands.\n",
			);
			return 0;
		}

		for (const entry of entries) {
			execFileSync(
				"npm",
				[
					"deprecate",
					`${entry.packageName}@${entry.deprecationRange}`,
					renderArchivedNpmDeprecationMessage(entry),
				],
				{
					stdio: "inherit",
				},
			);
			stdout.write(`Applied: ${renderArchivedNpmDeprecationCommand(entry)}\n`);
		}

		return 0;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		stderr.write(`${message}\n`);
		return 1;
	}
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
	process.exitCode = runCli();
}
