import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import {
	WP_TYPIA_BUNLI_MIGRATION_DOC,
	WP_TYPIA_CANONICAL_CREATE_USAGE,
	WP_TYPIA_CANONICAL_MIGRATE_USAGE,
	WP_TYPIA_FUTURE_COMMAND_TREE,
	WP_TYPIA_POSITIONAL_ALIAS_USAGE,
	WP_TYPIA_TOP_LEVEL_COMMAND_NAMES,
	normalizeWpTypiaArgv,
} from "../src/command-contract";
import { wpTypiaCommands } from "../src/command-list";

const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const packageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);

describe("wp-typia Bunli preparation", () => {
	test("checks in the Bunli prep tree without replacing the active bin", () => {
		expect(packageManifest.bin["wp-typia"]).toBe("bin/wp-typia.js");
		expect(packageManifest.scripts["bunli:build"]).toBe("bun run build");
		expect(packageManifest.scripts["bunli:dev"]).toBe("bun src/cli.ts");
		expect(packageManifest.scripts["bunli:test"]).toBe("bun test tests/*.test.ts");
		expect(packageManifest.devDependencies.bunli).toBe("0.9.0");
		expect(packageManifest.dependencies["@bunli/core"]).toBe("0.9.0");
		expect(packageManifest.devDependencies["@bunli/test"]).toBe("0.6.0");
		expect(fs.existsSync(path.join(packageRoot, "bunli.config.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "cli.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "create.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "add.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "templates.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "migrate.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "mcp.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, "src", "commands", "doctor.ts"))).toBe(true);
		expect(fs.existsSync(path.join(packageRoot, ".bunli", "commands.gen.ts"))).toBe(true);
	});

	test("future Bunli command tree preserves the reserved top-level taxonomy", async () => {
		expect(WP_TYPIA_FUTURE_COMMAND_TREE.map((command) => command.name)).toEqual(
			Array.from(WP_TYPIA_TOP_LEVEL_COMMAND_NAMES),
		);
		expect(wpTypiaCommands.map((command) => command.name)).toEqual(
			Array.from(WP_TYPIA_TOP_LEVEL_COMMAND_NAMES),
		);
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

		expect(migrationDoc).toContain("`@wp-typia/project-tools` must remain non-CLI");
		expect(migrationDoc).toContain("`npx wp-typia`");
		expect(migrationDoc).toContain("`bunx wp-typia`");
		expect(migrationDoc).toContain("`>=1.3.11`");
		expect(migrationDoc).toContain(`\`${WP_TYPIA_CANONICAL_CREATE_USAGE}\``);
		expect(migrationDoc).toContain(`\`${WP_TYPIA_CANONICAL_MIGRATE_USAGE}\``);
		expect(migrationDoc).toContain(`\`${WP_TYPIA_POSITIONAL_ALIAS_USAGE}\``);
		expect(createReadme).toContain("deprecated legacy package shell");
		expect(createReadme).toContain("use `wp-typia` for CLI");
	});

	test("alias normalization ignores option values before the first command positional", () => {
		expect(
			normalizeWpTypiaArgv(["--template", "basic", "demo-block"]),
		).toEqual(["--template", "basic", "create", "demo-block"]);
		expect(
			normalizeWpTypiaArgv(["--format", "json", "templates", "list"]),
		).toEqual(["--format", "json", "templates", "list"]);
		expect(
			normalizeWpTypiaArgv(["-t", "basic", "demo-block"]),
		).toEqual(["-t", "basic", "create", "demo-block"]);
		expect(
			normalizeWpTypiaArgv(["--config", "./custom.json", "templates", "list"]),
		).toEqual(["--config", "./custom.json", "templates", "list"]);
		expect(
			normalizeWpTypiaArgv(["-c", "./custom.json", "templates", "list"]),
		).toEqual(["-c", "./custom.json", "templates", "list"]);
	});
});
