import fs from "node:fs";
import path from "node:path";

import {
	CONFIG_FILE,
	FIXTURES_DIR,
	GENERATED_DIR,
	MIGRATION_TODO_PREFIX,
	ROOT_BLOCK_JSON,
	ROOT_MANIFEST,
	ROOT_SAVE_FILE,
	ROOT_TYPES_FILE,
	RULES_DIR,
	SNAPSHOT_DIR,
	SRC_BLOCK_JSON,
	SRC_MANIFEST,
	SUPPORTED_PROJECT_FILES,
} from "./migration-constants.js";
import {
	compareMigrationVersionLabels,
	readJson,
} from "./migration-utils.js";
import {
	ensureRelativePath,
	normalizeRelativePath,
	parseMigrationConfig,
} from "./migration-project-config-source.js";
import type {
	ManifestDocument,
	MigrationBlockConfig,
	MigrationConfig,
	MigrationEntry,
	MigrationProjectPaths,
	MigrationProjectState,
	ResolvedMigrationBlockTarget,
	RuleMetadata,
} from "./migration-types.js";

const DEFAULT_BLOCK_KEY = "default";
const SINGLE_BLOCK_LAYOUT_NOT_FOUND = "No supported single-block migration layout was found.";
const SINGLE_BLOCK_LAYOUT_CANDIDATES = [
	{
		blockJsonFile: SRC_BLOCK_JSON,
		manifestFile: SRC_MANIFEST,
	},
	{
		blockJsonFile: ROOT_BLOCK_JSON,
		manifestFile: ROOT_MANIFEST,
	},
] as const;
const LEGACY_ROOT_SINGLE_BLOCK_LAYOUT = SINGLE_BLOCK_LAYOUT_CANDIDATES[1];

/**
 * Describes the migration retrofit layout discovered in a project directory.
 *
 * Multi-block discovery wins when block targets are discovered under
 * `src/blocks/<slug>/block.json`.
 * Otherwise the runtime falls back to a supported single-block layout.
 */
export type DiscoveredMigrationLayout =
	| {
			block: MigrationBlockConfig;
			mode: "single";
	  }
	| {
			blocks: MigrationBlockConfig[];
			mode: "multi";
	  };

function toImportPath(fromDir: string, targetPath: string, stripExtension = false): string {
	let relativePath = normalizeRelativePath(path.relative(fromDir, targetPath));
	if (!relativePath.startsWith(".")) {
		relativePath = `./${relativePath}`;
	}
	if (stripExtension) {
		relativePath = relativePath.replace(/\.[^.]+$/u, "");
	}
	return relativePath;
}

function readSingleBlockTarget(
	projectDir: string,
	{
		blockJsonFile,
		manifestFile,
	}: {
		blockJsonFile: string;
		manifestFile: string;
	},
): MigrationBlockConfig | null {
	const requiredFiles = [blockJsonFile, ROOT_SAVE_FILE, ROOT_TYPES_FILE];
	if (requiredFiles.some((relativePath) => !fs.existsSync(path.join(projectDir, relativePath)))) {
		return null;
	}

	const blockName = readJson<{ name?: string }>(path.join(projectDir, blockJsonFile))?.name;
	if (typeof blockName !== "string" || blockName.length === 0) {
		throw new Error(`Unable to resolve block name from ${normalizeRelativePath(blockJsonFile)}`);
	}

	return {
		blockJsonFile: normalizeRelativePath(blockJsonFile),
		blockName,
		key: DEFAULT_BLOCK_KEY,
		manifestFile: normalizeRelativePath(manifestFile),
		saveFile: ROOT_SAVE_FILE,
		typesFile: ROOT_TYPES_FILE,
	};
}

function collectSingleBlockCandidates(
	projectDir: string,
): Array<{
	blockJsonFile: string;
	manifestFile: string;
}> {
	return SINGLE_BLOCK_LAYOUT_CANDIDATES.filter(({ blockJsonFile }) =>
		hasSingleBlockLayoutFiles(projectDir, blockJsonFile),
	);
}

