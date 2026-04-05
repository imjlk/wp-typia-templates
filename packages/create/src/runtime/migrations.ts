import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { formatRunScript } from "./package-managers.js";
import {
	ROOT_PHP_MIGRATION_REGISTRY,
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
	getFixtureFilePath,
	getGeneratedDirForBlock,
	getProjectPaths,
	getRuleFilePath,
	getSnapshotBlockJsonPath,
	getSnapshotManifestPath,
	getSnapshotRoot,
	getSnapshotSavePath,
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
	renderGeneratedMigrationIndexFile,
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
	detectPackageManagerId,
	getLocalTsxBinary,
	readJson,
	resolveTargetVersion,
	runProjectScriptIfPresent,
	sanitizeSaveSnapshotSource,
	sanitizeSnapshotBlockJson,
} from "./migration-utils.js";
import type {
	ManifestDocument,
	MigrationBlockConfig,
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
	confirmOverwrite?: ((message: string) => boolean) | undefined;
	force?: boolean;
	fromVersion?: string;
	isInteractive?: boolean;
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
  wp-typia migrations fuzz [--from <semver>|--all] [--iterations <n>] [--seed <n>]

Notes:
  --all runs across every configured legacy version and every configured block target.
  In TTY usage, \`migrations fixtures --force\` asks before overwriting existing fixture files.
  In non-interactive usage, \`migrations fixtures --force\` overwrites immediately for script compatibility.`;
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
		skipSyncTypes = false,
	}: CommandRenderOptions & { skipConfigUpdate?: boolean; skipSyncTypes?: boolean } = {},
) {
	ensureAdvancedMigrationProject(projectDir);
	assertSemver(version, "snapshot version");
	if (!skipSyncTypes) {
		try {
			runProjectScriptIfPresent(projectDir, "sync-types");
		} catch (error) {
			const syncTypesCommand = formatRunScript(detectPackageManagerId(projectDir), "sync-types");
			const reason = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Could not capture migration snapshot ${version} because \`${syncTypesCommand}\` failed first. ` +
					`Install project dependencies if needed, rerun \`${syncTypesCommand}\` in the project root to inspect the underlying error, ` +
					`then retry \`wp-typia migrations snapshot --version ${version}\`.\n` +
					`Original error: ${reason}`,
			);
		}
	}

	const state = loadMigrationProject(projectDir, { allowMissingConfig: skipConfigUpdate });
	for (const block of state.blocks) {
		const snapshotRoot = getSnapshotRoot(projectDir, block, version);
		fs.mkdirSync(snapshotRoot, { recursive: true });

		fs.writeFileSync(
			getSnapshotBlockJsonPath(projectDir, block, version),
			`${JSON.stringify(
				sanitizeSnapshotBlockJson(readJson<JsonObject>(path.join(projectDir, block.blockJsonFile))),
				null,
				"\t",
			)}\n`,
			"utf8",
		);
		copyFile(
			path.join(projectDir, block.manifestFile),
			getSnapshotManifestPath(projectDir, block, version),
		);
		fs.writeFileSync(
			getSnapshotSavePath(projectDir, block, version),
			sanitizeSaveSnapshotSource(fs.readFileSync(path.join(projectDir, block.saveFile), "utf8")),
			"utf8",
		);
	}

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
	assertDistinctMigrationEdge("diff", fromVersion, targetVersion);
	const diffs = state.blocks
		.filter((block) => hasSnapshotForVersion(state, block, fromVersion))
		.map((block) => ({
			block,
			diff: createMigrationDiff(state, block, fromVersion, targetVersion),
		}));

	if (diffs.length === 0) {
		throw new Error(createMissingProjectSnapshotMessage(state, fromVersion));
	}

	for (const { block, diff } of diffs) {
		renderLine(`Block: ${block.blockName}`);
		renderLine(formatDiffReport(diff));
	}

	return diffs.length === 1 ? diffs[0].diff : diffs;
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
	assertDistinctMigrationEdge("scaffold", fromVersion, targetVersion);
	const paths = getProjectPaths(projectDir);
	const scaffolded: Array<{ blockName: string; diff: ReturnType<typeof createMigrationDiff>; rulePath: string }> =
		[];
	let eligibleBlocks = 0;

	for (const block of state.blocks) {
		if (!hasSnapshotForVersion(state, block, fromVersion)) {
			renderLine(`Skipped ${block.blockName}: no snapshot for ${fromVersion}`);
			continue;
		}
		eligibleBlocks += 1;
		const diff = createMigrationDiff(state, block, fromVersion, targetVersion);
		const rulePath = getRuleFilePath(paths, block, fromVersion, targetVersion);

		if (!fs.existsSync(rulePath)) {
			fs.mkdirSync(path.dirname(rulePath), { recursive: true });
			fs.writeFileSync(
				rulePath,
				renderMigrationRuleFile({
					block,
					currentAttributes: block.currentManifest.attributes ?? {},
					currentTypeName: block.currentManifest.sourceType,
					diff,
					fromVersion,
					projectDir,
					rulePath,
					targetVersion,
				}),
				"utf8",
			);
		}

		ensureEdgeFixtureFile(projectDir, block, fromVersion, targetVersion, diff);
		scaffolded.push({ blockName: block.blockName, diff, rulePath });
	}
	regenerateGeneratedArtifacts(projectDir);

	for (const entry of scaffolded) {
		renderLine(`Block: ${entry.blockName}`);
		renderLine(formatDiffReport(entry.diff));
		renderLine(`Scaffolded ${path.relative(projectDir, entry.rulePath)}`);
	}

	if (eligibleBlocks === 0) {
		throw new Error(createMissingProjectSnapshotMessage(state, fromVersion));
	}

	return scaffolded.length === 1 ? scaffolded[0] : { scaffolded };
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
	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });
	const blockEntries = getSelectedEntriesByBlock(state, targetVersions, "verify");
	const legacySingleBlock = isLegacySingleBlockProject(state);

	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for verification.");
		return { verifiedVersions: [] };
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	for (const [blockKey, entries] of Object.entries(blockEntries)) {
		const block = state.blocks.find((entry) => entry.key === blockKey);
		if (!block || entries.length === 0) {
			continue;
		}
		for (const entry of entries) {
			assertRuleHasNoTodos(projectDir, block, entry.fromVersion, state.config.currentVersion);
		}
		const verifyScriptPath = path.join(getGeneratedDirForBlock(state.paths, block), "verify.ts");
		if (!fs.existsSync(verifyScriptPath)) {
			const selectedVersionsForBlock = entries.map((entry) => entry.fromVersion);
			throw new Error(
				`Generated verify script is missing for ${block.blockName} (${selectedVersionsForBlock.join(", ")}). ` +
					`Run \`${formatScaffoldCommand(selectedVersionsForBlock)}\` first, then \`wp-typia migrations doctor --all\` if the workspace should already be scaffolded.`,
			);
		}

		const selectedVersionsForBlock = entries.map((entry) => entry.fromVersion);
		const filteredArgs = all
			? ["--all"]
			: ["--from", selectedVersionsForBlock[0]];
		execFileSync(tsxBinary, [verifyScriptPath, ...filteredArgs], {
			cwd: projectDir,
			shell: process.platform === "win32",
			stdio: "inherit",
		});
		renderLine(
			legacySingleBlock
				? `Verified migrations for ${selectedVersionsForBlock.join(", ")}`
				: `Verified ${block.blockName} migrations for ${selectedVersionsForBlock.join(", ")}`,
		);
	}

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
		const legacySingleBlock = isLegacySingleBlockProject(state);
		recordCheck(
			"pass",
			"Migration config",
			legacySingleBlock
				? `Loaded ${state.blocks[0]?.blockName} @ ${state.config.currentVersion}`
				: `Loaded ${state.blocks.length} block target(s) @ ${state.config.currentVersion}`,
		);
	} catch (error) {
		recordCheck("fail", "Migration config", error instanceof Error ? error.message : String(error));
		throw new Error("Migration doctor failed.");
	}

	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });
	const legacySingleBlock = isLegacySingleBlockProject(state);
	const snapshotVersions = new Set(
		targetVersions.length > 0
			? [state.config.currentVersion, ...targetVersions]
			: state.config.supportedVersions,
	);

	for (const version of snapshotVersions) {
		for (const block of state.blocks) {
			const snapshotRoot = getSnapshotRoot(projectDir, block, version);
			const blockJsonPath = getSnapshotBlockJsonPath(projectDir, block, version);
			const manifestPath = getSnapshotManifestPath(projectDir, block, version);
			const savePath = getSnapshotSavePath(projectDir, block, version);
			const hasSnapshot = fs.existsSync(snapshotRoot);
			const snapshotIsOptional = !hasSnapshot && isSnapshotOptionalForBlockVersion(state, block, version);

			recordCheck(
				hasSnapshot || snapshotIsOptional ? "pass" : "fail",
				legacySingleBlock ? `Snapshot ${version}` : `Snapshot ${block.blockName} @ ${version}`,
				hasSnapshot
					? path.relative(projectDir, snapshotRoot)
					: `Not present for this version`,
			);

			if (!hasSnapshot) {
				continue;
			}

			for (const targetPath of [blockJsonPath, manifestPath, savePath]) {
				recordCheck(
					fs.existsSync(targetPath) ? "pass" : "fail",
					legacySingleBlock
						? `Snapshot file ${version}`
						: `Snapshot file ${block.blockName} @ ${version}`,
					fs.existsSync(targetPath)
						? path.relative(projectDir, targetPath)
						: `Missing ${path.relative(projectDir, targetPath)}`,
				);
			}
		}
	}

	try {
		const generatedEntries = collectGeneratedMigrationEntries(state);
		const expectedGeneratedFiles = new Map<string, string>();
		for (const block of state.blocks) {
			const blockGeneratedEntries = generatedEntries.filter(({ entry }) => entry.block.key === block.key);
			const entries = blockGeneratedEntries.map(({ entry }) => entry);
			const generatedDir = getGeneratedDirForBlock(state.paths, block);
			expectedGeneratedFiles.set(
				path.join(generatedDir, "registry.ts"),
				renderMigrationRegistryFile(state, block.key, blockGeneratedEntries),
			);
			expectedGeneratedFiles.set(
				path.join(generatedDir, "deprecated.ts"),
				renderGeneratedDeprecatedFile(entries),
			);
			expectedGeneratedFiles.set(
				path.join(generatedDir, "verify.ts"),
				renderVerifyFile(state, block.key, entries),
			);
			expectedGeneratedFiles.set(
				path.join(generatedDir, "fuzz.ts"),
				renderFuzzFile(state, block.key, blockGeneratedEntries),
			);
		}
		expectedGeneratedFiles.set(
			path.join(state.paths.generatedDir, "index.ts"),
			renderGeneratedMigrationIndexFile(state, generatedEntries.map(({ entry }) => entry)),
		);
		expectedGeneratedFiles.set(
			path.join(projectDir, ROOT_PHP_MIGRATION_REGISTRY),
			renderPhpMigrationRegistryFile(state, generatedEntries.map(({ entry }) => entry)),
		);

		for (const [filePath, expectedSource] of expectedGeneratedFiles) {
			const inSync = fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === expectedSource;
			recordCheck(
				inSync ? "pass" : "fail",
				`Generated ${path.relative(projectDir, filePath)}`,
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
		for (const block of state.blocks) {
			if (!hasSnapshotForVersion(state, block, version)) {
				recordCheck("pass", `Snapshot coverage ${block.blockName} @ ${version}`, "Target not present for this version");
				continue;
			}
			const rulePath = getRuleFilePath(state.paths, block, version, state.config.currentVersion);
			const fixturePath = getFixtureFilePath(state.paths, block, version, state.config.currentVersion);

			recordCheck(
				fs.existsSync(rulePath) ? "pass" : "fail",
				legacySingleBlock ? `Rule ${version}` : `Rule ${block.blockName} @ ${version}`,
				fs.existsSync(rulePath)
					? path.relative(projectDir, rulePath)
					: `Missing ${path.relative(projectDir, rulePath)}`,
			);
			recordCheck(
				fs.existsSync(fixturePath) ? "pass" : "fail",
				legacySingleBlock ? `Fixture ${version}` : `Fixture ${block.blockName} @ ${version}`,
				fs.existsSync(fixturePath)
					? path.relative(projectDir, fixturePath)
					: `Missing ${path.relative(projectDir, fixturePath)}`,
			);

			if (!fs.existsSync(rulePath) || !fs.existsSync(fixturePath)) {
				continue;
			}

			try {
				assertRuleHasNoTodos(projectDir, block, version, state.config.currentVersion);
				recordCheck(
					"pass",
					legacySingleBlock
						? `Rule TODOs ${version}`
						: `Rule TODOs ${block.blockName} @ ${version}`,
					"No TODO MIGRATION markers remain",
				);
			} catch (error) {
				recordCheck(
					"fail",
					legacySingleBlock
						? `Rule TODOs ${version}`
						: `Rule TODOs ${block.blockName} @ ${version}`,
					error instanceof Error ? error.message : String(error),
				);
			}

			try {
				const ruleMetadata = readRuleMetadata(rulePath);
				recordCheck(
					ruleMetadata.unresolved.length === 0 ? "pass" : "fail",
					legacySingleBlock
						? `Rule unresolved ${version}`
						: `Rule unresolved ${block.blockName} @ ${version}`,
					ruleMetadata.unresolved.length === 0
						? "No unresolved entries remain"
						: ruleMetadata.unresolved.join(", "),
				);
			} catch (error) {
				recordCheck(
					"fail",
					legacySingleBlock
						? `Rule unresolved ${version}`
						: `Rule unresolved ${block.blockName} @ ${version}`,
					error instanceof Error ? error.message : String(error),
				);
			}

			try {
				const fixtureDocument = readJson<{ cases?: Array<{ name?: string }> }>(fixturePath);
				recordCheck(
					Array.isArray(fixtureDocument.cases) && fixtureDocument.cases.length > 0 ? "pass" : "fail",
					legacySingleBlock
						? `Fixture parse ${version}`
						: `Fixture parse ${block.blockName} @ ${version}`,
					Array.isArray(fixtureDocument.cases) && fixtureDocument.cases.length > 0
						? `${fixtureDocument.cases.length} case(s)`
						: "Fixture document has no cases",
				);

				const diff = createMigrationDiff(state, block, version, state.config.currentVersion);
				const expectedFixture = createEdgeFixtureDocument(
					projectDir,
					block,
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
					legacySingleBlock
						? `Fixture coverage ${version}`
						: `Fixture coverage ${block.blockName} @ ${version}`,
					missingCases.length === 0 ? "All expected fixture cases are present" : `Missing ${missingCases.join(", ")}`,
				);

				recordCheck(
					"pass",
					legacySingleBlock
						? `Risk summary ${version}`
						: `Risk summary ${block.blockName} @ ${version}`,
					formatMigrationRiskSummary(createMigrationRiskSummary(diff)),
				);
			} catch (error) {
				recordCheck(
					"fail",
					legacySingleBlock
						? `Fixture parse ${version}`
						: `Fixture parse ${block.blockName} @ ${version}`,
					error instanceof Error ? error.message : String(error),
				);
			}
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
		confirmOverwrite,
		force = false,
		fromVersion,
		isInteractive = isInteractiveTerminal(),
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
	const fixtureTargets = collectFixtureTargets(state, targetVersions, targetVersion);

	if (force) {
		const overwriteTargets = fixtureTargets.filter(({ fixturePath }) => fs.existsSync(fixturePath));
		if (isInteractive && overwriteTargets.length > 0) {
			const confirmed =
				confirmOverwrite?.(
					`About to overwrite ${overwriteTargets.length} existing migration fixture file(s). Continue?`,
				) ?? promptForConfirmation(
					`About to overwrite ${overwriteTargets.length} existing migration fixture file(s). Continue?`,
				);

			if (!confirmed) {
				renderLine(
					`Cancelled fixture refresh. Kept ${overwriteTargets.length} existing fixture file(s).`,
				);
				return {
					generatedVersions,
					skippedVersions: overwriteTargets.map(({ scopedLabel }) => scopedLabel),
				};
			}
		}
	}

	for (const { block, fixturePath, scopedLabel, version } of fixtureTargets) {
		const diff = createMigrationDiff(state, block, version, targetVersion);
		const result = ensureEdgeFixtureFile(projectDir, block, version, targetVersion, diff, { force });
		if (result.written) {
			generatedVersions.push(scopedLabel);
			renderLine(`Generated fixture ${path.relative(projectDir, fixturePath)}`);
		} else {
			skippedVersions.push(scopedLabel);
			renderLine(`Skipped existing fixture ${path.relative(projectDir, fixturePath)}`);
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
	const targetVersions = resolveLegacyVersions(state, { all, fromVersion });
	const blockEntries = getSelectedEntriesByBlock(state, targetVersions, "fuzz");
	const legacySingleBlock = isLegacySingleBlockProject(state);
	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for fuzzing.");
		return { fuzzedVersions: [] };
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	for (const [blockKey, entries] of Object.entries(blockEntries)) {
		const block = state.blocks.find((entry) => entry.key === blockKey);
		if (!block || entries.length === 0) {
			continue;
		}
		for (const entry of entries) {
			assertRuleHasNoTodos(projectDir, block, entry.fromVersion, state.config.currentVersion);
		}
		const fuzzScriptPath = path.join(getGeneratedDirForBlock(state.paths, block), "fuzz.ts");
		if (!fs.existsSync(fuzzScriptPath)) {
			const selectedVersionsForBlock = entries.map((entry) => entry.fromVersion);
			throw new Error(
				`Generated fuzz script is missing for ${block.blockName} (${selectedVersionsForBlock.join(", ")}). ` +
					`Run \`${formatScaffoldCommand(selectedVersionsForBlock)}\` first, then \`wp-typia migrations doctor --all\` if the workspace should already be scaffolded.`,
			);
		}
		const selectedVersionsForBlock = entries.map((entry) => entry.fromVersion);
		const args = [
			fuzzScriptPath,
			...(all ? ["--all"] : ["--from", selectedVersionsForBlock[0]]),
			"--iterations",
			String(iterations),
			...(seed === undefined ? [] : ["--seed", String(seed)]),
		];
		execFileSync(tsxBinary, args, {
			cwd: projectDir,
			shell: process.platform === "win32",
			stdio: "inherit",
		});
		renderLine(
			legacySingleBlock
				? `Fuzzed migrations for ${selectedVersionsForBlock.join(", ")}`
				: `Fuzzed ${block.blockName} migrations for ${selectedVersionsForBlock.join(", ")}`,
		);
	}

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
	).sort(compareSemver);

	if (fromVersion) {
		if (!legacyVersions.includes(fromVersion)) {
			throw new Error(
				legacyVersions.length === 0
					? `Unsupported migration version: ${fromVersion}. No legacy versions are configured yet. ` +
						`Capture an older release with \`wp-typia migrations snapshot --version <semver>\` first.`
					: `Unsupported migration version: ${fromVersion}. Available legacy versions: ${legacyVersions.join(", ")}.`,
			);
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
		const block = state.blocks.find((target) => target.key === entry.block.key);
		if (!block) {
			throw new Error(`Unknown migration block target: ${entry.block.key}`);
		}
		const diff = createMigrationDiff(state, entry.block, entry.fromVersion, entry.toVersion);
		const legacyManifest = readJson<ManifestDocument>(
			getSnapshotManifestPath(state.projectDir, entry.block, entry.fromVersion),
		);

		return {
			diff,
			entry,
			fuzzPlan: createMigrationFuzzPlan(legacyManifest, block.currentManifest, diff),
			riskSummary: createMigrationRiskSummary(diff),
		};
	});
}

function regenerateGeneratedArtifacts(projectDir: string): void {
	const state = loadMigrationProject(projectDir);
	const generatedEntries = collectGeneratedMigrationEntries(state);
	for (const block of state.blocks) {
		const blockGeneratedEntries = generatedEntries.filter(({ entry }) => entry.block.key === block.key);
		const entries = blockGeneratedEntries.map(({ entry }) => entry);
		const generatedDir = getGeneratedDirForBlock(state.paths, block);
		fs.mkdirSync(generatedDir, { recursive: true });
		fs.writeFileSync(
			path.join(generatedDir, "registry.ts"),
			renderMigrationRegistryFile(state, block.key, blockGeneratedEntries),
			"utf8",
		);
		fs.writeFileSync(
			path.join(generatedDir, "deprecated.ts"),
			renderGeneratedDeprecatedFile(entries),
			"utf8",
		);
		fs.writeFileSync(
			path.join(generatedDir, "verify.ts"),
			renderVerifyFile(state, block.key, entries),
			"utf8",
		);
		fs.writeFileSync(
			path.join(generatedDir, "fuzz.ts"),
			renderFuzzFile(state, block.key, blockGeneratedEntries),
			"utf8",
		);
	}
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "index.ts"),
		renderGeneratedMigrationIndexFile(state, generatedEntries.map(({ entry }) => entry)),
		"utf8",
	);
	fs.writeFileSync(
		path.join(projectDir, ROOT_PHP_MIGRATION_REGISTRY),
		renderPhpMigrationRegistryFile(state, generatedEntries.map(({ entry }) => entry)),
		"utf8",
	);
}

/**
 * Initialize migration scaffolding for one or more block targets.
 *
 * Writes the migration config, creates the initial scaffold files, snapshots
 * the current project state, and regenerates generated migration artifacts.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param currentVersion Initial semantic version to seed into the migration config.
 * @param blocks Block targets to register for migration-aware scaffolding.
 * @param options Console rendering options for initialization output.
 * @returns The loaded migration project state after initialization completes.
 */
export function seedProjectMigrations(
	projectDir: string,
	currentVersion: string,
	blocks: MigrationBlockConfig[],
	{ renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	ensureAdvancedMigrationProject(projectDir, blocks);
	assertSemver(currentVersion, "current version");
	ensureMigrationDirectories(projectDir, blocks);
	writeMigrationConfig(projectDir, {
		blocks,
		currentVersion,
		snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
		supportedVersions: [currentVersion],
	});
	writeInitialMigrationScaffold(projectDir, currentVersion, blocks);
	snapshotProjectVersion(projectDir, currentVersion, {
		renderLine,
		skipConfigUpdate: true,
		skipSyncTypes: true,
	});
	regenerateGeneratedArtifacts(projectDir);
	renderLine(
		`Initialized migrations for ${blocks.map((block) => block.blockName).join(", ")} at version ${currentVersion}`,
	);
	return loadMigrationProject(projectDir);
}

function hasSnapshotForVersion(
	state: ReturnType<typeof loadMigrationProject>,
	block: ReturnType<typeof loadMigrationProject>["blocks"][number],
	version: string,
): boolean {
	return fs.existsSync(getSnapshotManifestPath(state.projectDir, block, version));
}

function getSelectedEntriesByBlock(
	state: ReturnType<typeof loadMigrationProject>,
	targetVersions: string[],
	command: "fuzz" | "verify",
) {
	const discoveredEntries = discoverMigrationEntries(state);
	const discoveredEntryKeys = new Set(
		discoveredEntries.map((entry) => `${entry.block.key}:${entry.fromVersion}`),
	);
	const missingEntries = targetVersions.flatMap((version) =>
		state.blocks
			.filter((block) => hasSnapshotForVersion(state, block, version))
			.filter((block) => !discoveredEntryKeys.has(`${block.key}:${version}`))
			.map((block) => ({ block, version })),
	);

	if (missingEntries.length > 0) {
		const missingLabels = missingEntries
			.map(({ block, version }) => `${block.blockName} @ ${version}`)
			.join(", ");
		const missingVersions = [...new Set(missingEntries.map(({ version }) => version))].sort(compareSemver);
		throw new Error(
			`Missing migration ${command} inputs for ${missingLabels}. ` +
				`Run \`${formatScaffoldCommand(missingVersions)}\` first, then \`wp-typia migrations doctor --all\` if the workspace should already be scaffolded.`,
		);
	}

	return groupEntriesByBlock(
		discoveredEntries.filter((entry) => targetVersions.includes(entry.fromVersion)),
	);
}

function isSnapshotOptionalForBlockVersion(
	state: ReturnType<typeof loadMigrationProject>,
	block: ReturnType<typeof loadMigrationProject>["blocks"][number],
	version: string,
): boolean {
	if (block.layout !== "multi") {
		return false;
	}

	const introducedVersions = [...new Set(state.config.supportedVersions)]
		.filter((candidateVersion) => hasSnapshotForVersion(state, block, candidateVersion))
		.sort(compareSemver);
	const firstIntroducedVersion = introducedVersions[0];

	if (!firstIntroducedVersion) {
		return false;
	}

	return compareSemver(version, firstIntroducedVersion) < 0;
}

function groupEntriesByBlock(entries: ReturnType<typeof discoverMigrationEntries>): Record<string, typeof entries> {
	return entries.reduce<Record<string, typeof entries>>((accumulator, entry) => {
		if (!accumulator[entry.block.key]) {
			accumulator[entry.block.key] = [];
		}
		accumulator[entry.block.key].push(entry);
		return accumulator;
	}, {});
}

function isLegacySingleBlockProject(
	state: ReturnType<typeof loadMigrationProject>,
): boolean {
	return state.blocks.length === 1 && state.blocks[0]?.layout === "legacy";
}

function assertDistinctMigrationEdge(
	command: "diff" | "scaffold",
	fromVersion: string,
	toVersion: string,
): void {
	if (fromVersion === toVersion) {
		throw new Error(
			`\`migrations ${command}\` requires different source and target versions, but both resolved to ${fromVersion}. ` +
				`Choose an older snapshot with \`--from <semver>\` or capture a newer release with \`wp-typia migrations snapshot --version <semver>\` first.`,
		);
	}
}

function createMissingProjectSnapshotMessage(
	state: ReturnType<typeof loadMigrationProject>,
	fromVersion: string,
): string {
	const snapshotVersions = [...new Set(
		state.blocks.flatMap((block) => getAvailableSnapshotVersionsForBlock(state, block)),
	)].sort(compareSemver);

	return snapshotVersions.length === 0
		? `No migration block targets have a snapshot for ${fromVersion}. No snapshots exist yet in this project. ` +
				`Run \`wp-typia migrations snapshot --version ${fromVersion}\` first if you want to preserve that release.`
		: `No migration block targets have a snapshot for ${fromVersion}. ` +
				`Available snapshot versions in this project: ${snapshotVersions.join(", ")}. ` +
				`Run \`wp-typia migrations snapshot --version ${fromVersion}\` first if you want to preserve that release.`;
}

function getAvailableSnapshotVersionsForBlock(
	state: ReturnType<typeof loadMigrationProject>,
	block: ReturnType<typeof loadMigrationProject>["blocks"][number],
): string[] {
	return state.config.supportedVersions
		.filter((version) => hasSnapshotForVersion(state, block, version))
		.sort(compareSemver);
}

function formatScaffoldCommand(versions: string[]): string {
	const uniqueVersions = [...new Set(versions)].sort(compareSemver);
	return uniqueVersions.length === 1
		? `wp-typia migrations scaffold --from ${uniqueVersions[0]}`
		: "wp-typia migrations scaffold --from <semver>";
}

function isInteractiveTerminal(): boolean {
	return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function promptForConfirmation(message: string): boolean {
	process.stdout.write(`${message} [y/N]: `);

	const buffer = Buffer.alloc(1);
	let answer = "";

	while (true) {
		const bytesRead = fs.readSync(process.stdin.fd, buffer, 0, 1, null);
		if (bytesRead === 0) {
			break;
		}

		const char = buffer.toString("utf8", 0, bytesRead);
		if (char === "\n" || char === "\r") {
			break;
		}

		answer += char;
	}

	const normalized = answer.trim().toLowerCase();
	return normalized === "y" || normalized === "yes";
}

function collectFixtureTargets(
	state: ReturnType<typeof loadMigrationProject>,
	targetVersions: string[],
	targetVersion: string,
) {
	return targetVersions.flatMap((version) =>
		state.blocks
			.filter((block) => hasSnapshotForVersion(state, block, version))
			.map((block) => ({
				block,
				fixturePath: getFixtureFilePath(state.paths, block, version, targetVersion),
				scopedLabel: `${block.key}@${version}`,
				version,
			})),
	);
}
