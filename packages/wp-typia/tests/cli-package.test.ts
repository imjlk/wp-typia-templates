import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
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
const runtimeBridgeSource = fs.readFileSync(
	path.join(packageRoot, "src", "runtime-bridge.ts"),
	"utf8",
);
const doctorCommandSource = fs.readFileSync(
	path.join(packageRoot, "src", "commands", "doctor.ts"),
	"utf8",
);
const addFlowSource = fs.readFileSync(
	path.join(packageRoot, "src", "ui", "add-flow.tsx"),
	"utf8",
);

function runCapturedCommand(
	command: string,
	args: string[],
	options: Parameters<typeof spawnSync>[2] = {},
) {
	return spawnSync(command, args, {
		...options,
		encoding: "utf8",
	});
}

function withoutAIAgentEnv(): NodeJS.ProcessEnv {
	return {
		...process.env,
		AGENT: "",
		AMP_CURRENT_THREAD_ID: "",
		CLAUDECODE: "",
		CLAUDE_CODE: "",
		CODEX_CI: "",
		CODEX_SANDBOX: "",
		CODEX_THREAD_ID: "",
		CURSOR_AGENT: "",
		GEMINI_CLI: "",
		OPENCODE: "",
	};
}

function withoutLocalBunEnv(): NodeJS.ProcessEnv {
	return {
		...withoutAIAgentEnv(),
		BUN_BIN: path.join(os.tmpdir(), "wp-typia-missing-bun"),
		PATH: path.dirname(process.execPath),
	};
}

