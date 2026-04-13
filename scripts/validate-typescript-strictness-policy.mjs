#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const TYPESCRIPT_STRICTNESS_BASELINE = Object.freeze({
	noFallthroughCasesInSwitch: true,
	noImplicitOverride: true,
	strict: true,
	useUnknownInCatchVariables: true,
});

export const TYPESCRIPT_STRICTNESS_DEFERRED_FLAGS = Object.freeze([
	"exactOptionalPropertyTypes",
	"noImplicitReturns",
	"noPropertyAccessFromIndexSignature",
	"noUncheckedIndexedAccess",
]);

export const TYPESCRIPT_STRICTNESS_POLICY_EXCEPTIONS = Object.freeze({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..");

function listTsconfigPaths(repoRoot) {
	const scopedRoots = [
		path.join(repoRoot, "packages"),
		path.join(repoRoot, "examples"),
	];
	const discovered = new Set([
		path.join(repoRoot, "tsconfig.base.json"),
		path.join(repoRoot, "tsconfig.json"),
	]);

	for (const scopedRoot of scopedRoots) {
		if (!fs.existsSync(scopedRoot)) {
			continue;
		}

		for (const entry of fs.readdirSync(scopedRoot, { withFileTypes: true })) {
			if (!entry.isDirectory()) {
				continue;
			}

			const childRoot = path.join(scopedRoot, entry.name);
			for (const childEntry of fs.readdirSync(childRoot, { withFileTypes: true })) {
				if (!childEntry.isFile() || !/^tsconfig(\..+)?\.json$/.test(childEntry.name)) {
					continue;
				}

				discovered.add(path.join(childRoot, childEntry.name));
			}
		}
	}

	return [...discovered].sort();
}

function readJsonFile(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toRelativePath(repoRoot, targetPath) {
	return path.relative(repoRoot, targetPath).split(path.sep).join("/");
}

export function validateTypeScriptStrictnessPolicy(
	repoRoot = DEFAULT_REPO_ROOT,
	policy = {
		baseline: TYPESCRIPT_STRICTNESS_BASELINE,
		deferredFlags: TYPESCRIPT_STRICTNESS_DEFERRED_FLAGS,
		exceptions: TYPESCRIPT_STRICTNESS_POLICY_EXCEPTIONS,
	},
) {
	const errors = [];
	const consumedExceptionFlags = new Set();
	const tsconfigPaths = listTsconfigPaths(repoRoot);
	const baseConfigPath = path.join(repoRoot, "tsconfig.base.json");
	const baseConfig = readJsonFile(baseConfigPath);
	const baseCompilerOptions = baseConfig.compilerOptions ?? {};
	const baseline = policy.baseline ?? TYPESCRIPT_STRICTNESS_BASELINE;
	const deferredFlags = policy.deferredFlags ?? TYPESCRIPT_STRICTNESS_DEFERRED_FLAGS;
	const exceptions = policy.exceptions ?? TYPESCRIPT_STRICTNESS_POLICY_EXCEPTIONS;

	for (const [flagName, expectedValue] of Object.entries(baseline)) {
		if (baseCompilerOptions[flagName] !== expectedValue) {
			errors.push(
				`tsconfig.base.json must declare compilerOptions.${flagName}=${JSON.stringify(expectedValue)}.`,
			);
		}
	}

	for (const tsconfigPath of tsconfigPaths) {
		if (tsconfigPath === baseConfigPath) {
			continue;
		}

		const relativePath = toRelativePath(repoRoot, tsconfigPath);
		const compilerOptions = readJsonFile(tsconfigPath).compilerOptions ?? {};
		const exceptionConfig = exceptions[relativePath] ?? {};

		for (const [flagName, expectedValue] of Object.entries(baseline)) {
			if (!(flagName in compilerOptions)) {
				continue;
			}

			const actualValue = compilerOptions[flagName];
			const allowedValue = exceptionConfig[flagName];
			if (allowedValue !== undefined) {
				consumedExceptionFlags.add(`${relativePath}:${flagName}`);
				if (actualValue !== allowedValue) {
					errors.push(
						`${relativePath} must keep compilerOptions.${flagName}=${JSON.stringify(allowedValue)} to match its explicit strictness exception, found ${JSON.stringify(actualValue)}.`,
					);
				}
				continue;
			}

			errors.push(
				`${relativePath} should inherit compilerOptions.${flagName}=${JSON.stringify(expectedValue)} from tsconfig.base.json instead of overriding it locally.`,
			);
		}

		for (const flagName of deferredFlags) {
			if (!(flagName in compilerOptions)) {
				continue;
			}

			const actualValue = compilerOptions[flagName];
			const allowedValue = exceptionConfig[flagName];
			if (allowedValue !== undefined) {
				consumedExceptionFlags.add(`${relativePath}:${flagName}`);
				if (actualValue !== allowedValue) {
					errors.push(
						`${relativePath} must keep compilerOptions.${flagName}=${JSON.stringify(allowedValue)} to match its explicit strictness exception, found ${JSON.stringify(actualValue)}.`,
					);
				}
				continue;
			}

			errors.push(
				`${relativePath} must not opt into compilerOptions.${flagName} ad hoc; add an explicit strictness policy exception first.`,
			);
		}
	}

	for (const [relativePath, flags] of Object.entries(exceptions)) {
		for (const flagName of Object.keys(flags)) {
			if (!consumedExceptionFlags.has(`${relativePath}:${flagName}`)) {
				errors.push(
					`${relativePath} declares a stale strictness exception for compilerOptions.${flagName}; remove the exception or restore the override.`,
				);
			}
		}
	}

	return {
		errors,
		valid: errors.length === 0,
	};
}

export function runCli({
	cwd = process.cwd(),
	stdout = process.stdout,
	stderr = process.stderr,
} = {}) {
	const result = validateTypeScriptStrictnessPolicy(cwd);

	if (!result.valid) {
		stderr.write("Invalid TypeScript strictness policy detected:\n");
		for (const error of result.errors) {
			stderr.write(`- ${error}\n`);
		}
		return 1;
	}

	stdout.write("Validated TypeScript strictness policy.\n");
	return 0;
}

const currentFilePath = fileURLToPath(import.meta.url);
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (invokedPath === currentFilePath) {
	process.exitCode = runCli();
}
