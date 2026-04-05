import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { runUtf8Command } from "../../../tests/helpers/process-utils";
import { writeJsonFile, writeTextFile } from "../../../tests/helpers/file-fixtures";
import { createMigrationDiff } from "../src/runtime/migration-diff.js";
import { parseMigrationArgs } from "../src/runtime/index.js";
import {
	fixturesProjectMigrations,
	snapshotProjectVersion,
} from "../src/runtime/migrations.js";
import { loadMigrationProject } from "../src/runtime/migration-project.js";
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
	if (fs.existsSync(directPackageRoot) && fs.existsSync(path.join(cwd, "src", "cli.ts"))) {
		return cwd;
	}

	const nestedPackageRoot = path.join(cwd, "packages", "create");
	if (
		fs.existsSync(path.join(nestedPackageRoot, "package.json")) &&
		fs.existsSync(path.join(nestedPackageRoot, "src", "cli.ts"))
	) {
		return nestedPackageRoot;
	}

	throw new Error("Unable to resolve the @wp-typia/create package root for migration tests.");
}

function resolveCliEntryPath() {
	const cliPath = path.join(packageRoot, "dist", "cli.js");
	if (fs.existsSync(cliPath)) {
		return cliPath;
	}

	execFileSync("bun", ["run", "build"], {
		cwd: packageRoot,
		stdio: "inherit",
	});

	if (!fs.existsSync(cliPath)) {
		throw new Error("Unable to build dist/cli.js for migration tests.");
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
		`export const migrationConfig = {\n\tblockName: "create-block/legacy-root-layout",\n\tcurrentVersion: "1.0.0",\n\tsupportedVersions: ["1.0.0"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
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

function writeCurrentSnapshot(projectDir: string, version = "2.0.0") {
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
		`export const migrationConfig = {\n\tblockName: "create-block/migration-smoke",\n\tcurrentVersion: "2.0.0",\n\tsupportedVersions: ["1.0.0", "2.0.0"],\n\tsnapshotDir: "src/migrations/versions",\n} as const;\n\nexport default migrationConfig;\n`,
	);
	writeFile(
		path.join(projectDir, "src", "migrations", "helpers.ts"),
		HELPERS_SOURCE,
	);
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
		},
		name: "create-block/migration-smoke",
		title: "Migration Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
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
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);
	writeCurrentSnapshot(projectDir);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
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
		`export const migrationConfig = {\n\tcurrentVersion: "2.0.0",\n\tsupportedVersions: ["1.0.0", "2.0.0"],\n\tsnapshotDir: "src/migrations/versions",\n\tblocks: [\n\t\t{\n\t\t\tkey: "multi-parent",\n\t\t\tblockName: "create-block/multi-parent",\n\t\t\tblockJsonFile: "src/blocks/multi-parent/block.json",\n\t\t\tmanifestFile: "src/blocks/multi-parent/typia.manifest.json",\n\t\t\tsaveFile: "src/blocks/multi-parent/save.tsx",\n\t\t\ttypesFile: "src/blocks/multi-parent/types.ts",\n\t\t},\n\t\t{\n\t\t\tkey: "multi-parent-item",\n\t\t\tblockName: "create-block/multi-parent-item",\n\t\t\tblockJsonFile: "src/blocks/multi-parent-item/block.json",\n\t\t\tmanifestFile: "src/blocks/multi-parent-item/typia.manifest.json",\n\t\t\tsaveFile: "src/blocks/multi-parent-item/save.tsx",\n\t\t\ttypesFile: "src/blocks/multi-parent-item/types.ts",\n\t\t},\n\t],\n} as const;\n\nexport default migrationConfig;\n`,
	);
	writeFile(path.join(projectDir, "src", "migrations", "helpers.ts"), HELPERS_SOURCE);
	writeMultiBlockSnapshot(projectDir, "2.0.0", parent, "Hello multi-parent");
	writeMultiBlockSnapshot(projectDir, "2.0.0", child, "Hello multi-parent-item");
	writeMultiBlockSnapshot(projectDir, "1.0.0", parent);
	if (includeLegacyChild) {
		writeMultiBlockSnapshot(projectDir, "1.0.0", child);
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			headline: { type: "string" },
		},
		name: "create-block/rename-smoke",
		title: "Rename Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
		attributes: {
			headline: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "RenameAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			settings: { type: "object" },
		},
		name: "create-block/nested-rename",
		title: "Nested Rename",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
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
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			body: { type: "string" },
			headline: { type: "string" },
		},
		name: "create-block/ambiguous-rename",
		title: "Ambiguous Rename",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
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
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			clickCount: { type: "string" },
		},
		name: "create-block/coercion-smoke",
		title: "Coercion Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
		attributes: {
			clickCount: createManifestAttribute("string", {
				required: true,
			}),
		},
		manifestVersion: 2,
		sourceType: "CoercionAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			linkTarget: { type: "object" },
		},
		name: "create-block/union-smoke",
		title: "Union Smoke",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
		attributes: {
			linkTarget: createUnionManifestAttribute("kind", legacyBranches),
		},
		manifestVersion: 2,
		sourceType: "UnionAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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
\tcurrentVersion: "2.0.0",
\tsupportedVersions: ["1.0.0", "2.0.0"],
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
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"), {
		apiVersion: 3,
		attributes: {
			content: { default: "Hello", type: "string" },
		},
		name: "create-block/fuzz-failure",
		title: "Fuzz Failure",
	});
	writeJson(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), {
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
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
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

describe("wp-typia migrations", () => {
	afterAll(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	test("bun entry bootstraps migrations and sanitizes snapshot metadata", () => {
		const projectDir = path.join(tempRoot, "init-project");
		createCurrentProjectFiles(projectDir);

		runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "config.ts"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "generated", "registry.ts"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "typia-migration-registry.php"))).toBe(true);

		const snapshotBlock = JSON.parse(
			fs.readFileSync(
				path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"),
				"utf8",
			),
		);
		expect(snapshotBlock.editorScript).toBeUndefined();
	});

	test("migrations init auto-detects current single-block scaffold layouts", () => {
		const projectDir = path.join(tempRoot, "init-current-single-block-project");
		createCurrentSingleBlockScaffoldProject(projectDir);

		const output = runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
		expect(configSource).not.toContain("blocks: [");
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"))).toBe(true);
		expect(fs.existsSync(path.join(projectDir, "src", "migrations", "generated", "registry.ts"))).toBe(true);
		expect(output).toContain("Detected single-block migration retrofit: create-block/current-scaffold");
		expect(output).toContain("Wrote src/migrations/config.ts");
	});

	test("migrations init auto-detects multi-block retrofit layouts including hidden compound children", () => {
		const projectDir = path.join(tempRoot, "init-multi-block-project");
		createRetrofitMultiBlockProject(projectDir);

		const output = runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blocks: [");
		expect(configSource).toContain("key: 'multi-parent'");
		expect(configSource).toContain("key: 'multi-parent-item'");
		expect(configSource).toContain("blockJsonFile: 'src/blocks/multi-parent/block.json'");
		expect(configSource).toContain("blockJsonFile: 'src/blocks/multi-parent-item/block.json'");
		expect(
			fs.existsSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "multi-parent", "block.json")),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "versions", "1.0.0", "multi-parent-item", "block.json"),
			),
		).toBe(true);
		expect(output).toContain("Detected multi-block migration retrofit (2 targets):");
		expect(output).toContain("create-block/multi-parent");
		expect(output).toContain("create-block/multi-parent-item");
	});

	test("migrations init prefers the legacy single-block fallback when only the root manifest exists", () => {
		const projectDir = path.join(tempRoot, "init-mixed-single-block-project");
		createMixedSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/legacy-root-layout'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), "utf8"),
		);
		expect(snapshotManifest.attributes.content.typia.defaultValue).toBe("Legacy");
	});

	test("migrations init ignores malformed non-selected single-block layouts", () => {
		const projectDir = path.join(tempRoot, "init-malformed-fallback-single-block-project");
		createMalformedFallbackSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
	});

	test("migrations init falls back from malformed preferred single-block layouts", () => {
		const projectDir = path.join(tempRoot, "init-malformed-preferred-single-block-project");
		createMalformedPreferredSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/legacy-root-layout'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), "utf8"),
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

	test("migrations init keeps manifest-priority when mixed single-block layouts share a block name", () => {
		const projectDir = path.join(tempRoot, "init-same-name-mixed-single-block-project");
		createSameNameMixedSingleBlockProject(projectDir);

		runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
			cwd: projectDir,
		});

		const configSource = fs.readFileSync(path.join(projectDir, "src", "migrations", "config.ts"), "utf8");
		expect(configSource).toContain("blockName: 'create-block/current-scaffold'");
		const snapshotManifest = JSON.parse(
			fs.readFileSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "typia.manifest.json"), "utf8"),
		);
		expect(snapshotManifest.attributes.content.typia.defaultValue).toBe("Legacy");
	});

	test("migrations init fails with actionable guidance when no supported retrofit layout is found", () => {
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
			runCli("bun", [entryPath, "migrations", "init", "--current-version", "1.0.0"], {
				cwd: projectDir,
			}),
		).toThrow(/Unable to auto-detect a supported migration retrofit layout[\s\S]*src\/migrations\/config\.ts/);
	});

	test("migrations help text explains retrofit auto-detection and --all workspace scope", () => {
		expect(() => runCli("node", [entryPath, "migrations"])).toThrow(
			/`migrations init` auto-detects supported single-block and `src\/blocks\/\*` multi-block layouts[\s\S]*--all runs across every configured legacy version and every configured block target\./,
		);
	});

	test("migration arg parser ignores standalone script separators", () => {
		const parsed = parseMigrationArgs(["snapshot", "--", "--version", "1.0.0"]);
		expect(parsed.command).toBe("snapshot");
		expect(parsed.flags.version).toBe("1.0.0");
	});

	test("scaffold and verify generate auto-migration artifacts for additive schema changes", () => {
		const projectDir = path.join(tempRoot, "verify-project");
		createVersionedMigrationProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrations", "diff", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("Migration diff: 1.0.0 -> 2.0.0");
		expect(diffOutput).toContain("add-default");

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-2.0.0.ts");
		const deprecatedPath = path.join(projectDir, "src", "migrations", "generated", "deprecated.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json");
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
		expect(phpRegistrySource).toContain("'currentVersion' => '2.0.0'");
		expect(phpRegistrySource).toContain("'legacyVersions' =>");
		expect(phpRegistrySource).toContain("'1.0.0'");

		const verifyOutput = runCli("node", [entryPath, "migrations", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified 1.0.0 -> 2.0.0");
		expect(verifyOutput).toContain("Migration verification passed for create-block/migration-smoke");
	});

	test("scaffold exposes renameMap and transforms helpers for rename candidates", () => {
		const projectDir = path.join(tempRoot, "rename-project");
		createRenameCandidateProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrations", "diff", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("Auto-applied renames:");
		expect(diffOutput).toContain("content <- headline");

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-2.0.0.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json");
		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

		expect(ruleSource).toContain("export const renameMap");
		expect(ruleSource).toContain('"content": "headline"');
		expect(ruleSource).toContain("export const transforms");
		expect(ruleSource).not.toContain('content: rename candidate from headline');
		expect(ruleSource).toContain('resolveMigrationAttribute(currentManifest.attributes.content, "content", "content", input, renameMap, transforms)');
		expect(fixture.cases.some((entry: { name: string }) => entry.name === "rename:headline->content")).toBe(true);

		const verifyOutput = runCli("node", [entryPath, "migrations", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified 1.0.0 -> 2.0.0");
	});

	test("scaffold auto-applies nested leaf rename candidates", () => {
		const projectDir = path.join(tempRoot, "nested-rename-project");
		createNestedRenameProject(projectDir);

		const diffOutput = runCli("node", [entryPath, "migrations", "diff", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		expect(diffOutput).toContain("settings.label <- settings.title");

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-2.0.0.ts");
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json");
		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

		expect(ruleSource).toContain('"settings.label": "settings.title"');
		expect(ruleSource).toContain('resolveMigrationAttribute(currentManifest.attributes.settings, "settings", "settings", input, renameMap, transforms)');
		expect(
			fixture.cases.some((entry: { name: string }) => entry.name === "rename:settings.title->settings.label"),
		).toBe(true);

		const verifyOutput = runCli("node", [entryPath, "migrations", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified 1.0.0 -> 2.0.0");
	});

	test("ambiguous rename candidates stay unresolved", () => {
		const projectDir = path.join(tempRoot, "ambiguous-rename-project");
		createAmbiguousRenameProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-2.0.0.ts");
		const ruleSource = fs.readFileSync(rulePath, "utf8");

		expect(ruleSource).toContain('// "content": "headline",');
		expect(ruleSource).toContain("rename candidate from");
	});

	test("scaffold suggests transform bodies for semantic coercion", () => {
		const projectDir = path.join(tempRoot, "coercion-project");
		createTypeCoercionProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const rulePath = path.join(projectDir, "src", "migrations", "rules", "1.0.0-to-2.0.0.ts");
		const ruleSource = fs.readFileSync(rulePath, "utf8");

		expect(ruleSource).toContain("export const transforms");
		expect(ruleSource).toContain('// "clickCount": (legacyValue, legacyInput) => {');
		expect(ruleSource).toContain("// const numericValue = typeof legacyValue === \"number\" ? legacyValue : Number(legacyValue ?? 0);");
		expect(ruleSource).toContain("clickCount: transform suggested from clickCount");
	});

	test("union diff distinguishes additive and removal changes", () => {
		const additiveProjectDir = path.join(tempRoot, "union-additive-project");
		createUnionProject(additiveProjectDir, { removeBranch: false });
		const additiveOutput = runCli("node", [entryPath, "migrations", "diff", "--from", "1.0.0"], {
			cwd: additiveProjectDir,
		});
		expect(additiveOutput).toContain("union-branch-addition");

		const removalProjectDir = path.join(tempRoot, "union-removal-project");
		createUnionProject(removalProjectDir, { removeBranch: true });
		const removalOutput = runCli("node", [entryPath, "migrations", "diff", "--from", "1.0.0"], {
			cwd: removalProjectDir,
		});
		expect(removalOutput).toContain("union-branch-removal");
	});

	test("risk summary classifies additive, rename, transform, and union-breaking edges", () => {
		const additiveProjectDir = path.join(tempRoot, "risk-additive-project");
		createVersionedMigrationProject(additiveProjectDir);
		const additiveSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(additiveProjectDir), "1.0.0", "2.0.0"),
		);
		expect(additiveSummary.additive.count).toBeGreaterThan(0);

		const renameProjectDir = path.join(tempRoot, "risk-rename-project");
		createRenameCandidateProject(renameProjectDir);
		const renameSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(renameProjectDir), "1.0.0", "2.0.0"),
		);
		expect(renameSummary.rename.count).toBeGreaterThan(0);

		const transformProjectDir = path.join(tempRoot, "risk-transform-project");
		createTypeCoercionProject(transformProjectDir);
		const transformSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(transformProjectDir), "1.0.0", "2.0.0"),
		);
		expect(transformSummary.semanticTransform.count).toBeGreaterThan(0);

		const unionProjectDir = path.join(tempRoot, "risk-union-project");
		createUnionProject(unionProjectDir, { removeBranch: true });
		const unionSummary = createMigrationRiskSummary(
			createMigrationDiff(loadMigrationProject(unionProjectDir), "1.0.0", "2.0.0"),
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

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "rules", "multi-parent", "1.0.0-to-2.0.0.ts"),
			),
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(projectDir, "src", "migrations", "rules", "multi-parent-item", "1.0.0-to-2.0.0.ts"),
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
			createMigrationDiff(state, "1.0.0", "2.0.0"),
		).toThrow(/block key is required/i);
		expect(() =>
			createMigrationDiff(
				state,
				{ key: "missing-block" } as any,
				"1.0.0",
				"2.0.0",
			),
		).toThrow(/Unknown migration block key: missing-block/);
	});

	test("doctor tolerates block targets that appear only in later versions", () => {
		const projectDir = path.join(tempRoot, "multi-block-late-child-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: false });

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const output = runCli("node", [entryPath, "migrations", "doctor", "--all"], {
			cwd: projectDir,
		});
		expect(output).toContain("PASS Snapshot create-block/multi-parent-item @ 1.0.0: Not present for this version");
		expect(output).toContain("PASS Migration doctor summary:");
	});

	test("doctor fails when a current multi-block snapshot root is missing after introduction", () => {
		const projectDir = path.join(tempRoot, "multi-block-missing-current-snapshot-project");
		createMultiBlockMigrationProject(projectDir, { includeLegacyChild: true });

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.rmSync(
			path.join(projectDir, "src", "migrations", "versions", "2.0.0", "multi-parent-item"),
			{ force: true, recursive: true },
		);

		expect(() =>
			runCli("node", [entryPath, "migrations", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor passes on a healthy migration workspace", () => {
		const projectDir = path.join(tempRoot, "doctor-success-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const output = runCli("node", [entryPath, "migrations", "doctor", "--all"], {
			cwd: projectDir,
		});
		expect(output).toContain("PASS Migration config:");
		expect(output).toContain("PASS Fixture coverage 1.0.0:");
		expect(output).toContain("PASS Risk summary 1.0.0:");
		expect(output).toContain("PASS Migration doctor summary:");
	});

	test("doctor fails when a snapshot file is missing", () => {
		const projectDir = path.join(tempRoot, "doctor-missing-snapshot-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"));

		expect(() =>
			runCli("node", [entryPath, "migrations", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when a fixture file is missing", () => {
		const projectDir = path.join(tempRoot, "doctor-missing-fixture-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json"));

		expect(() =>
			runCli("node", [entryPath, "migrations", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when unresolved migration markers remain", () => {
		const projectDir = path.join(tempRoot, "doctor-unresolved-project");
		createAmbiguousRenameProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		expect(() =>
			runCli("node", [entryPath, "migrations", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("doctor fails when generated deprecated files drift from discovered edges", () => {
		const projectDir = path.join(tempRoot, "doctor-drift-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.appendFileSync(
			path.join(projectDir, "src", "migrations", "generated", "deprecated.ts"),
			"\n// drift\n",
			"utf8",
		);

		expect(() =>
			runCli("node", [entryPath, "migrations", "doctor", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Migration doctor failed/);
	});

	test("fixtures command skips existing files without force and refreshes with force", () => {
		const projectDir = path.join(tempRoot, "fixtures-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json");
		fs.writeFileSync(
			fixturePath,
			`${JSON.stringify({ cases: [{ input: { content: "custom" }, name: "custom" }], fromVersion: "1.0.0", toVersion: "2.0.0" }, null, "\t")}\n`,
			"utf8",
		);

		const skipOutput = runCli("node", [entryPath, "migrations", "fixtures", "--all"], {
			cwd: projectDir,
		});
		expect(skipOutput).toContain("Skipped existing fixture");
		expect(fs.readFileSync(fixturePath, "utf8")).toContain('"custom"');

		const forceOutput = runCli("node", [entryPath, "migrations", "fixtures", "--all", "--force"], {
			cwd: projectDir,
		});
		expect(forceOutput).toContain("Generated fixture");
		expect(fs.readFileSync(fixturePath, "utf8")).toContain('"default"');
		expect(fs.readFileSync(fixturePath, "utf8")).not.toContain('"custom"');
	});

	test("fixtures --force prompts before overwriting existing fixtures in interactive mode", () => {
		const projectDir = path.join(tempRoot, "fixtures-force-confirm-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0-to-2.0.0.json");
		fs.writeFileSync(
			fixturePath,
			`${JSON.stringify({ cases: [{ input: { content: "custom" }, name: "custom" }], fromVersion: "1.0.0", toVersion: "2.0.0" }, null, "\t")}\n`,
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

		expect(() => snapshotProjectVersion(projectDir, "3.0.0")).toThrow(
			/Could not capture migration snapshot 3\.0\.0 because `bun run sync-types` failed first[\s\S]*Install project dependencies[\s\S]*rerun `bun run sync-types`[\s\S]*Original error:/,
		);
	});

	test("fuzz command succeeds on a healthy migration edge", () => {
		const projectDir = path.join(tempRoot, "fuzz-success-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const output = runCli(
			"node",
			[entryPath, "migrations", "fuzz", "--all", "--iterations", "5", "--seed", "1"],
			{ cwd: projectDir },
		);
		expect(output).toContain("Fuzzed 1.0.0 -> 2.0.0");
		expect(output).toContain("Migration fuzzing passed for create-block/migration-smoke");
	});

	test("fuzz command reports reproducible failures with the provided seed", () => {
		const projectDir = path.join(tempRoot, "fuzz-failure-project");
		createFuzzFailureProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--all", "--iterations", "5", "--seed", "7"],
				{ cwd: projectDir },
			),
		).toThrow(/seed 7/);
	});

	test("fuzz command accepts seed zero and rejects unsupported requested versions", () => {
		const projectDir = path.join(tempRoot, "fuzz-seed-zero-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		const zeroSeedOutput = runCli(
			"node",
			[entryPath, "migrations", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
			{ cwd: projectDir },
		);
		expect(zeroSeedOutput).toContain("Fuzzed 1.0.0 -> 2.0.0");

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--from", "9.9.9", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Unsupported migration version: 9.9.9[\s\S]*Available legacy versions: 1\.0\.0/);
	});

	test("diff and scaffold reject same-version migration edges early", () => {
		const projectDir = path.join(tempRoot, "same-version-edge-project");
		createVersionedMigrationProject(projectDir);

		expect(() =>
			runCli("node", [entryPath, "migrations", "diff", "--from", "2.0.0"], {
				cwd: projectDir,
			}),
		).toThrow(/migrations diff` requires different source and target versions[\s\S]*2\.0\.0/);

		expect(() =>
			runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0", "--to", "1.0.0"], {
				cwd: projectDir,
			}),
		).toThrow(/migrations scaffold` requires different source and target versions[\s\S]*1\.0\.0/);
	});

	test("verify defaults to the first legacy version and rejects malformed numeric flags", () => {
		const projectDir = path.join(tempRoot, "verify-default-project");
		createVersionedMigrationProject(projectDir);
		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		const version100Root = path.join(projectDir, "src", "migrations", "versions", "1.0.0");
		const version150Root = path.join(projectDir, "src", "migrations", "versions", "1.5.0");

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.cpSync(version100Root, version150Root, { recursive: true });
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedVersions: ["1.0.0", "2.0.0"]', 'supportedVersions: ["1.0.0", "1.5.0", "2.0.0"]'),
			"utf8",
		);
		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.5.0"], {
			cwd: projectDir,
		});

		const verifyOutput = runCli("node", [entryPath, "migrations", "verify"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified migrations for 1.0.0");
		expect(verifyOutput).not.toContain("1.5.0");

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--all", "--iterations", "2.5"],
				{ cwd: projectDir },
			),
		).toThrow(/Invalid iterations: 2.5/);

		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--all", "--seed", "10foo"],
				{ cwd: projectDir },
			),
		).toThrow(/Invalid seed: 10foo/);
	});

	test("verify and fuzz fail when selected legacy versions are missing scaffolded edges", () => {
		const projectDir = path.join(tempRoot, "missing-edge-verification-project");
		createVersionedMigrationProject(projectDir);
		const configPath = path.join(projectDir, "src", "migrations", "config.ts");
		const version100Root = path.join(projectDir, "src", "migrations", "versions", "1.0.0");
		const version150Root = path.join(projectDir, "src", "migrations", "versions", "1.5.0");

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.cpSync(version100Root, version150Root, { recursive: true });
		fs.writeFileSync(
			configPath,
			fs
				.readFileSync(configPath, "utf8")
				.replace('supportedVersions: ["1.0.0", "2.0.0"]', 'supportedVersions: ["1.0.0", "1.5.0", "2.0.0"]'),
			"utf8",
		);

		expect(() =>
			runCli("node", [entryPath, "migrations", "verify", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Missing migration verify inputs.*1\.5\.0[\s\S]*migrations scaffold --from 1\.5\.0[\s\S]*migrations doctor --all/);
		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Missing migration fuzz inputs.*1\.5\.0[\s\S]*migrations scaffold --from 1\.5\.0[\s\S]*migrations doctor --all/);
	});

	test("verify and fuzz fail with recovery guidance when generated scripts are missing", () => {
		const projectDir = path.join(tempRoot, "missing-generated-script-project");
		createVersionedMigrationProject(projectDir);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});

		fs.rmSync(path.join(projectDir, "src", "migrations", "generated", "verify.ts"));
		expect(() =>
			runCli("node", [entryPath, "migrations", "verify", "--all"], {
				cwd: projectDir,
			}),
		).toThrow(/Generated verify script is missing[\s\S]*1\.0\.0[\s\S]*migrations scaffold --from 1\.0\.0[\s\S]*migrations doctor --all/);

		runCli("node", [entryPath, "migrations", "scaffold", "--from", "1.0.0"], {
			cwd: projectDir,
		});
		fs.rmSync(path.join(projectDir, "src", "migrations", "generated", "fuzz.ts"));
		expect(() =>
			runCli(
				"node",
				[entryPath, "migrations", "fuzz", "--all", "--iterations", "1", "--seed", "0"],
				{ cwd: projectDir },
			),
		).toThrow(/Generated fuzz script is missing[\s\S]*1\.0\.0[\s\S]*migrations scaffold --from 1\.0\.0[\s\S]*migrations doctor --all/);
	});
});