function hasSingleBlockLayoutFiles(projectDir: string, blockJsonFile: string): boolean {
	return [blockJsonFile, ROOT_SAVE_FILE, ROOT_TYPES_FILE].every((relativePath) =>
		fs.existsSync(path.join(projectDir, relativePath)),
	);
}

function orderSingleBlockCandidates(
	projectDir: string,
	candidates: Array<{
		blockJsonFile: string;
		manifestFile: string;
	}>,
) {
	const candidatesWithManifest = candidates.filter(({ manifestFile }) =>
		fs.existsSync(path.join(projectDir, manifestFile)),
	);
	return [
		...candidatesWithManifest,
		...candidates.filter((candidate) => !candidatesWithManifest.includes(candidate)),
	];
}

/**
 * Synthesizes the implicit legacy migration block target for single-block projects.
 *
 * @param projectDir Project directory that may contain a legacy root migration layout.
 * @param blockName Optional configured block name used to prefer a matching legacy root target.
 * @returns The discovered single-block migration target keyed as `default`.
 */
export function createImplicitLegacyBlock(
	projectDir: string,
	blockName?: string,
): MigrationBlockConfig {
	if (blockName) {
		try {
			const rootTarget = readSingleBlockTarget(projectDir, LEGACY_ROOT_SINGLE_BLOCK_LAYOUT);
			const srcTarget = readSingleBlockTarget(projectDir, SINGLE_BLOCK_LAYOUT_CANDIDATES[0]);
			const hasSrcManifest = fs.existsSync(path.join(projectDir, SRC_MANIFEST));
			if (
				rootTarget?.blockName === blockName &&
				(!srcTarget || srcTarget.blockName !== blockName || !hasSrcManifest)
			) {
				return {
					...rootTarget,
					key: DEFAULT_BLOCK_KEY,
				};
			}
		} catch {
			// Fall back to the shared discovery flow so malformed legacy roots do not block valid layouts.
		}
	}
	const discovered = discoverSingleBlockTarget(projectDir, blockName);
	return {
		...discovered,
		key: DEFAULT_BLOCK_KEY,
	};
}

function createMalformedMultiBlockTargetError(directory: string, reason: string): Error {
	return new Error(
		"Unable to auto-detect a supported migration retrofit layout. " +
			`Detected ${path.join("src", "blocks", directory, "block.json")} but ${reason}. ` +
			"Create `src/migrations/config.ts` manually if your project uses a custom layout.",
	);
}

function getRequiredProjectFiles(projectDir: string, blocks?: MigrationBlockConfig[]): string[] {
	if (Array.isArray(blocks) && blocks.length > 0) {
		return [
			"package.json",
			...blocks.flatMap((block) => [block.blockJsonFile, block.saveFile, block.typesFile]),
		];
	}

	const configPath = path.join(projectDir, CONFIG_FILE);
	if (fs.existsSync(configPath)) {
		const config = parseMigrationConfig(fs.readFileSync(configPath, "utf8"));
		const configuredBlocks = config.blocks ?? [createImplicitLegacyBlock(projectDir, config.blockName)];
		return [
			"package.json",
			...configuredBlocks.flatMap((block) => [block.blockJsonFile, block.saveFile, block.typesFile]),
		];
	}

	const discoveredLayout = discoverMigrationLayout(projectDir);
	if (discoveredLayout?.mode === "multi") {
		return [
			"package.json",
			...discoveredLayout.blocks.flatMap((block) => [block.blockJsonFile, block.saveFile, block.typesFile]),
		];
	}
	if (discoveredLayout?.mode === "single") {
		return [
			"package.json",
			discoveredLayout.block.blockJsonFile,
			discoveredLayout.block.saveFile,
			discoveredLayout.block.typesFile,
		];
	}

	return SUPPORTED_PROJECT_FILES;
}

/**
 * Verifies that a project directory contains the files required for migration tooling.
 *
 * @param projectDir Project directory to validate.
 * @param blocks Optional block targets to validate directly instead of auto-discovering them.
 * @returns Nothing.
 * @throws Error When any required project file is missing.
 */
