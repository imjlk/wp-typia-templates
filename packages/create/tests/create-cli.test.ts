import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { scaffoldProject } from "../src/runtime/index.js";
import { copyRenderedDirectory } from "../src/runtime/template-render.js";
import {
	parseGitHubTemplateLocator,
	parseNpmTemplateLocator,
} from "../src/runtime/template-source.js";

const packageRoot = process.cwd();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "wp-typia-create-"));
const entryPath = path.join(packageRoot, "dist", "cli.js");
const createBlockExternalFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-external",
);
const createBlockSubsetFixturePath = path.join(
	packageRoot,
	"tests",
	"fixtures",
	"create-block-subset",
);
const createPackageManifest = JSON.parse(
	fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
);
const createPackageVersion = `^${createPackageManifest.version}`;
const blockTypesPackageVersion =
	createPackageManifest.dependencies["@wp-typia/block-types"];

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

		await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockSubsetFixturePath,
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
		expect(generatedTypes).toContain("\"content\"?: string & tags.Default<\"\">");
		expect(generatedIndex).toContain('import metadata from "./block.json";');
		expect(generatedBlockJson.name).toBe("create-block/demo-remote");
		expect(generatedBlockJson.title).toBe("Demo Remote");
		expect(generatedBlockJson.supports.align).toEqual(["wide", "full"]);
	});

	test("local official external template configs scaffold with the default variant", async () => {
		const targetDir = path.join(tempRoot, "demo-external-default");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external block",
				namespace: "create-block",
				slug: "demo-external-default",
				title: "Demo External Default",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("standard");
		expect(result.warnings).toContain(
			'Ignoring external template config key "pluginTemplatesPath": wp-typia owns package/tooling/sync setup for generated projects, so this external template setting is ignored.',
		);
		expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"standard">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"standard-transformed">');
		expect(generatedEdit).toContain("template-standard");
		expect(generatedEdit).toContain("standard-transformed");
		expect(generatedBlockJson.supports.multiple).toBe(false);
	});

	test("local official external template configs honor --variant overrides", async () => {
		const targetDir = path.join(tempRoot, "demo-external-hero");

		const result = await scaffoldProject({
			projectDir: targetDir,
			templateId: createBlockExternalFixturePath,
			variant: "hero",
			packageManager: "npm",
			noInstall: true,
			answers: {
				author: "Test Runner",
				description: "Demo external variant block",
				namespace: "create-block",
				slug: "demo-external-hero",
				title: "Demo External Hero",
			},
		});

		const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
		const generatedEdit = fs.readFileSync(path.join(targetDir, "src", "edit.js"), "utf8");
		const generatedBlockJson = JSON.parse(
			fs.readFileSync(path.join(targetDir, "src", "block.json"), "utf8"),
		);

		expect(result.selectedVariant).toBe("hero");
		expect(fs.existsSync(path.join(targetDir, "src", "assets"))).toBe(false);
		expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
		expect(generatedTypes).toContain('"transformedLabel"?: string & tags.Default<"hero-transformed">');
		expect(generatedEdit).toContain("template-hero");
		expect(generatedBlockJson.supports.multiple).toBe(true);
	});

	test("rendered template paths cannot escape the target directory", async () => {
		const templateRoot = fs.mkdtempSync(path.join(tempRoot, "render-escape-template-"));
		const targetDir = fs.mkdtempSync(path.join(tempRoot, "render-escape-target-"));

		fs.writeFileSync(
			path.join(templateRoot, "{{fileName}}.mustache"),
			"escaped",
			"utf8",
		);

		await expect(
			copyRenderedDirectory(templateRoot, targetDir, {
				fileName: "../outside",
			}),
		).rejects.toThrow("Rendered template path escapes target directory");
	});

	test("rejects unsupported variant usage for built-in templates", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-built-in-variant"),
				templateId: "basic",
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid built-in variant usage",
					namespace: "create-block",
					slug: "invalid-built-in-variant",
					title: "Invalid Built In Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
	});

	test("rejects unsupported variant usage for raw create-block subset sources", async () => {
		await expect(
			scaffoldProject({
				projectDir: path.join(tempRoot, "demo-invalid-remote-variant"),
				templateId: createBlockSubsetFixturePath,
				variant: "hero",
				packageManager: "bun",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Invalid remote variant usage",
					namespace: "create-block",
					slug: "invalid-remote-variant",
					title: "Invalid Remote Variant",
				},
			}),
		).rejects.toThrow('--variant is only supported for official external template configs.');
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

	test("parses npm template locators for package specs", () => {
		expect(parseNpmTemplateLocator("@scope/template-package@^1.2.0")).toEqual({
			fetchSpec: "^1.2.0",
			name: "@scope/template-package",
			raw: "@scope/template-package@^1.2.0",
			type: "range",
		});
	});

	test("npm package template specs can scaffold through the registry resolver", async () => {
		const npmTemplateRoot = fs.mkdtempSync(path.join(tempRoot, "npm-template-source-"));
		const registryBase = "https://registry.npmjs.org";
		const tarballUrl = `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`;
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const tarballPath = path.join(npmTemplateRoot, "create-block-template-1.2.3.tgz");
		const packageDir = path.join(npmTemplateRoot, "package");
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;
		const targetDir = path.join(tempRoot, "demo-external-npm");

		fs.mkdirSync(packageDir, { recursive: true });
		fs.cpSync(createBlockExternalFixturePath, packageDir, { recursive: true });
		fs.writeFileSync(
			path.join(packageDir, "package.json"),
			JSON.stringify(
				{
					name: "@demo/create-block-template",
					version: "1.2.3",
				},
				null,
				2,
			),
		);
		execFileSync("tar", ["-czf", tarballPath, "-C", npmTemplateRoot, "package"]);
		process.env.NPM_CONFIG_REGISTRY = registryBase;

		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: tarballUrl,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			if (requestUrl === tarballUrl) {
				return new Response(fs.readFileSync(tarballPath), { status: 200 });
			}

			throw new Error(`Unexpected fetch URL in npm template resolver test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			const result = await scaffoldProject({
				projectDir: targetDir,
				templateId: "@demo/create-block-template@^1.2.0",
				variant: "hero",
				packageManager: "npm",
				noInstall: true,
				answers: {
					author: "Test Runner",
					description: "Demo external npm template",
					namespace: "create-block",
					slug: "demo-external-npm",
					title: "Demo External Npm",
				},
			});

			const generatedTypes = fs.readFileSync(path.join(targetDir, "src", "types.ts"), "utf8");
			expect(result.selectedVariant).toBe("hero");
			expect(generatedTypes).toContain('"variantLabel"?: string & tags.Default<"hero">');
			expect(fs.existsSync(path.join(targetDir, "assets", "remote-note.txt"))).toBe(true);
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
	});

	test("npm package template specs reject explicit ranges that do not match published versions", async () => {
		const registryBase = "https://registry.npmjs.org";
		const metadataUrl = `${registryBase}/${encodeURIComponent("@demo/create-block-template")}`;
		const originalFetch = globalThis.fetch;
		const originalRegistry = process.env.NPM_CONFIG_REGISTRY;

		process.env.NPM_CONFIG_REGISTRY = registryBase;
		globalThis.fetch = (async (input) => {
			const requestUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
			if (requestUrl === metadataUrl) {
				return new Response(
					JSON.stringify({
						"dist-tags": {
							latest: "1.2.3",
						},
						versions: {
							"1.2.3": {
								dist: {
									tarball: `${registryBase}/@demo/create-block-template/-/create-block-template-1.2.3.tgz`,
								},
							},
						},
					}),
					{
						status: 200,
						headers: {
							"content-type": "application/json",
						},
					},
				);
			}

			throw new Error(`Unexpected fetch URL in npm template resolver range test: ${requestUrl}`);
		}) as typeof fetch;

		try {
			await expect(
				scaffoldProject({
					projectDir: path.join(tempRoot, "demo-external-range-miss"),
					templateId: "@demo/create-block-template@^9.0.0",
					packageManager: "npm",
					noInstall: true,
					answers: {
						author: "Test Runner",
						description: "Demo external npm range miss",
						namespace: "create-block",
						slug: "demo-external-range-miss",
						title: "Demo External Range Miss",
					},
				}),
			).rejects.toThrow('Requested "^9.0.0"');
		} finally {
			globalThis.fetch = originalFetch;
			if (originalRegistry === undefined) {
				delete process.env.NPM_CONFIG_REGISTRY;
			} else {
				process.env.NPM_CONFIG_REGISTRY = originalRegistry;
			}
		}
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
