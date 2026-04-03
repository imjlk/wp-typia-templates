import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

describe("@wp-typia/create import policy", () => {
	test("supported generated-project import paths resolve from the built package", async () => {
		const [
			rootModule,
			metadataCoreModule,
			blocksModule,
			defaultsModule,
			editorModule,
			validationModule,
			schemaCoreModule,
		] = await Promise.all([
			import("@wp-typia/create"),
			import("@wp-typia/create/metadata-core"),
			import("@wp-typia/create/runtime/blocks"),
			import("@wp-typia/create/runtime/defaults"),
			import("@wp-typia/create/runtime/editor"),
			import("@wp-typia/create/runtime/validation"),
			import("@wp-typia/create/runtime/schema-core"),
		]);

		expect(typeof rootModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof rootModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof rootModule.createEditorModel).toBe("function");
		expect(typeof rootModule.createAttributeUpdater).toBe("function");
		expect(typeof rootModule.createScaffoldValidatorToolkit).toBe("function");
		expect(typeof rootModule.createTypiaWebpackConfig).toBe("function");
		expect(typeof rootModule.createUseTypiaValidationHook).toBe("function");
		expect(typeof rootModule.createNestedAttributeUpdater).toBe("function");
		expect(typeof rootModule.toValidationResult).toBe("function");
		expect(typeof rootModule.projectJsonSchemaDocument).toBe("function");
		expect(typeof rootModule.manifestToJsonSchema).toBe("function");
		expect(typeof rootModule.manifestToOpenApi).toBe("function");
		expect(typeof rootModule.runSyncBlockMetadata).toBe("function");

		expect(typeof metadataCoreModule.defineEndpointManifest).toBe("function");
		expect(typeof metadataCoreModule.runSyncBlockMetadata).toBe("function");
		expect(typeof metadataCoreModule.syncRestOpenApi).toBe("function");
		expect(typeof blocksModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof blocksModule.createTypiaWebpackConfig).toBe("function");
		expect(typeof defaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof editorModule.createEditorModel).toBe("function");
		expect(typeof validationModule.createAttributeUpdater).toBe("function");
		expect(typeof validationModule.createScaffoldValidatorToolkit).toBe("function");
		expect(typeof validationModule.createUseTypiaValidationHook).toBe("function");
		expect(typeof validationModule.toValidationResult).toBe("function");
		expect(typeof schemaCoreModule.projectJsonSchemaDocument).toBe("function");
		expect(typeof schemaCoreModule.manifestToOpenApi).toBe("function");
	});

	test("public docs point to the normative import policy", () => {
		const createReadme = fs.readFileSync(
			path.join(packageRoot, "README.md"),
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

		expect(createReadme).toContain("docs/runtime-import-policy.md");
		expect(apiGuide).toContain("docs/runtime-import-policy.md");
		expect(runtimeSurfaceDoc).toContain("descriptive, not normative");
		expect(runtimeSurfaceDoc).toContain("docs/runtime-import-policy.md");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/blocks");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/defaults");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/editor");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/validation");
		expect(importPolicyDoc).toContain("@wp-typia/create/metadata-core");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/schema-core");
		expect(importPolicyDoc).toMatch(/^- `@wp-typia\/create`$/m);
	});
});
