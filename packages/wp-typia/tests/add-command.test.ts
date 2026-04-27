import { afterAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { executeAddCommand } from "../src/runtime-bridge";
import {
	linkWorkspaceNodeModules,
	scaffoldOfficialWorkspace,
} from "../../wp-typia-project-tools/tests/helpers/scaffold-test-harness.js";

describe("wp-typia add command bridge", () => {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-add-bridge-"));

	afterAll(() => {
		fs.rmSync(tempRoot, { force: true, recursive: true });
	});

	test("defaults add block to the basic template in non-interactive runs", async () => {
		const projectDir = path.join(tempRoot, "demo-add-basic-default");

		await scaffoldOfficialWorkspace(projectDir);
		linkWorkspaceNodeModules(projectDir);

		const payload = await executeAddCommand({
			cwd: projectDir,
			emitOutput: false,
			flags: {},
			interactive: false,
			kind: "block",
			name: "promo-card",
		});

		expect(payload?.title).toContain("Added workspace block");
		expect(payload?.summaryLines).toContain("Template family: basic");
		expect(
			fs.existsSync(path.join(projectDir, "src", "blocks", "promo-card", "block.json")),
		).toBe(true);
	});

	test(
		"passes binding-source target flags through the add bridge",
		async () => {
			const projectDir = path.join(tempRoot, "demo-add-binding-target");

			await scaffoldOfficialWorkspace(projectDir);
			linkWorkspaceNodeModules(projectDir);
			await expect(
				executeAddCommand({
					cwd: projectDir,
					emitOutput: false,
					flags: {
						block: "counter-card",
					},
					interactive: false,
					kind: "binding-source",
					name: "hero-data",
				}),
			).rejects.toThrow(
				"`wp-typia add binding-source` requires --block and --attribute to be provided together.",
			);
			await executeAddCommand({
				cwd: projectDir,
				emitOutput: false,
				flags: {
					template: "basic",
				},
				interactive: false,
				kind: "block",
				name: "counter-card",
			});

			const payload = await executeAddCommand({
				cwd: projectDir,
				emitOutput: false,
				flags: {
					attribute: "headline",
					block: "counter-card",
				},
				interactive: false,
				kind: "binding-source",
				name: "hero-data",
			});

			expect(payload?.summaryLines).toContain("Target: counter-card.headline");
			expect(
				fs.existsSync(path.join(projectDir, "src", "bindings", "hero-data", "server.php")),
			).toBe(true);
			const blockJson = JSON.parse(
				fs.readFileSync(
					path.join(projectDir, "src", "blocks", "counter-card", "block.json"),
					"utf8",
				),
			);
			expect(blockJson.attributes.headline).toEqual({ type: "string" });
		},
		15_000,
	);

	test(
		"passes block style and transform flags through the add bridge",
		async () => {
			const projectDir = path.join(tempRoot, "demo-add-style-transform");

			await scaffoldOfficialWorkspace(projectDir);
			linkWorkspaceNodeModules(projectDir);
			await executeAddCommand({
				cwd: projectDir,
				emitOutput: false,
				flags: {
					template: "basic",
				},
				interactive: false,
				kind: "block",
				name: "counter-card",
			});
			await expect(
				executeAddCommand({
					cwd: projectDir,
					emitOutput: false,
					flags: {},
					interactive: false,
					kind: "style",
					name: "callout-emphasis",
				}),
			).rejects.toThrow("`wp-typia add style` requires --block <block-slug>.");

			const stylePayload = await executeAddCommand({
				cwd: projectDir,
				emitOutput: false,
				flags: {
					block: "counter-card",
				},
				interactive: false,
				kind: "style",
				name: "callout-emphasis",
			});
			const transformPayload = await executeAddCommand({
				cwd: projectDir,
				emitOutput: false,
				flags: {
					from: "core/quote",
					to: "counter-card",
				},
				interactive: false,
				kind: "transform",
				name: "quote-to-counter",
			});

			expect(stylePayload?.summaryLines).toContain(
				"Block style: callout-emphasis",
			);
			expect(transformPayload?.summaryLines).toContain(
				"Block transform: quote-to-counter",
			);
			expect(transformPayload?.summaryLines).toContain("From: core/quote");
			expect(transformPayload?.summaryLines).toContain(
				"To: demo-space/counter-card",
			);
			expect(
				fs.existsSync(
					path.join(
						projectDir,
						"src",
						"blocks",
						"counter-card",
						"styles",
						"callout-emphasis.ts",
					),
				),
			).toBe(true);
			expect(
				fs.existsSync(
					path.join(
						projectDir,
						"src",
						"blocks",
						"counter-card",
						"transforms",
						"quote-to-counter.ts",
					),
				),
			).toBe(true);
		},
		15_000,
	);
});