export function ensureAdvancedMigrationProject(
	projectDir: string,
	blocks?: MigrationBlockConfig[],
): void {
	const missing = getRequiredProjectFiles(projectDir, blocks).filter(
		(relativePath) => !fs.existsSync(path.join(projectDir, relativePath)),
	);
	if (missing.length > 0) {
		throw new Error(
			`This directory is not a supported migration-capable project. Missing: ${missing.join(", ")}`,
		);
	}
}

/**
 * Resolves the canonical migration workspace paths for a project directory.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @returns Absolute filesystem paths for config, generated, fixture, rule, and snapshot roots.
 */
export function getProjectPaths(projectDir: string): MigrationProjectPaths {
	return {
		configFile: path.join(projectDir, CONFIG_FILE),
		fixturesDir: path.join(projectDir, FIXTURES_DIR),
		generatedDir: path.join(projectDir, GENERATED_DIR),
		rulesDir: path.join(projectDir, RULES_DIR),
		snapshotDir: path.join(projectDir, SNAPSHOT_DIR),
	};
}

function createBlockTarget(
	projectDir: string,
	{
		blockJsonFile,
		key,
		manifestFile,
		saveFile,
		typesFile,
	}: {
		blockJsonFile: string;
		key: string;
		manifestFile: string;
		saveFile: string;
		typesFile: string;
	},
): MigrationBlockConfig | null {
	const requiredFiles = [blockJsonFile, saveFile, typesFile];
	if (requiredFiles.some((relativePath) => !fs.existsSync(path.join(projectDir, relativePath)))) {
		return null;
	}

	const blockName = readJson<{ name?: string }>(path.join(projectDir, blockJsonFile))?.name;
	if (typeof blockName !== "string" || blockName.length === 0) {
		return null;
	}

	return {
		blockJsonFile: normalizeRelativePath(blockJsonFile),
		blockName,
		key,
		manifestFile: normalizeRelativePath(manifestFile),
		saveFile: normalizeRelativePath(saveFile),
		typesFile: normalizeRelativePath(typesFile),
	};
}

function discoverSingleBlockTarget(projectDir: string, preferredBlockName?: string): MigrationBlockConfig {
	const candidates = collectSingleBlockCandidates(projectDir);
	if (candidates.length === 0) {
		throw new Error(SINGLE_BLOCK_LAYOUT_NOT_FOUND);
	}

	const readCandidate = (candidate: (typeof candidates)[number]) =>
		readSingleBlockTarget(projectDir, candidate);
	const orderedCandidates = orderSingleBlockCandidates(projectDir, candidates);

	if (preferredBlockName) {
		const validTargets: MigrationBlockConfig[] = [];
		let firstReadError: Error | null = null;

		for (const candidate of orderedCandidates) {
			try {
				const target = readCandidate(candidate);
				if (!target) {
					continue;
				}
				if (target.blockName === preferredBlockName) {
					return target;
				}
				validTargets.push(target);
			} catch (error) {
				if (!firstReadError && error instanceof Error) {
					firstReadError = error;
				}
			}
		}

		if (validTargets.length > 0) {
			throw new Error(
				`Configured migration blockName ${preferredBlockName} does not match the detected single-block layout(s): ${validTargets
					.map((target) => target.blockName)
					.join(", ")}.`,
			);
		}
		if (firstReadError) {
			throw firstReadError;
		}
	}

	let firstReadError: unknown;
	let sawReadError = false;
	for (const candidate of orderedCandidates) {
		try {
			const target = readCandidate(candidate);
			if (target) {
				return target;
			}
		} catch (error) {
			if (!sawReadError) {
				firstReadError = error;
				sawReadError = true;
			}
		}
	}

	if (sawReadError) {
		throw firstReadError;
	}

	throw new Error(SINGLE_BLOCK_LAYOUT_NOT_FOUND);
}

