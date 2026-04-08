import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { runUtf8Command } from "../../../tests/helpers/process-utils";
import { writeJsonFile, writeTextFile } from "../../../tests/helpers/file-fixtures";
import type { ReadlinePrompt } from "../src/runtime/cli-prompt.js";
import { createMigrationDiff } from "../src/runtime/migration-diff.js";
import { parseMigrationArgs } from "../src/runtime/index.js";
import {
	fixturesProjectMigrations,
	initProjectMigrations,
	planProjectMigrations,
	runMigrationCommand,
	snapshotProjectVersion,
	wizardProjectMigrations,
} from "../src/runtime/migrations.js";
import { loadMigrationProject, parseMigrationConfig } from "../src/runtime/migration-project.js";
import { createMigrationRiskSummary } from "../src/runtime/migration-risk.js";

const packageRoot = resolvePackageRoot();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-migrations-"));
const entryPath = resolveCliEntryPath();
const repoTsxPath = resolveRepoTsxBinary();

function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof runUtf8Command>[2] = {},
) {
	return runUtf8Command(command, args, options);
}

function writeFile(filePath: string, contents: string) {
	writeTextFile(filePath, contents);
}

function writeJson(filePath: string, value: unknown) {
	writeJsonFile(filePath, value, "\t");
}

function resolveRepoTsxBinary() {
	const candidates = [
		path.resolve(packageRoot, "node_modules/.bin/tsx"),
		path.resolve(packageRoot, "node_modules/.bun/tsx@4.21.0/node_modules/.bin/tsx"),
		path.resolve(packageRoot, "../../node_modules/.bin/tsx"),
		path.resolve(packageRoot, "../../node_modules/.bun/tsx@4.21.0/node_modules/.bin/tsx"),
	];

	const resolved = candidates.find((candidate) => fs.existsSync(candidate));
	if (!resolved) {
		throw new Error("Unable to locate a repo tsx binary for migration verification tests.");
	}

	return resolved;
}

function resolvePackageRoot() {
	const cwd = process.cwd();
	const directPackageRoot = path.join(cwd, "package.json");
	if (fs.existsSync(directPackageRoot) && fs.existsSync(path.join(cwd, "src", "runtime"))) {
		return cwd;
	}

	const nestedPackageRoot = path.join(cwd, "packages", "wp-typia-project-tools");
	if (
		fs.existsSync(path.join(nestedPackageRoot, "package.json")) &&
		fs.existsSync(path.join(nestedPackageRoot, "src", "runtime"))
	) {
		return nestedPackageRoot;
	}

	throw new Error("Unable to resolve the @wp-typia/project-tools package root for migration tests.");
}

function resolveCliEntryPath() {
	const cliPath = path.resolve(packageRoot, "..", "wp-typia", "bin", "wp-typia.js");
	const createRuntimeIndexPath = path.join(packageRoot, "dist", "runtime", "index.js");
	if (fs.existsSync(cliPath) && fs.existsSync(createRuntimeIndexPath)) {
		return cliPath;
	}

	execFileSync("bun", ["run", "build"], {
		cwd: packageRoot,
		stdio: "inherit",
	});

	if (!fs.existsSync(cliPath) || !fs.existsSync(createRuntimeIndexPath)) {
		throw new Error("Unable to resolve the canonical wp-typia bin for migration tests.");
	}

	return cliPath;
}

function createManifestAttribute(
	kind: "string" | "number" | "boolean" | "array" | "object",
	{
		defaultValue = null,
		required = true,
	}: {
		defaultValue?: unknown;
		required?: boolean;
	} = {},
) {
	return {
		typia: {
			constraints: {
				exclusiveMaximum: null,
				exclusiveMinimum: null,
				format: null,
				maxLength: null,
				maxItems: null,
				maximum: null,
				minLength: null,
				minItems: null,
				minimum: null,
				multipleOf: null,
				pattern: null,
				typeTag: null,
			},
			defaultValue,
			hasDefault: defaultValue !== null,
		},
		ts: {
			items: null,
			kind,
			properties: null,
			required,
			union: null,
		},
		wp: {
			defaultValue,
			enum: null,
			hasDefault: defaultValue !== null,
			type: kind,
		},
	};
}

function createUnionManifestAttribute(
	discriminator: string,
	branches: Record<string, ReturnType<typeof createManifestAttribute>>,
) {
	return {
		typia: {
			constraints: {
				exclusiveMaximum: null,
				exclusiveMinimum: null,
				format: null,
				maxLength: null,
				maxItems: null,
				maximum: null,
				minLength: null,
				minItems: null,
				minimum: null,
				multipleOf: null,
				pattern: null,
				typeTag: null,
			},
			defaultValue: null,
			hasDefault: false,
		},
		ts: {
			items: null,
			kind: "union",
			properties: null,
			required: true,
			union: {
				branches,
				discriminator,
			},
		},
		wp: {
			defaultValue: null,
			enum: null,
			hasDefault: false,
			type: "object",
		},
	};
}

const HELPERS_SOURCE = `export type RenameMap = Record<string, string>;
export type TransformMap = Record<string, (legacyValue: unknown, legacyInput: Record<string, unknown>) => unknown>;

function getValueAtPath(input: Record<string, unknown>, path: string): unknown {
\treturn String(path)
\t\t.split(".")
\t\t.reduce((value: any, segment: string) => (value && typeof value === "object" ? value[segment] : undefined), input);
}

function createDefaultValue(attribute: any): unknown {
\tif (attribute?.typia?.hasDefault) {
\t\treturn attribute.typia.defaultValue;
\t}
\tswitch (attribute?.ts?.kind) {
\t\tcase "string":
\t\t\treturn "";
\t\tcase "number":
\t\t\treturn 0;
\t\tcase "boolean":
\t\t\treturn false;
\t\tcase "array":
\t\t\treturn [];
\t\tcase "object":
\t\t\treturn Object.fromEntries(
\t\t\t\tObject.entries(attribute.ts.properties ?? {}).map(([key, property]) => [key, createDefaultValue(property)]),
\t\t\t);
\t\tdefault:
\t\t\treturn null;
\t}
}

function coerceValue(attribute: any, value: unknown): unknown {
\treturn value ?? createDefaultValue(attribute);
}

export function resolveMigrationValue(
\tattribute: any,
\tcurrentKey: string,
\tfallbackPath: string,
\tinput: Record<string, unknown>,
\trenameMap: RenameMap,
\ttransforms: TransformMap,
) {
\tconst sourcePath = renameMap[currentKey] ?? fallbackPath;
\tconst legacyValue = getValueAtPath(input, sourcePath);
\tconst transformedValue = transforms[currentKey] ? transforms[currentKey](legacyValue, input) : legacyValue;
\treturn coerceValue(attribute, transformedValue);
}

export function resolveMigrationAttribute(
\tattribute: any,
\tcurrentPath: string,
\tfallbackPath: string,
\tinput: Record<string, unknown>,
\trenameMap: RenameMap,
\ttransforms: TransformMap,
) {
\tconst sourcePath = renameMap[currentPath] ?? fallbackPath;
\tif (attribute?.ts?.kind === "object") {
\t\treturn Object.fromEntries(
\t\t\tObject.entries(attribute.ts.properties ?? {}).map(([key, property]) => [
\t\t\t\tkey,
\t\t\t\tresolveMigrationAttribute(property, \`\${currentPath}.\${key}\`, \`\${sourcePath}.\${key}\`, input, renameMap, transforms),
\t\t\t]),
\t\t);
\t}
\tif (attribute?.ts?.kind === "union" && attribute?.ts?.union) {
\t\tconst legacyValue = getValueAtPath(input, sourcePath) as Record<string, unknown> | undefined;
\t\tconst branchKey = legacyValue?.[attribute.ts.union.discriminator];
\t\tif (typeof branchKey !== "string" || !(branchKey in attribute.ts.union.branches)) {
\t\t\treturn createDefaultValue(attribute);
\t\t}
\t\tconst branch = attribute.ts.union.branches[branchKey];
\t\treturn {
\t\t\t...Object.fromEntries(
\t\t\t\tObject.entries(branch.ts.properties ?? {})
\t\t\t\t\t.filter(([key]) => key !== attribute.ts.union.discriminator)
\t\t\t\t\t.map(([key, property]) => [
\t\t\t\t\t\tkey,
\t\t\t\t\t\tresolveMigrationAttribute(property, \`\${currentPath}.\${branchKey}.\${key}\`, \`\${sourcePath}.\${key}\`, input, renameMap, transforms),
\t\t\t\t\t]),
\t\t\t),
\t\t\t[attribute.ts.union.discriminator]: branchKey,
\t\t};
\t}
\treturn resolveMigrationValue(attribute, currentPath, fallbackPath, input, renameMap, transforms);
}
`;

function createProjectShell(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "migration-smoke",
		packageManager: "bun@1.3.10",
		private: true,
		scripts: {},
		type: "module",
		version: "0.1.0",
	});
	writeFile(
		path.join(projectDir, "src", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);
	writeFile(
		path.join(projectDir, "src", "types.ts"),
		`export interface MigrationAttributes {\n\tcontent: string;\n\tisVisible?: boolean;\n}\n`,
	);
}

