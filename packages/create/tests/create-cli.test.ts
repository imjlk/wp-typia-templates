import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scaffoldProject } from "../src/runtime/index.js";
import { parseGitHubTemplateLocator } from "../src/runtime/template-source.js";

const packageRoot = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-create-"));
const entryPath = path.join(packageRoot, "dist", "cli.js");
const createPackageVersion = `^${JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
).version}`;
const blockTypesPackageVersion = `^${JSON.parse(
	fs.readFileSync(path.resolve(packageRoot, "../wp-typia-block-types/package.json"), "utf8"),
).version}`;

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

describe("@wp-typia/create scaffolding", () => {
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
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/create"]).toBe(createPackageVersion);
		expect(packageJson.scripts.build).toBe("npm run sync-types && wp-scripts build");
		expect(packageJson.scripts.start).toBe("npm run sync-types && wp-scripts start");
		expect(readme).toContain("npm install");
		expect(readme).toContain("npm run start");
	});

	test("local create-block subset paths scaffold into a pnpm-ready wp-typia project", async () => {
		const targetDir = path.join(tempRoot, "demo-remote");
		const remoteFixturePath = path.join(packageRoot, "tests", "fixtures", "create-block-subset");

		await scaffoldProject({
			projectDir: targetDir,
			templateId: remoteFixturePath,
			packageManager: "pnpm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo remote block",
				namespace: "create-block",
				slug: "demo-remote",
				title: "Demo Remote",
			},
		});

		const packageJson = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedIndex = fs.readFileSync(path.join(targetDir, "src", "index.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(packageJson.packageManager).toBe("pnpm@8.3.1");
		expect(packageJson.devDependencies["@wp-typia/block-types"]).toBe(blockTypesPackageVersion);
		expect(packageJson.devDependencies["@wp-typia/create"]).toBe(createPackageVersion);
		expect(packageJson.scripts.build).toBe("pnpm run sync-types && wp-scripts build");
		expect(generatedTypes).toContain("export interface DemoRemoteAttributes");
		expect(generatedTypes).toContain("content?: string & tags.Default<\"\">");
		expect(generatedIndex).toContain('import metadata from "./block.json";');
		expect(generatedBlockJson.name).toBe("create-block/demo-remote");
		expect(generatedBlockJson.title).toBe("Demo Remote");
		expect(generatedBlockJson.supports.align).toEqual(["wide", "full"]);
	});

	test("node entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("node", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("node", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("bun entry exposes templates and doctor commands", () => {
		const templatesOutput = runCli("bun", [entryPath, "templates", "list"]);
		const doctorOutput = runCli("bun", [entryPath, "doctor"]);

		expect(templatesOutput).toContain("basic");
		expect(templatesOutput).toContain("interactivity");
		expect(templatesOutput).not.toContain("advanced");
		expect(templatesOutput).not.toContain("full");
		expect(doctorOutput).toContain("PASS Bun");
		expect(doctorOutput).toContain("PASS Template basic");
	});

	test("parses github template locators with refs", () => {
		expect(parseGitHubTemplateLocator("github:owner/repo/templates/card#main")).toEqual({
			owner: "owner",
			repo: "repo",
			ref: "main",
			sourcePath: "templates/card",
		});
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
