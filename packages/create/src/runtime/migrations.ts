import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
	GENERATED_DIR,
	ROOT_BLOCK_JSON,
	ROOT_MANIFEST,
	ROOT_PHP_MIGRATION_REGISTRY,
	ROOT_SAVE_FILE,
	SNAPSHOT_DIR,
} from "./migration-constants.js";
import { createMigrationDiff } from "./migration-diff.js";
import { createMigrationFuzzPlan } from "./migration-fuzz-plan.js";
import { createEdgeFixtureDocument, ensureEdgeFixtureFile } from "./migration-fixtures.js";
import {
	assertRuleHasNoTodos,
	discoverMigrationEntries,
	ensureAdvancedMigrationProject,
	ensureMigrationDirectories,
	getProjectPaths,
	getRuleFilePath,
	loadMigrationProject,
	readProjectBlockName,
	readRuleMetadata,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import {
	formatDiffReport,
	renderFuzzFile,
	renderGeneratedDeprecatedFile,
	renderMigrationRegistryFile,
	renderMigrationRuleFile,
	renderPhpMigrationRegistryFile,
	renderVerifyFile,
} from "./migration-render.js";
import { createMigrationRiskSummary, formatMigrationRiskSummary } from "./migration-risk.js";
import {
	assertSemver,
	compareSemver,
	copyFile,
	getLocalTsxBinary,
	readJson,
	resolveTargetVersion,
	runProjectScriptIfPresent,
	sanitizeSaveSnapshotSource,
	sanitizeSnapshotBlockJson,
} from "./migration-utils.js";
import type {
	ManifestDocument,
	JsonObject,
	ParsedMigrationArgs,
	GeneratedMigrationEntry,
	RenderLine,
} from "./migration-types.js";

type CommandRenderOptions = {
	renderLine?: RenderLine;
};

type DiffLikeOptions = {
	fromVersion?: string;
	renderLine?: RenderLine;
	toVersion?: string;
};

type VerifyOptions = {
	all?: boolean;
	fromVersion?: string;
	renderLine?: RenderLine;
};

type FixturesOptions = {
	all?: boolean;
	force?: boolean;
	fromVersion?: string;
	renderLine?: RenderLine;
	toVersion?: string;
};

type FuzzOptions = {
	all?: boolean;
	fromVersion?: string;
	iterations?: number;
	renderLine?: RenderLine;
	seed?: number;
};

export function formatMigrationHelpText(): string {
	return `Usage:
  wp-typia migrations init --current-version <semver>
  wp-typia migrations snapshot --version <semver>
  wp-typia migrations diff --from <semver> [--to current]
  wp-typia migrations scaffold --from <semver> [--to current]
  wp-typia migrations verify [--from <semver>|--all]
  wp-typia migrations doctor [--from <semver>|--all]
  wp-typia migrations fixtures [--from <semver>|--all] [--to current] [--force]
  wp-typia migrations fuzz [--from <semver>|--all] [--iterations <n>] [--seed <n>]`;
}

export function parseMigrationArgs(argv: string[]): ParsedMigrationArgs {
	const parsed: ParsedMigrationArgs = {
		command: undefined,
		flags: {
			all: false,
			currentVersion: undefined,
			force: false,
			from: undefined,
			iterations: undefined,
			seed: undefined,
			to: "current",
			version: undefined,
		},
	};

	if (argv.length === 0) {
		throw new Error(formatMigrationHelpText());
	}

	parsed.command = argv[0];

	for (let index = 1; index < argv.length; index += 1) {
		const arg = argv[index];
		const next = argv[index + 1];

		if (arg === "--") continue;
		if (arg === "--all") {
			parsed.flags.all = true;
			continue;
		}
		if (arg === "--force") {
			parsed.flags.force = true;
			continue;
		}
		if (arg === "--current-version") {
			parsed.flags.currentVersion = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--current-version=")) {
			parsed.flags.currentVersion = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--from") {
			parsed.flags.from = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--from=")) {
			parsed.flags.from = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--iterations") {
			parsed.flags.iterations = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--iterations=")) {
			parsed.flags.iterations = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--seed") {
			parsed.flags.seed = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--seed=")) {
			parsed.flags.seed = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--to") {
			parsed.flags.to = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--to=")) {
			parsed.flags.to = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--version") {
			parsed.flags.version = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--version=")) {
			parsed.flags.version = arg.split("=", 2)[1];
			continue;
		}

		throw new Error(`Unknown migrations flag: ${arg}`);
	}

	return parsed;
}

export { formatDiffReport };

export function runMigrationCommand(
	command: ParsedMigrationArgs,
	cwd: string,
	{ renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	switch (command.command) {
		case "init":
			if (!command.flags.currentVersion) {
				throw new Error("`migrations init` requires --current-version <semver>.");
			}
			return initProjectMigrations(cwd, command.flags.currentVersion, { renderLine });
		case "snapshot":
			if (!command.flags.version) {
				throw new Error("`migrations snapshot` requires --version <semver>.");
			}
			return snapshotProjectVersion(cwd, command.flags.version, { renderLine });
		case "diff":
			if (!command.flags.from) {
				throw new Error("`migrations diff` requires --from <semver>.");
			}
			return diffProjectMigrations(cwd, {
				fromVersion: command.flags.from,
				renderLine,
				toVersion: command.flags.to ?? "current",
			});
		case "scaffold":
			if (!command.flags.from) {
				throw new Error("`migrations scaffold` requires --from <semver>.");
			}
			return scaffoldProjectMigrations(cwd, {
				fromVersion: command.flags.from,
				renderLine,
				toVersion: command.flags.to ?? "current",
			});
		case "verify":
			return verifyProjectMigrations(cwd, {
				all: command.flags.all,
				fromVersion: command.flags.from,
				renderLine,
			});
		case "doctor":
			return doctorProjectMigrations(cwd, {
				all: command.flags.all,
				fromVersion: command.flags.from,
				renderLine,
			});
		case "fixtures":
			return fixturesProjectMigrations(cwd, {
				all: command.flags.all,
				force: command.flags.force,
				fromVersion: command.flags.from,
				renderLine,
				toVersion: command.flags.to ?? "current",
			});
		case "fuzz":
			return fuzzProjectMigrations(cwd, {
				all: command.flags.all,
				fromVersion: command.flags.from,
				iterations: parsePositiveInteger(command.flags.iterations, "iterations") ?? 25,
				renderLine,
				seed: parseNonNegativeInteger(command.flags.seed, "seed") ?? undefined,
			});
		default:
			throw new Error(formatMigrationHelpText());
	}
}

export function initProjectMigrations(
	projectDir: string,
	currentVersion: string,
	{ renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	ensureAdvancedMigrationProject(projectDir);
	assertSemver(currentVersion, "current version");

	const blockName = readProjectBlockName(projectDir);

	ensureMigrationDirectories(projectDir);
	writeMigrationConfig(projectDir, {
		blockName,
		currentVersion,
		snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
		supportedVersions: [currentVersion],
	});

	writeInitialMigrationScaffold(projectDir, currentVersion);
	snapshotProjectVersion(projectDir, currentVersion, { renderLine, skipConfigUpdate: true });
	regenerateGeneratedArtifacts(projectDir);

	renderLine(`Initialized migrations for ${blockName} at version ${currentVersion}`);
	return loadMigrationProject(projectDir);
}

export function snapshotProjectVersion(
	projectDir: string,
	version: string,
	{
		renderLine = console.log as RenderLine,
		skipConfigUpdate = false,
	}: CommandRenderOptions & { skipConfigUpdate?: boolean } = {},
) {
	ensureAdvancedMigrationProject(projectDir);
	assertSemver(version, "snapshot version");
	runProjectScriptIfPresent(projectDir, "sync-types");

	const state = loadMigrationProject(projectDir, { allowMissingConfig: skipConfigUpdate });
	const snapshotRoot = path.join(projectDir, SNAPSHOT_DIR, version);
	fs.mkdirSync(snapshotRoot, { recursive: true });

	fs.writeFileSync(
		path.join(snapshotRoot, ROOT_BLOCK_JSON),
		`${JSON.stringify(
			sanitizeSnapshotBlockJson(readJson<JsonObject>(path.join(projectDir, ROOT_BLOCK_JSON))),
			null,
			"\t",
		)}\n`,
		"utf8",
	);
	copyFile(path.join(projectDir, ROOT_MANIFEST), path.join(snapshotRoot, ROOT_MANIFEST));
	fs.writeFileSync(
		path.join(snapshotRoot, "save.tsx"),
		sanitizeSaveSnapshotSource(fs.readFileSync(path.join(projectDir, ROOT_SAVE_FILE), "utf8")),
		"utf8",
	);

	if (!skipConfigUpdate) {
		const nextSupported = [...new Set([...state.config.supportedVersions, version])].sort(compareSemver);
		writeMigrationConfig(projectDir, {
			...state.config,
			currentVersion: version,
			supportedVersions: nextSupported,
		});
	}

	regenerateGeneratedArtifacts(projectDir);
	renderLine(`Snapshot stored for ${version}`);
	return loadMigrationProject(projectDir);
}

export function diffProjectMigrations(
	projectDir: string,
	{ fromVersion, toVersion = "current", renderLine = console.log as RenderLine }: DiffLikeOptions = {},
) {
	if (!fromVersion) {
		throw new Error("`migrations diff` requires --from <semver>.");
	}
	const state = loadMigrationProject(projectDir);
	const targetVersion = resolveTargetVersion(state.config.currentVersion, toVersion);
	const diff = createMigrationDiff(state, fromVersion, targetVersion);
	renderLine(formatDiffReport(diff));
	return diff;
}

export function scaffoldProjectMigrations(
	projectDir: string,
	{ fromVersion, toVersion = "current", renderLine = console.log as RenderLine }: DiffLikeOptions = {},
) {
	if (!fromVersion) {
		throw new Error("`migrations scaffold` requires --from <semver>.");
	}

	ensureMigrationDirectories(projectDir);
	const state = loadMigrationProject(projectDir);
	const targetVersion = resolveTargetVersion(state.config.currentVersion, toVersion);
	const diff = createMigrationDiff(state, fromVersion, targetVersion);
	const paths = getProjectPaths(projectDir);
	const rulePath = getRuleFilePath(paths, fromVersion, targetVersion);

	if (!fs.existsSync(rulePath)) {
		fs.writeFileSync(
			rulePath,
			renderMigrationRuleFile({
				currentAttributes: state.currentManifest.attributes ?? {},
				currentTypeName: state.currentManifest.sourceType,
				diff,
				fromVersion,
				targetVersion,
			}),
			"utf8",
		);
	}

	ensureEdgeFixtureFile(projectDir, fromVersion, targetVersion, diff);
	regenerateGeneratedArtifacts(projectDir);

	renderLine(formatDiffReport(diff));
	renderLine(`Scaffolded ${path.relative(projectDir, rulePath)}`);
	return { diff, rulePath };
}

/**
 * Run deterministic migration verification against generated fixtures.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Verification scope and console rendering options.
 * @returns Verified legacy versions.
 */
export function verifyProjectMigrations(
	projectDir: string,
	{ all = false, fromVersion, renderLine = console.log as RenderLine }: VerifyOptions = {},
) {
	const state = loadMigrationProject(projectDir);
	const verifyScriptPath = path.join(projectDir, GENERATED_DIR, "verify.ts");

	if (!fs.existsSync(verifyScriptPath)) {
		throw new Error(
			"Generated verify script is missing. Run `wp-typia migrations scaffold --from <semver>` first.",
		);
	}

	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });

	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for verification.");
		return { verifiedVersions: [] };
	}

	for (const version of targetVersions) {
		assertRuleHasNoTodos(projectDir, version, state.config.currentVersion);
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	const filteredArgs = all
		? ["--all"]
		: ["--from", targetVersions[0]];
	execFileSync(tsxBinary, [verifyScriptPath, ...filteredArgs], {
		cwd: projectDir,
		shell: process.platform === "win32",
		stdio: "inherit",
	});

	renderLine(`Verified migrations for ${targetVersions.join(", ")}`);
	return { verifiedVersions: targetVersions };
}

/**
 * Validate the migration workspace without mutating files.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Doctor scope and console rendering options.
 * @returns Structured doctor check results for the selected legacy versions.
 */
export function doctorProjectMigrations(
	projectDir: string,
	{ all = false, fromVersion, renderLine = console.log as RenderLine }: VerifyOptions = {},
) {
	const checks: Array<{ detail: string; label: string; status: "fail" | "pass" }> = [];
	const recordCheck = (status: "fail" | "pass", label: string, detail: string) => {
		checks.push({ detail, label, status });
		renderLine(`${status === "pass" ? "PASS" : "FAIL"} ${label}: ${detail}`);
	};

	let state;
	try {
		state = loadMigrationProject(projectDir);
		recordCheck("pass", "Migration config", `Loaded ${state.config.blockName} @ ${state.config.currentVersion}`);
	} catch (error) {
		recordCheck("fail", "Migration config", error instanceof Error ? error.message : String(error));
		throw new Error("Migration doctor failed.");
	}

	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });
	const snapshotVersions = new Set(
		targetVersions.length > 0
			? [state.config.currentVersion, ...targetVersions]
			: state.config.supportedVersions,
	);

	for (const version of snapshotVersions) {
		const snapshotRoot = path.join(projectDir, SNAPSHOT_DIR, version);
		const requiredFiles = [
			ROOT_BLOCK_JSON,
			ROOT_MANIFEST,
			"save.tsx",
		];

		recordCheck(
			fs.existsSync(snapshotRoot) ? "pass" : "fail",
			`Snapshot ${version}`,
			fs.existsSync(snapshotRoot)
				? path.relative(projectDir, snapshotRoot)
				: `Missing ${path.relative(projectDir, snapshotRoot)}`,
		);

		for (const relativePath of requiredFiles) {
			const targetPath = path.join(snapshotRoot, relativePath);
			recordCheck(
				fs.existsSync(targetPath) ? "pass" : "fail",
				`Snapshot file ${version}`,
				fs.existsSync(targetPath)
					? path.relative(projectDir, targetPath)
					: `Missing ${path.relative(projectDir, targetPath)}`,
			);
		}
	}

	try {
		const generatedEntries = collectGeneratedMigrationEntries(state);
		const expectedGeneratedFiles = new Map<string, string>([
			["registry.ts", renderMigrationRegistryFile(state, generatedEntries)],
			["deprecated.ts", renderGeneratedDeprecatedFile(generatedEntries.map(({ entry }) => entry))],
			["verify.ts", renderVerifyFile(state, generatedEntries.map(({ entry }) => entry))],
			["fuzz.ts", renderFuzzFile(state, generatedEntries)],
			[
				ROOT_PHP_MIGRATION_REGISTRY,
				renderPhpMigrationRegistryFile(state, generatedEntries.map(({ entry }) => entry)),
			],
		]);

		for (const [fileName, expectedSource] of expectedGeneratedFiles) {
			const filePath = fileName.endsWith(".php")
				? path.join(projectDir, fileName)
				: path.join(state.paths.generatedDir, fileName);
			const inSync = fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === expectedSource;
			recordCheck(
				inSync ? "pass" : "fail",
				`Generated ${fileName}`,
				inSync ? "In sync" : `Run \`wp-typia migrations scaffold --from <semver>\` or regenerate artifacts`,
			);
		}
	} catch (error) {
		recordCheck(
			"fail",
			"Generated artifacts",
			error instanceof Error ? error.message : String(error),
		);
	}

	for (const version of targetVersions) {
		const rulePath = getRuleFilePath(state.paths, version, state.config.currentVersion);
		const fixturePath = path.join(state.paths.fixturesDir, `${version}-to-${state.config.currentVersion}.json`);

		recordCheck(
			fs.existsSync(rulePath) ? "pass" : "fail",
			`Rule ${version}`,
			fs.existsSync(rulePath) ? path.relative(projectDir, rulePath) : `Missing ${path.relative(projectDir, rulePath)}`,
		);
		recordCheck(
			fs.existsSync(fixturePath) ? "pass" : "fail",
			`Fixture ${version}`,
			fs.existsSync(fixturePath)
				? path.relative(projectDir, fixturePath)
				: `Missing ${path.relative(projectDir, fixturePath)}`,
		);

		if (!fs.existsSync(rulePath) || !fs.existsSync(fixturePath)) {
			continue;
		}

		try {
			assertRuleHasNoTodos(projectDir, version, state.config.currentVersion);
			recordCheck("pass", `Rule TODOs ${version}`, "No TODO MIGRATION markers remain");
		} catch (error) {
			recordCheck("fail", `Rule TODOs ${version}`, error instanceof Error ? error.message : String(error));
		}

		try {
			const ruleMetadata = readRuleMetadata(rulePath);
			recordCheck(
				ruleMetadata.unresolved.length === 0 ? "pass" : "fail",
				`Rule unresolved ${version}`,
				ruleMetadata.unresolved.length === 0
					? "No unresolved entries remain"
					: ruleMetadata.unresolved.join(", "),
			);
		} catch (error) {
			recordCheck(
				"fail",
				`Rule unresolved ${version}`,
				error instanceof Error ? error.message : String(error),
			);
		}

		try {
			const fixtureDocument = readJson<{ cases?: Array<{ name?: string }> }>(fixturePath);
			recordCheck(
				Array.isArray(fixtureDocument.cases) && fixtureDocument.cases.length > 0 ? "pass" : "fail",
				`Fixture parse ${version}`,
				Array.isArray(fixtureDocument.cases) && fixtureDocument.cases.length > 0
					? `${fixtureDocument.cases.length} case(s)`
					: "Fixture document has no cases",
			);

			const diff = createMigrationDiff(state, version, state.config.currentVersion);
			const expectedFixture = createEdgeFixtureDocument(
				projectDir,
				version,
				state.config.currentVersion,
				diff,
			);
			const actualCaseNames = new Set((fixtureDocument.cases ?? []).map((fixtureCase) => fixtureCase.name));
			const missingCases = expectedFixture.cases
				.map((fixtureCase) => fixtureCase.name)
				.filter((name) => !actualCaseNames.has(name));
			recordCheck(
				missingCases.length === 0 ? "pass" : "fail",
				`Fixture coverage ${version}`,
				missingCases.length === 0 ? "All expected fixture cases are present" : `Missing ${missingCases.join(", ")}`,
			);

			recordCheck(
				"pass",
				`Risk summary ${version}`,
				formatMigrationRiskSummary(createMigrationRiskSummary(diff)),
			);
		} catch (error) {
			recordCheck("fail", `Fixture parse ${version}`, error instanceof Error ? error.message : String(error));
		}
	}

	const failedChecks = checks.filter((check) => check.status === "fail");
	renderLine(
		`${failedChecks.length === 0 ? "PASS" : "FAIL"} Migration doctor summary: ${checks.length - failedChecks.length}/${checks.length} checks passed`,
	);

	if (failedChecks.length > 0) {
		throw new Error("Migration doctor failed.");
	}

	return {
		checkedVersions: targetVersions,
		checks,
	};
}