function createSyncFixture(options: {
	packageManager?: string | null;
	scripts: Record<string, string>;
	withSyncTypesMarker?: boolean;
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
				...(options.packageManager === null
					? {}
					: {
							packageManager: options.packageManager ?? "npm@11.6.1",
					  }),
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
	if (options.withSyncTypesMarker !== false) {
		fs.writeFileSync(
			path.join(fixtureRoot, "scripts", "sync-types-to-block-json.ts"),
			"export {};\n",
			"utf8",
		);
	}

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

function parseJsonObjectFromOutput<T>(output: string): T {
	const trimmed = output.trim();
	const jsonStart = trimmed.startsWith("{") ? 0 : trimmed.lastIndexOf("\n{");
	const jsonSource = (
		jsonStart >= 0 ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1) : trimmed
	).trim();
	return JSON.parse(jsonSource) as T;
}

function parseJsonArrayFromOutput<T>(output: string): T {
	const trimmed = output.trim();
	const jsonStart = trimmed.startsWith("[") ? 0 : trimmed.lastIndexOf("\n[");
	const jsonSource = (
		jsonStart >= 0 ? trimmed.slice(jsonStart === 0 ? 0 : jsonStart + 1) : trimmed
	).trim();
	return JSON.parse(jsonSource) as T;
}

describe("wp-typia package", () => {
	test("owns the canonical CLI bin and keeps project-tools as a library dependency", () => {
		expect(packageManifest.name).toBe("wp-typia");
		expect(packageManifest.bin["wp-typia"]).toBe("bin/wp-typia.js");
		expect(packageManifest.dependencies["@wp-typia/project-tools"]).toBe(projectToolsPackageManifest.version);
		expect(projectToolsPackageManifest.bin).toBeUndefined();
		expect(projectToolsPackageManifest.exports["./cli"]).toBeUndefined();
		expect(projectToolsPackageManifest.exports["./cli-add"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./cli-diagnostics"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./cli-doctor"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./cli-prompt"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./cli-scaffold"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./cli-templates"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./hooked-blocks"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./migrations"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./package-managers"]).toBeDefined();
		expect(projectToolsPackageManifest.exports["./workspace-project"]).toBeDefined();
	});

	test("keeps CLI React dependencies dedupe-friendly for Bunli peers", () => {
		expect(packageManifest.dependencies.react).toBe(packageManifest.dependencies["react-dom"]);
		expect(packageManifest.dependencies.react).toMatch(/^\^/);
		expect(packageManifest.dependencies["react-dom"]).toMatch(/^\^/);
	});

	test("avoids eager project-tools root imports on CLI startup paths", () => {
		expect(runtimeBridgeSource).not.toMatch(/from ["']@wp-typia\/project-tools["']/);
		expect(doctorCommandSource).not.toMatch(/from ["']@wp-typia\/project-tools["']/);
		expect(addFlowSource).not.toMatch(/from ["']@wp-typia\/project-tools["']/);
	});

	test("renders help output through the canonical bin", () => {
		const helpOutput = runUtf8Command("node", [entryPath, "--help"]);
		const createHelpOutput = runUtf8Command("node", [entryPath, "create", "--help"]);
		const addHelpOutput = runUtf8Command("node", [entryPath, "add", "--help"]);

		for (const commandName of WP_TYPIA_TOP_LEVEL_COMMAND_NAMES) {
			expect(helpOutput).toContain(commandName);
		}
		expect(createHelpOutput).toContain("--external-layer-source");
		expect(createHelpOutput).toContain("--external-layer-id");
		expect(addHelpOutput).toContain("--external-layer-source");
		expect(addHelpOutput).toContain("--external-layer-id");
	});

	test("returns structured version output through the canonical bin", () => {
		const output = runUtf8Command("node", [entryPath, "--version"]);
		const parsed = parseJsonObjectFromOutput<{
			data?: { name?: string; type?: string; version?: string };
			ok?: boolean;
		}>(output);

		expect(parsed.ok).toBe(true);
		expect(parsed.data?.type).toBe("version");
		expect(parsed.data?.name).toBe("wp-typia");
		expect(parsed.data?.version).toBe(packageManifest.version);
	});

	test("runs the published version path without requiring a local Bun binary", () => {
		const result = runCapturedCommand(process.execPath, [entryPath, "--version"], {
			env: withoutLocalBunEnv(),
		});

		expect(result.status).toBe(0);
		expect(result.stderr).toBe("");
		const parsed = parseJsonObjectFromOutput<{
			data?: { name?: string; type?: string; version?: string };
			ok?: boolean;
		}>(result.stdout);
		expect(parsed.ok).toBe(true);
		expect(parsed.data?.type).toBe("version");
		expect(parsed.data?.name).toBe("wp-typia");
		expect(parsed.data?.version).toBe(packageManifest.version);
	});

	test("renders general and command help without requiring a local Bun binary", () => {
		const helpResult = runCapturedCommand(process.execPath, [entryPath, "--help"], {
			env: withoutLocalBunEnv(),
		});
		const createHelpResult = runCapturedCommand(
			process.execPath,
			[entryPath, "create", "--help"],
			{
				env: withoutLocalBunEnv(),
			},
		);

		expect(helpResult.status).toBe(0);
		expect(helpResult.stderr).toBe("");
		expect(helpResult.stdout).toContain("Canonical CLI package for wp-typia scaffolding");
		expect(helpResult.stdout).toContain("Supported without a local Bun binary:");
		expect(createHelpResult.status).toBe(0);
		expect(createHelpResult.stderr).toBe("");
		expect(createHelpResult.stdout).toContain("--external-layer-source");
		expect(createHelpResult.stdout).toContain("--external-layer-id");
	});

	test("keeps value-taking options from being mistaken for Bun-only commands", () => {
		const targetDir = path.join(os.tmpdir(), `wp-typia-mcp-namespace-${Date.now()}`);
		const result = runCapturedCommand(
			process.execPath,
			[
				entryPath,
				"--namespace",
				"mcp",
				"create",
				targetDir,
				"--template",
				"basic",
				"--package-manager",
				"npm",
				"--yes",
				"--no-install",
			],
			{
				env: withoutLocalBunEnv(),
			},
		);

		expect(result.status).toBe(0);
		expect(result.stderr).not.toContain("requires Bun");
		expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "block.json"))).toBe(true);
	});

	test("packs a built dist-bunli runtime for the published CLI entrypoint", () => {
		const packResult = runCapturedCommand("npm", ["pack", "--json", "--pack-destination", packageRoot], {
			cwd: packageRoot,
		});

		expect(packResult.status).toBe(0);
		const parsed = parseJsonArrayFromOutput<Array<{
			filename: string;
			files: Array<{ path: string }>;
		}>>(packResult.stdout);
		const tarball = parsed[0];
		expect(tarball?.files.some((entry) => entry.path === "dist-bunli/cli.js")).toBe(true);
		expect(tarball?.files.some((entry) => entry.path === "dist-bunli/node-cli.js")).toBe(true);
		expect(tarball?.files.some((entry) => entry.path === "bin/wp-typia.js")).toBe(true);
		expect(tarball?.files.some((entry) => entry.path === "src/cli.ts")).toBe(false);

		if (tarball?.filename) {
			fs.rmSync(path.join(packageRoot, tarball.filename), { force: true });
		}
	}, 15000);

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

	test("accepts custom scaffold sync scripts without the built-in sync-types marker", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			scripts: {
				sync: "node scripts/record.mjs sync",
			},
			withSyncTypesMarker: false,
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

	test("infers npm when a legacy sync project omits the packageManager field", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			packageManager: null,
			scripts: {
				sync: "node scripts/record.mjs sync",
			},
			withSyncTypesMarker: false,
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

	test("falls back to sync-types without requiring the built-in marker layout", () => {
		const { fixtureRoot, logPath } = createSyncFixture({
			scripts: {
				"sync-types": "node scripts/record.mjs sync-types",
			},
			withSyncTypesMarker: false,
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

	test("rejects typo-like positional alias invocations with extra arguments", () => {
		const result = runCapturedCommand("node", [entryPath, "temlates", "list"], {
			env: withoutAIAgentEnv(),
		});

		expect(result.status).toBe(1);
		expect(result.stderr).toContain(
			"The positional alias only accepts a single project directory.",
		);
		expect(result.stderr).toContain("`wp-typia create <project-dir>`");
		expect(result.stderr).toContain("check the command spelling");
		expect(result.stderr).toContain("`list`");
	});

	test("formats create failures with a shared non-interactive diagnostic block", () => {
		const result = runCapturedCommand("node", [entryPath, "create"]);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Error: wp-typia create failed");
		expect(result.stderr).toContain("Summary: Unable to complete the requested create workflow.");
		expect(result.stderr).toContain("- `wp-typia create` requires <project-dir>.");
	});

	test("formats add failures with a shared non-interactive diagnostic block", () => {
		const result = runCapturedCommand("node", [entryPath, "add", "variation", "promo-card"]);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Error: wp-typia add failed");
		expect(result.stderr).toContain("Summary: Unable to complete the requested add workflow.");
		expect(result.stderr).toContain("- `wp-typia add variation` requires --block <block-slug>.");
	});

	test("formats migrate failures with a shared non-interactive diagnostic block", () => {
		const result = runCapturedCommand("node", [entryPath, "migrate", "init"]);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Error: wp-typia migrate failed");
		expect(result.stderr).toContain(
			"Summary: Unable to complete the requested migration command.",
		);
		expect(result.stderr).toContain(
			"- `migrate init` requires --current-migration-version <label>.",
		);
	});

	test("formats doctor failures with a summary block while keeping streamed check output", () => {
		const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-doctor-diagnostics-"));

		try {
			fs.writeFileSync(
				path.join(fixtureRoot, "package.json"),
				`${JSON.stringify(
					{
						name: "broken-workspace",
						private: true,
						wpTypia: {
							projectType: "workspace",
						},
					},
					null,
					2,
				)}\n`,
				"utf8",
			);

			const result = runCapturedCommand("node", [entryPath, "doctor"], {
				cwd: fixtureRoot,
				env: withoutAIAgentEnv(),
			});

			expect(result.status).toBe(1);
			expect(result.stdout).toContain("FAIL Workspace package metadata:");
			expect(result.stdout).toContain("FAIL wp-typia doctor summary:");
			expect(result.stderr).toContain("Error: wp-typia doctor failed");
			expect(result.stderr).toContain("Summary: One or more doctor checks failed.");
			expect(result.stderr).toContain("- Workspace package metadata:");
		} finally {
			fs.rmSync(fixtureRoot, { force: true, recursive: true });
		}
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

	test("loads baseline create defaults from package.json#wp-typia in the Node fallback", () => {
		const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-node-config-defaults-"));
		const targetDir = path.join(tempRoot, "demo-config-defaults");

		try {
			fs.writeFileSync(
				path.join(tempRoot, "package.json"),
				`${JSON.stringify(
					{
						name: "node-config-defaults",
						private: true,
						"wp-typia": {
							create: {
								"package-manager": "npm",
								template: "basic",
								yes: true,
								"no-install": true,
							},
						},
					},
					null,
					2,
				)}\n`,
				"utf8",
			);

			const result = runCapturedCommand(process.execPath, [entryPath, "create", targetDir], {
				cwd: tempRoot,
				env: withoutLocalBunEnv(),
			});

			expect(result.status).toBe(0);
			expect(result.stderr).toBe("");
			expect(fs.existsSync(path.join(targetDir, "package.json"))).toBe(true);
			expect(fs.existsSync(path.join(targetDir, "src", "block.json"))).toBe(true);
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

	test("rejects unknown short options in the Node fallback parser", () => {
		const result = runCapturedCommand(process.execPath, [entryPath, "create", "-x", "demo-short-flag"], {
			env: withoutLocalBunEnv(),
		});

		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Unknown option `-x`.");
	});
});
