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
	isLegacySemverMigrationVersion,
	readJson,
	runProjectScriptIfPresent,
} from "./migration-utils.js";
import {
	createLegacyMigrationWorkspaceResetError,
	ensureRelativePath,
	hasLegacyConfigKeys,
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
const LEGACY_VERSIONED_EDGE_FILE_PATTERN = /^(\d+\.\d+\.\d+)-to-(\d+\.\d+\.\d+)\.(?:ts|json)$/;
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

function createEmptyMigrationProjectBlockJson(): Record<string, unknown> {
	return {};
}

function createEmptyMigrationProjectManifest(): ManifestDocument {
	return {
		attributes: {},
		manifestVersion: 2,
		sourceType: null,
	};
}

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
export { parseMigrationConfig } from "./migration-project-config-source.js";

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

function createImplicitLegacyBlock(projectDir: string, blockName?: string): MigrationBlockConfig {
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

export function ensureAdvancedMigrationProject(projectDir: string, blocks?: MigrationBlockConfig[]): void {
	const missing = getRequiredProjectFiles(projectDir, blocks).filter(
		(relativePath) => !fs.existsSync(path.join(projectDir, relativePath)),
	);
	if (missing.length > 0) {
		throw new Error(
			`This directory is not a supported migration-capable project. Missing: ${missing.join(", ")}`,
		);
	}
}

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

export function getSnapshotBlockJsonPath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	return path.join(getSnapshotRoot(projectDir, block, version), ROOT_BLOCK_JSON);
}

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

export function getSnapshotSavePath(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	version: string,
): string {
	return path.join(getSnapshotRoot(projectDir, block, version), "save.tsx");
}

export function getGeneratedDirForBlock(
	paths: MigrationProjectPaths,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
): string {
	if ("layout" in block && block.layout === "legacy") {
		return paths.generatedDir;
	}
	return path.join(paths.generatedDir, block.key);
}

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

export function writeInitialMigrationScaffold(
	projectDir: string,
	currentMigrationVersion: string,
	blocks?: MigrationBlockConfig[],
): void {
	const paths = getProjectPaths(projectDir);
	const readmeFiles = [
		[path.join(paths.snapshotDir, "README.md"), `# Migration Version Snapshots\n\nSnapshots for ${currentMigrationVersion} and future migration versions live here.\n`],
		[path.join(paths.rulesDir, "README.md"), "# Migration Rules\n\nScaffold direct legacy-to-current migration rules in this directory.\n"],
		[path.join(paths.fixturesDir, "README.md"), "# Migration Fixtures\n\nGenerated fixtures are used by verify to assert migrations.\n"],
	];

	for (const [targetPath, content] of readmeFiles) {
		if (!fs.existsSync(targetPath)) {
			fs.writeFileSync(targetPath, content, "utf8");
		}
	}

	if (!Array.isArray(blocks) || blocks.length === 0) {
		return;
	}

	for (const block of blocks) {
		const scopedReadmes = [
			[path.join(paths.rulesDir, block.key, "README.md"), `# ${block.blockName} Migration Rules\n\nScaffold direct legacy-to-current migration rules for ${block.blockName} in this directory.\n`],
			[path.join(paths.fixturesDir, block.key, "README.md"), `# ${block.blockName} Migration Fixtures\n\nGenerated fixtures for ${block.blockName} are stored in this directory.\n`],
		];
		for (const [targetPath, content] of scopedReadmes) {
			if (!fs.existsSync(targetPath)) {
				fs.mkdirSync(path.dirname(targetPath), { recursive: true });
				fs.writeFileSync(targetPath, content, "utf8");
			}
		}
	}
}

function findLegacySemverMigrationArtifacts(projectDir: string): string[] {
	const paths = getProjectPaths(projectDir);
	const matches: string[] = [];

	if (fs.existsSync(paths.snapshotDir)) {
		for (const entry of fs.readdirSync(paths.snapshotDir, { withFileTypes: true })) {
			if (entry.isDirectory() && isLegacySemverMigrationVersion(entry.name)) {
				matches.push(normalizeRelativePath(path.join(SNAPSHOT_DIR, entry.name)));
			}
		}
	}

	const scanEdgeDir = (directory: string, relativeRoot: string) => {
		if (!fs.existsSync(directory)) {
			return;
		}

		const walk = (currentDir: string, currentRelativeDir: string) => {
			for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
				if (entry.isDirectory()) {
					walk(path.join(currentDir, entry.name), path.join(currentRelativeDir, entry.name));
					continue;
				}
				if (LEGACY_VERSIONED_EDGE_FILE_PATTERN.test(entry.name)) {
					matches.push(normalizeRelativePath(path.join(currentRelativeDir, entry.name)));
				}
			}
		};

		walk(directory, relativeRoot);
	};

	scanEdgeDir(paths.rulesDir, RULES_DIR);
	scanEdgeDir(paths.fixturesDir, FIXTURES_DIR);

	return matches;
}

/**
 * Guards a project directory against legacy semver-based migration workspaces.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @returns Nothing.
 * @throws Error When legacy config keys or semver-named migration artifacts are detected.
 */
export function assertNoLegacySemverMigrationWorkspace(projectDir: string): void {
	const paths = getProjectPaths(projectDir);
	if (fs.existsSync(paths.configFile)) {
		const source = fs.readFileSync(paths.configFile, "utf8");
		if (hasLegacyConfigKeys(source)) {
			throw createLegacyMigrationWorkspaceResetError(
				"Detected legacy config keys `currentVersion` / `supportedVersions` in `src/migrations/config.ts`.",
			);
		}
	}

	const artifactMatches = findLegacySemverMigrationArtifacts(projectDir);
	if (artifactMatches.length > 0) {
		throw createLegacyMigrationWorkspaceResetError(
			`Detected legacy semver-named migration artifacts: ${artifactMatches.join(", ")}.`,
		);
	}
}