function createCurrentProjectFiles(projectDir: string) {
	createProjectShell(projectDir);

	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
			isVisible: { default: false, type: "boolean" },
		},
		editorScript: "file:./index.js",
		name: "create-block/migration-smoke",
		title: "Migration Smoke",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Hello",
				required: true,
			}),
			isVisible: createManifestAttribute("boolean", {
				defaultValue: false,
				required: false,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function createCurrentSingleBlockScaffoldProject(projectDir: string) {
	createProjectShell(projectDir);

	writeJson(path.join(projectDir, "src", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
			isVisible: { default: false, type: "boolean" },
		},
		editorScript: "file:./index.js",
		name: "create-block/current-scaffold",
		title: "Current Scaffold",
	});
	writeJson(path.join(projectDir, "src", "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Hello",
				required: true,
			}),
			isVisible: createManifestAttribute("boolean", {
				defaultValue: false,
				required: false,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function createMixedSingleBlockProject(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);
	fs.rmSync(path.join(projectDir, "src", "typia.manifest.json"));

	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Legacy", type: "string" },
		},
		name: "create-block/legacy-root-layout",
		title: "Legacy Root Layout",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Legacy",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function createMalformedFallbackSingleBlockProject(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Legacy", type: "string" },
		},
		title: "Broken Legacy Root Layout",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Legacy",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function createMalformedPreferredSingleBlockProject(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);

	writeJson(path.join(projectDir, "src", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
			isVisible: { default: false, type: "boolean" },
		},
		editorScript: "file:./index.js",
		title: "Broken Current Scaffold",
	});
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Legacy", type: "string" },
		},
		name: "create-block/legacy-root-layout",
		title: "Legacy Root Layout",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Legacy",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function createLegacyConfiguredMixedSingleBlockProject(projectDir: string) {
	createMixedSingleBlockProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/legacy-root-layout",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
}

function createLegacyConfiguredSameNameMixedSingleBlockProject(projectDir: string) {
	createSameNameMixedSingleBlockProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/current-scaffold",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
}

function createLegacyConfiguredCurrentPreferredSameNameMixedSingleBlockProject(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Legacy", type: "string" },
		},
		name: "create-block/current-scaffold",
		title: "Legacy Root Layout",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Legacy",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/current-scaffold",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
}

function createSameNameMixedSingleBlockProject(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);
	fs.rmSync(path.join(projectDir, "src", "typia.manifest.json"));

	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Legacy", type: "string" },
		},
		name: "create-block/current-scaffold",
		title: "Legacy Root Layout",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Legacy",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
}

function writeCurrentSnapshot(projectDir: string, version = "v3") {
	writeJson(
		path.join(projectDir, "src", "migrations", "versions", version, "block.json"),
		JSON.parse(fs.readFileSync(path.join(projectDir, "block.json"), "utf8")),
	);
	writeJson(
		path.join(projectDir, "src", "migrations", "versions", version, "typia.manifest.json"),
		JSON.parse(fs.readFileSync(path.join(projectDir, "typia.manifest.json"), "utf8")),
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", version, "save.tsx"),
		fs.readFileSync(path.join(projectDir, "src", "save.tsx"), "utf8"),
	);
}

function createVersionedMigrationProject(projectDir: string) {
	createCurrentProjectFiles(projectDir);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {\n\tvalidate(input: Record<string, unknown>) {\n\t\tconst success = typeof input.content === "string" && (input.isVisible === undefined || typeof input.isVisible === "boolean");\n\t\treturn success\n\t\t\t? { success: true as const, data: input }\n\t\t\t: { success: false as const, errors: [{ path: "$", expected: "MigrationAttributes" }] };\n\t},\n\trandom() {\n\t\treturn { content: "Hello", isVisible: false };\n\t},\n};\n`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentMigrationVersion: "v3",\n\tsupportedMigrationVersions: ["v1", "v3"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
		},
		name: "create-block/migration-smoke",
		title: "Migration Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Hello",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "MigrationAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function addLegacyVersion(projectDir: string, version: string, sourceVersion = "v1") {
	const configPath = path.join(projectDir, "src", "migrations", "config.ts");
	const sourceSnapshotRoot = path.join(projectDir, "src", "migrations", "versions", sourceVersion);
	const targetSnapshotRoot = path.join(projectDir, "src", "migrations", "versions", version);
	fs.cpSync(sourceSnapshotRoot, targetSnapshotRoot, { recursive: true });

	const configSource = fs.readFileSync(configPath, "utf8");
	const match = configSource.match(/supportedMigrationVersions:\s*\[(.*?)\]/s);
	if (!match) {
		throw new Error("Could not locate supportedMigrationVersions in migration config.");
	}

	const versions = match[1]
		.split(",")
		.map((value) => value.trim().replace(/^"|"$/g, ""))
		.filter(Boolean);
	const nextVersions = [...new Set([...versions, version])].sort((left, right) =>
		left.localeCompare(right, undefined, { numeric: true }),
	);
	const nextSource = configSource.replace(
		match[0],
		`supportedMigrationVersions: [${nextVersions.map((value) => `"${value}"`).join(", ")}]`,
	);
	fs.writeFileSync(configPath, nextSource, "utf8");
}

type PromptSelectionCall = {
	defaultValue?: number;
	message: string;
	options: Array<{
		hint?: string;
		label: string;
		value: string;
	}>;
};

function createStubPrompt(selectedValue: string | undefined, calls: PromptSelectionCall[]): ReadlinePrompt {
	return {
		close(): void {
			// Tests inject a no-op prompt and manage their own lifecycle.
		},
		async select<T extends string>(
			message: string,
			options: Array<{ hint?: string; label: string; value: T }>,
			defaultValue?: number,
		): Promise<T> {
			calls.push({
				defaultValue,
				message,
				options: options.map((option) => ({
					hint: option.hint,
					label: option.label,
					value: option.value,
				})),
			});
			if (
				selectedValue === undefined &&
				typeof defaultValue === "number" &&
				defaultValue > 0 &&
				options[defaultValue - 1]
			) {
				return options[defaultValue - 1].value;
			}
			return (selectedValue ?? options[0]?.value) as T;
		},
		async text(_message: string, defaultValue: string): Promise<string> {
			return defaultValue;
		},
	};
}

function writeMultiBlockCurrentFiles(
	projectDir: string,
	block: {
		blockName: string;
		blockSlug: string;
		title: string;
		typeName: string;
	},
) {
	const blockDir = path.join(projectDir, "src", "blocks", block.blockSlug);
	writeFile(
		path.join(blockDir, "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);
	writeFile(
		path.join(blockDir, "types.ts"),
		`export interface ${block.typeName} {\n\tcontent: string;\n}\n`,
	);
	writeFile(
		path.join(blockDir, "validators.ts"),
		`export const validators = {\n\tvalidate(input: Record<string, unknown>) {\n\t\tconst success = typeof input.content === "string";\n\t\treturn success\n\t\t\t? { success: true as const, data: input }\n\t\t\t: { success: false as const, errors: [{ path: "$", expected: "${block.typeName}" }] };\n\t},\n\trandom() {\n\t\treturn { content: "Hello ${block.blockSlug}" };\n\t},\n};\n`,
	);
	writeJson(path.join(blockDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: `Hello ${block.blockSlug}`, type: "string" },
		},
		name: block.blockName,
		title: block.title,
	});
	writeJson(path.join(blockDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: `Hello ${block.blockSlug}`,
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: block.typeName,
	});
}

function writeMultiBlockSnapshot(
	projectDir: string,
	version: string,
	block: {
		blockName: string;
		blockSlug: string;
		title: string;
		typeName: string;
	},
	legacyLabel = `Legacy ${block.blockSlug}`,
) {
	const snapshotRoot = path.join(
		projectDir,
		"src",
		"migrations",
		"versions",
		version,
		block.blockSlug,
	);
	writeJson(path.join(snapshotRoot, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: legacyLabel, type: "string" },
		},
		name: block.blockName,
		title: block.title,
	});
	writeJson(path.join(snapshotRoot, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: legacyLabel,
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: block.typeName,
	});
	writeFile(
		path.join(snapshotRoot, "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);
}

function createMultiBlockMigrationProject(
	projectDir: string,
	{ includeLegacyChild = true }: { includeLegacyChild?: boolean } = {},
) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "multi-block-migration-smoke",
		packageManager: "bun@1.3.10",
		private: true,
		scripts: {},
		type: "module",
		version: "0.1.0",
	});

	const parent = {
		blockName: "create-block/multi-parent",
		blockSlug: "multi-parent",
		title: "Multi Parent",
		typeName: "MultiParentAttributes",
	};
	const child = {
		blockName: "create-block/multi-parent-item",
		blockSlug: "multi-parent-item",
		title: "Multi Parent Item",
		typeName: "MultiParentItemAttributes",
	};

	writeMultiBlockCurrentFiles(projectDir, parent);
	writeMultiBlockCurrentFiles(projectDir, child);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tcurrentMigrationVersion: "v3",\n\tsupportedMigrationVersions: ["v1", "v3"],\n\tsnapshotDir: "src/migrations/versions",\n\tblocks: [\n\t\t{\n\t\t\tkey: "multi-parent",\n\t\t\tblockName: "create-block/multi-parent",\n\t\t\tblockJsonFile: "src/blocks/multi-parent/block.json",\n\t\t\tmanifestFile: "src/blocks/multi-parent/typia.manifest.json",\n\t\t\tsaveFile: "src/blocks/multi-parent/save.tsx",\n\t\t\ttypesFile: "src/blocks/multi-parent/types.ts",\n\t\t},\n\t\t{\n\t\t\tkey: "multi-parent-item",\n\t\t\tblockName: "create-block/multi-parent-item",\n\t\t\tblockJsonFile: "src/blocks/multi-parent-item/block.json",\n\t\t\tmanifestFile: "src/blocks/multi-parent-item/typia.manifest.json",\n\t\t\tsaveFile: "src/blocks/multi-parent-item/save.tsx",\n\t\t\ttypesFile: "src/blocks/multi-parent-item/types.ts",\n\t\t},\n\t],\n} as const;\n\nexport default migrationConfig;\n`,
	);
	writeFile(path.join(projectDir, "src", "migrations", "helpers.ts"), HELPERS_SOURCE);
	writeMultiBlockSnapshot(projectDir, "v3", parent, "Hello multi-parent");
	writeMultiBlockSnapshot(projectDir, "v3", child, "Hello multi-parent-item");
	writeMultiBlockSnapshot(projectDir, "v1", parent);
	if (includeLegacyChild) {
		writeMultiBlockSnapshot(projectDir, "v1", child);
	}

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createRetrofitMultiBlockProject(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "retrofit-multi-block",
		packageManager: "bun@1.3.10",
		private: true,
		scripts: {},
		type: "module",
		version: "0.1.0",
	});

	writeMultiBlockCurrentFiles(projectDir, {
		blockName: "create-block/multi-parent",
		blockSlug: "multi-parent",
		title: "Multi Parent",
		typeName: "MultiParentAttributes",
	});
	writeMultiBlockCurrentFiles(projectDir, {
		blockName: "create-block/multi-parent-item",
		blockSlug: "multi-parent-item",
		title: "Multi Parent Item",
		typeName: "MultiParentItemAttributes",
	});
}

