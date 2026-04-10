import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { WP_TYPIA_TOP_LEVEL_COMMAND_NAMES } from "../src/command-contract";

import { runUtf8Command } from "../../../tests/helpers/process-utils";

const packageRoot = path.resolve(import.meta.dir, "..");
const entryPath = path.join(packageRoot, "bin", "wp-typia.js");
const packageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);
const projectToolsPackageManifest = JSON.parse(
	fs.readFileSync(path.resolve(packageRoot, "..", "wp-typia-project-tools", "package.json"), "utf8"),
);

function createSyncFixture(options: {
	packageManager?: string;
	scripts: Record<string, string>;
	withSyncRestMarker?: boolean;
}): { fixtureRoot: string; logPath: string } {
	const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-sync-fixture-"));
	const logPath = path.join(fixtureRoot, ".sync-log.jsonl");

	fs.mkdirSync(path.join(fixtureRoot, "scripts"), { recursive: true });
	fs.writeFileSync(
		path.join(fixtureRoot, "package.json"),
		`${JSON.stringify(
			{
				name: path.basename(fixtureRoot),
				packageManager: options.packageManager ?? "npm@11.6.1",
				private: true,
				scripts: options.scripts,
			},
			null,
			2,
		)}\n`,
		"utf8",
	);
	fs.writeFileSync(
		path.join(fixtureRoot, "scripts", "record.mjs"),
		`import fs from "node:fs";
import path from "node:path";

const [, , label, ...args] = process.argv;
const logPath = path.join(process.cwd(), ".sync-log.jsonl");
fs.appendFileSync(logPath, \`\${JSON.stringify({ args, label })}\n\`);
`,
		"utf8",
	);
	fs.writeFileSync(
		path.join(fixtureRoot, "scripts", "sync-types-to-block-json.ts"),
		"export {};\n",
		"utf8",
	);

	if (options.withSyncRestMarker) {
		fs.writeFileSync(
			path.join(fixtureRoot, "scripts", "sync-rest-contracts.ts"),
			"export {};\n",
			"utf8",
		);
	}

	return { fixtureRoot, logPath };
}

function readSyncLog(logPath: string): Array<{ args: string[]; label: string }> {
	if (!fs.existsSync(logPath)) {
		return [];
	}

	return fs
		.readFileSync(logPath, "utf8")
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line) as { args: string[]; label: string });
}

