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
	RULES_DIR,
	SNAPSHOT_DIR,
	SUPPORTED_PROJECT_FILES,
} from "./migration-constants.js";
import {
	compareSemver,
	readJson,
	runProjectScriptIfPresent,
} from "./migration-utils.js";
import type {
	MigrationConfig,
	MigrationEntry,
	MigrationProjectPaths,
	MigrationProjectState,
	RuleMetadata,
} from "./migration-types.js";

export function ensureAdvancedMigrationProject(projectDir: string): void {
	const missing = SUPPORTED_PROJECT_FILES.filter((relativePath) => !fs.existsSync(path.join(projectDir, relativePath)));
	if (missing.length > 0) {
		throw new Error(
			`This directory is not a supported advanced migration project. Missing: ${missing.join(", ")}`,
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

export function ensureMigrationDirectories(projectDir: string): void {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(paths.fixturesDir, { recursive: true });
	fs.mkdirSync(paths.generatedDir, { recursive: true });
	fs.mkdirSync(paths.rulesDir, { recursive: true });
	fs.mkdirSync(paths.snapshotDir, { recursive: true });
}

export function writeInitialMigrationScaffold(projectDir: string, currentVersion: string): void {
	const paths = getProjectPaths(projectDir);
	const readmeFiles = [
		[path.join(paths.snapshotDir, "README.md"), `# Version Snapshots\n\nSnapshots for ${currentVersion} and future versions live here.\n`],
		[path.join(paths.rulesDir, "README.md"), `# Migration Rules\n\nScaffold direct legacy-to-current migration rules in this directory.\n`],
		[path.join(paths.fixturesDir, "README.md"), `# Migration Fixtures\n\nGenerated fixtures are used by verify to assert migrations.\n`],
	];

	for (const [targetPath, content] of readmeFiles) {
		if (!fs.existsSync(targetPath)) {
			fs.writeFileSync(targetPath, content, "utf8");
		}
	}
}

export function loadMigrationProject(
	projectDir: string,
	{ allowMissingConfig = false }: { allowMissingConfig?: boolean } = {},
): MigrationProjectState {
	ensureAdvancedMigrationProject(projectDir);
	if (!fs.existsSync(path.join(projectDir, ROOT_MANIFEST))) {
		runProjectScriptIfPresent(projectDir, "sync-types");
	}

	const paths = getProjectPaths(projectDir);
	const config: MigrationConfig = allowMissingConfig && !fs.existsSync(paths.configFile)
		? {
			blockName: readProjectBlockName(projectDir),
			currentVersion: "0.0.0",
			snapshotDir: SNAPSHOT_DIR.replace(/\\/g, "/"),
			supportedVersions: [],
		}
		: parseMigrationConfig(fs.readFileSync(paths.configFile, "utf8"));

	return {
		config,
		currentBlockJson: readJson(path.join(projectDir, ROOT_BLOCK_JSON)),
		currentManifest: readJson(path.join(projectDir, ROOT_MANIFEST)),
		paths,
		projectDir,
	};
}

export function discoverMigrationEntries(state: MigrationProjectState): MigrationEntry[] {
	const entries: MigrationEntry[] = [];
	const currentVersion = state.config.currentVersion;

	for (const version of state.config.supportedVersions) {
		if (version === currentVersion) {
			continue;
		}

		const snapshotRoot = path.join(state.projectDir, SNAPSHOT_DIR, version);
		const manifestPath = path.join(snapshotRoot, ROOT_MANIFEST);
		const blockJsonPath = path.join(snapshotRoot, ROOT_BLOCK_JSON);
		const savePath = path.join(snapshotRoot, "save.tsx");
		const rulePath = getRuleFilePath(state.paths, version, currentVersion);

		if (
			fs.existsSync(manifestPath) &&
			fs.existsSync(blockJsonPath) &&
			fs.existsSync(savePath) &&
			fs.existsSync(rulePath)
		) {
			entries.push({
				blockJsonImport: `../versions/${version}/block.json`,
				fixtureImport: `../fixtures/${version}-to-${currentVersion}.json`,
				fromVersion: version,
				manifestImport: `../versions/${version}/typia.manifest.json`,
				ruleImport: `../rules/${version}-to-${currentVersion}`,
				rulePath,
				saveImport: `../versions/${version}/save`,
				toVersion: currentVersion,
			});
		}
	}

	return entries.sort((left, right) => compareSemver(right.fromVersion, left.fromVersion));
}

export function parseMigrationConfig(source: string): MigrationConfig {
	const blockName = matchConfigValue(source, "blockName");
	const currentVersion = matchConfigValue(source, "currentVersion");
	const snapshotDir = matchConfigValue(source, "snapshotDir");
	const supportedVersionsMatch = source.match(/supportedVersions:\s*\[([\s\S]*?)\]/);

	if (!blockName || !currentVersion || !snapshotDir || !supportedVersionsMatch) {
		throw new Error("Unable to parse migration config. Regenerate with `create-wp-typia migrations init`.");
	}

	const supportedVersions = supportedVersionsMatch[1]
		.split(",")
		.map((item) => item.trim().replace(/^["']|["']$/g, ""))
		.filter(Boolean)
		.sort(compareSemver);

	return {
		blockName,
		currentVersion,
		snapshotDir,
		supportedVersions,
	};
}

function matchConfigValue(source: string, key: string): string | null {
	return source.match(new RegExp(`${key}:\\s*"([^"]+)"`))?.[1] ?? null;
}

export function writeMigrationConfig(projectDir: string, config: MigrationConfig): void {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(path.dirname(paths.configFile), { recursive: true });
	fs.writeFileSync(
		paths.configFile,
		`export const migrationConfig = {
	blockName: "${config.blockName}",
	currentVersion: "${config.currentVersion}",
	supportedVersions: [${config.supportedVersions.map((version) => `"${version}"`).join(", ")}],
	snapshotDir: "${config.snapshotDir}",
} as const;

export default migrationConfig;
`,
		"utf8",
	);
}

export function readProjectBlockName(projectDir: string): string {
	const blockJson = readJson<{ name?: string }>(path.join(projectDir, ROOT_BLOCK_JSON));
	const blockName = blockJson?.name;
	if (typeof blockName !== "string" || blockName.length === 0) {
		throw new Error("Unable to resolve block name from block.json");
	}
	return blockName;
}

export function assertRuleHasNoTodos(projectDir: string, fromVersion: string, toVersion: string): void {
	const rulePath = getRuleFilePath(getProjectPaths(projectDir), fromVersion, toVersion);
	if (!fs.existsSync(rulePath)) {
		throw new Error(`Missing migration rule: ${path.relative(projectDir, rulePath)}`);
	}
	const source = fs.readFileSync(rulePath, "utf8");
	if (source.includes(MIGRATION_TODO_PREFIX)) {
		throw new Error(`Migration rule still contains ${MIGRATION_TODO_PREFIX} markers: ${path.relative(projectDir, rulePath)}`);
	}
}

export function getRuleFilePath(paths: MigrationProjectPaths, fromVersion: string, toVersion: string): string {
	return path.join(paths.rulesDir, `${fromVersion}-to-${toVersion}.ts`);
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
