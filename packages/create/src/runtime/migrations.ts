import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { createReadlinePrompt } from "./cli-prompt.js";
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
	discoverMigrationInitLayout,
	discoverMigrationEntries,
	ensureAdvancedMigrationProject,
	ensureMigrationDirectories,
	getFixtureFilePath,
	getAvailableSnapshotVersionsForBlock,
	getGeneratedDirForBlock,
	getProjectPaths,
	getRuleFilePath,
	getSnapshotBlockJsonPath,
	getSnapshotManifestPath,
	getSnapshotRoot,
	getSnapshotSavePath,
	loadMigrationProject,
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
	assertMigrationVersionLabel,
	compareMigrationVersionLabels,
	copyFile,
	detectPackageManagerId,
	formatLegacyMigrationWorkspaceResetGuidance,
	getLocalTsxBinary,
	isInteractiveTerminal,
	readJson,
	resolveTargetMigrationVersion,
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
import type { ReadlinePrompt } from "./cli-prompt.js";

type CommandRenderOptions = {
	prompt?: ReadlinePrompt;
	renderLine?: RenderLine;
};

type DiffLikeOptions = {
	fromMigrationVersion?: string;
	renderLine?: RenderLine;
	toMigrationVersion?: string;
};

type VerifyOptions = {
	all?: boolean;
	fromMigrationVersion?: string;
	renderLine?: RenderLine;
};

type FixturesOptions = {
	all?: boolean;
	confirmOverwrite?: ((message: string) => boolean) | undefined;
	force?: boolean;
	fromMigrationVersion?: string;
	isInteractive?: boolean;
	renderLine?: RenderLine;
	toMigrationVersion?: string;
};

type FuzzOptions = {
	all?: boolean;
	fromMigrationVersion?: string;
	iterations?: number;
	renderLine?: RenderLine;
	seed?: number;
};

type MigrationPlanBlockSummary = {
	blockName: string;
	diff: ReturnType<typeof createMigrationDiff>;
	riskSummary: ReturnType<typeof createMigrationRiskSummary>;
};

type MigrationPlanSummary = {
	availableLegacyVersions: string[];
	currentMigrationVersion: string;
	fromMigrationVersion: string;
	includedBlocks: string[];
	nextSteps: string[];
	skippedBlocks: string[];
	summaries: MigrationPlanBlockSummary[];
	targetMigrationVersion: string;
};

type WizardOptions = CommandRenderOptions & {
	isInteractive?: boolean;
};

export function formatMigrationHelpText(): string {
	return `Usage:
  wp-typia migrations init --current-migration-version <label>
  wp-typia migrations snapshot --migration-version <label>
  wp-typia migrations plan --from-migration-version <label> [--to-migration-version current]
  wp-typia migrations wizard
  wp-typia migrations diff --from-migration-version <label> [--to-migration-version current]
  wp-typia migrations scaffold --from-migration-version <label> [--to-migration-version current]
  wp-typia migrations verify [--from-migration-version <label>|--all]
  wp-typia migrations doctor [--from-migration-version <label>|--all]
  wp-typia migrations fixtures [--from-migration-version <label>|--all] [--to-migration-version current] [--force]
  wp-typia migrations fuzz [--from-migration-version <label>|--all] [--iterations <n>] [--seed <n>]

Notes:
  \`migrations init\` auto-detects supported single-block and \`src/blocks/*\` multi-block layouts.
  Migration versions use strict schema labels like \`v1\`, \`v2\`, and \`v3\`.
  \`migrations wizard\` is TTY-only and helps you choose one legacy migration version to preview.
  \`migrations plan\` and \`migrations wizard\` are read-only previews; they do not scaffold rules or fixtures.
  --all runs across every configured legacy migration version and every configured block target.
  In TTY usage, \`migrations fixtures --force\` asks before overwriting existing fixture files.
  In non-interactive usage, \`migrations fixtures --force\` overwrites immediately for script compatibility.`;
}

