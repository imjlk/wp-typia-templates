import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { parseMigrationArgs } from "../lib/migrations.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-wp-typia-migrations-"));
const entryPath = path.resolve(import.meta.dir, "../lib/entry.js");
const repoTsxPath = resolveRepoTsxBinary();

function runCli(
	command: string,
	args: string[],
	options: Parameters<typeof execFileSync>[2] = {},
) {
	return execFileSync(command, args, {
		encoding: "utf8",
		...options,
	});
}

function writeFile(filePath: string, contents: string) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, contents, "utf8");
}

function writeJson(filePath: string, value: unknown) {
	writeFile(filePath, `${JSON.stringify(value, null, "\t")}\n`);
}

function resolveRepoTsxBinary() {
	const candidates = [
		path.resolve(import.meta.dir, "../../../packages/wp-typia-advanced/node_modules/.bin/tsx"),
		path.resolve(import.meta.dir, "../../../packages/wp-typia-basic/node_modules/.bin/tsx"),
		path.resolve(import.meta.dir, "../../../node_modules/.bun/tsx@4.21.0/node_modules/.bin/tsx"),
	];

	const resolved = candidates.find((candidate) => fs.existsSync(candidate));
	if (!resolved) {
		throw new Error("Unable to locate a repo tsx binary for migration verification tests.");
	}

	return resolved;
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
				format: null,
				maxLength: null,
				maximum: null,
				minLength: null,
				minimum: null,
				pattern: null,
				typeTag: null,
			},
			default: defaultValue,
		},
		ts: {
			items: null,
			kind,
			properties: null,
			required,
		},
		wp: {
			default: defaultValue,
			enum: null,
			type: kind,
		},
	};
}

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
		manifestVersion: 1,
		sourceType: "MigrationAttributes",
	});
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
		`export function coerceValueFromManifest(attribute: any, value: unknown) {\n\tif (value !== undefined && value !== null) {\n\t\treturn value;\n\t}\n\treturn attribute?.typia?.default ?? null;\n}\n`,
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
		manifestVersion: 1,
		sourceType: "MigrationAttributes",
	});
	writeFile(
		path.join(projectDir, "src", "migrations", "versions", "1.0.0", "save.tsx"),
		`export default function Save({ attributes }: { attributes: any }) {\n\treturn attributes.content ?? null;\n}\n`,
	);

	const localBinDir = path.join(projectDir, "node_modules", ".bin");
	fs.mkdirSync(localBinDir, { recursive: true });
	fs.symlinkSync(repoTsxPath, path.join(localBinDir, "tsx"));
}

describe("create-wp-typia migrations", () => {
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

		const snapshotBlock = JSON.parse(
			fs.readFileSync(
				path.join(projectDir, "src", "migrations", "versions", "1.0.0", "block.json"),
				"utf8",
			),
		);
		expect(snapshotBlock.editorScript).toBeUndefined();
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
		const fixturePath = path.join(projectDir, "src", "migrations", "fixtures", "1.0.0.json");

		expect(fs.existsSync(rulePath)).toBe(true);
		expect(fs.existsSync(deprecatedPath)).toBe(true);
		expect(fs.existsSync(fixturePath)).toBe(true);

		const ruleSource = fs.readFileSync(rulePath, "utf8");
		const deprecatedSource = fs.readFileSync(deprecatedPath, "utf8");
		expect(ruleSource).not.toContain("TODO MIGRATION:");
		expect(ruleSource).toContain("isVisible");
		expect(deprecatedSource).toContain("deprecated_0");

		const verifyOutput = runCli("node", [entryPath, "migrations", "verify", "--all"], {
			cwd: projectDir,
		});
		expect(verifyOutput).toContain("Verified 1.0.0 -> 2.0.0");
		expect(verifyOutput).toContain("Migration verification passed for create-block/migration-smoke");
	});
});