describe("wp-typia package", () => {
	test("owns the canonical CLI bin and keeps project-tools as a library dependency", () => {
		expect(packageManifest.name).toBe("wp-typia");
		expect(packageManifest.bin["wp-typia"]).toBe("bin/wp-typia.js");
		expect(packageManifest.dependencies["@wp-typia/project-tools"]).toBe(projectToolsPackageManifest.version);
		expect(projectToolsPackageManifest.bin).toBeUndefined();
		expect(projectToolsPackageManifest.exports["./cli"]).toBeUndefined();
	});

	test("renders help output through the canonical bin", () => {
		const helpOutput = runUtf8Command("node", [entryPath, "--help"]);

		for (const commandName of WP_TYPIA_TOP_LEVEL_COMMAND_NAMES) {
			expect(helpOutput).toContain(commandName);
		}
	});

	test("returns structured version output through the canonical bin", () => {
		const output = runUtf8Command("node", [entryPath, "--version"]);
		const parsed = JSON.parse(output) as {
			data?: { name?: string; type?: string; version?: string };
			ok?: boolean;
		};

		expect(parsed.ok).toBe(true);
		expect(parsed.data?.type).toBe("version");
		expect(parsed.data?.name).toBe("wp-typia");
		expect(parsed.data?.version).toBe(packageManifest.version);
	});

	test("rejects sync outside a generated project root with explicit guidance", () => {
		const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-sync-outside-"));

		try {
			expect(() =>
				runUtf8Command("node", [entryPath, "sync"], {
					cwd: tempRoot,
				}),
			).toThrow(/Run `wp-typia sync` from a scaffolded project or official workspace root/);
		} finally {
			fs.rmSync(tempRoot, { force: true, recursive: true });
		}
	});

	test("prefers the project-local sync script and forwards --check", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			scripts: {
				sync: "node scripts/record.mjs sync",
				"sync-rest": "node scripts/record.mjs sync-rest",
				"sync-types": "node scripts/record.mjs sync-types",
			},
			withSyncRestMarker: true,
		});

		try {
			runUtf8Command("node", [entryPath, "sync", "--check"], {
				cwd: fixtureRoot,
			});

			expect(readSyncLog(logPath)).toEqual([
				{
					args: ["--check"],
					label: "sync",
				},
			]);
		} finally {
			fs.rmSync(fixtureRoot, { force: true, recursive: true });
		}
	});

	test("falls back to sync-types only for legacy single-block projects", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			scripts: {
				"sync-types": "node scripts/record.mjs sync-types",
			},
		});

		try {
			runUtf8Command("node", [entryPath, "sync"], {
				cwd: fixtureRoot,
			});

			expect(readSyncLog(logPath)).toEqual([
				{
					args: [],
					label: "sync-types",
				},
			]);
		} finally {
			fs.rmSync(fixtureRoot, { force: true, recursive: true });
		}
	});

	test("falls back to sync-types then sync-rest for legacy persistence projects", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			scripts: {
				"sync-rest": "node scripts/record.mjs sync-rest",
				"sync-types": "node scripts/record.mjs sync-types",
			},
			withSyncRestMarker: true,
		});

		try {
			runUtf8Command("node", [entryPath, "sync", "--check"], {
				cwd: fixtureRoot,
			});

			expect(readSyncLog(logPath)).toEqual([
				{
					args: ["--check"],
					label: "sync-types",
				},
				{
					args: ["--check"],
					label: "sync-rest",
				},
			]);
		} finally {
			fs.rmSync(fixtureRoot, { force: true, recursive: true });
		}
	});

	test("rejects the removed migrations alias with actionable guidance", () => {
		expect(() => runUtf8Command("node", [entryPath, "migrations", "plan"])).toThrow(
			/removed in favor of `wp-typia migrate`/,
		);
	});

	test("requires --block for add variation", () => {
		expect(() => runUtf8Command("node", [entryPath, "add", "variation", "promo-card"])).toThrow(
			"`wp-typia add variation` requires --block <block-slug>.",
		);
	});

	test("requires --anchor and --position for add hooked-block", () => {
		expect(() => runUtf8Command("node", [entryPath, "add", "hooked-block", "promo-card"])).toThrow(
			"`wp-typia add hooked-block` requires --anchor <anchor-block-name>.",
		);
		expect(() =>
			runUtf8Command("node", [
				entryPath,
				"add",
				"hooked-block",
				"promo-card",
				"--anchor",
				"core/post-content",
			]),
		).toThrow(
			"`wp-typia add hooked-block` requires --position <before|after|firstChild|lastChild>.",
		);
	});

	test("requires a project directory for the explicit create command", () => {
		expect(() => runUtf8Command("node", [entryPath, "create"])).toThrow(
			"`wp-typia create` requires <project-dir>.",
		);
	});

	test("prints migrate help through the canonical verb", () => {
		const helpOutput = runUtf8Command("node", [entryPath, "migrate"]);
		expect(helpOutput).toContain("wp-typia migrate init");
	});

	test("exposes shell completions through the Bunli plugin surface", () => {
		const output = runUtf8Command("node", [entryPath, "completions", "bash"]);

		expect(output).toContain("# bash completion for wp-typia");
		expect(output).toContain("wp-typia complete --");
	});

	test("exposes skills listing through the Bunli plugin surface", () => {
		const output = runUtf8Command("node", [entryPath, "skills", "list"]);

		expect(output).toContain("\"agents\": [");
		expect(output).toMatch(/Detected|No agents detected/);
	});

	test("fails mcp list with actionable config guidance when no schema sources are configured", () => {
		expect(() => runUtf8Command("node", [entryPath, "mcp", "list"])).toThrow(
			"No MCP schema sources are configured.",
		);
	});

	test("loads MCP schema sources from an explicit --config override", () => {
		const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-mcp-config-"));
		const schemaPath = path.join(tempRoot, "mcp-tools.json");
		const configPath = path.join(tempRoot, "wp-typia.config.json");

		try {
			fs.writeFileSync(
				schemaPath,
				`${JSON.stringify([{ description: "Ping test tool", name: "ping" }], null, 2)}\n`,
				"utf8",
			);
			fs.writeFileSync(
				configPath,
				`${JSON.stringify({
					mcp: {
						schemaSources: [
							{
								namespace: "demo",
								path: schemaPath,
							},
						],
					},
				}, null, 2)}\n`,
				"utf8",
			);

			const output = runUtf8Command("node", [entryPath, "--config", configPath, "mcp", "list"]);
			const parsed = JSON.parse(output) as {
				groups: Array<{ namespace: string; toolCount: number; tools: string[] }>;
			};
			expect(parsed.groups).toEqual([
				{
					namespace: "demo",
					toolCount: 1,
					tools: ["ping"],
				},
			]);
		} finally {
			fs.rmSync(tempRoot, { force: true, recursive: true });
		}
	});

	test("honors explicit machine-readable output for mcp list", () => {
		const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-mcp-format-"));
		const schemaPath = path.join(tempRoot, "mcp-tools.json");
		const configPath = path.join(tempRoot, "wp-typia.config.json");

		try {
			fs.writeFileSync(
				schemaPath,
				`${JSON.stringify([{ description: "Ping test tool", name: "ping" }], null, 2)}\n`,
				"utf8",
			);
			fs.writeFileSync(
				configPath,
				`${JSON.stringify({
					mcp: {
						schemaSources: [
							{
								namespace: "demo",
								path: schemaPath,
							},
						],
					},
				}, null, 2)}\n`,
				"utf8",
			);

			const output = runUtf8Command("node", [
				entryPath,
				"--config",
				configPath,
				"mcp",
				"list",
				"--format",
				"json",
			]);
			const parsed = JSON.parse(output) as {
				groups: Array<{ namespace: string; toolCount: number; tools: string[] }>;
			};
			expect(parsed.groups[0]).toEqual({
				namespace: "demo",
				toolCount: 1,
				tools: ["ping"],
			});
		} finally {
			fs.rmSync(tempRoot, { force: true, recursive: true });
		}
	});

	test("honors explicit machine-readable output for templates list", () => {
		const output = runUtf8Command("node", [entryPath, "templates", "list", "--format", "json"]);
		const parsed = JSON.parse(output) as {
			templates: Array<{ id: string }>;
		};

		expect(parsed.templates.length).toBeGreaterThan(0);
		expect(parsed.templates.some((entry) => entry.id === "basic")).toBe(true);
		expect(
			parsed.templates.some(
				(entry) => entry.id === "@wp-typia/create-workspace-template",
			),
		).toBe(true);
	});

	test("treats templates --id as an alias for templates inspect", () => {
		const output = runUtf8Command("node", [
			entryPath,
			"templates",
			"--id",
			"basic",
			"--format",
			"json",
		]);
		const parsed = JSON.parse(output) as {
			template?: { id?: string; description?: string };
			templates?: Array<{ id: string }>;
		};

		expect(parsed.templates).toBeUndefined();
		expect(parsed.template?.id).toBe("basic");
		expect(parsed.template?.description).toContain("Typia validation");
	});

	test("inspects the official workspace template through the canonical templates command", () => {
		const output = runUtf8Command("node", [
			entryPath,
			"templates",
			"inspect",
			"@wp-typia/create-workspace-template",
			"--format",
			"json",
		]);
		const parsed = JSON.parse(output) as {
			template?: { id?: string; description?: string };
		};

		expect(parsed.template?.id).toBe("@wp-typia/create-workspace-template");
		expect(parsed.template?.description).toContain("official empty workspace");
	});
});
