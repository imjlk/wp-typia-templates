import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { runUtf8Command } from "../../../../tests/helpers/process-utils";
import { writeJsonFile, writeTextFile } from "../../../../tests/helpers/file-fixtures";
import type { ReadlinePrompt } from "../../src/runtime/cli-prompt.js";

export const packageRoot = resolvePackageRoot();
export const entryPath = resolveCliEntryPath();
export const repoTsxPath = resolveRepoTsxBinary();

export function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof runUtf8Command>[2] = {},
) {
	return runUtf8Command(command, args, options);
}

export function writeFile(filePath: string, contents: string) {
	writeTextFile(filePath, contents);
}

export function writeJson(filePath: string, value: unknown) {
	writeJsonFile(filePath, value, "\t");
}

export function resolveRepoTsxBinary() {
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

export function resolvePackageRoot() {
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

export function resolveCliEntryPath() {
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

export function createManifestAttribute(
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

export function createUnionManifestAttribute(
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

export const HELPERS_SOURCE = `export type RenameMap = Record<string, string>;
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

export function createProjectShell(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "migration-smoke",
		packageManager: "bun@1.3.11",
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

export function createCurrentProjectFiles(projectDir: string) {
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

export function createCurrentSingleBlockScaffoldProject(projectDir: string) {
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

export function createMixedSingleBlockProject(projectDir: string) {
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

export function createMalformedFallbackSingleBlockProject(projectDir: string) {
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

export function createMalformedPreferredSingleBlockProject(projectDir: string) {
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

export function createLegacyConfiguredMixedSingleBlockProject(projectDir: string) {
	createMixedSingleBlockProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/legacy-root-layout",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
}

export function createLegacyConfiguredSameNameMixedSingleBlockProject(projectDir: string) {
	createSameNameMixedSingleBlockProject(projectDir);
	writeFile(
		path.join(projectDir, "src", "migrations", "config.ts"),
		`export const migrationConfig = {\n\tblockName: "create-block/current-scaffold",\n\tcurrentMigrationVersion: "v1",\n\tsupportedMigrationVersions: ["v1"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
}

export function createLegacyConfiguredCurrentPreferredSameNameMixedSingleBlockProject(projectDir: string) {
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

export function createSameNameMixedSingleBlockProject(projectDir: string) {
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

export function writeCurrentSnapshot(projectDir: string, version = "v3") {
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

export function createVersionedMigrationProject(projectDir: string) {
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

export function addLegacyVersion(projectDir: string, version: string, sourceVersion = "v1") {
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

export type PromptSelectionCall = {
	defaultValue?: number;
	message: string;
	options: Array<{
		hint?: string;
		label: string;
		value: string;
	}>;
};

export function createStubPrompt(selectedValue: string | undefined, calls: PromptSelectionCall[]): ReadlinePrompt {
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

export function writeMultiBlockCurrentFiles(
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

export function writeMultiBlockSnapshot(
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

export function createMultiBlockMigrationProject(
	projectDir: string,
	{ includeLegacyChild = true }: { includeLegacyChild?: boolean } = {},
) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "multi-block-migration-smoke",
		packageManager: "bun@1.3.11",
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

export function addOfficialWorkspaceInventory(
	projectDir: string,
	blockSlugs: string[],
) {
	const packageJsonPath = path.join(projectDir, "package.json");
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
	packageJson.wpTypia = {
		projectType: "workspace",
		templatePackage: "@wp-typia/create-workspace-template",
		namespace: "create-block",
		textDomain: "create-block",
		phpPrefix: "create_block",
	};
	writeJson(packageJsonPath, packageJson);

	const blockEntries = blockSlugs
		.map(
			(blockSlug) => `\t{
\t\tslug: "${blockSlug}",
\t\tattributeTypeName: "${blockSlug
				.split("-")
				.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
				.join("")}Attributes",
\t\ttypesFile: "src/blocks/${blockSlug}/types.ts",
\t},`,
		)
		.join("\n");

	writeFile(
		path.join(projectDir, "scripts", "block-config.ts"),
		`export interface WorkspaceBlockConfig {
\tslug: string;
\tattributeTypeName: string;
\ttypesFile: string;
\tapiTypesFile?: string;
\topenApiFile?: string;
}

export interface WorkspaceVariationConfig {
\tblock: string;
\tfile: string;
\tslug: string;
}

export interface WorkspacePatternConfig {
\tfile: string;
\tslug: string;
}

export const BLOCKS: WorkspaceBlockConfig[] = [
${blockEntries}
];

export const VARIATIONS: WorkspaceVariationConfig[] = [];

export const PATTERNS: WorkspacePatternConfig[] = [];
`,
	);
}

export function createRetrofitMultiBlockProject(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "retrofit-multi-block",
		packageManager: "bun@1.3.11",
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

export function createRetrofitMultiBlockProjectWithBrokenCandidate(projectDir: string) {
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

export function createSingleBlockProjectWithBrokenMultiBlockCandidate(projectDir: string) {
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

export function createBrokenOnlyMultiBlockProject(projectDir: string) {
	writeJson(path.join(projectDir, "package.json"), {
		name: "broken-only-multi-block",
		packageManager: "bun@1.3.11",
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

export function createRenameCandidateProject(projectDir: string) {
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

export function createNestedRenameProject(projectDir: string) {
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

export function createAmbiguousRenameProject(projectDir: string) {
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

export function createTypeCoercionProject(projectDir: string) {
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

export function createUnionProject(projectDir: string, { removeBranch = false }: { removeBranch?: boolean } = {}) {
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

export function createFuzzFailureProject(projectDir: string) {
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

export function createMigrationTempRoot(prefix = "wp-typia-migrations-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanupMigrationTempRoot(tempRoot: string) {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