/**
 * Loads the migration workspace state for a project directory.
 *
 * By default this loader may run the project's `sync-types` script when the
 * current manifest files are missing, because later migration commands depend
 * on those generated artifacts. Pass `allowSyncTypes: false` to keep the call
 * read-only and fail instead of mutating the workspace.
 *
 * When `allowMissingConfig` is enabled and the migration config file does not
 * exist yet, the loader synthesizes a minimal legacy-root config so bootstrap
 * flows can continue before the first config write.
 *
 * @param projectDir Absolute or relative project directory containing the migration workspace.
 * @param options Loader flags controlling config fallback and `sync-types` side effects.
 * @returns The resolved migration project state, including config, block targets, and helper paths.
 * @throws Error When the project is not migration-capable, required manifests remain missing, or generated files cannot be read.
 */
export function loadMigrationProject(
	projectDir: string,
	{
		allowMissingConfig = false,
		allowSyncTypes = true,
	}: { allowMissingConfig?: boolean; allowSyncTypes?: boolean } = {},
): MigrationProjectState {
	assertNoLegacySemverMigrationWorkspace(projectDir);
	ensureAdvancedMigrationProject(projectDir);

	const paths = getProjectPaths(projectDir);
	const config: MigrationConfig = allowMissingConfig && !fs.existsSync(paths.configFile)
		? {
			blocks: [createImplicitLegacyBlock(projectDir)],
			currentMigrationVersion: "v1",
			snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
			supportedMigrationVersions: [],
		}
		: parseMigrationConfig(fs.readFileSync(paths.configFile, "utf8"));
	const configuredBlocks =
		config.blocks === undefined ? [createImplicitLegacyBlock(projectDir, config.blockName)] : config.blocks;
	const missingManifestFiles = configuredBlocks
		.filter((block) => !fs.existsSync(path.join(projectDir, block.manifestFile)))
		.map((block) => block.manifestFile);
	if (missingManifestFiles.length > 0) {
		if (!allowSyncTypes) {
			throw new Error(
				"Migration planning is read-only and cannot run `sync-types` automatically. " +
					`Missing current manifest file(s): ${missingManifestFiles.join(", ")}. ` +
					"Run your project's `sync-types` script in the project root first, then rerun the planning command.",
			);
		}
		runProjectScriptIfPresent(projectDir, "sync-types");
		const remainingManifestFiles = configuredBlocks
			.filter((block) => !fs.existsSync(path.join(projectDir, block.manifestFile)))
			.map((block) => block.manifestFile);
		if (remainingManifestFiles.length > 0) {
			throw new Error(
				`Missing current manifest file(s): ${remainingManifestFiles.join(", ")}. ` +
					"Run your project's `sync-types` script in the project root first, then retry.",
			);
		}
	}
	const blocks = resolveMigrationBlocks(projectDir, config);

	return {
		blocks,
		config,
		currentBlockJson:
			blocks[0]?.currentBlockJson ??
			(config.blocks !== undefined
				? createEmptyMigrationProjectBlockJson()
				: readJson(path.join(projectDir, ROOT_BLOCK_JSON))),
		currentManifest:
			blocks[0]?.currentManifest ??
			(config.blocks !== undefined
				? createEmptyMigrationProjectManifest()
				: readJson(path.join(projectDir, ROOT_MANIFEST))),
		paths,
		projectDir,
	};
}

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

export function writeMigrationConfig(projectDir: string, config: MigrationConfig): void {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(path.dirname(paths.configFile), { recursive: true });
	if (!Array.isArray(config.blocks)) {
		fs.writeFileSync(
			paths.configFile,
			`export const migrationConfig = {
\tblockName: '${config.blockName ?? readProjectBlockName(projectDir)}',
\tcurrentMigrationVersion: '${config.currentMigrationVersion}',
\tsupportedMigrationVersions: [ ${config.supportedMigrationVersions.map((version) => `'${version}'`).join(", ")} ],
\tsnapshotDir: '${config.snapshotDir}',
} as const;

export default migrationConfig;
`,
			"utf8",
		);
		return;
	}

	const blocks = config.blocks;
	const blocksSource = blocks
		.map(
			(block) =>
				`\t\t{
\t\t\tkey: '${block.key}',
\t\t\tblockName: '${block.blockName}',
\t\t\tblockJsonFile: '${normalizeRelativePath(block.blockJsonFile)}',
\t\t\tmanifestFile: '${normalizeRelativePath(block.manifestFile)}',
\t\t\tsaveFile: '${normalizeRelativePath(block.saveFile)}',
\t\t\ttypesFile: '${normalizeRelativePath(block.typesFile)}',
\t\t},`,
		)
		.join("\n");
	fs.writeFileSync(
		paths.configFile,
		`export const migrationConfig = {
\tcurrentMigrationVersion: '${config.currentMigrationVersion}',
\tsupportedMigrationVersions: [ ${config.supportedMigrationVersions.map((version) => `'${version}'`).join(", ")} ],
\tsnapshotDir: '${config.snapshotDir}',
\tblocks: [
${blocksSource}
\t],
} as const;

export default migrationConfig;
`,
		"utf8",
	);
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
