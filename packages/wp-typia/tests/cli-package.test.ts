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

	test("rejects the removed migrations alias with actionable guidance", () => {
		expect(() => runUtf8Command("node", [entryPath, "migrations", "plan"])).toThrow(
			/removed in favor of `wp-typia migrate`/,
		);
	});

	test("fails add variation with an actionable placeholder message", () => {
		expect(() => runUtf8Command("node", [entryPath, "add", "variation"])).toThrow(
			"`wp-typia add variation` is not implemented yet.",
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
});
