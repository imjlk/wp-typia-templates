import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

import { formatRunScript } from "./package-managers.js";

const ROOT_BLOCK_JSON = "block.json";
const ROOT_MANIFEST = "typia.manifest.json";
const ROOT_SAVE_FILE = path.join("src", "save.tsx");
const ROOT_TYPES_FILE = path.join("src", "types.ts");
const MIGRATIONS_DIR = path.join("src", "migrations");
const CONFIG_FILE = path.join(MIGRATIONS_DIR, "config.ts");
const GENERATED_DIR = path.join(MIGRATIONS_DIR, "generated");
const FIXTURES_DIR = path.join(MIGRATIONS_DIR, "fixtures");
const RULES_DIR = path.join(MIGRATIONS_DIR, "rules");
const SNAPSHOT_DIR = path.join(MIGRATIONS_DIR, "versions");
const SUPPORTED_PROJECT_FILES = ["package.json", ROOT_BLOCK_JSON, ROOT_SAVE_FILE, ROOT_TYPES_FILE];
const MIGRATION_TODO_PREFIX = "TODO MIGRATION:";

export function formatMigrationHelpText() {
	return `Usage:
  create-wp-typia migrations init --current-version <semver>
  create-wp-typia migrations snapshot --version <semver>
  create-wp-typia migrations diff --from <semver> [--to current]
  create-wp-typia migrations scaffold --from <semver> [--to current]
  create-wp-typia migrations verify [--from <semver>|--all]`;
}