export function parseMigrationArgs(argv: string[]): ParsedMigrationArgs {
	const parsed: ParsedMigrationArgs = {
		command: undefined,
		flags: {
			all: false,
			currentMigrationVersion: undefined,
			force: false,
			fromMigrationVersion: undefined,
			iterations: undefined,
			migrationVersion: undefined,
			seed: undefined,
			toMigrationVersion: "current",
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
		if (arg === "--current-migration-version") {
			parsed.flags.currentMigrationVersion = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--current-migration-version=")) {
			parsed.flags.currentMigrationVersion = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--from-migration-version") {
			parsed.flags.fromMigrationVersion = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--from-migration-version=")) {
			parsed.flags.fromMigrationVersion = arg.split("=", 2)[1];
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
		if (arg === "--to-migration-version") {
			parsed.flags.toMigrationVersion = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--to-migration-version=")) {
			parsed.flags.toMigrationVersion = arg.split("=", 2)[1];
			continue;
		}
		if (arg === "--migration-version") {
			parsed.flags.migrationVersion = next;
			index += 1;
			continue;
		}
		if (arg.startsWith("--migration-version=")) {
			parsed.flags.migrationVersion = arg.split("=", 2)[1];
			continue;
		}

		if (
			arg === "--current-version" ||
			arg.startsWith("--current-version=") ||
			arg === "--version" ||
			arg.startsWith("--version=") ||
			arg === "--from" ||
			arg.startsWith("--from=") ||
			arg === "--to" ||
			arg.startsWith("--to=")
		) {
			throwLegacyMigrationFlagError(arg);
			continue;
		}

		throw new Error(`Unknown migrations flag: ${arg}`);
	}

	return parsed;
}

export { formatDiffReport };

/**
 * Dispatch a parsed migrations command to the matching runtime workflow.
 *
 * Most commands execute synchronously and preserve direct throw semantics for
 * existing callers. The interactive `wizard` command returns a promise because
 * it waits for prompt selection before running the shared read-only planner.
 *
 * @param command Parsed migration command and flags.
 * @param cwd Project directory to operate on.
 * @param options Optional prompt/render hooks for testable and interactive execution.
 * @returns The command result, or a promise when the selected command is interactive.
 */
export function runMigrationCommand(
	command: ParsedMigrationArgs,
	cwd: string,
	{ prompt, renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	switch (command.command) {
		case "init":
			if (!command.flags.currentMigrationVersion) {
				throw new Error("`migrations init` requires --current-migration-version <label>.");
			}
			return initProjectMigrations(cwd, command.flags.currentMigrationVersion, { renderLine });
		case "snapshot":
			if (!command.flags.migrationVersion) {
				throw new Error("`migrations snapshot` requires --migration-version <label>.");
			}
			return snapshotProjectVersion(cwd, command.flags.migrationVersion, { renderLine });
		case "plan":
			if (!command.flags.fromMigrationVersion) {
				throw new Error("`migrations plan` requires --from-migration-version <label>.");
			}
			return planProjectMigrations(cwd, {
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
				toMigrationVersion: command.flags.toMigrationVersion ?? "current",
			});
		case "wizard":
			return wizardProjectMigrations(cwd, {
				prompt,
				renderLine,
			});
		case "diff":
			if (!command.flags.fromMigrationVersion) {
				throw new Error("`migrations diff` requires --from-migration-version <label>.");
			}
			return diffProjectMigrations(cwd, {
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
				toMigrationVersion: command.flags.toMigrationVersion ?? "current",
			});
		case "scaffold":
			if (!command.flags.fromMigrationVersion) {
				throw new Error("`migrations scaffold` requires --from-migration-version <label>.");
			}
			return scaffoldProjectMigrations(cwd, {
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
				toMigrationVersion: command.flags.toMigrationVersion ?? "current",
			});
		case "verify":
			return verifyProjectMigrations(cwd, {
				all: command.flags.all,
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
			});
		case "doctor":
			return doctorProjectMigrations(cwd, {
				all: command.flags.all,
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
			});
		case "fixtures":
			return fixturesProjectMigrations(cwd, {
				all: command.flags.all,
				force: command.flags.force,
				fromMigrationVersion: command.flags.fromMigrationVersion,
				renderLine,
				toMigrationVersion: command.flags.toMigrationVersion ?? "current",
			});
		case "fuzz":
			return fuzzProjectMigrations(cwd, {
				all: command.flags.all,
				fromMigrationVersion: command.flags.fromMigrationVersion,
				iterations: parsePositiveInteger(command.flags.iterations, "iterations") ?? 25,
				renderLine,
				seed: parseNonNegativeInteger(command.flags.seed, "seed") ?? undefined,
			});
		default:
			throw new Error(formatMigrationHelpText());
	}
}

/**
 * Preview one migration edge without scaffolding rules, fixtures, or generated files.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Selected source/target versions plus optional line rendering overrides.
 * @returns A structured summary of the selected edge, included/skipped block targets, and next steps.
 */
export function planProjectMigrations(
	projectDir: string,
	{ fromMigrationVersion, renderLine = console.log as RenderLine, toMigrationVersion = "current" }: DiffLikeOptions = {},
): MigrationPlanSummary {
	if (!fromMigrationVersion) {
		throw new Error("`migrations plan` requires --from-migration-version <label>.");
	}

	const state = loadMigrationProject(projectDir, { allowSyncTypes: false });
	const availableLegacyVersions = listPreviewableLegacyVersions(state).sort(compareMigrationVersionLabels).reverse();
	const targetMigrationVersion = resolveTargetMigrationVersion(state.config.currentMigrationVersion, toMigrationVersion);
	assertDistinctMigrationEdge("plan", fromMigrationVersion, targetMigrationVersion);
	resolveLegacyVersions(state, {
		fromMigrationVersion,
		availableVersions: availableLegacyVersions,
	});

	const includedBlocks = state.blocks.filter((block) => hasSnapshotForVersion(state, block, fromMigrationVersion));
	if (includedBlocks.length === 0) {
		throw new Error(createMissingProjectSnapshotMessage(state, fromMigrationVersion));
	}
	const skippedBlocks = state.blocks
		.filter((block) => !hasSnapshotForVersion(state, block, fromMigrationVersion))
		.map((block) => block.blockName);
	const summaries = includedBlocks.map((block) => {
		const diff = createMigrationDiff(state, block, fromMigrationVersion, targetMigrationVersion);
		return {
			blockName: block.blockName,
			diff,
			riskSummary: createMigrationRiskSummary(diff),
		};
	});
	const nextSteps = createMigrationPlanNextSteps(
		fromMigrationVersion,
		targetMigrationVersion,
		state.config.currentMigrationVersion,
	);

	renderLine(`Current migration version: ${state.config.currentMigrationVersion}`);
	renderLine(
		`Available legacy migration versions: ${availableLegacyVersions.length > 0 ? availableLegacyVersions.join(", ") : "None configured"}`,
	);
	renderLine(`Selected migration edge: ${fromMigrationVersion} -> ${targetMigrationVersion}`);
	renderLine(`Included block targets: ${includedBlocks.map((block) => block.blockName).join(", ")}`);
	renderLine(`Skipped block targets: ${skippedBlocks.length > 0 ? skippedBlocks.join(", ") : "None"}`);

	for (const summary of summaries) {
		renderLine(`Block: ${summary.blockName}`);
		renderLine(formatDiffReport(summary.diff, { includeRiskSummary: false }));
		renderLine(`Risk summary: ${formatMigrationRiskSummary(summary.riskSummary)}`);
	}

	renderLine("Next steps:");
	for (const command of nextSteps) {
		renderLine(`  ${command}`);
	}
	renderLine(
		`Optional after editing rules: ${formatEdgeCommand(
			"fixtures",
			fromMigrationVersion,
			targetMigrationVersion,
			state.config.currentMigrationVersion,
		)} --force`,
	);

	return {
		availableLegacyVersions,
		currentMigrationVersion: state.config.currentMigrationVersion,
		fromMigrationVersion,
		includedBlocks: includedBlocks.map((block) => block.blockName),
		nextSteps,
		skippedBlocks,
		summaries,
		targetMigrationVersion,
	};
}

/**
 * Interactively choose one legacy version to preview, then run the same read-only planner.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Interactive prompt and rendering settings. Throws when no TTY is available.
 * @returns The planned migration summary, or `{ cancelled: true }` when the user exits the wizard.
 */
export async function wizardProjectMigrations(
	projectDir: string,
	{
		isInteractive = isInteractiveTerminal(),
		prompt,
		renderLine = console.log as RenderLine,
	}: WizardOptions = {},
) {
	if (!isInteractive) {
		throw new Error(
			"`migrations wizard` requires an interactive terminal. " +
				"Use `wp-typia migrations plan --from-migration-version <label>` for a read-only preview or run the direct migration commands with explicit flags.",
		);
	}

	const state = loadMigrationProject(projectDir, { allowSyncTypes: false });
	const availableLegacyVersions = listPreviewableLegacyVersions(state).sort(compareMigrationVersionLabels).reverse();
	if (availableLegacyVersions.length === 0) {
		throw new Error(
			"No legacy migration versions are configured yet. " +
				"Capture an older schema release with `wp-typia migrations snapshot --migration-version <label>` first, then rerun `wp-typia migrations wizard`.",
		);
	}

	const activePrompt = prompt ?? createReadlinePrompt();
	const createdPrompt = !prompt;
	try {
		const selectedVersion = await activePrompt.select(
			"Choose a legacy version to preview",
			[
				...availableLegacyVersions.map((version) => ({
					hint: `Preview ${version} -> ${state.config.currentMigrationVersion}`,
					label: version,
					value: version,
				})),
				{
					hint: "Exit without previewing a migration edge",
					label: "Cancel",
					value: "cancel",
				},
			],
			1,
		);

		if (selectedVersion === "cancel") {
			renderLine("Cancelled migration planning.");
			return { cancelled: true as const };
		}

		return planProjectMigrations(projectDir, {
			fromMigrationVersion: selectedVersion,
			renderLine,
		});
	} finally {
		if (createdPrompt) {
			activePrompt.close();
		}
	}
}

export function initProjectMigrations(
	projectDir: string,
	currentMigrationVersion: string,
	{ renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	assertMigrationVersionLabel(currentMigrationVersion, "current migration version");
	const discoveredLayout = discoverMigrationInitLayout(projectDir);
	const configuredBlocks = discoveredLayout.mode === "multi" ? discoveredLayout.blocks : undefined;
	ensureAdvancedMigrationProject(projectDir, configuredBlocks);
	ensureMigrationDirectories(projectDir, configuredBlocks);
	writeMigrationConfig(projectDir, {
		blockName:
			discoveredLayout.mode === "single"
				? discoveredLayout.block.blockName
				: undefined,
		blocks: configuredBlocks,
		currentMigrationVersion,
		snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
		supportedMigrationVersions: [currentMigrationVersion],
	});

	writeInitialMigrationScaffold(projectDir, currentMigrationVersion, configuredBlocks);
	snapshotProjectVersion(projectDir, currentMigrationVersion, { renderLine, skipConfigUpdate: true });
	regenerateGeneratedArtifacts(projectDir);

	if (discoveredLayout.mode === "multi") {
		renderLine(
			`Detected multi-block migration retrofit (${discoveredLayout.blocks.length} targets): ${discoveredLayout.blocks.map((block) => block.blockName).join(", ")}`,
		);
	} else {
		renderLine(`Detected single-block migration retrofit: ${discoveredLayout.block.blockName}`);
	}
	renderLine("Wrote src/migrations/config.ts");
	renderLine(
		`Initialized migrations for ${
			discoveredLayout.mode === "multi"
				? discoveredLayout.blocks.map((block) => block.blockName).join(", ")
				: discoveredLayout.block.blockName
		} at migration version ${currentMigrationVersion}`,
	);
	return loadMigrationProject(projectDir);
}

export function snapshotProjectVersion(
	projectDir: string,
	migrationVersion: string,
	{
		renderLine = console.log as RenderLine,
		skipConfigUpdate = false,
		skipSyncTypes = false,
	}: CommandRenderOptions & { skipConfigUpdate?: boolean; skipSyncTypes?: boolean } = {},
) {
	ensureAdvancedMigrationProject(projectDir);
	assertMigrationVersionLabel(migrationVersion, "migration version");
	if (!skipSyncTypes) {
		try {
			runProjectScriptIfPresent(projectDir, "sync-types");
		} catch (error) {
			const syncTypesCommand = formatRunScript(detectPackageManagerId(projectDir), "sync-types");
			const reason = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Could not capture migration snapshot ${migrationVersion} because \`${syncTypesCommand}\` failed first. ` +
					`Install project dependencies if needed, rerun \`${syncTypesCommand}\` in the project root to inspect the underlying error, ` +
					`then retry \`wp-typia migrations snapshot --migration-version ${migrationVersion}\`.\n` +
					`Original error: ${reason}`,
			);
		}
	}

	const state = loadMigrationProject(projectDir, { allowMissingConfig: skipConfigUpdate });
	for (const block of state.blocks) {
		const snapshotRoot = getSnapshotRoot(projectDir, block, migrationVersion);
		fs.mkdirSync(snapshotRoot, { recursive: true });

		fs.writeFileSync(
			getSnapshotBlockJsonPath(projectDir, block, migrationVersion),
			`${JSON.stringify(
				sanitizeSnapshotBlockJson(readJson<JsonObject>(path.join(projectDir, block.blockJsonFile))),
				null,
				"\t",
			)}\n`,
			"utf8",
		);
		copyFile(
			path.join(projectDir, block.manifestFile),
			getSnapshotManifestPath(projectDir, block, migrationVersion),
		);
		fs.writeFileSync(
			getSnapshotSavePath(projectDir, block, migrationVersion),
			sanitizeSaveSnapshotSource(fs.readFileSync(path.join(projectDir, block.saveFile), "utf8")),
			"utf8",
		);
	}

	if (!skipConfigUpdate) {
		const nextSupported = [
			...new Set([...state.config.supportedMigrationVersions, migrationVersion]),
		].sort(compareMigrationVersionLabels);
		writeMigrationConfig(projectDir, {
			...state.config,
			currentMigrationVersion: migrationVersion,
			supportedMigrationVersions: nextSupported,
		});
	}

	regenerateGeneratedArtifacts(projectDir);
	renderLine(`Snapshot stored for migration version ${migrationVersion}`);
	return loadMigrationProject(projectDir);
}

export function diffProjectMigrations(
	projectDir: string,
	{
		fromMigrationVersion,
		toMigrationVersion = "current",
		renderLine = console.log as RenderLine,
	}: DiffLikeOptions = {},
) {
	if (!fromMigrationVersion) {
		throw new Error("`migrations diff` requires --from-migration-version <label>.");
	}
	const state = loadMigrationProject(projectDir);
	const targetMigrationVersion = resolveTargetMigrationVersion(
		state.config.currentMigrationVersion,
		toMigrationVersion,
	);
	assertDistinctMigrationEdge("diff", fromMigrationVersion, targetMigrationVersion);
	const diffs = state.blocks
		.filter((block) => hasSnapshotForVersion(state, block, fromMigrationVersion))
		.map((block) => ({
			block,
			diff: createMigrationDiff(state, block, fromMigrationVersion, targetMigrationVersion),
		}));

	if (diffs.length === 0) {
		throw new Error(createMissingProjectSnapshotMessage(state, fromMigrationVersion));
	}

	for (const { block, diff } of diffs) {
		renderLine(`Block: ${block.blockName}`);
		renderLine(formatDiffReport(diff));
	}

	return diffs.length === 1 ? diffs[0].diff : diffs;
}

export function scaffoldProjectMigrations(
	projectDir: string,
	{
		fromMigrationVersion,
		toMigrationVersion = "current",
		renderLine = console.log as RenderLine,
	}: DiffLikeOptions = {},
) {
	if (!fromMigrationVersion) {
		throw new Error("`migrations scaffold` requires --from-migration-version <label>.");
	}

	ensureMigrationDirectories(projectDir);
	const state = loadMigrationProject(projectDir);
	const targetMigrationVersion = resolveTargetMigrationVersion(
		state.config.currentMigrationVersion,
		toMigrationVersion,
	);
	assertDistinctMigrationEdge("scaffold", fromMigrationVersion, targetMigrationVersion);
	const paths = getProjectPaths(projectDir);
	const scaffolded: Array<{ blockName: string; diff: ReturnType<typeof createMigrationDiff>; rulePath: string }> =
		[];
	let eligibleBlocks = 0;

	for (const block of state.blocks) {
		if (!hasSnapshotForVersion(state, block, fromMigrationVersion)) {
			renderLine(`Skipped ${block.blockName}: no snapshot for ${fromMigrationVersion}`);
			continue;
		}
		eligibleBlocks += 1;
		const diff = createMigrationDiff(state, block, fromMigrationVersion, targetMigrationVersion);
		const rulePath = getRuleFilePath(paths, block, fromMigrationVersion, targetMigrationVersion);

		if (!fs.existsSync(rulePath)) {
			fs.mkdirSync(path.dirname(rulePath), { recursive: true });
			fs.writeFileSync(
				rulePath,
				renderMigrationRuleFile({
					block,
					currentAttributes: block.currentManifest.attributes ?? {},
					currentTypeName: block.currentManifest.sourceType,
					diff,
					fromVersion: fromMigrationVersion,
					projectDir,
					rulePath,
					targetVersion: targetMigrationVersion,
				}),
				"utf8",
			);
		}

		ensureEdgeFixtureFile(projectDir, block, fromMigrationVersion, targetMigrationVersion, diff);
		scaffolded.push({ blockName: block.blockName, diff, rulePath });
	}
	regenerateGeneratedArtifacts(projectDir);

	for (const entry of scaffolded) {
		renderLine(`Block: ${entry.blockName}`);
		renderLine(formatDiffReport(entry.diff));
		renderLine(`Scaffolded ${path.relative(projectDir, entry.rulePath)}`);
	}

	if (eligibleBlocks === 0) {
		throw new Error(createMissingProjectSnapshotMessage(state, fromMigrationVersion));
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
	{ all = false, fromMigrationVersion, renderLine = console.log as RenderLine }: VerifyOptions = {},
) {
	const state = loadMigrationProject(projectDir);
	const targetVersions = resolveLegacyVersions(state, { all, fromMigrationVersion });
	const blockEntries = getSelectedEntriesByBlock(state, targetVersions, "verify");
	const legacySingleBlock = isLegacySingleBlockProject(state);

	if (targetVersions.length === 0) {
		renderLine("No legacy migration versions configured for verification.");
		return { verifiedVersions: [] };
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	for (const [blockKey, entries] of Object.entries(blockEntries)) {
		const block = state.blocks.find((entry) => entry.key === blockKey);
		if (!block || entries.length === 0) {
			continue;
		}
		for (const entry of entries) {
			assertRuleHasNoTodos(projectDir, block, entry.fromVersion, state.config.currentMigrationVersion);
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
			: ["--from-migration-version", selectedVersionsForBlock[0]];
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
	{ all = false, fromMigrationVersion, renderLine = console.log as RenderLine }: VerifyOptions = {},
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
				? `Loaded ${state.blocks[0]?.blockName} @ ${state.config.currentMigrationVersion}`
				: `Loaded ${state.blocks.length} block target(s) @ ${state.config.currentMigrationVersion}`,
		);
	} catch (error) {
		recordCheck("fail", "Migration config", error instanceof Error ? error.message : String(error));
		throw new Error("Migration doctor failed.");
	}

	const targetVersions = resolveLegacyVersions(state, { all, fromMigrationVersion });
	const legacySingleBlock = isLegacySingleBlockProject(state);
	const snapshotVersions = new Set(
		targetVersions.length > 0
			? [state.config.currentMigrationVersion, ...targetVersions]
			: state.config.supportedMigrationVersions,
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
				inSync
					? "In sync"
					: `Run \`wp-typia migrations scaffold --from-migration-version <label>\` or regenerate artifacts`,
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
			const rulePath = getRuleFilePath(state.paths, block, version, state.config.currentMigrationVersion);
			const fixturePath = getFixtureFilePath(state.paths, block, version, state.config.currentMigrationVersion);

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
				assertRuleHasNoTodos(projectDir, block, version, state.config.currentMigrationVersion);
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

				const diff = createMigrationDiff(state, block, version, state.config.currentMigrationVersion);
				const expectedFixture = createEdgeFixtureDocument(
					projectDir,
					block,
					version,
					state.config.currentMigrationVersion,
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
		fromMigrationVersion,
		isInteractive = isInteractiveTerminal(),
		renderLine = console.log as RenderLine,
		toMigrationVersion = "current",
	}: FixturesOptions = {},
) {
	ensureMigrationDirectories(projectDir);
	const state = loadMigrationProject(projectDir);
	const targetMigrationVersion = resolveTargetMigrationVersion(
		state.config.currentMigrationVersion,
		toMigrationVersion,
	);
	const targetVersions = resolveLegacyVersions(state, { all, fromMigrationVersion });

	if (targetVersions.length === 0) {
		renderLine("No legacy migration versions configured for fixture generation.");
		return { generatedVersions: [], skippedVersions: [] };
	}

	const generatedVersions: string[] = [];
	const skippedVersions: string[] = [];
	const fixtureTargets = collectFixtureTargets(state, targetVersions, targetMigrationVersion);

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
		const diff = createMigrationDiff(state, block, version, targetMigrationVersion);
		const result = ensureEdgeFixtureFile(projectDir, block, version, targetMigrationVersion, diff, { force });
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
		fromMigrationVersion,
		iterations = 25,
		renderLine = console.log as RenderLine,
		seed,
	}: FuzzOptions = {},
) {
	const state = loadMigrationProject(projectDir);
	const targetVersions = resolveLegacyVersions(state, { all, fromMigrationVersion });
	const blockEntries = getSelectedEntriesByBlock(state, targetVersions, "fuzz");
	const legacySingleBlock = isLegacySingleBlockProject(state);
	if (targetVersions.length === 0) {
		renderLine("No legacy migration versions configured for fuzzing.");
		return { fuzzedVersions: [] };
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	for (const [blockKey, entries] of Object.entries(blockEntries)) {
		const block = state.blocks.find((entry) => entry.key === blockKey);
		if (!block || entries.length === 0) {
			continue;
		}
		for (const entry of entries) {
			assertRuleHasNoTodos(projectDir, block, entry.fromVersion, state.config.currentMigrationVersion);
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
			...(all ? ["--all"] : ["--from-migration-version", selectedVersionsForBlock[0]]),
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
	{
		all = false,
		availableVersions,
		fromMigrationVersion,
	}: { all?: boolean; availableVersions?: string[]; fromMigrationVersion?: string },
): string[] {
	const configuredLegacyVersions = listConfiguredLegacyVersions(state);
	const legacyVersions = availableVersions ?? configuredLegacyVersions;

	if (fromMigrationVersion) {
		if (!legacyVersions.includes(fromMigrationVersion)) {
			throw new Error(
				legacyVersions.length === 0
					? availableVersions && configuredLegacyVersions.length > 0
						? `Unsupported migration version: ${fromMigrationVersion}. No previewable legacy migration versions are available yet because none currently have snapshot coverage. ` +
							`Restore or recapture the missing snapshots first.`
						: `Unsupported migration version: ${fromMigrationVersion}. No legacy migration versions are configured yet. ` +
							`Capture an older schema release with \`wp-typia migrations snapshot --migration-version <label>\` first.`
					: `Unsupported migration version: ${fromMigrationVersion}. Available legacy migration versions: ${legacyVersions.join(", ")}.`,
			);
		}
		return [fromMigrationVersion];
	}

	if (all) {
		return legacyVersions;
	}

	return legacyVersions.slice(0, 1);
}

function listConfiguredLegacyVersions(
	state: ReturnType<typeof loadMigrationProject>,
): string[] {
	return state.config.supportedMigrationVersions
		.filter((version) => version !== state.config.currentMigrationVersion)
		.sort(compareMigrationVersionLabels);
}

function listPreviewableLegacyVersions(
	state: ReturnType<typeof loadMigrationProject>,
): string[] {
	return [...new Set(
		state.blocks.flatMap((block) =>
			getAvailableSnapshotVersionsForBlock(
				state.projectDir,
				state.config.supportedMigrationVersions,
				block,
			),
		),
	)]
		.filter((version) => version !== state.config.currentMigrationVersion)
		.sort(compareMigrationVersionLabels);
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
 * @param currentMigrationVersion Initial migration version label to seed into the migration config.
 * @param blocks Block targets to register for migration-aware scaffolding.
 * @param options Console rendering options for initialization output.
 * @returns The loaded migration project state after initialization completes.
 */
export function seedProjectMigrations(
	projectDir: string,
	currentMigrationVersion: string,
	blocks: MigrationBlockConfig[],
	{ renderLine = console.log as RenderLine }: CommandRenderOptions = {},
) {
	ensureAdvancedMigrationProject(projectDir, blocks);
	assertMigrationVersionLabel(currentMigrationVersion, "current migration version");
	ensureMigrationDirectories(projectDir, blocks);
	writeMigrationConfig(projectDir, {
		blocks,
		currentMigrationVersion,
		snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
		supportedMigrationVersions: [currentMigrationVersion],
	});
	writeInitialMigrationScaffold(projectDir, currentMigrationVersion, blocks);
	snapshotProjectVersion(projectDir, currentMigrationVersion, {
		renderLine,
		skipConfigUpdate: true,
		skipSyncTypes: true,
	});
	regenerateGeneratedArtifacts(projectDir);
	renderLine(
		`Initialized migrations for ${blocks.map((block) => block.blockName).join(", ")} at migration version ${currentMigrationVersion}`,
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
		const missingVersions = [...new Set(missingEntries.map(({ version }) => version))].sort(compareMigrationVersionLabels);
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

	const introducedVersions = [...new Set(state.config.supportedMigrationVersions)]
		.filter((candidateVersion) => hasSnapshotForVersion(state, block, candidateVersion))
		.sort(compareMigrationVersionLabels);
	const firstIntroducedVersion = introducedVersions[0];

	if (!firstIntroducedVersion) {
		return false;
	}

	return compareMigrationVersionLabels(version, firstIntroducedVersion) < 0;
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
	command: "diff" | "plan" | "scaffold",
	fromVersion: string,
	toVersion: string,
): void {
	if (fromVersion === toVersion) {
		throw new Error(
			`\`migrations ${command}\` requires different source and target migration versions, but both resolved to ${fromVersion}. ` +
				`Choose an older snapshot with \`--from-migration-version <label>\` or capture a newer schema release with \`wp-typia migrations snapshot --migration-version <label>\` first.`,
		);
	}
}

function createMigrationPlanNextSteps(
	fromVersion: string,
	targetVersion: string,
	currentVersion: string,
): string[] {
	if (targetVersion !== currentVersion) {
		return [
			formatEdgeCommand("scaffold", fromVersion, targetVersion, currentVersion),
		];
	}

	return [
		formatEdgeCommand("scaffold", fromVersion, targetVersion, currentVersion),
		`wp-typia migrations doctor --from-migration-version ${fromVersion}`,
		`wp-typia migrations verify --from-migration-version ${fromVersion}`,
		`wp-typia migrations fuzz --from-migration-version ${fromVersion}`,
	];
}

function formatEdgeCommand(
	command: "fixtures" | "scaffold",
	fromVersion: string,
	targetVersion: string,
	currentVersion: string,
): string {
	return targetVersion === currentVersion
		? `wp-typia migrations ${command} --from-migration-version ${fromVersion}`
		: `wp-typia migrations ${command} --from-migration-version ${fromVersion} --to-migration-version ${targetVersion}`;
}

function createMissingProjectSnapshotMessage(
	state: ReturnType<typeof loadMigrationProject>,
	fromVersion: string,
): string {
	const snapshotVersions = [...new Set(
		state.blocks.flatMap((block) =>
			getAvailableSnapshotVersionsForBlock(state.projectDir, state.config.supportedMigrationVersions, block),
		),
	)].sort(compareMigrationVersionLabels);

	return snapshotVersions.length === 0
		? `No migration block targets have a snapshot for ${fromVersion}. No snapshots exist yet in this project. ` +
				`Run \`wp-typia migrations snapshot --migration-version ${fromVersion}\` first if you want to preserve that schema state.`
		: `No migration block targets have a snapshot for ${fromVersion}. ` +
				`Available snapshot versions in this project: ${snapshotVersions.join(", ")}. ` +
				`Run \`wp-typia migrations snapshot --migration-version ${fromVersion}\` first if you want to preserve that schema state.`;
}

function formatScaffoldCommand(versions: string[]): string {
	const uniqueVersions = [...new Set(versions)].sort(compareMigrationVersionLabels);
	return uniqueVersions.length === 1
		? `wp-typia migrations scaffold --from-migration-version ${uniqueVersions[0]}`
		: "wp-typia migrations scaffold --from-migration-version <label>";
}

function throwLegacyMigrationFlagError(flag: string): never {
	const replacement =
		flag.startsWith("--current-version")
			? "--current-migration-version"
			: flag.startsWith("--version")
				? "--migration-version"
				: flag.startsWith("--from")
					? "--from-migration-version"
					: "--to-migration-version";
	throw new Error(
		`Legacy migrations flag \`${flag}\` is no longer supported. Use \`${replacement}\` with schema labels like \`v1\` and \`v2\` instead. ` +
			formatLegacyMigrationWorkspaceResetGuidance(),
	);
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
