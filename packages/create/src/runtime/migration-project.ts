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
	compareSemver,
	readJson,
	runProjectScriptIfPresent,
} from "./migration-utils.js";
import type {
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

function normalizeRelativePath(value: string): string {
	return value.replace(/\\/g, "/");
}

function ensureRelativePath(projectDir: string, filePath: string): string {
	return normalizeRelativePath(path.relative(projectDir, filePath));
}

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

function hasSingleBlockLayoutFiles(projectDir: string, blockJsonFile: string): boolean {
	return [blockJsonFile, ROOT_SAVE_FILE, ROOT_TYPES_FILE].every((relativePath) =>
		fs.existsSync(path.join(projectDir, relativePath)),
	);
}

function createImplicitLegacyBlock(projectDir: string, blockName?: string): MigrationBlockConfig {
	const discovered = discoverSingleBlockTarget(projectDir);
	return {
		...discovered,
		blockName: blockName ?? discovered.blockName,
		key: DEFAULT_BLOCK_KEY,
	};
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

function discoverSingleBlockTarget(projectDir: string): MigrationBlockConfig {
	const currentHasFiles = hasSingleBlockLayoutFiles(projectDir, SRC_BLOCK_JSON);
	const legacyHasFiles = hasSingleBlockLayoutFiles(projectDir, ROOT_BLOCK_JSON);
	const currentHasManifest = currentHasFiles && fs.existsSync(path.join(projectDir, SRC_MANIFEST));
	const legacyHasManifest = legacyHasFiles && fs.existsSync(path.join(projectDir, ROOT_MANIFEST));

	if (currentHasManifest) {
		return readSingleBlockTarget(projectDir, {
			blockJsonFile: SRC_BLOCK_JSON,
			manifestFile: SRC_MANIFEST,
		})!;
	}
	if (legacyHasManifest) {
		return readSingleBlockTarget(projectDir, {
			blockJsonFile: ROOT_BLOCK_JSON,
			manifestFile: ROOT_MANIFEST,
		})!;
	}
	if (currentHasFiles) {
		return readSingleBlockTarget(projectDir, {
			blockJsonFile: SRC_BLOCK_JSON,
			manifestFile: SRC_MANIFEST,
		})!;
	}
	if (legacyHasFiles) {
		return readSingleBlockTarget(projectDir, {
			blockJsonFile: ROOT_BLOCK_JSON,
			manifestFile: ROOT_MANIFEST,
		})!;
	}

	throw new Error(SINGLE_BLOCK_LAYOUT_NOT_FOUND);
}

function discoverMigrationLayout(projectDir: string): DiscoveredMigrationLayout | null {
	const blocksRoot = path.join(projectDir, "src", "blocks");
	if (fs.existsSync(blocksRoot) && fs.statSync(blocksRoot).isDirectory()) {
		const blockDirectories = fs
			.readdirSync(blocksRoot, { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name);
		const candidateDirectories = blockDirectories.filter((directory) =>
			fs.existsSync(path.join(blocksRoot, directory, "block.json")),
		);

		if (candidateDirectories.length > 0) {
			const blocks = candidateDirectories.map((directory) => {
				const saveFile = path.join("src", "blocks", directory, "save.tsx");
				const typesFile = path.join("src", "blocks", directory, "types.ts");
				const missingFiles = [saveFile, typesFile].filter(
					(relativePath) => !fs.existsSync(path.join(projectDir, relativePath)),
				);
				if (missingFiles.length > 0) {
					throw new Error(
						"Unable to auto-detect a supported migration retrofit layout. " +
							`Detected ${path.join("src", "blocks", directory, "block.json")} but the block target is missing ${missingFiles.join(", ")}. ` +
							"Create `src/migrations/config.ts` manually if your project uses a custom layout.",
					);
				}

				const block = createBlockTarget(projectDir, {
					blockJsonFile: path.join("src", "blocks", directory, "block.json"),
					key: directory,
					manifestFile: path.join("src", "blocks", directory, "typia.manifest.json"),
					saveFile,
					typesFile,
				});
				if (!block) {
					throw new Error(
						"Unable to auto-detect a supported migration retrofit layout. " +
							`Could not read a valid block name from ${path.join("src", "blocks", directory, "block.json")}. ` +
							"Create `src/migrations/config.ts` manually if your project uses a custom layout.",
					);
				}
				return block;
			});

			return {
				blocks: blocks.sort((left, right) => left.key.localeCompare(right.key)),
				mode: "multi",
			};
		}
	}

	try {
		return {
			block: discoverSingleBlockTarget(projectDir),
			mode: "single",
		};
	} catch (error) {
		if (error instanceof Error && error.message === SINGLE_BLOCK_LAYOUT_NOT_FOUND) {
			return null;
		}
		throw error;
	}
}

/**
 * Detects the supported migration retrofit layout for `migrations init`.
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
	const configuredBlocks =
		Array.isArray(config.blocks) && config.blocks.length > 0
			? config.blocks
			: [createImplicitLegacyBlock(projectDir, config.blockName)];

	return configuredBlocks.map((block) => {
		const blockJsonPath = path.join(projectDir, block.blockJsonFile);
		const manifestPath = path.join(projectDir, block.manifestFile);
		const savePath = path.join(projectDir, block.saveFile);
		const typesPath = path.join(projectDir, block.typesFile);
		return {
			...block,
			currentBlockJson: readJson(blockJsonPath),
			currentManifest: readJson(manifestPath),
			layout:
				Array.isArray(config.blocks) && config.blocks.length > 0
					? "multi"
					: "legacy",
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
 * Returns the sorted subset of `supportedVersions` that have a manifest on disk
 * for the provided block, or an empty array when none exist.
 */
export function getAvailableSnapshotVersionsForBlock(
	projectDir: string,
	supportedVersions: string[],
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
): string[] {
	return supportedVersions
		.filter((version) => fs.existsSync(getSnapshotManifestPath(projectDir, block, version)))
		.sort(compareSemver);
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
				`No snapshots exist yet for ${blockName}. Run \`wp-typia migrations snapshot --version ${fromVersion}\` first.`
		: `Snapshot manifest for ${blockName} @ ${fromVersion} does not exist. ` +
				`Available snapshot versions for ${blockName}: ${availableSnapshotVersions.join(", ")}. ` +
				`Run \`wp-typia migrations snapshot --version ${fromVersion}\` first if you want to preserve that release.`;
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
	currentVersion: string,
	blocks?: MigrationBlockConfig[],
): void {
	const paths = getProjectPaths(projectDir);
	const readmeFiles = [
		[path.join(paths.snapshotDir, "README.md"), `# Version Snapshots\n\nSnapshots for ${currentVersion} and future versions live here.\n`],
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

export function loadMigrationProject(
	projectDir: string,
	{ allowMissingConfig = false }: { allowMissingConfig?: boolean } = {},
): MigrationProjectState {
	ensureAdvancedMigrationProject(projectDir);

	const paths = getProjectPaths(projectDir);
	const config: MigrationConfig = allowMissingConfig && !fs.existsSync(paths.configFile)
		? {
			blocks: [createImplicitLegacyBlock(projectDir)],
			currentVersion: "0.0.0",
			snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
			supportedVersions: [],
		}
		: parseMigrationConfig(fs.readFileSync(paths.configFile, "utf8"));
	const configuredBlocks = config.blocks ?? [createImplicitLegacyBlock(projectDir, config.blockName)];
	if (
		configuredBlocks.some(
			(block) => !fs.existsSync(path.join(projectDir, block.manifestFile)),
		)
	) {
		runProjectScriptIfPresent(projectDir, "sync-types");
	}
	const blocks = resolveMigrationBlocks(projectDir, config);

	return {
		blocks,
		config,
		currentBlockJson: blocks[0]?.currentBlockJson ?? readJson(path.join(projectDir, ROOT_BLOCK_JSON)),
		currentManifest: blocks[0]?.currentManifest ?? readJson(path.join(projectDir, ROOT_MANIFEST)),
		paths,
		projectDir,
	};
}

export function discoverMigrationEntries(state: MigrationProjectState): MigrationEntry[] {
	const entries: MigrationEntry[] = [];
	const currentVersion = state.config.currentVersion;

	for (const block of state.blocks) {
		const generatedDir = getGeneratedDirForBlock(state.paths, block);

		for (const version of state.config.supportedVersions) {
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
		const versionDelta = compareSemver(right.fromVersion, left.fromVersion);
		if (versionDelta !== 0) {
			return versionDelta;
		}
		return left.block.key.localeCompare(right.block.key);
	});
}

export function parseMigrationConfig(source: string): MigrationConfig {
	const blockName = matchConfigValue(source, "blockName");
	const currentVersion = matchConfigValue(source, "currentVersion");
	const snapshotDir = matchConfigValue(source, "snapshotDir");
	const supportedVersionsMatch = source.match(/supportedVersions:\s*\[([\s\S]*?)\]/);
	const blocks = parseMigrationBlocks(source);

	if (!currentVersion || !snapshotDir || !supportedVersionsMatch) {
		throw new Error("Unable to parse migration config. Regenerate with `wp-typia migrations init`.");
	}
	if (!blockName && blocks.length === 0) {
		throw new Error("Migration config must define `blockName` or `blocks`.");
	}

	const supportedVersions = supportedVersionsMatch[1]
		.split(",")
		.map((item) => item.trim().replace(/^["']|["']$/g, ""))
		.filter(Boolean)
		.sort(compareSemver);

	return {
		blockName: blockName ?? undefined,
		blocks: blocks.length > 0 ? blocks : undefined,
		currentVersion,
		snapshotDir,
		supportedVersions,
	};
}

function parseMigrationBlocks(source: string): MigrationBlockConfig[] {
	const blocksMatch = source.match(/blocks:\s*\[([\s\S]*?)\]\s*,?\n/u);
	if (!blocksMatch) {
		return [];
	}

	const blockLiterals = [...blocksMatch[1].matchAll(/\{([\s\S]*?)\}/gu)];
	return blockLiterals
		.map((match) => {
			const body = match[1];
			const key = matchConfigValue(body, "key");
			const blockName = matchConfigValue(body, "blockName");
			const blockJsonFile = matchConfigValue(body, "blockJsonFile");
			const manifestFile = matchConfigValue(body, "manifestFile");
			const saveFile = matchConfigValue(body, "saveFile");
			const typesFile = matchConfigValue(body, "typesFile");
			if (!key || !blockName || !blockJsonFile || !manifestFile || !saveFile || !typesFile) {
				return null;
			}
			return {
				blockJsonFile,
				blockName,
				key,
				manifestFile,
				saveFile,
				typesFile,
			} satisfies MigrationBlockConfig;
		})
		.filter((block): block is MigrationBlockConfig => block !== null);
}

function matchConfigValue(source: string, key: string): string | null {
	const pattern = new RegExp(`${key}:\\s*["']([^"']+)["']`);
	return source.match(pattern)?.[1] ?? null;
}

export function writeMigrationConfig(projectDir: string, config: MigrationConfig): void {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(path.dirname(paths.configFile), { recursive: true });
	if (!config.blocks?.length) {
		fs.writeFileSync(
			paths.configFile,
			`export const migrationConfig = {
\tblockName: '${config.blockName ?? readProjectBlockName(projectDir)}',
\tcurrentVersion: '${config.currentVersion}',
\tsupportedVersions: [ ${config.supportedVersions.map((version) => `'${version}'`).join(", ")} ],
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
\tcurrentVersion: '${config.currentVersion}',
\tsupportedVersions: [ ${config.supportedVersions.map((version) => `'${version}'`).join(", ")} ],
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

export function readProjectBlockName(projectDir: string): string {
	return discoverSingleBlockTarget(projectDir).blockName;
}

export function assertRuleHasNoTodos(
	projectDir: string,
	block: MigrationBlockConfig | ResolvedMigrationBlockTarget,
	fromVersion: string,
	toVersion: string,
): void {
	const rulePath = getRuleFilePath(getProjectPaths(projectDir), block, fromVersion, toVersion);
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