export function parseMigrationArgs(argv) {
	const parsed = {
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

		if (arg === "--") {
			continue;
		}
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

export function formatDiffReport(diff) {
	const lines = [
		`Migration diff: ${diff.fromVersion} -> ${diff.toVersion}`,
		`Current type: ${diff.currentTypeName}`,
		`Safe changes: ${diff.summary.auto}`,
		`Manual changes: ${diff.summary.manual}`,
	];

	if (diff.summary.autoItems.length > 0) {
		lines.push("", "Safe changes:");
		for (const item of diff.summary.autoItems) {
			lines.push(`  - ${item.path}: ${item.kind}${item.detail ? ` (${item.detail})` : ""}`);
		}
	}

	if (diff.summary.manualItems.length > 0) {
		lines.push("", "Manual review required:");
		for (const item of diff.summary.manualItems) {
			lines.push(`  - ${item.path}: ${item.kind}${item.detail ? ` (${item.detail})` : ""}`);
		}
	}

	return lines.join("\n");
}

export function runMigrationCommand(command, cwd, { renderLine = console.log } = {}) {
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

export function initProjectMigrations(projectDir, currentVersion, { renderLine = console.log } = {}) {
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
	projectDir,
	version,
	{ renderLine = console.log, skipConfigUpdate = false } = {},
) {
	ensureAdvancedMigrationProject(projectDir);
	assertSemver(version, "snapshot version");
	runProjectScriptIfPresent(projectDir, "sync-types");

	const state = loadMigrationProject(projectDir, { allowMissingConfig: skipConfigUpdate });
	const snapshotRoot = path.join(projectDir, SNAPSHOT_DIR, version);
	fs.mkdirSync(snapshotRoot, { recursive: true });

	fs.writeFileSync(
		path.join(snapshotRoot, ROOT_BLOCK_JSON),
		`${JSON.stringify(sanitizeSnapshotBlockJson(readJson(path.join(projectDir, ROOT_BLOCK_JSON))), null, "\t")}\n`,
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
	projectDir,
	{ fromVersion, toVersion = "current", renderLine = console.log } = {},
) {
	const state = loadMigrationProject(projectDir);
	const targetVersion = resolveTargetVersion(state.config.currentVersion, toVersion);
	const diff = createMigrationDiff(state, fromVersion, targetVersion);
	renderLine(formatDiffReport(diff));
	return diff;
}

export function scaffoldProjectMigrations(
	projectDir,
	{ fromVersion, toVersion = "current", renderLine = console.log } = {},
) {
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

	ensureFixtureFile(projectDir, fromVersion);
	regenerateGeneratedArtifacts(projectDir);

	renderLine(formatDiffReport(diff));
	renderLine(`Scaffolded ${path.relative(projectDir, rulePath)}`);
	return {
		diff,
		rulePath,
	};
}

export function verifyProjectMigrations(
	projectDir,
	{ all = false, fromVersion, renderLine = console.log } = {},
) {
	const state = loadMigrationProject(projectDir);
	const verifyScriptPath = path.join(projectDir, GENERATED_DIR, "verify.ts");

	if (!fs.existsSync(verifyScriptPath)) {
		throw new Error("Generated verify script is missing. Run `create-wp-typia migrations scaffold --from <semver>` first.");
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
	return {
		verifiedVersions: targetVersions,
	};
}

function ensureAdvancedMigrationProject(projectDir) {
	const missing = SUPPORTED_PROJECT_FILES.filter((relativePath) => !fs.existsSync(path.join(projectDir, relativePath)));
	if (missing.length > 0) {
		throw new Error(
			`This directory is not a supported advanced migration project. Missing: ${missing.join(", ")}`,
		);
	}
}

function getProjectPaths(projectDir) {
	return {
		configFile: path.join(projectDir, CONFIG_FILE),
		fixturesDir: path.join(projectDir, FIXTURES_DIR),
		generatedDir: path.join(projectDir, GENERATED_DIR),
		rulesDir: path.join(projectDir, RULES_DIR),
		snapshotDir: path.join(projectDir, SNAPSHOT_DIR),
	};
}

function ensureMigrationDirectories(projectDir) {
	const paths = getProjectPaths(projectDir);
	fs.mkdirSync(paths.fixturesDir, { recursive: true });
	fs.mkdirSync(paths.generatedDir, { recursive: true });
	fs.mkdirSync(paths.rulesDir, { recursive: true });
	fs.mkdirSync(paths.snapshotDir, { recursive: true });
}

function writeInitialMigrationScaffold(projectDir, currentVersion) {
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

function loadMigrationProject(projectDir, { allowMissingConfig = false } = {}) {
	ensureAdvancedMigrationProject(projectDir);
	if (!fs.existsSync(path.join(projectDir, ROOT_MANIFEST))) {
		runProjectScriptIfPresent(projectDir, "sync-types");
	}

	const paths = getProjectPaths(projectDir);
	const config = allowMissingConfig && !fs.existsSync(paths.configFile)
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

function regenerateGeneratedArtifacts(projectDir) {
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
}

function discoverMigrationEntries(state) {
	const entries = [];
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
				fixtureImport: `../fixtures/${version}.json`,
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

function parseMigrationConfig(source) {
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

function matchConfigValue(source, key) {
	return source.match(new RegExp(`${key}:\\s*"([^"]+)"`))?.[1] ?? null;
}

function writeMigrationConfig(projectDir, config) {
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

function readProjectBlockName(projectDir) {
	const blockJson = readJson(path.join(projectDir, ROOT_BLOCK_JSON));
	const blockName = blockJson?.name;
	if (typeof blockName !== "string" || blockName.length === 0) {
		throw new Error("Unable to resolve block name from block.json");
	}
	return blockName;
}

function createMigrationDiff(state, fromVersion, toVersion) {
	const snapshotManifestPath = path.join(state.projectDir, SNAPSHOT_DIR, fromVersion, ROOT_MANIFEST);
	if (!fs.existsSync(snapshotManifestPath)) {
		throw new Error(`Snapshot manifest for ${fromVersion} does not exist. Run \`migrations snapshot --version ${fromVersion}\` first.`);
	}

	const targetManifest = toVersion === state.config.currentVersion
		? state.currentManifest
		: readJson(path.join(state.projectDir, SNAPSHOT_DIR, toVersion, ROOT_MANIFEST));

	if (!targetManifest) {
		throw new Error(`Unable to load target manifest for ${toVersion}`);
	}

	const oldManifest = readJson(snapshotManifestPath);
	const oldAttributes = oldManifest.attributes ?? {};
	const newAttributes = targetManifest.attributes ?? {};
	const autoItems = [];
	const manualItems = [];

	for (const [key, newAttribute] of Object.entries(newAttributes)) {
		const oldAttribute = oldAttributes[key];

		if (!oldAttribute) {
			if (newAttribute.ts.required && newAttribute.typia.default == null) {
				manualItems.push({
					detail: "required field has no default in current schema",
					kind: "required-addition",
					path: key,
				});
			} else {
				autoItems.push({
					detail: newAttribute.typia.default != null ? `default ${JSON.stringify(newAttribute.typia.default)}` : "optional addition",
					kind: newAttribute.typia.default != null ? "add-default" : "add-optional",
					path: key,
				});
			}
			continue;
		}

		const outcome = compareManifestAttribute(oldAttribute, newAttribute, key);
		if (outcome.status === "manual") {
			manualItems.push(outcome);
		} else {
			autoItems.push(outcome);
		}
	}

	for (const key of Object.keys(oldAttributes)) {
		if (!(key in newAttributes)) {
			autoItems.push({
				detail: "field removed from current schema",
				kind: "drop",
				path: key,
			});
		}
	}

	return {
		currentTypeName: targetManifest.sourceType ?? state.currentManifest.sourceType,
		fromVersion,
		summary: {
			auto: autoItems.length,
			autoItems,
			manual: manualItems.length,
			manualItems,
		},
		toVersion,
	};
}

function compareManifestAttribute(oldAttribute, newAttribute, attributePath) {
	if (oldAttribute.ts.kind !== newAttribute.ts.kind) {
		return manualOutcome(attributePath, "type-change", `${oldAttribute.ts.kind} -> ${newAttribute.ts.kind}`);
	}

	if (oldAttribute.ts.kind === "object") {
		return compareObjectAttribute(oldAttribute, newAttribute, attributePath);
	}

	if (oldAttribute.ts.kind === "array") {
		if (!oldAttribute.ts.items || !newAttribute.ts.items) {
			return autoOutcome(attributePath, "copy", "array shape unchanged");
		}
		const nested = compareManifestAttribute(
			oldAttribute.ts.items,
			newAttribute.ts.items,
			`${attributePath}[]`,
		);
		return nested.status === "manual"
			? manualOutcome(attributePath, "array-change", nested.detail)
			: autoOutcome(attributePath, "hydrate", "array items can be normalized");
	}

	if (hasStricterConstraints(oldAttribute, newAttribute)) {
		return manualOutcome(attributePath, "stricter-constraints", describeConstraintChange(oldAttribute, newAttribute));
	}

	return autoOutcome(attributePath, "copy", "compatible primitive field");
}

function compareObjectAttribute(oldAttribute, newAttribute, attributePath) {
	const oldProperties = oldAttribute.ts.properties ?? {};
	const newProperties = newAttribute.ts.properties ?? {};

	for (const [key, nextProperty] of Object.entries(newProperties)) {
		const previousProperty = oldProperties[key];
		if (!previousProperty) {
			if (nextProperty.ts.required && nextProperty.typia.default == null) {
				return manualOutcome(
					attributePath,
					"object-change",
					`nested required field ${attributePath}.${key} has no default`,
				);
			}
			continue;
		}

		const nested = compareManifestAttribute(previousProperty, nextProperty, `${attributePath}.${key}`);
		if (nested.status === "manual") {
			return manualOutcome(attributePath, "object-change", nested.detail);
		}
	}

	return autoOutcome(attributePath, "hydrate", "object can be normalized with current manifest defaults");
}

function hasStricterConstraints(oldAttribute, newAttribute) {
	const oldConstraints = oldAttribute.typia.constraints;
	const nextConstraints = newAttribute.typia.constraints;
	const oldEnum = oldAttribute.wp.enum ?? null;
	const nextEnum = newAttribute.wp.enum ?? null;

	if (nextEnum && (!oldEnum || !oldEnum.every((value) => nextEnum.includes(value)))) {
		return true;
	}
	if (isNumber(nextConstraints.minLength) && (!isNumber(oldConstraints.minLength) || nextConstraints.minLength > oldConstraints.minLength)) {
		return true;
	}
	if (isNumber(nextConstraints.maxLength) && (!isNumber(oldConstraints.maxLength) || nextConstraints.maxLength < oldConstraints.maxLength)) {
		return true;
	}
	if (isNumber(nextConstraints.minimum) && (!isNumber(oldConstraints.minimum) || nextConstraints.minimum > oldConstraints.minimum)) {
		return true;
	}
	if (isNumber(nextConstraints.maximum) && (!isNumber(oldConstraints.maximum) || nextConstraints.maximum < oldConstraints.maximum)) {
		return true;
	}
	if (nextConstraints.pattern && nextConstraints.pattern !== oldConstraints.pattern) {
		return true;
	}
	if (nextConstraints.format && nextConstraints.format !== oldConstraints.format) {
		return true;
	}
	if (nextConstraints.typeTag && nextConstraints.typeTag !== oldConstraints.typeTag) {
		return true;
	}

	return false;
}

function describeConstraintChange(oldAttribute, newAttribute) {
	const details = [];
	const oldConstraints = oldAttribute.typia.constraints;
	const nextConstraints = newAttribute.typia.constraints;

	if (newAttribute.wp.enum && JSON.stringify(newAttribute.wp.enum) !== JSON.stringify(oldAttribute.wp.enum)) {
		details.push("enum changed");
	}
	for (const key of ["minLength", "maxLength", "minimum", "maximum", "pattern", "format", "typeTag"]) {
		if (oldConstraints[key] !== nextConstraints[key]) {
			details.push(`${key}: ${oldConstraints[key]} -> ${nextConstraints[key]}`);
		}
	}

	return details.join(", ");
}

function autoOutcome(pathLabel, kind, detail) {
	return {
		detail,
		kind,
		path: pathLabel,
		status: "auto",
	};
}

function manualOutcome(pathLabel, kind, detail) {
	return {
		detail,
		kind,
		path: pathLabel,
		status: "manual",
	};
}

function renderMigrationRuleFile({ currentAttributes, currentTypeName, diff, fromVersion, targetVersion }) {
	const lines = [];
	lines.push(`import type { ${currentTypeName} } from "../../types";`);
	lines.push(`import currentManifest from "../../../${ROOT_MANIFEST}";`);
	lines.push(`import { coerceValueFromManifest } from "../helpers";`);
	lines.push("");
	lines.push(`export const fromVersion = "${fromVersion}" as const;`);
	lines.push(`export const toVersion = "${targetVersion}" as const;`);
	lines.push("");
	lines.push("export const unresolved = [");
	for (const item of diff.summary.manualItems) {
		lines.push(`\t"${item.path}: ${item.kind}${item.detail ? ` (${escapeForCode(item.detail)})` : ""}",`);
	}
	lines.push("] as const;");
	lines.push("");
	lines.push(`export function migrate(input: Record<string, unknown>): ${currentTypeName} {`);
	lines.push(`\treturn {`);

	for (const key of Object.keys(currentAttributes)) {
		const autoItem = diff.summary.autoItems.find((item) => item.path === key);
		const manualItem = diff.summary.manualItems.find((item) => item.path === key);

		if (autoItem && autoItem.kind !== "drop") {
			lines.push(
				`\t\t${key}: coerceValueFromManifest(currentManifest.attributes.${key}, input.${key}),`,
			);
			continue;
		}

		if (manualItem) {
			lines.push(`\t\t// ${MIGRATION_TODO_PREFIX} ${manualItem.path}: ${manualItem.kind}${manualItem.detail ? ` (${manualItem.detail})` : ""}`);
			lines.push(`\t\t${key}: coerceValueFromManifest(currentManifest.attributes.${key}, undefined),`);
			continue;
		}

		lines.push(`\t\t${key}: coerceValueFromManifest(currentManifest.attributes.${key}, undefined),`);
	}

	lines.push(`\t} as ${currentTypeName};`);
	lines.push("}");
	lines.push("");
	return `${lines.join("\n")}\n`;
}

function renderMigrationRegistryFile(state, entries) {
	const imports = [
		`import currentManifest from "../../../${ROOT_MANIFEST}";`,
	];
	const body = [];

	entries.forEach((entry, index) => {
		imports.push(`import manifest_${index} from "${entry.manifestImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		body.push(`\t{`);
		body.push(`\t\tfromVersion: "${entry.fromVersion}",`);
		body.push(`\t\tmanifest: manifest_${index},`);
		body.push(`\t\trule: rule_${index},`);
		body.push(`\t},`);
	});

	return `${imports.join("\n")}

export const migrationRegistry = {
	currentVersion: "${state.config.currentVersion}",
	currentManifest,
	entries: [
${body.join("\n")}
	],
} as const;

export default migrationRegistry;
`;
}

function renderGeneratedDeprecatedFile(entries) {
	if (entries.length === 0) {
		return `import type { BlockConfiguration } from "@wordpress/blocks";

export const deprecated: NonNullable<BlockConfiguration["deprecated"]> = [];
`;
	}

	const imports = [`import type { BlockConfiguration } from "@wordpress/blocks";`];
	const definitions = [];
	const arrayEntries = [];

	entries.forEach((entry, index) => {
		imports.push(`import block_${index} from "${entry.blockJsonImport}";`);
		imports.push(`import save_${index} from "${entry.saveImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		definitions.push(`const deprecated_${index}: NonNullable<BlockConfiguration["deprecated"]>[number] = {`);
		definitions.push(`\tattributes: (block_${index}.attributes ?? {}) as Record<string, unknown>,`);
		definitions.push(`\tsave: save_${index} as BlockConfiguration["save"],`);
		definitions.push(`\tmigrate(attributes: Record<string, unknown>) {`);
		definitions.push(`\t\treturn rule_${index}.migrate(attributes);`);
		definitions.push(`\t},`);
		definitions.push(`};`);
		arrayEntries.push(`deprecated_${index}`);
	});

	return `${imports.join("\n")}

${definitions.join("\n\n")}

export const deprecated: NonNullable<BlockConfiguration["deprecated"]> = [${arrayEntries.join(", ")}];
`;
}

function renderVerifyFile(state, entries) {
	const imports = [
		`import { validators } from "../../validators";`,
		`import { deprecated } from "./deprecated";`,
	];
	const checks = [];

	entries.forEach((entry, index) => {
		imports.push(`import fixture_${index} from "${entry.fixtureImport}";`);
		imports.push(`import * as rule_${index} from "${entry.ruleImport}";`);
		checks.push(`\tif (selectedVersions.length === 0 || selectedVersions.includes("${entry.fromVersion}")) {`);
		checks.push(`\t\tif (rule_${index}.unresolved.length > 0) {`);
		checks.push(`\t\t\tthrow new Error("Unresolved migration TODOs remain for ${entry.fromVersion} -> ${entry.toVersion}: " + rule_${index}.unresolved.join(", "));`);
		checks.push(`\t\t}`);
		checks.push(`\t\tconst migrated_${index} = rule_${index}.migrate(fixture_${index});`);
		checks.push(`\t\tconst validation_${index} = validators.validate(migrated_${index});`);
		checks.push(`\t\tif (!validation_${index}.success) {`);
		checks.push(`\t\t\tthrow new Error("Current validator rejected migrated fixture for ${entry.fromVersion}: " + JSON.stringify(validation_${index}.errors));`);
		checks.push(`\t\t}`);
		checks.push(`\t\tconsole.log("Verified ${entry.fromVersion} -> ${entry.toVersion}");`);
		checks.push(`\t}`);
	});

	return `${imports.join("\n")}

const args = process.argv.slice(2);
const selectedVersions =
	args[0] === "--all"
		? []
		: args[0] === "--from" && args[1]
			? [args[1]]
			: [];

if (deprecated.length !== ${entries.length}) {
	throw new Error("Generated deprecated entries are out of sync with migration registry.");
}

${checks.join("\n")}

console.log("Migration verification passed for ${state.config.blockName}");
`;
}

function ensureFixtureFile(projectDir, version) {
	const fixturePath = path.join(projectDir, FIXTURES_DIR, `${version}.json`);
	if (fs.existsSync(fixturePath)) {
		return;
	}

	const manifest = readJson(path.join(projectDir, SNAPSHOT_DIR, version, ROOT_MANIFEST));
	const attributes = {};
	for (const [key, attribute] of Object.entries(manifest.attributes ?? {})) {
		attributes[key] = defaultValueForManifestAttribute(attribute);
	}
	fs.writeFileSync(fixturePath, `${JSON.stringify(attributes, null, "\t")}\n`, "utf8");
}

function defaultValueForManifestAttribute(attribute) {
	if (attribute.typia.default != null) {
		return attribute.typia.default;
	}
	switch (attribute.ts.kind) {
		case "string":
			return "";
		case "number":
			return 0;
		case "boolean":
			return false;
		case "array":
			return [];
		case "object": {
			const result = {};
			for (const [key, property] of Object.entries(attribute.ts.properties ?? {})) {
				result[key] = defaultValueForManifestAttribute(property);
			}
			return result;
		}
		default:
			return null;
	}
}

function assertRuleHasNoTodos(projectDir, fromVersion, toVersion) {
	const rulePath = getRuleFilePath(getProjectPaths(projectDir), fromVersion, toVersion);
	if (!fs.existsSync(rulePath)) {
		throw new Error(`Missing migration rule: ${path.relative(projectDir, rulePath)}`);
	}
	const source = fs.readFileSync(rulePath, "utf8");
	if (source.includes(MIGRATION_TODO_PREFIX)) {
		throw new Error(`Migration rule still contains ${MIGRATION_TODO_PREFIX} markers: ${path.relative(projectDir, rulePath)}`);
	}
}

function getRuleFilePath(paths, fromVersion, toVersion) {
	return path.join(paths.rulesDir, `${fromVersion}-to-${toVersion}.ts`);
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function copyFile(sourcePath, targetPath) {
	fs.mkdirSync(path.dirname(targetPath), { recursive: true });
	fs.copyFileSync(sourcePath, targetPath);
}

function sanitizeSaveSnapshotSource(source) {
	return source
		.replace(/^import\s+\{[^}]+\}\s+from\s+['"]\.\/types['"];?\n?/gm, "")
		.replace(/^interface\s+SaveProps\s*\{[\s\S]*?\}\n?/m, "")
		.replace(/: SaveProps/g, ": { attributes: any }")
		.replace(/attributes:\s*[A-Za-z0-9_<>{}\[\]|&,\s]+;/g, "attributes: any;")
		.replace(/\(\{\s*attributes\s*\}:\s*\{\s*attributes:\s*any\s*\}\)/g, "({ attributes }: { attributes: any })");
}

function sanitizeSnapshotBlockJson(blockJson) {
	const snapshot = { ...blockJson };
	for (const key of [
		"editorScript",
		"script",
		"scriptModule",
		"viewScript",
		"viewScriptModule",
		"style",
		"editorStyle",
		"render",
	]) {
		delete snapshot[key];
	}
	return snapshot;
}

function runProjectScriptIfPresent(projectDir, scriptName) {
	const packageJson = readJson(path.join(projectDir, "package.json"));
	if (!packageJson.scripts?.[scriptName]) {
		return;
	}

	const packageManagerId = detectPackageManagerId(projectDir);
	execSync(formatRunScript(packageManagerId, scriptName), {
		cwd: projectDir,
		stdio: "inherit",
	});
}

function detectPackageManagerId(projectDir) {
	const packageJson = readJson(path.join(projectDir, "package.json"));
	const field = String(packageJson.packageManager ?? "");

	if (field.startsWith("bun@")) return "bun";
	if (field.startsWith("npm@")) return "npm";
	if (field.startsWith("pnpm@")) return "pnpm";
	if (field.startsWith("yarn@")) return "yarn";
	return "bun";
}

function getLocalTsxBinary(projectDir) {
	const filename = process.platform === "win32" ? "tsx.cmd" : "tsx";
	const binaryPath = path.join(projectDir, "node_modules", ".bin", filename);

	if (!fs.existsSync(binaryPath)) {
		throw new Error("Local tsx binary was not found. Install project dependencies before running migration verification.");
	}

	return binaryPath;
}

function resolveTargetVersion(currentVersion, value) {
	return value === "current" ? currentVersion : value;
}

function assertSemver(value, label) {
	if (!/^\d+\.\d+\.\d+$/.test(value)) {
		throw new Error(`Invalid ${label}: ${value}. Expected x.y.z`);
	}
}

function compareSemver(left, right) {
	const leftParts = left.split(".").map((part) => Number.parseInt(part, 10));
	const rightParts = right.split(".").map((part) => Number.parseInt(part, 10));

	for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
		const delta = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
		if (delta !== 0) {
			return delta;
		}
	}

	return 0;
}

function escapeForCode(value) {
	return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function isNumber(value) {
	return typeof value === "number" && Number.isFinite(value);
}
