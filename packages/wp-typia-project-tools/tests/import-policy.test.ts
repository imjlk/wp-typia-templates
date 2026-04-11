import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

describe("@wp-typia/project-tools import policy", () => {
	test("exports project orchestration helpers without re-exporting generated runtime helpers", async () => {
		const [rootModule, schemaCoreModule, metadataCoreModule] = await Promise.all([
			import("@wp-typia/project-tools"),
			import("@wp-typia/project-tools/schema-core"),
			import("@wp-typia/block-runtime/metadata-core"),
		]);

		expect(typeof rootModule.collectScaffoldAnswers).toBe("function");
		expect(typeof rootModule.formatAddHelpText).toBe("function");
		expect(typeof rootModule.formatMigrationHelpText).toBe("function");
		expect(typeof rootModule.getDoctorChecks).toBe("function");
		expect(typeof rootModule.getTemplateById).toBe("function");
		expect(typeof rootModule.listTemplates).toBe("function");
		expect(typeof rootModule.parseMigrationArgs).toBe("function");
		expect(typeof rootModule.projectJsonSchemaDocument).toBe("function");
		expect(typeof rootModule.resolvePackageManagerId).toBe("function");
		expect(typeof rootModule.runAddBlockCommand).toBe("function");
		expect(typeof rootModule.runMigrationCommand).toBe("function");
		expect(typeof rootModule.runScaffoldFlow).toBe("function");
		expect(typeof schemaCoreModule.normalizeEndpointAuthDefinition).toBe("function");
		expect(typeof metadataCoreModule.defineEndpointManifest).toBe("function");

		expect("applyTemplateDefaultsFromManifest" in rootModule).toBe(false);
		expect("buildScaffoldBlockRegistration" in rootModule).toBe(false);
		expect("createAttributeUpdater" in rootModule).toBe(false);
		expect("createEditorModel" in rootModule).toBe(false);
		expect("runSyncBlockMetadata" in rootModule).toBe(false);
	});

	test("does not expose legacy runtime compatibility subpaths", async () => {
		const packageManifest = JSON.parse(
			fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"),
		) as {
			bin?: Record<string, string>;
			exports?: Record<string, unknown>;
		};

		expect(packageManifest.bin).toBeUndefined();
		expect(packageManifest.exports?.["./cli"]).toBeUndefined();
		expect(packageManifest.exports?.["./metadata-core"]).toBeUndefined();
		expect(packageManifest.exports?.["./runtime/cli-core"]).toBeUndefined();
		expect(packageManifest.exports?.["./runtime/schema-core"]).toBeUndefined();

		const importRemovedCli = new Function(
			"return import('@wp-typia/project-tools/cli');",
		) as () => Promise<unknown>;
		const importRemovedRuntime = new Function(
			"return import('@wp-typia/project-tools/runtime/blocks');",
		) as () => Promise<unknown>;

		await expect(importRemovedCli()).rejects.toThrow();
		await expect(importRemovedRuntime()).rejects.toThrow();
	});

	test("public docs point to the new canonical package map", () => {
		const projectToolsReadme = fs.readFileSync(
			path.join(packageRoot, "README.md"),
			"utf8",
		);
		const createReadme = fs.readFileSync(
			path.join(repoRoot, "packages", "create", "README.md"),
			"utf8",
		);
		const apiGuide = fs.readFileSync(path.join(repoRoot, "docs", "API.md"), "utf8");
		const runtimeSurfaceDoc = fs.readFileSync(
			path.join(repoRoot, "docs", "runtime-surface.md"),
			"utf8",
		);
		const importPolicyDoc = fs.readFileSync(
			path.join(repoRoot, "docs", "runtime-import-policy.md"),
			"utf8",
		);

		expect(projectToolsReadme).toContain("@wp-typia/project-tools");
		expect(projectToolsReadme).toContain("@wp-typia/project-tools/schema-core");
		expect(projectToolsReadme).toContain("@wp-typia/block-runtime/*");
		expect(projectToolsReadme).toContain("@wp-typia/block-runtime/schema-core");
		expect(createReadme).toContain("deprecated legacy package shell");
		expect(createReadme).toContain("@wp-typia/project-tools");
		expect(createReadme).toContain("@wp-typia/project-tools/schema-core");
		expect(apiGuide).toContain("@wp-typia/project-tools");
		expect(apiGuide).toContain("@wp-typia/project-tools/schema-core");
		expect(apiGuide).toContain("@wp-typia/block-runtime/metadata-core");
		expect(runtimeSurfaceDoc).toContain("@wp-typia/project-tools");
		expect(runtimeSurfaceDoc).toContain("@wp-typia/project-tools/schema-core");
		expect(runtimeSurfaceDoc).toContain("@wp-typia/block-runtime/schema-core");
		expect(runtimeSurfaceDoc).not.toContain("@wp-typia/project-tools/runtime/*");
		expect(importPolicyDoc).toContain("@wp-typia/project-tools");
		expect(importPolicyDoc).toContain("@wp-typia/project-tools/schema-core");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/schema-core");
		expect(importPolicyDoc).not.toContain("@wp-typia/project-tools/runtime/*");
	});
});