function discoverMigrationLayout(projectDir: string): DiscoveredMigrationLayout | null {
	const blocksRoot = path.join(projectDir, "src", "blocks");
	let firstMultiBlockError: Error | null = null;
	if (fs.existsSync(blocksRoot) && fs.statSync(blocksRoot).isDirectory()) {
		const blockDirectories = fs
			.readdirSync(blocksRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
		const candidateDirectories = blockDirectories.filter((directory) =>
			fs.existsSync(path.join(blocksRoot, directory, "block.json")),
		);

		if (candidateDirectories.length > 0) {
			const blocks = candidateDirectories.flatMap((directory) => {
				const saveFile = path.join("src", "blocks", directory, "save.tsx");
				const typesFile = path.join("src", "blocks", directory, "types.ts");
				const missingFiles = [saveFile, typesFile].filter(
					(relativePath) => !fs.existsSync(path.join(projectDir, relativePath)),
				);
				if (missingFiles.length > 0) {
					firstMultiBlockError ??= createMalformedMultiBlockTargetError(
						directory,
						`the block target is missing ${missingFiles.join(", ")}`,
					);
					return [];
				}

				let block: MigrationBlockConfig | null = null;
				try {
					block = createBlockTarget(projectDir, {
						blockJsonFile: path.join("src", "blocks", directory, "block.json"),
						key: directory,
						manifestFile: path.join("src", "blocks", directory, "typia.manifest.json"),
						saveFile,
						typesFile,
					});
				} catch (error) {
					firstMultiBlockError ??=
						error instanceof Error
							? createMalformedMultiBlockTargetError(directory, `could not be parsed (${error.message})`)
							: createMalformedMultiBlockTargetError(directory, "could not be parsed");
					return [];
				}
				if (!block) {
					firstMultiBlockError ??= createMalformedMultiBlockTargetError(
						directory,
						"it does not expose a valid block name",
					);
					return [];
				}
				return [block];
			});

			if (blocks.length > 0) {
				return {
					blocks: blocks.sort((left, right) => left.key.localeCompare(right.key)),
					mode: "multi",
				};
			}
		}
	}

	try {
		return {
			block: discoverSingleBlockTarget(projectDir),
			mode: "single",
		};
	} catch (error) {
		if (error instanceof Error && error.message === SINGLE_BLOCK_LAYOUT_NOT_FOUND) {
			if (firstMultiBlockError) {
				throw firstMultiBlockError;
			}
			return null;
		}
		throw error;
	}
}

/**
 * Detects the supported migration retrofit layout for `migrate init`.
 *
 * Multi-block targets under `src/blocks/<slug>` take precedence over
 * single-block layouts.
 * Returns the detected layout on success and throws an actionable error when no
 * supported first-party layout can be inferred.
 *
 * @param projectDir Project directory to inspect.
 * @returns The discovered migration layout.
 * @throws Error When no supported layout can be inferred.
 */
export function discoverMigrationInitLayout(projectDir: string): DiscoveredMigrationLayout {
	const discoveredLayout = discoverMigrationLayout(projectDir);
	if (discoveredLayout) {
		return discoveredLayout;
	}

	throw new Error(
		"Unable to auto-detect a supported migration retrofit layout. " +
			"Expected either `src/blocks/*/block.json` with matching `types.ts` and `save.tsx`, " +
			"or a single-block layout using `src/block.json` (or legacy root `block.json`) with `src/types.ts` and `src/save.tsx`. " +
			"Create `src/migrations/config.ts` manually if your project uses a custom layout.",
	);
}

/**
 * Resolves the configured migration block targets and their current artifacts.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param config Parsed migration configuration.
 * @returns The resolved block targets, including current block.json and manifest documents.
 */
export function resolveMigrationBlocks(
	projectDir: string,
	config: MigrationConfig,
): ResolvedMigrationBlockTarget[] {
	if (Array.isArray(config.blocks)) {
		if (config.blocks.length === 0) {
			return [];
		}

		return config.blocks.map((block) => {
			const blockJsonPath = path.join(projectDir, block.blockJsonFile);
			const manifestPath = path.join(projectDir, block.manifestFile);
			return {
				...block,
				currentBlockJson: readJson(blockJsonPath),
				currentManifest: readJson(manifestPath),
				layout: "multi",
			} satisfies ResolvedMigrationBlockTarget;
		});
	}

	return [createImplicitLegacyBlock(projectDir, config.blockName)].map((block) => {
		const blockJsonPath = path.join(projectDir, block.blockJsonFile);
		const manifestPath = path.join(projectDir, block.manifestFile);
		return {
			...block,
			currentBlockJson: readJson(blockJsonPath),
			currentManifest: readJson(manifestPath),
			layout: "legacy",
		} satisfies ResolvedMigrationBlockTarget;
	});
}

/**
 * Resolves the snapshot root for a block target and migration version.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param version Migration version label.
 * @returns The absolute snapshot root directory for the requested block/version pair.
 */
export function getSnapshotRoot(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	if ("layout" in block && block.layout === "legacy") {
		return path.join(projectDir, SNAPSHOT_DIR, version);
	}
	return path.join(projectDir, SNAPSHOT_DIR, version, block.key);
}

/**
 * Resolves the snapshot `block.json` path for a block target and migration version.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param version Migration version label.
 * @returns The absolute snapshot `block.json` path.
 */
export function getSnapshotBlockJsonPath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	return path.join(getSnapshotRoot(projectDir, block, version), ROOT_BLOCK_JSON);
}

