import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import {
	GENERATED_DIR,
	ROOT_BLOCK_JSON,
	ROOT_MANIFEST,
	ROOT_PHP_MIGRATION_REGISTRY,
	ROOT_SAVE_FILE,
	SNAPSHOT_DIR,
} from "./migration-constants.js";
import { createMigrationDiff } from "./migration-diff.js";
import { ensureEdgeFixtureFile } from "./migration-fixtures.js";
import {
	assertRuleHasNoTodos,
	discoverMigrationEntries,
	ensureAdvancedMigrationProject,
	ensureMigrationDirectories,
	getProjectPaths,
	getRuleFilePath,
	loadMigrationProject,
	readProjectBlockName,
	writeInitialMigrationScaffold,
	writeMigrationConfig,
} from "./migration-project.js";
import {
	formatDiffReport,
	renderGeneratedDeprecatedFile,
	renderMigrationRegistryFile,
	renderMigrationRuleFile,
	renderPhpMigrationRegistryFile,
	renderVerifyFile,
} from "./migration-render.js";
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

export function formatMigrationHelpText(): string {
	return `Usage:
  create-wp-typia migrations init --current-version <semver>
  create-wp-typia migrations snapshot --version <semver>
  create-wp-typia migrations diff --from <semver> [--to current]
  create-wp-typia migrations scaffold --from <semver> [--to current]
  create-wp-typia migrations verify [--from <semver>|--all]`;
}

export function parseMigrationArgs(argv: string[]): ParsedMigrationArgs {
	const parsed: ParsedMigrationArgs = {
		command: undefined,
		flags: {
			all: false,
			currentVersion: undefined,
			from: undefined,
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

export function verifyProjectMigrations(
	projectDir: string,
	{ all = false, fromVersion, renderLine = console.log as RenderLine }: VerifyOptions = {},
) {
	const state = loadMigrationProject(projectDir);
	const verifyScriptPath = path.join(projectDir, GENERATED_DIR, "verify.ts");

	if (!fs.existsSync(verifyScriptPath)) {
		throw new Error(
			"Generated verify script is missing. Run `create-wp-typia migrations scaffold --from <semver>` first.",
		);
	}

	const targetVersions = all
		? state.config.supportedVersions.filter((version) => version !== state.config.currentVersion)
		: fromVersion
			? [fromVersion]
			: state.config.supportedVersions.filter((version) => version !== state.config.currentVersion);

	if (targetVersions.length === 0) {
		renderLine("No legacy versions configured for verification.");
		return { verifiedVersions: [] };
	}

	for (const version of targetVersions) {
		assertRuleHasNoTodos(projectDir, version, state.config.currentVersion);
	}

	const tsxBinary = getLocalTsxBinary(projectDir);
	const filteredArgs = all ? ["--all"] : fromVersion ? ["--from", fromVersion] : [];
	execSync(`"${tsxBinary}" "${verifyScriptPath}" ${filteredArgs.join(" ")}`.trim(), {
		cwd: projectDir,
		stdio: "inherit",
	});

	renderLine(`Verified migrations for ${targetVersions.join(", ")}`);
	return { verifiedVersions: targetVersions };
}

function regenerateGeneratedArtifacts(projectDir: string): void {
	const state = loadMigrationProject(projectDir);
	const entries = discoverMigrationEntries(state);

	fs.mkdirSync(state.paths.generatedDir, { recursive: true });
	fs.writeFileSync(
		path.join(state.paths.generatedDir, "registry.ts"),
		renderMigrationRegistryFile(state, entries),
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
		path.join(projectDir, ROOT_PHP_MIGRATION_REGISTRY),
		renderPhpMigrationRegistryFile(state, entries),
		"utf8",
	);
}
