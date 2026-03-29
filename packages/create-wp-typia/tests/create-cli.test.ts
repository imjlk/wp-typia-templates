import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scaffoldProject } from "../src/runtime/index.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-wp-typia-"));
const entryPath = path.resolve(import.meta.dir, "../dist/cli.js");

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

describe("create-wp-typia scaffolding", () => {
	afterAll(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	test("scaffoldProject creates an npm-ready basic template", async () => {
		const targetDir = path.join(tempRoot, "demo-npm");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "basic",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo npm block",
				namespace: "create-block",
				slug: "demo-npm",
				title: "Demo Npm",
			},
		});

		const packageJsonPath = path.join(targetDir, "package.json");
		const readmePath = path.join(targetDir, "README.md");

		expect(fs.existsSync(packageJsonPath)).toBe(true);
		expect(fs.existsSync(readmePath)).toBe(true);

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		const readme = fs.readFileSync(readmePath, "utf8");

		expect(packageJson.packageManager).toBe("npm@11.6.1");
		expect(packageJson.scripts.build).toBe("npm run sync-types && wp-scripts build");
		expect(packageJson.scripts.start).toBe("npm run sync-types && wp-scripts start");
		expect(readme).toContain("npm install");
		expect(readme).toContain("npm run start");
	});

	test("advanced template converts nested run-script invocations for pnpm", async () => {
		const targetDir = path.join(tempRoot, "demo-pnpm");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: "advanced",
			packageManager: "pnpm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo pnpm block",
				namespace: "create-block",
				slug: "demo-pnpm",
				title: "Demo Pnpm",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));

		expect(packageJson.packageManager).toBe("pnpm@8.3.1");
		expect(packageJson.scripts.build).toBe("pnpm run sync-types && wp-scripts build");
		expect(packageJson.scripts["migration:init"]).toBe(
			"create-wp-typia migrations init --current-version 1.0.0",
		);
		expect(packageJson.scripts["migration:scaffold"]).toBe("create-wp-typia migrations scaffold");
	});

	test("node entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("node", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("node", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("advanced");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("bun entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("bun", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("bun", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("advanced");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("bun entry translates kebab-case flags while scaffolding", () => {
		const targetDir = path.join(tempRoot, "demo-bun-entry");

		runCli("bun", [
			entryPath,
			targetDir,
			"--template",
			"basic",
			"--yes",
			"--no-install",
			"--package-manager",
			"bun",
		], {
			stdio: "inherit",
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		expect(packageJson.packageManager).toBe("bun@1.3.10");
		expect(fs.existsSync(path.join(targetDir, "README.md"))).toBe(true);
	});

	test("node entry requires --package-manager with --yes", () => {
		expect(() => {
			runCli("node", [
				entryPath,
				"demo-missing-pm",
				"--template",
				"basic",
				"--yes",
				"--no-install",
			], {
				stdio: "pipe",
			});
		}).toThrow();
	});
});