/**
 * Resolves the snapshot manifest path for a block target and migration version.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param version Migration version label.
 * @returns The absolute snapshot manifest path.
 */
export function getSnapshotManifestPath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	return path.join(getSnapshotRoot(projectDir, block, version), ROOT_MANIFEST);
}

/**
 * Lists the snapshot versions currently present for a specific block target.
 *
 * Returns the sorted subset of supported migration versions that have a manifest on disk
 * for the provided block, or an empty array when none exist.
 */
export function getAvailableSnapshotVersionsForBlock(
	projectDir: string,
	supportedMigrationVersions: string[],
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
): string[] {
	return supportedMigrationVersions
		.filter((version) => fs.existsSync(getSnapshotManifestPath(projectDir, block, version)))
		.sort(compareMigrationVersionLabels);
}

/**
 * Formats the standard missing-snapshot guidance for a block target.
 *
 * Returns a user-facing message that either lists the available snapshot
 * versions or explains that no snapshots exist yet for the block.
 */
export function createMissingBlockSnapshotMessage(
	blockName: string,
	fromVersion: string,
	availableSnapshotVersions: string[],
): string {
	return availableSnapshotVersions.length === 0
		? `Snapshot manifest for ${blockName} @ ${fromVersion} does not exist. ` +
				`No snapshots exist yet for ${blockName}. Run \`wp-typia migrate snapshot --migration-version ${fromVersion}\` first.`
		: `Snapshot manifest for ${blockName} @ ${fromVersion} does not exist. ` +
				`Available snapshot versions for ${blockName}: ${availableSnapshotVersions.join(", ")}. ` +
				`Run \`wp-typia migrate snapshot --migration-version ${fromVersion}\` first if you want to preserve that release.`;
}

/**
 * Resolves the snapshot save source path for a block target and migration version.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param version Migration version label.
 * @returns The absolute snapshot `save.tsx` path.
 */
export function getSnapshotSavePath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	return path.join(getSnapshotRoot(projectDir, block, version), "save.tsx");
}

/**
 * Resolves the generated directory used for a block's migration output.
 *
 * @param paths Resolved migration project paths.
 * @param block Block target or resolved block target.
 * @returns The absolute generated directory for the block.
 */
export function getGeneratedDirForBlock(
	paths: MigrationProjectPaths,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
): string {
	if ("layout" in block && block.layout === "legacy") {
		return paths.generatedDir;
	}
	return path.join(paths.generatedDir, block.key);
}

