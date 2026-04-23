import { describe, expect, test } from "bun:test";

import {
	ADD_OPTION_METADATA,
	buildCommandOptionParser,
	CREATE_OPTION_METADATA,
	GLOBAL_OPTION_METADATA,
	parseCommandArgvWithMetadata,
	resolveCommandOptionValues,
	SYNC_OPTION_METADATA,
} from "../src/command-option-metadata";

describe("command option metadata helpers", () => {
	test("parses string and boolean flags from shared metadata", () => {
		const parsed = parseCommandArgvWithMetadata(
			["--dry-run", "-t", "basic", "-y", "demo-project"],
			{
				extraBooleanOptionNames: ["help", "version"],
				parser: buildCommandOptionParser(
					GLOBAL_OPTION_METADATA,
					CREATE_OPTION_METADATA,
				),
			},
		);

		expect(parsed.flags).toEqual({
			"dry-run": true,
			template: "basic",
			yes: true,
		});
		expect(parsed.positionals).toEqual(["demo-project"]);
	});

	test("merges defaults and flags through metadata-backed resolution", () => {
		const resolved = resolveCommandOptionValues(CREATE_OPTION_METADATA, {
			defaults: {
				"dry-run": true,
				"package-manager": "npm",
				template: "basic",
			},
			flags: {
				"package-manager": "bun",
			},
		});

		expect(resolved["dry-run"]).toBe(true);
		expect(resolved["no-install"]).toBe(false);
		expect(resolved["package-manager"]).toBe("bun");
		expect(resolved.template).toBe("basic");
	});

	test("supports option subsets for add-flow initial values", () => {
		const resolved = resolveCommandOptionValues(ADD_OPTION_METADATA, {
			defaults: {
				"data-storage": "post-meta",
				"dry-run": true,
				template: "persistence",
			},
			flags: {
				"external-layer-source": "./layers",
			},
			optionNames: Object.keys(ADD_OPTION_METADATA).filter(
				(optionName) => optionName !== "dry-run",
			),
		});

		expect(resolved["data-storage"]).toBe("post-meta");
		expect(resolved["external-layer-source"]).toBe("./layers");
		expect(resolved.template).toBe("persistence");
		expect("dry-run" in resolved).toBe(false);
	});

	test("parses sync preview flags from shared metadata", () => {
		const parsed = parseCommandArgvWithMetadata(["--dry-run", "--check"], {
			extraBooleanOptionNames: ["help", "version"],
			parser: buildCommandOptionParser(
				GLOBAL_OPTION_METADATA,
				SYNC_OPTION_METADATA,
			),
		});

		expect(parsed.flags).toEqual({
			check: true,
			"dry-run": true,
		});
		expect(parsed.positionals).toEqual([]);
	});
});