function createRetrofitMultiBlockProjectWithBrokenCandidate(projectDir: string) {
	createRetrofitMultiBlockProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "save.tsx"),
		`export default function Save() {\n\treturn null;\n}\n`,
	);
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "types.ts"),
		`export interface BrokenItemAttributes {}\n`,
	);
	writeFile(path.join(projectDir, "src", "blocks", "broken-item", "block.json"), '{"apiVersion":3,');
}

function createSingleBlockProjectWithBrokenMultiBlockCandidate(projectDir: string) {
	createCurrentSingleBlockScaffoldProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "save.tsx"),
		`export default function Save() {\n\treturn null;\n}\n`,
	);
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "types.ts"),
		`export interface BrokenItemAttributes {}\n`,
	);
	writeFile(path.join(projectDir, "src", "blocks", "broken-item", "block.json"), '{"apiVersion":3,');
}

function createBrokenOnlyMultiBlockProject(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "broken-only-multi-block",
		packageManager: "bun@1.3.10",
		private: true,
		scripts: {},
		type: "module",
		version: "0.1.0",
	});
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "save.tsx"),
		`export default function Save() {\n\treturn null;\n}\n`,
	);
	writeFile(
		path.join(projectDir, "src", "blocks", "broken-item", "types.ts"),
		`export interface BrokenItemAttributes {}\n`,
	);
	writeFile(path.join(projectDir, "src", "blocks", "broken-item", "block.json"), '{"apiVersion":3,');
}

function createRenameCandidateProject(projectDir: string) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst success = typeof input.content === "string";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$", expected: "RenameAttributes" }] };
\t},
\trandom() {
\t\treturn { content: "Hello" };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/rename-smoke",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { type: "string" },
		},
		name: "create-block/rename-smoke",
		title: "Rename Smoke",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "RenameAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			headline: { type: "string" },
		},
		name: "create-block/rename-smoke",
		title: "Rename Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			headline: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "RenameAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.headline ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createNestedRenameProject(projectDir: string) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.settings?.label ?? null;\n}\n`,
	);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst settings = input.settings as Record<string, unknown> | undefined;
\t\tconst success =
\t\t\ttypeof settings === "object" &&
\t\t\tsettings !== null &&
\t\t\ttypeof settings.label === "string";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$.settings.label", expected: "string" }] };
\t},
\trandom() {
\t\treturn { settings: { label: "Hello" } };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/nested-rename",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(path.join(projectDir, "src", "migrations", "helpers.ts"), HELPERS_SOURCE);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			settings: { type: "object" },
		},
		name: "create-block/nested-rename",
		title: "Nested Rename",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			settings: {
				typia: {
					constraints: {
						exclusiveMaximum: null,
						exclusiveMinimum: null,
						format: null,
						maxLength: null,
						maxItems: null,
						maximum: null,
						minLength: null,
						minItems: null,
						minimum: null,
						multipleOf: null,
						pattern: null,
						typeTag: null,
					},
					defaultValue: null,
					hasDefault: false,
				},
				ts: {
					items: null,
					kind: "object",
					properties: {
						label: createManifestAttribute("string", { required: true }),
					},
					required: true,
					union: null,
				},
				wp: {
					defaultValue: null,
					enum: null,
					hasDefault: false,
					type: "object",
				},
			},
		},
		manifestVersion: 2,
		sourceType: "NestedRenameAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			settings: { type: "object" },
		},
		name: "create-block/nested-rename",
		title: "Nested Rename",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			settings: {
				typia: {
					constraints: {
						exclusiveMaximum: null,
						exclusiveMinimum: null,
						format: null,
						maxLength: null,
						maxItems: null,
						maximum: null,
						minLength: null,
						minItems: null,
						minimum: null,
						multipleOf: null,
						pattern: null,
						typeTag: null,
					},
					defaultValue: null,
					hasDefault: false,
				},
				ts: {
					items: null,
					kind: "object",
					properties: {
						title: createManifestAttribute("string", { required: true }),
					},
					required: true,
					union: null,
				},
				wp: {
					defaultValue: null,
					enum: null,
					hasDefault: false,
					type: "object",
				},
			},
		},
		manifestVersion: 2,
		sourceType: "NestedRenameAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.settings?.title ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createAmbiguousRenameProject(projectDir: string) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst success = typeof input.content === "string";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$", expected: "AmbiguousRenameAttributes" }] };
\t},
\trandom() {
\t\treturn { content: "Hello" };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/ambiguous-rename",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { type: "string" },
		},
		name: "create-block/ambiguous-rename",
		title: "Ambiguous Rename",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "AmbiguousRenameAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			body: { type: "string" },
			headline: { type: "string" },
		},
		name: "create-block/ambiguous-rename",
		title: "Ambiguous Rename",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			body: createManifestAttribute("string", {
				required: true,
			}),
			headline: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "AmbiguousRenameAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.headline ?? attributes.body ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createTypeCoercionProject(projectDir: string) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.clickCount ?? null;\n}\n`,
	);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst success = typeof input.clickCount === "number";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$", expected: "CoercionAttributes" }] };
\t},
\trandom() {
\t\treturn { clickCount: 1 };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/coercion-smoke",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			clickCount: { type: "number" },
		},
		name: "create-block/coercion-smoke",
		title: "Coercion Smoke",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			clickCount: createManifestAttribute("number", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "CoercionAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			clickCount: { type: "string" },
		},
		name: "create-block/coercion-smoke",
		title: "Coercion Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			clickCount: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "CoercionAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.clickCount ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createUnionProject(projectDir: string, { removeBranch = false }: { removeBranch?: boolean } = {}) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.linkTarget ?? null;\n}\n`,
	);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst target = input.linkTarget as any;
\t\tconst success = typeof target === "object" && target !== null && typeof target.kind === "string";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$", expected: "UnionAttributes" }] };
\t},
\trandom() {
\t\treturn { linkTarget: { kind: "post", postId: 1 } };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/union-smoke",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);

	const currentBranches: Record<string, ReturnType<typeof createManifestAttribute>> = removeBranch
		? {
			post: createManifestAttribute("object", {
				required: true,
			}),
		}
		: {
			post: createManifestAttribute("object", {
				required: true,
			}),
			url: createManifestAttribute("object", {
				required: true,
			}),
		};
	const legacyBranches: Record<string, ReturnType<typeof createManifestAttribute>> = removeBranch
		? {
			post: createManifestAttribute("object", {
				required: true,
			}),
			url: createManifestAttribute("object", {
				required: true,
			}),
		}
		: {
			post: createManifestAttribute("object", {
				required: true,
			}),
		};

	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			linkTarget: { type: "object" },
		},
		name: "create-block/union-smoke",
		title: "Union Smoke",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			linkTarget: createUnionManifestAttribute("kind", currentBranches),
		},
		manifestVersion: 2,
		sourceType: "UnionAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			linkTarget: { type: "object" },
		},
		name: "create-block/union-smoke",
		title: "Union Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			linkTarget: createUnionManifestAttribute("kind", legacyBranches),
		},
		manifestVersion: 2,
		sourceType: "UnionAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.linkTarget ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

function createFuzzFailureProject(projectDir: string) {
	createProjectShell(projectDir);

	writeFile(
		path.join(projectDir, "src", "validators.ts"),
		`export const validators = {
\tvalidate(input: Record<string, unknown>) {
\t\tconst success = input.content === "Hello";
\t\treturn success
\t\t\t? { success: true as const, data: input }
\t\t\t: { success: false as const, errors: [{ path: "$.content", expected: '"Hello"' }] };
\t},
\trandom() {
\t\treturn { content: "legacy-random" };
\t},
};
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {
\tblockName: "create-block/fuzz-failure",
\tcurrentMigrationVersion: "v3",
\tsupportedMigrationVersions: ["v1", "v3"],
\tsnapshotDir: "src/migrations/versions",
} as const;

