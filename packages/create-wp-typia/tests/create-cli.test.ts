import { afterAll, describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scaffoldProject } from "../lib/scaffold.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "create-wp-typia-"));
const entryPath = path.resolve(import.meta.dir, "../lib/entry.js");
const legacyBasicPath = path.resolve(import.meta.dir, "../../wp-typia-basic/scripts/setup.js");

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
		expect(packageJson.scripts.prebuild).toBe("npm run sync-types");
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
		expect(packageJson.scripts.prebuild).toBe(
			"pnpm run sync-types && pnpm run generate-migrations",
		);
		expect(packageJson.scripts["migration:detect"]).toBe("pnpm run migration -- detect");
	});

	test("node entry exposes templates and doctor commands", () => {
		const templatesOutput = execSync(`node ${JSON.stringify(entryPath)} templates list`, {
			encoding: "utf8",
		});
		const doctorOutput = execSync(`node ${JSON.stringify(entryPath)} doctor`, {
			encoding: "utf8",
		});

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("advanced");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("node entry requires --package-manager with --yes", () => {
		expect(() => {
			execSync(
				`node ${JSON.stringify(entryPath)} demo-missing-pm --template basic --yes --no-install`,
				{
					stdio: "pipe",
				},
			);
		}).toThrow();
	});

	test("legacy wrapper keeps current-directory scaffolding flow with explicit package manager", () => {
		const targetDir = path.join(tempRoot, "legacy-basic");
		fs.mkdirSync(targetDir, { recursive: true });

		execSync(
			`node ${JSON.stringify(legacyBasicPath)} --yes --no-install --package-manager bun`,
			{ cwd: targetDir, stdio: "inherit" },
		);

		const packageJsonPath = path.join(targetDir, "package.json");
		expect(fs.existsSync(packageJsonPath)).toBe(true);

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
		expect(packageJson.name).toBe("legacy-basic");
		expect(packageJson.packageManager).toBe("bun@1.3.10");
	});
});