/**
 * Resolves the migration rule file path for a block version edge.
 *
 * @param paths Resolved migration project paths.
 * @param block Block target or resolved block target.
 * @param fromVersion Source migration version.
 * @param toVersion Destination migration version.
 * @returns The absolute migration rule file path.
 */
export function getRuleFilePath(
	paths: MigrationProjectPaths,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	fromVersion: string,
	toVersion: string,
): string {
	if ("layout" in block && block.layout === "legacy") {
		return path.join(paths.rulesDir, `${fromVersion}-to-${toVersion}.ts`);
	}
	return path.join(paths.rulesDir, block.key, `${fromVersion}-to-${toVersion}.ts`);
}

/**
 * Resolves the migration fixture path for a block version edge.
 *
 * @param paths Resolved migration project paths.
 * @param block Block target or resolved block target.
 * @param fromVersion Source migration version.
 * @param toVersion Destination migration version.
 * @returns The absolute migration fixture file path.
 */
export function getFixtureFilePath(
	paths: MigrationProjectPaths,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	fromVersion: string,
	toVersion: string,
): string {
	if ("layout" in block && block.layout === "legacy") {
		return path.join(paths.fixturesDir, `${fromVersion}-to-${toVersion}.json`);
	}
	return path.join(paths.fixturesDir, block.key, `${fromVersion}-to-${toVersion}.json`);
}

/**
 * Resolves the validators import path for generated migration artifacts.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param fromDir Directory that will import the validators module.
 * @returns A relative module import path without a file extension.
 */
export function getValidatorsImportPath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	fromDir: string,
): string {
	const validatorPath = path.join(
		projectDir,
		block.typesFile.replace(/types\.ts$/u, "validators.ts"),
	);
	return toImportPath(fromDir, validatorPath, true);
}

/**
 * Ensures the migration fixture, generated, rule, and snapshot directories exist.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param blocks Optional block targets whose scoped rule/fixture directories should be created.
 * @returns Nothing.
 */
export function ensureMigrationDirectories(projectDir: string, blocks?: MigrationBlockConfig[]): void {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(paths.fixturesDir, { recursive: true });
	fs.mkdirSync(paths.generatedDir, { recursive: true });
	fs.mkdirSync(paths.rulesDir, { recursive: true });
	fs.mkdirSync(paths.snapshotDir, { recursive: true });

	if (!Array.isArray(blocks) || blocks.length === 0) {
		return;
	}

	for (const block of blocks) {
		fs.mkdirSync(path.join(paths.fixturesDir, block.key), { recursive: true });
		fs.mkdirSync(path.join(paths.generatedDir, block.key), { recursive: true });
		fs.mkdirSync(path.join(paths.rulesDir, block.key), { recursive: true });
	}
}

/**
 * Discovers the generated migration registry entries for a loaded project state.
 *
 * @param state Loaded migration project state.
 * @returns Sorted migration registry entries for every available block/version edge.
 */
export function discoverMigrationEntries(state: MigrationProjectState): MigrationEntry[] {
	const entries: MigrationEntry[] = [];
	const currentVersion = state.config.currentMigrationVersion;

	for (const block of state.blocks) {
		const generatedDir = getGeneratedDirForBlock(state.paths, block);

		for (const version of state.config.supportedMigrationVersions) {
			if (version === currentVersion) {
				continue;
			}

			const manifestPath = getSnapshotManifestPath(state.projectDir, block, version);
			const blockJsonPath = getSnapshotBlockJsonPath(state.projectDir, block, version);
			const savePath = getSnapshotSavePath(state.projectDir, block, version);
			const rulePath = getRuleFilePath(state.paths, block, version, currentVersion);
			if (
				!fs.existsSync(manifestPath) ||
				!fs.existsSync(blockJsonPath) ||
				!fs.existsSync(savePath) ||
				!fs.existsSync(rulePath)
			) {
				continue;
			}

			entries.push({
				block,
				blockJsonImport: toImportPath(generatedDir, blockJsonPath),
				fixtureImport: toImportPath(
					generatedDir,
					getFixtureFilePath(state.paths, block, version, currentVersion),
				),
				fromVersion: version,
				generatedDir,
				manifestImport: toImportPath(generatedDir, manifestPath),
				ruleImport: toImportPath(generatedDir, rulePath, true),
				rulePath,
				saveImport: toImportPath(generatedDir, savePath, true),
				toVersion: currentVersion,
				validatorImport: getValidatorsImportPath(state.projectDir, block, generatedDir),
			});
		}
	}

	return entries.sort((left, right) => {
		const versionDelta = compareMigrationVersionLabels(right.fromVersion, left.fromVersion);
		if (versionDelta !== 0) {
			return versionDelta;
		}
		return left.block.key.localeCompare(right.block.key);
	});
}