/**
 * Generate or refresh migration fixtures for one or more legacy edges.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Fixture generation scope and refresh options.
 * @returns Generated and skipped legacy versions.
 */
export function fixturesProjectMigrations(
	projectDir: string,
	{
		all = false,
		force = false,
		fromVersion,
		renderLine = console.log as RenderLine,
		toVersion = "current",
	}: FixturesOptions = {},
) {
	ensureMigrationDirectories(projectDir);
	const state = loadMigrationProject(projectDir);
	const targetVersion = resolveTargetVersion(state.config.currentVersion, toVersion);
	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });

	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for fixture generation.");
		return { generatedVersions: [], skippedVersions: [] };
	}

	const generatedVersions: string[] = [];
	const skippedVersions: string[] = [];

	for (const version of targetVersions) {
		const diff = createMigrationDiff(state, version, targetVersion);
		const result = ensureEdgeFixtureFile(projectDir, version, targetVersion, diff, { force });
		if (result.written) {
			generatedVersions.push(version);
			renderLine(`Generated fixture ${path.relative(projectDir, result.fixturePath)}`);
		} else {
			skippedVersions.push(version);
			renderLine(`Skipped existing fixture ${path.relative(projectDir, result.fixturePath)}`);
		}
	}

	return {
		generatedVersions,
		skippedVersions,
	};
}