export default migrationConfig;
`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
		},
		name: "create-block/fuzz-failure",
		title: "Fuzz Failure",
	});
	writeJson(path.join(projectDir, "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Hello",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "FuzzFailureAttributes",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
		},
		name: "create-block/fuzz-failure",
		title: "Fuzz Failure",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), {
		attributes: {
			content: createManifestAttribute("string", {
				defaultValue: "Hello",
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "FuzzFailureAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {
\treturn attributes.content ?? null;
}
`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

describe("wp-typia migrate", () => {
	afterAll(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	test("bun entry bootstraps migrations and sanitizes snapshot metadata", () => {
		const projectDir = path.join(tempRoot, "init-project");
		createCurrentProjectFiles(projectDir);

		runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "config.ts"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "generated", "registry.ts"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "typia-migration-registry.php"))).toBe(true);

		const snapshotBlock = JSON.parse(
			fs.readFileSync(
				path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"),
				"utf8",
			),
		);
		expect(snapshotBlock.editorScript).toBeUndefined();
	});

	test("migrate init auto-detects current single-block scaffold layouts", () => {
		const projectDir = path.join(tempRoot, "init-current-single-block-project");
		createCurrentSingleBlockScaffoldProject(projectDir);

		const output = runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
		expect(configSource).not.toContain("blocks: [");
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "versions", "v1", "block.json"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "generated", "registry.ts"))).toBe(true);
		expect(output).toContain("Detected single-block migration retrofit: create-block/current-scaffold");
		expect(output).toContain("Wrote src/migrations/config.ts");
	});

	test("migrate init auto-detects multi-block retrofit layouts including hidden compound children", () => {
		const projectDir = path.join(tempRoot, "init-multi-block-project");
		createRetrofitMultiBlockProject(projectDir);

		const output = runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blocks: [");
		expect(configSource).toContain("key: 'multi-parent'");
		expect(configSource).toContain("key: 'multi-parent-item'");
		expect(configSource).toContain("blockJsonFile: 'src/blocks/multi-parent/block.json'");
		expect(configSource).toContain("blockJsonFile: 'src/blocks/multi-parent-item/block.json'");
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "versions", "v1", "multi-parent", "block.json")),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "versions", "v1", "multi-parent-item", "block.json"),
			),
		).toBe(true);
		expect(output).toContain("Detected multi-block migration retrofit (2 targets):");
		expect(output).toContain("create-block/multi-parent");
		expect(output).toContain("create-block/multi-parent-item");
	});

	test("migrate init ignores malformed multi-block candidates when valid block targets remain", () => {
		const projectDir = path.join(tempRoot, "init-multi-block-project-with-broken-candidate");
		createRetrofitMultiBlockProjectWithBrokenCandidate(projectDir);

		const output = runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("key: 'multi-parent'");
		expect(configSource).toContain("key: 'multi-parent-item'");
		expect(configSource).not.toContain("key: 'broken-item'");
		expect(output).toContain("Detected multi-block migration retrofit (2 targets):");
	});

	test("migrate init prefers the legacy single-block fallback when only the root manifest exists", () => {
		const projectDir = path.join(tempRoot, "init-mixed-single-block-project");
		createMixedSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/legacy-root-layout'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), "utf8"),
		);
		expect(snapshotManifest.attributes.content.typia.defaultValue).toBe("Legacy");
	});

	test("migrate init falls back to single-block detection when all multi-block candidates are malformed", () => {
		const projectDir = path.join(tempRoot, "init-single-block-with-broken-multi-block-candidate");
		createSingleBlockProjectWithBrokenMultiBlockCandidate(projectDir);

		const output = runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
		expect(configSource).not.toContain("blocks: [");
		expect(output).toContain("Detected single-block migration retrofit: create-block/current-scaffold");
	});

	test("migrate init reports actionable guidance when only malformed multi-block candidates exist", () => {
		const projectDir = path.join(tempRoot, "init-broken-only-multi-block-project");
		createBrokenOnlyMultiBlockProject(projectDir);

		expect(() =>
			runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
				cwd: projectDir,
			}),
		).toThrow(
			/Unable to auto-detect a supported migration retrofit layout\.[\s\S]*src\/blocks\/broken-item\/block\.json[\s\S]*could not be parsed[\s\S]*src\/migrations\/config\.ts/,
		);
	});

	test("migrate init ignores malformed non-selected single-block layouts", () => {
		const projectDir = path.join(tempRoot, "init-malformed-fallback-single-block-project");
		createMalformedFallbackSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
	});

	test("migrate init falls back from malformed preferred single-block layouts", () => {
		const projectDir = path.join(tempRoot, "init-malformed-preferred-single-block-project");
		createMalformedPreferredSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/legacy-root-layout'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), "utf8"),
		);
		expect(snapshotManifest.attributes.content.typia.defaultValue).toBe("Legacy");
	});

	test("legacy migration configs stay bound to the configured single-block layout", () => {
		const projectDir = path.join(tempRoot, "legacy-config-mixed-single-block-project");
		createLegacyConfiguredMixedSingleBlockProject(projectDir);

		const state = loadMigrationProject(projectDir);
		expect(state.blocks[0]?.blockJsonFile).toBe("block.json");
		expect(state.blocks[0]?.blockName).toBe("create-block/legacy-root-layout");
		expect(state.currentManifest.attributes?.content?.typia.defaultValue).toBe("Legacy");
	});

	test("legacy migration configs keep the root layout when mixed single-block paths share a block name", () => {
		const projectDir = path.join(tempRoot, "legacy-config-same-name-mixed-single-block-project");
		createLegacyConfiguredSameNameMixedSingleBlockProject(projectDir);

		const state = loadMigrationProject(projectDir);
		expect(state.blocks[0]?.blockJsonFile).toBe("block.json");
		expect(state.blocks[0]?.manifestFile).toBe("typia.manifest.json");
		expect(state.currentManifest.attributes?.content?.typia.defaultValue).toBe("Legacy");
	});

	test("legacy migration configs keep the current scaffold layout when same-name mixed layouts both expose manifests", () => {
		const projectDir = path.join(tempRoot, "legacy-config-current-preferred-same-name-mixed-single-block-project");
		createLegacyConfiguredCurrentPreferredSameNameMixedSingleBlockProject(projectDir);

		const state = loadMigrationProject(projectDir);
		expect(state.blocks[0]?.blockJsonFile).toBe("src/block.json");
		expect(state.blocks[0]?.manifestFile).toBe("src/typia.manifest.json");
		expect(state.currentManifest.attributes?.content?.typia.defaultValue).toBe("Hello");
	});

	test("migrate init keeps manifest-priority when mixed single-block layouts share a block name", () => {
		const projectDir = path.join(tempRoot, "init-same-name-mixed-single-block-project");
		createSameNameMixedSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "v1", "typia.manifest.json"), "utf8"),
		);
		expect(snapshotManifest.attributes.content.typia.defaultValue).toBe("Legacy");
	});

	test("migrate init fails with actionable guidance when no supported retrofit layout is found", () => {
		const projectDir = path.join(tempRoot, "init-unsupported-layout-project");
		writeJson(path.join(projectDir, "package.json"), {
			name: "unsupported-migration-layout",
			packageManager: "bun@1.3.10",
			private: true,
			scripts: {},
			type: "module",
			version: "0.1.0",
		});

		expect(() =>
			runCli("bun", [entryPath, "migrate", "init", "--current-migration-version", "v1"], {
				cwd: projectDir,
			}),
		).toThrow(/Unable to auto-detect a supported migration retrofit layout[\s\S]*src\/migrations\/config\.ts/);
	});

	test("migrate help text explains retrofit auto-detection, read-only planning, and --all workspace scope", () => {
		expect(runCli("node", [entryPath, "migrate"])).toMatch(
			/`migrate init` auto-detects supported single-block and `src\/blocks\/\*` multi-block layouts[\s\S]*Migration versions use strict schema labels like `v1`, `v2`, and `v3`[\s\S]*`migrate wizard` is TTY-only[\s\S]*`migrate plan` and `migrate wizard` are read-only previews[\s\S]*--all runs across every configured legacy migration version and every configured block target\.[\s\S]*Existing fixture files are preserved and reported as skipped unless you pass `--force`\.[\s\S]*Use `migrate fixtures --force` as the explicit refresh path/,
		);
	});

	test("migration arg parser ignores standalone script separators", () => {
		const parsed = parseMigrationArgs(["snapshot", "--", "--migration-version", "v1"]);
		expect(parsed.command).toBe("snapshot");
		expect(parsed.flags.migrationVersion).toBe("v1");
	});

	test("migration arg parser accepts plan and wizard commands", () => {
		const plan = parseMigrationArgs(["plan", "--from-migration-version", "v1", "--to-migration-version", "v2"]);
		expect(plan.command).toBe("plan");
		expect(plan.flags.fromMigrationVersion).toBe("v1");
		expect(plan.flags.toMigrationVersion).toBe("v2");

		const wizard = parseMigrationArgs(["wizard"]);
		expect(wizard.command).toBe("wizard");
		expect(wizard.flags.toMigrationVersion).toBe("current");
	});

	test("migration arg parser rejects legacy semver-era flag names with reset guidance", () => {
		for (const argv of [
			["init", "--current-version", "1.0.0"],
			["snapshot", "--version", "1.0.0"],
			["plan", "--from", "1.0.0"],
			["plan", "--from-migration-version", "v1", "--to", "1.0.0"],
		]) {
			expect(() => parseMigrationArgs(argv)).toThrow(
				/Legacy migration flag[\s\S]*@wp-typia migrate init --current-migration-version v1|rerun `wp-typia migrate init --current-migration-version v1`/,
			);
		}
	});

	test("plan requires --from-migration-version", () => {
		const projectDir = path.join(tempRoot, "plan-requires-from-project");
		createVersionedMigrationProject(projectDir);

		expect(() =>
			runCli("node", [entryPath, "migrate", "plan"], {
				cwd: projectDir,
			}),
		).toThrow(/`migrate plan` requires --from-migration-version <label>\./);
	});

	test("plan previews one selected migration edge without generating artifacts", () => {
		const projectDir = path.join(tempRoot, "plan-preview-project");
		createVersionedMigrationProject(projectDir);
		addLegacyVersion(projectDir, "v2");

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		const generatedPath = path.join(projectDir, "src", "migrations", "generated", "deprecated.ts");
		const lines: string[] = [];
		const summary = planProjectMigrations(projectDir, {
			fromMigrationVersion: "v1",
			renderLine: (line) => lines.push(line),
			toMigrationVersion: "current",
		});

		const output = lines.join("\n");
		expect(summary.availableLegacyVersions).toEqual(["v2", "v1"]);
		expect(summary.currentMigrationVersion).toBe("v3");
		expect(summary.fromMigrationVersion).toBe("v1");
		expect(summary.targetMigrationVersion).toBe("v3");
		expect(summary.includedBlocks).toEqual(["create-block/migration-smoke"]);
		expect(summary.skippedBlocks).toEqual([]);
		expect(output).toContain("Current migration version: v3");
		expect(output).toContain("Available legacy migration versions: v2, v1");
		expect(output).toContain("Selected migration edge: v1 -> v3");
		expect(output).toContain("Included block targets: create-block/migration-smoke");
		expect(output).toContain("Skipped block targets: None");
		expect(output).toContain("Migration diff: v1 -> v3");
		expect(output).toContain("Risk summary:");
		expect(output).toContain("Next steps:");
		expect(output).toContain("wp-typia migrate scaffold --from-migration-version v1");
		expect(output).toContain("wp-typia migrate doctor --from-migration-version v1");
		expect(output).toContain("wp-typia migrate verify --from-migration-version v1");
		expect(output).toContain("wp-typia migrate fuzz --from-migration-version v1");
		expect(output).toContain("Optional after editing rules: wp-typia migrate fixtures --from-migration-version v1 --force");
		expect(output.indexOf("Current migration version:")).toBeLessThan(output.indexOf("Available legacy migration versions:"));
		expect(output.indexOf("Available legacy migration versions:")).toBeLessThan(output.indexOf("Selected migration edge:"));
		expect(output.indexOf("Selected migration edge:")).toBeLessThan(output.indexOf("Included block targets:"));
		expect(output.indexOf("Included block targets:")).toBeLessThan(output.indexOf("Block: create-block/migration-smoke"));
		expect(output.indexOf("Block: create-block/migration-smoke")).toBeLessThan(output.indexOf("Next steps:"));
		expect(fs.existsSync(rulePath)).toBe(false);
		expect(fs.existsSync(fixturePath)).toBe(false);
		expect(fs.existsSync(generatedPath)).toBe(false);
	});

	test("plan previews multi-block edges and lists skipped targets that lack snapshots", () => {
		const projectDir = path.join(tempRoot, "plan-multi-block-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: false });

		const lines: string[] = [];
		const summary = planProjectMigrations(projectDir, {
			fromMigrationVersion: "v1",
			renderLine: (line) => lines.push(line),
		});

		const output = lines.join("\n");
		expect(summary.includedBlocks).toEqual(["create-block/multi-parent"]);
		expect(summary.skippedBlocks).toEqual(["create-block/multi-parent-item"]);
		expect(output).toContain("Included block targets: create-block/multi-parent");
		expect(output).toContain("Skipped block targets: create-block/multi-parent-item");
		expect(output).toContain("Block: create-block/multi-parent");
		expect(output).not.toContain("Block: create-block/multi-parent-item");
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "rules", "multi-parent", "v1-to-v3.ts"),
			),
		).toBe(false);
	});

	test("plan stays read-only when current manifests are missing", () => {
		const projectDir = path.join(tempRoot, "plan-read-only-manifest-project");
		createVersionedMigrationProject(projectDir);
		const manifestPath = path.join(projectDir, "typia.manifest.json");
		fs.rmSync(manifestPath);

		expect(() =>
			planProjectMigrations(projectDir, {
				fromMigrationVersion: "v1",
			}),
		).toThrow(/Migration planning is read-only[\s\S]*Run your project's `sync-types` script/);
		expect(fs.existsSync(manifestPath)).toBe(false);
	});

	test("loadMigrationProject rechecks manifests after attempting sync-types", () => {
		const projectDir = path.join(tempRoot, "plan-missing-manifest-after-sync-project");
		createVersionedMigrationProject(projectDir);
		const manifestPath = path.join(projectDir, "typia.manifest.json");
		fs.rmSync(manifestPath);

		expect(() => loadMigrationProject(projectDir)).toThrow(
			/Missing current manifest file\(s\): typia\.manifest\.json[\s\S]*Run your project's `sync-types` script/,
		);
		expect(fs.existsSync(manifestPath)).toBe(false);
	});

	test("plan only advertises legacy versions with snapshot coverage", () => {
		const projectDir = path.join(tempRoot, "plan-previewable-versions-project");
		createVersionedMigrationProject(projectDir);

		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedMigrationVersions: ["v1", "v3"]', 'supportedMigrationVersions: ["v1", "v2", "v3"]'),
			"utf8",
		);

		const lines: string[] = [];
		const summary = planProjectMigrations(projectDir, {
			fromMigrationVersion: "v1",
			renderLine: (line) => lines.push(line),
		});

		expect(summary.availableLegacyVersions).toEqual(["v1"]);
		expect(lines.join("\n")).toContain("Available legacy migration versions: v1");
		expect(lines.join("\n")).not.toContain("v2");
	});

	test("plan unsupported-version guidance only lists previewable legacy versions", () => {
		const projectDir = path.join(tempRoot, "plan-previewable-error-project");
		createVersionedMigrationProject(projectDir);

		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedMigrationVersions: ["v1", "v3"]', 'supportedMigrationVersions: ["v1", "v2", "v3"]'),
			"utf8",
		);

		let thrown: unknown;
		try {
			planProjectMigrations(projectDir, {
				fromMigrationVersion: "9.9.9",
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain("Available legacy migration versions: v1");
		expect((thrown as Error).message).not.toContain("v2");
	});

	test("plan omits current-migration-version follow-up commands for non-current targets", () => {
		const projectDir = path.join(tempRoot, "plan-non-current-target-project");
		createVersionedMigrationProject(projectDir);
		addLegacyVersion(projectDir, "v2");

		const lines: string[] = [];
		const summary = planProjectMigrations(projectDir, {
			fromMigrationVersion: "v1",
			renderLine: (line) => lines.push(line),
			toMigrationVersion: "v2",
		});

		const output = lines.join("\n");
		expect(summary.targetMigrationVersion).toBe("v2");
		expect(summary.nextSteps).toEqual(["wp-typia migrate scaffold --from-migration-version v1 --to-migration-version v2"]);
		expect(output).toContain("Selected migration edge: v1 -> v2");
		expect(output).toContain("wp-typia migrate scaffold --from-migration-version v1 --to-migration-version v2");
		expect(output).not.toContain("wp-typia migrate doctor --from-migration-version v1");
		expect(output).not.toContain("wp-typia migrate verify --from-migration-version v1");
		expect(output).not.toContain("wp-typia migrate fuzz --from-migration-version v1");
		expect(output).toContain("Optional after editing rules: wp-typia migrate fixtures --from-migration-version v1 --to-migration-version v2 --force");
	});

	test("wizard fails outside a TTY with actionable guidance", async () => {
		const projectDir = path.join(tempRoot, "wizard-non-tty-project");
		createVersionedMigrationProject(projectDir);

		await expect(
			wizardProjectMigrations(projectDir, {
				isInteractive: false,
			}),
		).rejects.toThrow(
			/`migrate wizard` requires an interactive terminal[\s\S]*wp-typia migrate plan --from-migration-version <label>/,
		);
	});

	test("wizard previews the most recent legacy version by default order and stays read-only", async () => {
		const projectDir = path.join(tempRoot, "wizard-preview-project");
		createVersionedMigrationProject(projectDir);
		addLegacyVersion(projectDir, "v2");

		const calls: PromptSelectionCall[] = [];
		const lines: string[] = [];
		const summary = await wizardProjectMigrations(projectDir, {
			isInteractive: true,
			prompt: createStubPrompt(undefined, calls),
			renderLine: (line) => lines.push(line),
		});

		expect("cancelled" in summary).toBe(false);
		expect(calls[0]?.message).toContain("Choose a legacy version to preview");
		expect(calls[0]?.defaultValue).toBe(1);
		expect(calls[0]?.options.map((option) => option.value)).toEqual(["v2", "v1", "cancel"]);
		if ("cancelled" in summary) {
			throw new Error("Expected wizard to return a plan summary.");
		}
		expect(summary.fromMigrationVersion).toBe("v2");
		expect(summary.targetMigrationVersion).toBe("v3");
		expect(lines.join("\n")).toContain("Selected migration edge: v2 -> v3");
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "rules", "v2-to-v3.ts")),
		).toBe(false);
	});

	test("wizard orders migration labels numerically and defaults to the newest label", async () => {
		const projectDir = path.join(tempRoot, "wizard-numeric-order-project");
		createVersionedMigrationProject(projectDir);

		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		fs.cpSync(
			path.join(projectDir, "src", "migrations", "versions", "v1"),
			path.join(projectDir, "src", "migrations", "versions", "v9"),
			{ recursive: true },
		);
		fs.cpSync(
			path.join(projectDir, "src", "migrations", "versions", "v1"),
			path.join(projectDir, "src", "migrations", "versions", "v10"),
			{ recursive: true },
		);
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('currentMigrationVersion: "v3"', 'currentMigrationVersion: "v11"')
				.replace('supportedMigrationVersions: ["v1", "v3"]', 'supportedMigrationVersions: ["v1", "v9", "v10", "v11"]'),
			"utf8",
		);

		const calls: PromptSelectionCall[] = [];
		await wizardProjectMigrations(projectDir, {
			isInteractive: true,
			prompt: createStubPrompt(undefined, calls),
			renderLine: () => undefined,
		});

		expect(calls[0]?.options.map((option) => option.value)).toEqual(["v10", "v9", "v1", "cancel"]);
	});

	test("loadMigrationProject rejects legacy semver config keys with reset guidance", () => {
		const projectDir = path.join(tempRoot, "legacy-semver-config-project");
		createCurrentProjectFiles(projectDir);
		writeFile(
			path.join(projectDir, "src", "migrations", "config.ts"),
			`export const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentVersion: "1.0.0",\n\tsupportedVersions: ["1.0.0"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
		);

		expect(() => loadMigrationProject(projectDir)).toThrow(
			/Detected legacy config keys `currentVersion` \/ `supportedVersions`[\s\S]*rerun `wp-typia migrate init --current-migration-version v1`/,
		);
	});

	test("loadMigrationProject ignores commented legacy semver config key names", () => {
		const projectDir = path.join(tempRoot, "commented-legacy-semver-config-project");
		createCurrentProjectFiles(projectDir);
		writeFile(
			path.join(projectDir, "src", "migrations", "config.ts"),
			`// renamed from currentVersion / supportedVersions during the vN reset\nexport const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n\tcomment: "legacy currentVersion should not trip reset guidance",\n} as const;\n\nexport default migrationConfig;\n`,
		);

		expect(() => loadMigrationProject(projectDir)).not.toThrow();
	});

	test("loadMigrationProject ignores commented migration version label properties", () => {
		const projectDir = path.join(tempRoot, "commented-migration-version-project");
		createCurrentProjectFiles(projectDir);
		writeFile(
			path.join(projectDir, "src", "migrations", "config.ts"),
			`// currentMigrationVersion: "v99"\n// supportedMigrationVersions: ["v99"]\nexport const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentMigrationVersion: "v3",\n\tsupportedMigrationVersions: ["v1", "v3"],\n\tsnapshotDir: "src/migrations/versions",\n\tnote: "currentMigrationVersion: 'v99' should not be parsed",\n} as const;\n\nexport default migrationConfig;\n`,
		);

		const state = loadMigrationProject(projectDir);
		expect(state.config.currentMigrationVersion).toBe("v3");
		expect(state.config.supportedMigrationVersions).toEqual(["v1", "v3"]);
	});

	test("loadMigrationProject ignores legacy-looking nested config helper objects", () => {
		const projectDir = path.join(tempRoot, "nested-legacy-helper-config-project");
		createCurrentProjectFiles(projectDir);
		writeFile(
			path.join(projectDir, "src", "migrations", "config.ts"),
			`export const migrationConfig = {\n\thelperMetadata: {\n\t\tcurrentVersion: "legacy-note",\n\t\tsupportedVersions: ["legacy-note"],\n\t},\n\tblockName: "create-block/migration-smoke",\n\tcurrentMigrationVersion: "v3",\n\tsupportedMigrationVersions: ["v1", "v3"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
		);

		const state = loadMigrationProject(projectDir);
		expect(state.config.currentMigrationVersion).toBe("v3");
		expect(state.config.supportedMigrationVersions).toEqual(["v1", "v3"]);
	});

	test("loadMigrationProject treats explicit empty block arrays as a valid zero-target workspace", () => {
		const projectDir = path.join(tempRoot, "empty-workspace-migrations");
		fs.mkdirSync(path.join(projectDir, "src", "migrations"), { recursive: true });
		writeJson(path.join(projectDir, "package.json"), {
			name: "empty-workspace-migrations",
			version: "0.0.0",
		});
		writeFile(
			path.join(projectDir, "src", "migrations", "config.ts"),
			`export const migrationConfig = {
\tcurrentMigrationVersion: 'v1',
\tsupportedMigrationVersions: [ 'v1' ],
\tsnapshotDir: 'src/migrations/versions',
\tblocks: [],
} as const;

export default migrationConfig;
`,
		);

		const state = loadMigrationProject(projectDir, { allowSyncTypes: false });

		expect(state.blocks).toEqual([]);
		expect(state.currentManifest.attributes).toEqual({});
		expect(state.currentBlockJson).toEqual({});
	});

	test("parseMigrationConfig rejects malformed explicit block arrays", () => {
		expect(() =>
			parseMigrationConfig(`export const migrationConfig = {
\tcurrentMigrationVersion: 'v1',
\tsupportedMigrationVersions: [ 'v1' ],
\tsnapshotDir: 'src/migrations/versions',
\tblocks: [
\t\t{ key: 'broken' },
\t],
} as const;

export default migrationConfig;
`),
		).toThrow(/Migration config defines `blocks`, but the array entries could not be parsed/);
	});

	test("loadMigrationProject rejects legacy semver-named migration artifacts with reset guidance", () => {
		const projectDir = path.join(tempRoot, "legacy-semver-artifacts-project");
		createVersionedMigrationProject(projectDir);
		writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
			apiVersion: 3,
			attributes: {
				content: { default: "Legacy", type: "string" },
			},
			name: "create-block/migration-smoke",
			title: "Migration Smoke",
		});

		expect(() => loadMigrationProject(projectDir)).toThrow(
			/Detected a legacy semver-based migration workspace[\s\S]*1\.0\.0[\s\S]*rerun `wp-typia migrate init --current-migration-version v1`/,
		);
	});

	test("migrate init rejects legacy semver workspaces before rewriting the config", () => {
		const projectDir = path.join(tempRoot, "legacy-semver-init-project");
		createCurrentProjectFiles(projectDir);
		const legacyConfigPath = path.join(projectDir, "src", "migrations", "config.ts");
		const legacyConfigSource = `export const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentVersion: "1.0.0",\n\tsupportedVersions: ["1.0.0"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`;
		writeFile(legacyConfigPath, legacyConfigSource);

		expect(() => initProjectMigrations(projectDir, "v1")).toThrow(
			/Detected a legacy semver-based migration workspace[\s\S]*rerun `wp-typia migrate init --current-migration-version v1`/,
		);
		expect(fs.readFileSync(legacyConfigPath, "utf8")).toBe(legacyConfigSource);
	});

	test("wizard cancellation exits cleanly without writing migration artifacts", async () => {
		const projectDir = path.join(tempRoot, "wizard-cancel-project");
		createVersionedMigrationProject(projectDir);

		const lines: string[] = [];
		const result = await wizardProjectMigrations(projectDir, {
			isInteractive: true,
			prompt: createStubPrompt("cancel", []),
			renderLine: (line) => lines.push(line),
		});

		expect(result).toEqual({ cancelled: true });
		expect(lines.join("\n")).toContain("Cancelled migration planning.");
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts")),
		).toBe(false);
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json")),
		).toBe(false);
	});

	test("scaffold and verify generate auto-migration artifacts for additive schema changes", () => {
		const projectDir = path.join(tempRoot, "verify-project");
		createVersionedMigrationProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("Migration diff: v1 -> v3");
		expect(diffOutput).toContain("add-default");

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const deprecatedPath = path.join(projectDir, "src", "migrations", "generated", "deprecated.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		const phpRegistryPath = path.join(projectDir, "typia-migration-registry.php");

		expect(fs.existsSync(rulePath)).toBe(true);
		expect(fs.existsSync(deprecatedPath)).toBe(true);
		expect(fs.existsSync(fixturePath)).toBe(true);
		expect(fs.existsSync(phpRegistryPath)).toBe(true);

		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const deprecatedSource = fs.readFileSync(deprecatedPath, "utf8");
		const fixtureSource = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
		const phpRegistrySource = fs.readFileSync(phpRegistryPath, "utf8");
		expect(ruleSource).not.toContain("TODO MIGRATION:");
		expect(ruleSource).toContain("isVisible");
		expect(deprecatedSource).toContain("deprecated_0");
		expect(Array.isArray(fixtureSource.cases)).toBe(true);
		expect(fixtureSource.cases[0].name).toBe("default");
		expect(phpRegistrySource).toContain("'currentMigrationVersion' => 'v3'");
		expect(phpRegistrySource).toContain("'legacyMigrationVersions' =>");
		expect(phpRegistrySource).toContain("'v1'");

		const verifyOutput = runCli("node", [entryPath, "migrate", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified v1 -> v3");
		expect(verifyOutput).toContain("Migration verification passed for create-block/migration-smoke");
	});

	test("scaffold exposes renameMap and transforms helpers for rename candidates", () => {
		const projectDir = path.join(tempRoot, "rename-project");
		createRenameCandidateProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("Auto-applied renames:");
		expect(diffOutput).toContain("content <- headline");

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

		expect(ruleSource).toContain("export const renameMap");
		expect(ruleSource).toContain('"content": "headline"');
		expect(ruleSource).toContain("export const transforms");
		expect(ruleSource).not.toContain('content: rename candidate from headline');
		expect(ruleSource).toContain('resolveMigrationAttribute(currentManifest.attributes.content, "content", "content", input, renameMap, transforms)');
		expect(fixture.cases.some((entry: { name: string }) => entry.name === "rename:headline->content")).toBe(true);

		const verifyOutput = runCli("node", [entryPath, "migrate", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified v1 -> v3");
	});

	test("scaffold auto-applies nested leaf rename candidates", () => {
		const projectDir = path.join(tempRoot, "nested-rename-project");
		createNestedRenameProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("settings.label <- settings.title");

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

		expect(ruleSource).toContain('"settings.label": "settings.title"');
		expect(ruleSource).toContain('resolveMigrationAttribute(currentManifest.attributes.settings, "settings", "settings", input, renameMap, transforms)');
		expect(
			fixture.cases.some((entry: { name: string }) => entry.name === "rename:settings.title->settings.label"),
		).toBe(true);

		const verifyOutput = runCli("node", [entryPath, "migrate", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified v1 -> v3");
	});

	test("ambiguous rename candidates stay unresolved", () => {
		const projectDir = path.join(tempRoot, "ambiguous-rename-project");
		createAmbiguousRenameProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const ruleSource = fs.readFileSync(rulePath, "utf8");

		expect(ruleSource).toContain('// "content": "headline",');
		expect(ruleSource).toContain("rename candidate from");
	});

	test("scaffold suggests transform bodies for semantic coercion", () => {
		const projectDir = path.join(tempRoot, "coercion-project");
		createTypeCoercionProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "v1-to-v3.ts");
		const ruleSource = fs.readFileSync(rulePath, "utf8");

		expect(ruleSource).toContain("export const transforms");
		expect(ruleSource).toContain('// "clickCount": (legacyValue, legacyInput) => {');
		expect(ruleSource).toContain("// const numericValue = typeof legacyValue === \"number\" ? legacyValue : Number(legacyValue ?? 0);");
		expect(ruleSource).toContain("clickCount: transform suggested from clickCount");
	});

	test("union diff distinguishes additive and removal changes", () => {
		const additiveProjectDir = path.join(tempRoot, "union-additive-project");
		createUnionProject(additiveProjectDir, { removeBranch: false });
		const additiveOutput = runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v1"], {
			cwd: additiveProjectDir,
		});
		expect(additiveOutput).toContain("union-branch-addition");

		const removalProjectDir = path.join(tempRoot, "union-removal-project");
		createUnionProject(removalProjectDir, { removeBranch: true });
		const removalOutput = runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v1"], {
			cwd: removalProjectDir,
		});
		expect(removalOutput).toContain("union-branch-removal");
	});

	test("risk summary classifies additive, rename, transform, and union-breaking edges", () => {
		const additiveProjectDir = path.join(tempRoot, "risk-additive-project");
		createVersionedMigrationProject(additiveProjectDir);
		const additiveSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(additiveProjectDir), "v1", "v3"),
		);
		expect(additiveSummary.additive.count).toBeGreaterThan(0);

		const renameProjectDir = path.join(tempRoot, "risk-rename-project");
		createRenameCandidateProject(renameProjectDir);
		const renameSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(renameProjectDir), "v1", "v3"),
		);
		expect(renameSummary.rename.count).toBeGreaterThan(0);

		const transformProjectDir = path.join(tempRoot, "risk-transform-project");
		createTypeCoercionProject(transformProjectDir);
		const transformSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(transformProjectDir), "v1", "v3"),
		);
		expect(transformSummary.semanticTransform.count).toBeGreaterThan(0);

		const unionProjectDir = path.join(tempRoot, "risk-union-project");
		createUnionProject(unionProjectDir, { removeBranch: true });
		const unionSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(unionProjectDir), "v1", "v3"),
		);
		expect(unionSummary.unionBreaking.count).toBeGreaterThan(0);
	});

	test("multi-block configs load and scaffold per-target migration artifacts", () => {
		const projectDir = path.join(tempRoot, "multi-block-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: true });

		const state = loadMigrationProject(projectDir);
		expect(state.blocks).toHaveLength(2);
		expect(state.blocks.map((block) => block.key)).toEqual([
			"multi-parent",
			"multi-parent-item",
		]);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "rules", "multi-parent", "v1-to-v3.ts"),
			),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "rules", "multi-parent-item", "v1-to-v3.ts"),
			),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "generated", "multi-parent", "registry.ts"),
			),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "generated", "multi-parent-item", "registry.ts"),
			),
		).toBe(true);
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "generated", "index.ts")),
		).toBe(true);
		const phpRegistry = fs.readFileSync(
			path.join(projectDir, "typia-migration-registry.php"),
			"utf8",
		);
		expect(phpRegistry).toContain("'blocks' =>");
		expect(phpRegistry).toContain("'multi-parent'");
		expect(phpRegistry).toContain("'multi-parent-item'");
	});

	test("createMigrationDiff requires an explicit block key for multi-block projects", () => {
		const projectDir = path.join(tempRoot, "multi-block-diff-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: true });
		const state = loadMigrationProject(projectDir);

		expect(() =>
			createMigrationDiff(state, "v1", "v3"),
		).toThrow(/block key is required/i);
		expect(() =>
			createMigrationDiff(
				state,
				{ key: "missing-block" } as any,
				"v1",
				"v3",
			),
		).toThrow(/Unknown migration block key: missing-block/);
	});

	test("doctor tolerates block targets that appear only in later versions", () => {
		const projectDir = path.join(tempRoot, "multi-block-late-child-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: false });

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const output = runCli("node", [entryPath, "migrate", "doctor", "--all"], {
			cwd: projectDir,
		});
		expect(output).toContain("PASS Snapshot create-block/multi-parent-item @ v1: Not present for this version");
		expect(output).toContain("PASS Migration doctor summary:");
	});

	test("doctor fails when a current multi-block snapshot root is missing after introduction", () => {
		const projectDir = path.join(tempRoot, "multi-block-missing-current-snapshot-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: true });

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.rmSync(
			path.join(projectDir, "src", "migrations", "versions", "v3", "multi-parent-item"),
			{ force: true, recursive: true },
		);

		expect(() =>
			runCli("node", [entryPath, "migrate", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor passes on a healthy migration workspace", () => {
		const projectDir = path.join(tempRoot, "doctor-success-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const output = runCli("node", [entryPath, "migrate", "doctor", "--all"], {
			cwd: projectDir,
		});
		expect(output).toContain("PASS Migration config:");
		expect(output).toContain("PASS Fixture coverage v1:");
		expect(output).toContain("PASS Risk summary v1:");
		expect(output).toContain("PASS Migration doctor summary:");
	});

	test("doctor fails when a snapshot file is missing", () => {
		const projectDir = path.join(tempRoot, "doctor-missing-snapshot-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "versions", "v1", "save.tsx"));

		expect(() =>
			runCli("node", [entryPath, "migrate", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when a fixture file is missing", () => {
		const projectDir = path.join(tempRoot, "doctor-missing-fixture-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json"));

		expect(() =>
			runCli("node", [entryPath, "migrate", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when unresolved migration markers remain", () => {
		const projectDir = path.join(tempRoot, "doctor-unresolved-project");
		createAmbiguousRenameProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		expect(() =>
			runCli("node", [entryPath, "migrate", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when generated deprecated files drift from discovered edges", () => {
		const projectDir = path.join(tempRoot, "doctor-drift-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.appendFileSync(
			path.join(projectDir, "src", "migrations", "generated", "deprecated.ts"),
			"\n// drift\n",
			"utf8",
		);

		expect(() =>
			runCli("node", [entryPath, "migrate", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("fixtures command skips existing files without force and refreshes with force", () => {
		const projectDir = path.join(tempRoot, "fixtures-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		fs.writeFileSync(
			fixturePath,
			`${JSON.stringify({ cases: [{ input: { content: "custom" }, name: "custom" }], fromVersion: "v1", toVersion: "v3" }, null, "\t")}\n`,
			"utf8",
		);

		const skipOutput = runCli("node", [entryPath, "migrate", "fixtures", "--all"], {
			cwd: projectDir,
		});
		expect(skipOutput).toContain("Preserved existing fixture");
		expect(skipOutput).toContain("use --force to refresh");
		expect(fs.readFileSync(fixturePath, "utf8")).toContain('"custom"');

		const forceOutput = runCli("node", [entryPath, "migrate", "fixtures", "--all", "--force"], {
			cwd: projectDir,
		});
		expect(forceOutput).toContain("Refreshed fixture");
		expect(fs.readFileSync(fixturePath, "utf8")).toContain('"default"');
		expect(fs.readFileSync(fixturePath, "utf8")).not.toContain('"custom"');
	});

	test("fixtures --force prompts before overwriting existing fixtures in interactive mode", () => {
		const projectDir = path.join(tempRoot, "fixtures-force-confirm-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "v1-to-v3.json");
		fs.writeFileSync(
			fixturePath,
			`${JSON.stringify({ cases: [{ input: { content: "custom" }, name: "custom" }], fromVersion: "v1", toVersion: "v3" }, null, "\t")}\n`,
			"utf8",
		);

		const prompts: string[] = [];
		const lines: string[] = [];
		const result = fixturesProjectMigrations(projectDir, {
			all: true,
			confirmOverwrite: (message) => {
				prompts.push(message);
				return false;
			},
			force: true,
			isInteractive: true,
			renderLine: (line) => lines.push(line),
		});

		expect(prompts[0]).toContain("overwrite 1 existing migration fixture file");
		expect(lines.join("\n")).toContain("Cancelled fixture refresh");
		expect(result.generatedVersions).toEqual([]);
		expect(result.skippedVersions.length).toBe(1);
		expect(fs.readFileSync(fixturePath, "utf8")).toContain('"custom"');
	});

	test("snapshot surfaces sync-types recovery guidance when the preflight script fails", () => {
		const projectDir = path.join(tempRoot, "snapshot-sync-types-failure-project");
		createVersionedMigrationProject(projectDir);

		writeJson(
			path.join(projectDir, "package.json"),
			{
				name: "migration-smoke",
				packageManager: "bun@1.3.10",
				private: true,
				scripts: {
					"sync-types": `node -e "process.stderr.write('sync-types failed'); process.exit(1)"`,
				},
				type: "module",
				version: "0.1.0",
			},
		);

		expect(() => snapshotProjectVersion(projectDir, "v4")).toThrow(
			/Could not capture migration snapshot v4 because `bun run sync-types` failed first[\s\S]*Install project dependencies[\s\S]*rerun `bun run sync-types`[\s\S]*retry `wp-typia migrate snapshot --migration-version v4`[\s\S]*Original error:/,
		);
	});

	test("fuzz command succeeds on a healthy migration edge", () => {
		const projectDir = path.join(tempRoot, "fuzz-success-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const output = runCli(
			"node",
			[entryPath, "migrate", "fuzz", "--all", "--iterations", "5", "--seed", "1"],
			{ cwd: projectDir },
		);
		expect(output).toContain("Fuzzed v1 -> v3");
		expect(output).toContain("Migration fuzzing passed for create-block/migration-smoke");
	});

	test("fuzz command reports reproducible failures with the provided seed", () => {
		const projectDir = path.join(tempRoot, "fuzz-failure-project");
		createFuzzFailureProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--all", "--iterations", "5", "--seed", "7"],
				{ cwd: projectDir },
			),
		).toThrow(/seed 7/);
	});

	test("fuzz command accepts seed zero and rejects unsupported requested versions", () => {
		const projectDir = path.join(tempRoot, "fuzz-seed-zero-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		const zeroSeedOutput = runCli(
			"node",
			[entryPath, "migrate", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
			{ cwd: projectDir },
		);
		expect(zeroSeedOutput).toContain("Fuzzed v1 -> v3");

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--from-migration-version", "9.9.9", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Unsupported migration version: 9.9.9[\s\S]*Available legacy migration versions: v1/);
	});

	test("plan, diff, and scaffold reject same-version migration edges early", () => {
		const projectDir = path.join(tempRoot, "same-version-edge-project");
		createVersionedMigrationProject(projectDir);

		expect(() =>
			runCli("node", [entryPath, "migrate", "plan", "--from-migration-version", "v3"], {
				cwd: projectDir,
			}),
		).toThrow(/migrate plan` requires different source and target migration versions[\s\S]*v3/);

		expect(() =>
			runCli("node", [entryPath, "migrate", "diff", "--from-migration-version", "v3"], {
				cwd: projectDir,
			}),
		).toThrow(/migrate diff` requires different source and target migration versions[\s\S]*v3/);

		expect(() =>
			runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1", "--to-migration-version", "v1"], {
				cwd: projectDir,
			}),
		).toThrow(/migrate scaffold` requires different source and target migration versions[\s\S]*v1/);
	});

	test("runMigrationCommand preserves synchronous throws for direct callers", () => {
		const projectDir = path.join(tempRoot, "run-command-sync-contract-project");
		createVersionedMigrationProject(projectDir);
		const command = parseMigrationArgs(["plan", "--from-migration-version", "v3"]);

		expect(() => runMigrationCommand(command, projectDir)).toThrow(
			/migrate plan` requires different source and target migration versions[\s\S]*v3/,
		);
	});

	test("verify defaults to the first legacy version and rejects malformed numeric flags", () => {
		const projectDir = path.join(tempRoot, "verify-default-project");
		createVersionedMigrationProject(projectDir);
		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		const version100Root = path.join(projectDir, "src", "migrations", "versions", "v1");
		const version150Root = path.join(projectDir, "src", "migrations", "versions", "v2");

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.cpSync(version100Root, version150Root, { recursive: true });
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedMigrationVersions: ["v1", "v3"]', 'supportedMigrationVersions: ["v1", "v2", "v3"]'),
			"utf8",
		);
		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v2"], {
			cwd: projectDir,
		});

		const verifyOutput = runCli("node", [entryPath, "migrate", "verify"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified migrations for v1");
		expect(verifyOutput).not.toContain("v2");

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--all", "--iterations", "2.5"],
				{ cwd: projectDir },
			),
		).toThrow(/Invalid iterations: 2.5/);

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--all", "--seed", "10foo"],
				{ cwd: projectDir },
			),
		).toThrow(/Invalid seed: 10foo/);
	});

	test("verify and fuzz fail when selected legacy versions are missing scaffolded edges", () => {
		const projectDir = path.join(tempRoot, "missing-edge-verification-project");
		createVersionedMigrationProject(projectDir);
		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		const version100Root = path.join(projectDir, "src", "migrations", "versions", "v1");
		const version150Root = path.join(projectDir, "src", "migrations", "versions", "v2");

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.cpSync(version100Root, version150Root, { recursive: true });
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedMigrationVersions: ["v1", "v3"]', 'supportedMigrationVersions: ["v1", "v2", "v3"]'),
			"utf8",
		);

		expect(() =>
			runCli("node", [entryPath, "migrate", "verify", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Missing migration verify inputs.*v2[\s\S]*migrate scaffold --from-migration-version v2[\s\S]*migrate doctor --all/);
		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Missing migration fuzz inputs.*v2[\s\S]*migrate scaffold --from-migration-version v2[\s\S]*migrate doctor --all/);
	});

	test("verify and fuzz fail with recovery guidance when generated scripts are missing", () => {
		const projectDir = path.join(tempRoot, "missing-generated-script-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});

		fs.rmSync(path.join(projectDir, "src", "migrations", "generated", "verify.ts"));
		expect(() =>
			runCli("node", [entryPath, "migrate", "verify", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Generated verify script is missing[\s\S]*v1[\s\S]*migrate scaffold --from-migration-version v1[\s\S]*migrate doctor --all/);

		runCli("node", [entryPath, "migrate", "scaffold", "--from-migration-version", "v1"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "generated", "fuzz.ts"));
		expect(() =>
			runCli(
				"node",
				[entryPath, "migrate", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Generated fuzz script is missing[\s\S]*v1[\s\S]*migrate scaffold --from-migration-version v1[\s\S]*migrate doctor --all/);
	});
});
