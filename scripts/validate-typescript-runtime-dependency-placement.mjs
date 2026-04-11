#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";

import {
	packWorkspacePackage,
	readJson,
	readPackedPackageManifest,
	withTempDir,
} from "./publish-package-utils.mjs";
import {
	collectTypeScriptImportFiles,
	evaluateTypeScriptRuntimePackagePolicy,
	TYPESCRIPT_RUNTIME_PACKAGE_POLICIES,
} from "./lib/typescript-runtime-policy.mjs";

export function validateTypeScriptRuntimeDependencyPlacement(repoRoot) {
	const packages = [];
	const errors = [];

	withTempDir("wp-typia-typescript-runtime-", (tempDir) => {
		for (const policy of TYPESCRIPT_RUNTIME_PACKAGE_POLICIES) {
			const absolutePackageDir = path.join(repoRoot, policy.packageDir);
			const sourceManifest = readJson(path.join(absolutePackageDir, "package.json"));
			const packedManifest = readPackedPackageManifest(
				packWorkspacePackage(absolutePackageDir, tempDir),
			);
			const typeScriptImportFiles = collectTypeScriptImportFiles(
				absolutePackageDir,
				policy.runtimeSourceRoots,
			);
			const result = evaluateTypeScriptRuntimePackagePolicy(policy, {
				packedManifest,
				sourceManifest,
				typeScriptImportFiles,
			});

			errors.push(...result.errors);
			packages.push({
				packageDir: policy.packageDir,
				packageName: policy.packageName,
				packedPlacement: result.packedPlacement,
				sourcePlacement: result.sourcePlacement,
				typeScriptImportFiles: result.typeScriptImportFiles,
				typescriptPlacement: policy.typescriptPlacement,
			});
		}
	});

	return {
		errors,
		packages,
		valid: errors.length === 0,
	};
}

export function runCli({
	cwd = process.cwd(),
	stderr = process.stderr,
	stdout = process.stdout,
} = {}) {
	const result = validateTypeScriptRuntimeDependencyPlacement(cwd);

	if (!result.valid) {
		stderr.write("Invalid TypeScript runtime dependency placement detected:\n");
		for (const error of result.errors) {
			stderr.write(`- ${error}\n`);
		}
		return 1;
	}

	stdout.write(
		`Validated TypeScript runtime dependency placement for ${result.packages.length} policy-targeted packages.\n`,
	);
	return 0;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
	process.exitCode = runCli();
}