/**
 * Run seeded migration fuzz verification against generated fuzz artifacts.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Fuzz scope, iteration count, seed, and console rendering options.
 * @returns Fuzzed legacy versions and the effective seed.
 */
export function fuzzProjectMigrations(
	projectDir: string,
	{
		all = false,
		fromVersion,
		iterations = 25,
		renderLine = console.log as RenderLine,
		seed,
	}: FuzzOptions = {},
) {
	const state = loadMigrationProject(projectDir);
	const fuzzScriptPath = path.join(projectDir, GENERATED_DIR, "fuzz.ts");

	if (!fs.existsSync(fuzzScriptPath)) {
		throw new Error(
			"Generated fuzz script is missing. Run `wp-typia migrations scaffold --from <semver>` first.",
		);
	}

	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });
	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for fuzzing.");
		return { fuzzedVersions: [] };
	}

	for (const version of targetVersions) {
		assertRuleHasNoTodos(projectDir, version, state.config.currentVersion);
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	const args = [
		fuzzScriptPath,
		...(all ? ["--all"] : ["--from", targetVersions[0]]),
		"--iterations",
		String(iterations),
		...(seed === undefined ? [] : ["--seed", String(seed)]),
	];
	execFileSync(tsxBinary, args, {
		cwd: projectDir,
		shell: process.platform === "win32",
		stdio: "inherit",
	});

	renderLine(`Fuzzed migrations for ${targetVersions.join(", ")}`);
	return { fuzzedVersions: targetVersions, seed };
}

