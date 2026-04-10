#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	findPublishablePackageIds,
	formatChangesetValidationSuccessMessage,
	parseChangesetFrontmatter,
	validateSampoChangesets,
} from "./lib/sampo-changesets.mjs";

export {
	findPublishablePackageIds,
	parseChangesetFrontmatter,
	validateSampoChangesets,
} from "./lib/sampo-changesets.mjs";

export function runCli({
	cwd = process.cwd(),
	stdout = process.stdout,
	stderr = process.stderr,
} = {}) {
	const result = validateSampoChangesets(cwd);

	if (!result.valid) {
		stderr.write("Invalid Sampo changesets detected:\n");
		for (const error of result.errors) {
			stderr.write(`- ${error}\n`);
		}
		return 1;
	}

	stdout.write(`${formatChangesetValidationSuccessMessage(result)}\n`);
	return 0;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
	process.exitCode = runCli();
}
