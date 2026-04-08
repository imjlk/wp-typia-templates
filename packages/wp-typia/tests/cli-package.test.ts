import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import { parseArgs } from "../lib/cli.js";
import { WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES } from "../src/command-contract";

import { runUtf8Command } from "../../../tests/helpers/process-utils";

const packageRoot = path.resolve(import.meta.dir, "..");
const entryPath = path.join(packageRoot, "bin", "wp-typia.js");
const packageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);
const createPackageManifest = JSON.parse(
	fs.readFileSync(path.resolve(packageRoot, "..", "create", "package.json"), "utf8"),
);

describe("wp-typia package", () => {
	test("owns the canonical CLI bin and keeps create as a library dependency", () => {
		expect(packageManifest.name).toBe("wp-typia");
		expect(packageManifest.bin["wp-typia"]).toBe("bin/wp-typia.js");
		expect(packageManifest.dependencies["@wp-typia/create"]).toBe(createPackageManifest.version);
		expect(createPackageManifest.bin).toBeUndefined();
		expect(createPackageManifest.exports["./cli"]).toBeUndefined();
	});

	test("renders help output through the canonical bin", () => {
		const helpOutput = runUtf8Command("node", [entryPath, "--help"]);

		expect(helpOutput).toContain("Usage:");
		expect(helpOutput).toContain("wp-typia create <project-dir>");
		expect(helpOutput).toContain("wp-typia <project-dir> [create flags...]");
		for (const commandName of WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES) {
			expect(helpOutput).toContain(`wp-typia ${commandName}`);
		}
	});

	test("documents create as the canonical verb while keeping the positional alias", () => {
		const helpOutput = runUtf8Command("node", [entryPath, "--help"]);

		expect(helpOutput).toContain("`wp-typia create` is the canonical scaffold command.");
		expect(helpOutput).toContain("backward-compatible alias");
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

	test("rejects empty --package-manager= values during argument parsing", () => {
		expect(() => parseArgs(["demo-block", "--package-manager="])).toThrow(
			"--package-manager requires a value",
		);
	});
});