function parsePositiveInteger(value: string | undefined, label: string): number | undefined {
	if (!value) {
		return undefined;
	}

	if (!/^\d+$/.test(value)) {
		throw new Error(`Invalid ${label}: ${value}. Expected a positive integer.`);
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`Invalid ${label}: ${value}. Expected a positive integer.`);
	}

	return parsed;
}

function parseNonNegativeInteger(value: string | undefined, label: string): number | undefined {
	if (!value) {
		return undefined;
	}

	if (!/^\d+$/.test(value)) {
		throw new Error(`Invalid ${label}: ${value}. Expected a non-negative integer.`);
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isInteger(parsed) || parsed < 0) {
		throw new Error(`Invalid ${label}: ${value}. Expected a non-negative integer.`);
	}

	return parsed;
}

function resolveLegacyVersions(
	state: ReturnType<typeof loadMigrationProject>,
	{ all = false, fromVersion }: { all?: boolean; fromVersion?: string },
): string[] {
	const legacyVersions = state.config.supportedVersions.filter(
		(version) => version !== state.config.currentVersion,
	);

	if (fromVersion) {
		if (!legacyVersions.includes(fromVersion)) {
			throw new Error(`Unsupported migration version: ${fromVersion}`);
		}
		return [fromVersion];
	}

	if (all) {
		return legacyVersions;
	}

	return legacyVersions.slice(0, 1);
}

