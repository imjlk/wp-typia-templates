import { describe, expect, test } from "bun:test";

import { runCli } from "../../scripts/deprecate-archived-npm-entrypoints.mjs";

function createBufferWriter() {
	let value = "";

	return {
		writer: {
			write(chunk: string) {
				value += chunk;
			},
		},
		read() {
			return value;
		},
	};
}

describe("deprecate-archived-npm-entrypoints", () => {
	test("rejects --package when the archived entrypoint name is missing", () => {
		const stdout = createBufferWriter();
		const stderr = createBufferWriter();

		expect(
			runCli({
				argv: ["--package"],
				stdout: stdout.writer,
				stderr: stderr.writer,
			}),
		).toBe(1);
		expect(stdout.read()).toBe("");
		expect(stderr.read()).toContain(
			"--package requires an archived npm entrypoint name.",
		);
	});

	test("prints a package-scoped plan without executing npm", () => {
		const stdout = createBufferWriter();
		const stderr = createBufferWriter();

		expect(
			runCli({
				argv: ["--package", "create-wp-typia"],
				stdout: stdout.writer,
				stderr: stderr.writer,
			}),
		).toBe(0);
		expect(stderr.read()).toBe("");
		expect(stdout.read()).toContain("Archived npm entrypoint deprecation plan:");
		expect(stdout.read()).toContain(
			"npm deprecate 'create-wp-typia@*' 'create-wp-typia is archived. Use `npx wp-typia create <project-dir>` or `bunx wp-typia create <project-dir>` instead.'",
		);
	});
});