/**
 * Returns the discovered block name for a supported single-block project.
 *
 * Uses `discoverSingleBlockTarget(projectDir)` internally and throws when the
 * project directory does not resolve to a supported single-block migration
 * layout.
 */
export function readProjectBlockName(projectDir: string): string {
	return discoverSingleBlockTarget(projectDir).blockName;
}

/**
 * Verifies that a migration rule file exists and no TODO markers remain in it.
 *
 * @param projectDir Project directory containing the migration workspace.
 * @param block Block target or resolved block target.
 * @param fromMigrationVersion Source migration version.
 * @param toMigrationVersion Destination migration version.
 * @returns Nothing.
 * @throws Error When the rule file is missing or still contains TODO markers.
 */
export function assertRuleHasNoTodos(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	fromMigrationVersion: string,
	toMigrationVersion: string,
): void {
	const rulePath = getRuleFilePath(getProjectPaths(projectDir), block, fromMigrationVersion, toMigrationVersion);
	if (!fs.existsSync(rulePath)) {
		throw new Error(`Missing migration rule: ${path.relative(projectDir, rulePath)}`);
	}
	const source = fs.readFileSync(rulePath, "utf8");
	if (source.includes(MIGRATION_TODO_PREFIX)) {
		throw new Error(`Migration rule still contains ${MIGRATION_TODO_PREFIX} markers: ${path.relative(projectDir, rulePath)}`);
	}
}

/**
 * Reads lightweight metadata from a migration rule source file.
 *
 * @param rulePath Absolute path to the migration rule source file.
 * @returns Parsed unresolved paths, rename mappings, and transform keys.
 */
export function readRuleMetadata(rulePath: string): RuleMetadata {
	const source = fs.readFileSync(rulePath, "utf8");
	const unresolvedBlock = source.match(/export const unresolved = \[([\s\S]*?)\] as const;/);
	const renameMapBlock = source.match(/export const renameMap: RenameMap = \{([\s\S]*?)\};/);
	const transformsBlock = source.match(/export const transforms: TransformMap = \{([\s\S]*?)\};/);

	const unresolved: string[] = unresolvedBlock
		? [...unresolvedBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1])
		: [];
	const renameMap: RuleMetadata["renameMap"] = renameMapBlock
		? [...renameMapBlock[1].matchAll(/^\s*"([^"]+)":\s*"([^"]+)"/gm)].map((match) => ({
			currentPath: match[1],
			legacyPath: match[2],
		}))
		: [];
	const transforms: string[] = transformsBlock
		? [...transformsBlock[1].matchAll(/^\s*"([^"]+)":\s*\(/gm)].map((match) => match[1])
		: [];

	return { renameMap, transforms, unresolved };
}

/**
 * Normalizes a migration block config against the current working directory.
 *
 * @param block Migration block config with project-relative file paths.
 * @returns A normalized migration block config with ensured relative paths.
 */
export function createMigrationBlockConfig(block: MigrationBlockConfig): MigrationBlockConfig {
	return {
		blockJsonFile: ensureRelativePath(process.cwd(), block.blockJsonFile),
		blockName: block.blockName,
		key: block.key,
		manifestFile: ensureRelativePath(process.cwd(), block.manifestFile),
		saveFile: ensureRelativePath(process.cwd(), block.saveFile),
		typesFile: ensureRelativePath(process.cwd(), block.typesFile),
	};
}
