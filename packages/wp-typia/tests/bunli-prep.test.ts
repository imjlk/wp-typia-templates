import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import {
	WP_TYPIA_BUNLI_MIGRATION_DOC,
	WP_TYPIA_CANONICAL_CREATE_USAGE,
	WP_TYPIA_FUTURE_COMMAND_TREE,
	WP_TYPIA_POSITIONAL_ALIAS_USAGE,
	WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES,
} from "../src/command-contract";
import { bunliPreparedCommands } from "../src/cli";

const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const packageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

describe("wp-typia Bunli preparation", () => {
	test("checks in the Bunli prep tree without replacing the active bin", () => {
		expect(packageManifest.bin["wp-typia"]).toBe("bin/wp-typia.js");
		expect(packageManifest.scripts["bunli:build"]).toBe("bunli build");
		expect(packageManifest.scripts["bunli:dev"]).toBe("bunli dev");
		expect(packageManifest.scripts["bunli:test"]).toBe("bunli test");
		expect(packageManifest.devDependencies.bunli).toBe("0.9.0");
		expect(packageManifest.devDependencies["@bunli/core"]).toBe("0.9.0");
		expect(packageManifest.devDependencies["@bunli/test"]).toBe("0.6.0");
		expect(fs.existsSync(path.join(packageRoot, "bunli.config.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "cli.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "create.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "add.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "templates.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "migrations.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "doctor.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "ui", "README.md"))).toBe(true);
	});

	test("future Bunli command tree preserves the reserved top-level taxonomy", async () => {
		expect(WP_TYPIA_FUTURE_COMMAND_TREE.map((command) => command.name)).toEqual([
			...WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES,
		]);
		expect(bunliPreparedCommands.map((command) => command.name)).toEqual([
			...WP_TYPIA_RESERVED_TOP_LEVEL_COMMAND_NAMES,
		]);
		expect(fs.readFileSync(path.join(packageRoot, "src", "cli.ts"), "utf8")).toContain(
			"createCLI(",
		);
	});

	test("maintainer docs keep wp-typia as the only CLI owner", () => {
		const migrationDoc = fs.readFileSync(
			path.join(repoRoot, WP_TYPIA_BUNLI_MIGRATION_DOC),
			"utf8",
		);
		const createReadme = fs.readFileSync(
			path.join(repoRoot, "packages", "create", "README.md"),
			"utf8",
		);

		expect(migrationDoc).toContain("`@wp-typia/create` must remain non-CLI");
		expect(migrationDoc).toContain("`npx wp-typia`");
		expect(migrationDoc).toContain("`bunx wp-typia`");
		expect(migrationDoc).toContain("`>=1.3.11`");
		expect(migrationDoc).toContain(`\`${WP_TYPIA_CANONICAL_CREATE_USAGE}\``);
		expect(migrationDoc).toContain(`\`${WP_TYPIA_POSITIONAL_ALIAS_USAGE}\``);
		expect(createReadme).toContain("This package no longer owns the CLI bin.");
		expect(createReadme).toContain("`wp-typia` is the canonical CLI package.");
	});
});