function collectGeneratedMigrationEntries(
	state: ReturnType<typeof loadMigrationProject>,
): GeneratedMigrationEntry[] {
	return discoverMigrationEntries(state).map((entry) => {
		const diff = createMigrationDiff(state, entry.fromVersion, entry.toVersion);
		const legacyManifest = readJson<ManifestDocument>(
			path.join(state.projectDir, SNAPSHOT_DIR, entry.fromVersion, ROOT_MANIFEST),
		);

		return {
			diff,
			entry,
			fuzzPlan: createMigrationFuzzPlan(legacyManifest, state.currentManifest, diff),
			riskSummary: createMigrationRiskSummary(diff),
		};
	});
}

function regenerateGeneratedArtifacts(projectDir: string): void {
	const state = loadMigrationProject(projectDir);
	const generatedEntries = collectGeneratedMigrationEntries(state);
	const entries = generatedEntries.map(({ entry }) => entry);

	fs.mkdirSync(state.paths.generatedDir, { recursive: true });
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "registry.ts"),
		renderMigrationRegistryFile(state, generatedEntries),
		"utf8",
	);
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "deprecated.ts"),
		renderGeneratedDeprecatedFile(entries),
		"utf8",
	);
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "verify.ts"),
		renderVerifyFile(state, entries),
		"utf8",
	);
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "fuzz.ts"),
		renderFuzzFile(state, generatedEntries),
		"utf8",
	);
	fs.writeFileSync(
		path.join(projectDir, ROOT_PHP_MIGRATION_REGISTRY),
		renderPhpMigrationRegistryFile(state, entries),
		"utf8",
	);
}
