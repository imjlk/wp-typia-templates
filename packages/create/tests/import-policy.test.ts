import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const packageRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageRoot, "..", "..");

describe("@wp-typia/create import policy", () => {
	test("supported generated-project import paths resolve from the built package", async () => {
		const [
			rootModule,
			createMetadataCoreModule,
			metadataCoreModule,
			schemaCoreModule,
			blockRuntimeRootModule,
			blockRuntimeBlocksModule,
			blockRuntimeDefaultsModule,
			blockRuntimeEditorModule,
			blockRuntimeIdentifiersModule,
			blockRuntimeInspectorModule,
			blockRuntimeValidationModule,
			createRuntimeBlocksModule,
			createRuntimeDefaultsModule,
			createRuntimeEditorModule,
			createRuntimeInspectorModule,
			createRuntimeValidationModule,
		] = await Promise.all([
			import("@wp-typia/create"),
			import("@wp-typia/create/metadata-core"),
			import("@wp-typia/block-runtime/metadata-core"),
			import("@wp-typia/create/runtime/schema-core"),
			import("@wp-typia/block-runtime"),
			import("@wp-typia/block-runtime/blocks"),
			import("@wp-typia/block-runtime/defaults"),
			import("@wp-typia/block-runtime/editor"),
			import("@wp-typia/block-runtime/identifiers"),
			import("@wp-typia/block-runtime/inspector"),
			import("@wp-typia/block-runtime/validation"),
			import("@wp-typia/create/runtime/blocks"),
			import("@wp-typia/create/runtime/defaults"),
			import("@wp-typia/create/runtime/editor"),
			import("@wp-typia/create/runtime/inspector"),
			import("@wp-typia/create/runtime/validation"),
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

		expect(typeof createMetadataCoreModule.runSyncBlockMetadata).toBe("function");
		expect(typeof createMetadataCoreModule.syncRestOpenApi).toBe("function");
		expect(typeof metadataCoreModule.defineEndpointManifest).toBe("function");
		expect(typeof metadataCoreModule.runSyncBlockMetadata).toBe("function");
		expect(typeof metadataCoreModule.syncEndpointClient).toBe("function");
		expect(typeof metadataCoreModule.syncRestOpenApi).toBe("function");
		expect(typeof blockRuntimeRootModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof blockRuntimeBlocksModule.createTypiaWebpackConfig).toBe("function");
		expect(typeof blockRuntimeDefaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof blockRuntimeEditorModule.createEditorModel).toBe("function");
		expect(typeof blockRuntimeIdentifiersModule.generateBlockId).toBe("function");
		expect(typeof blockRuntimeIdentifiersModule.generateResourceKey).toBe("function");
		expect(typeof blockRuntimeInspectorModule.useEditorFields).toBe("function");
		expect(typeof blockRuntimeValidationModule.createAttributeUpdater).toBe("function");
		expect(typeof blockRuntimeValidationModule.createScaffoldValidatorToolkit).toBe("function");
		expect(typeof blockRuntimeValidationModule.createUseTypiaValidationHook).toBe("function");
		expect(typeof blockRuntimeValidationModule.toValidationResult).toBe("function");
		expect(typeof createRuntimeBlocksModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof createRuntimeDefaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof createRuntimeEditorModule.createEditorModel).toBe("function");
		expect(typeof createRuntimeInspectorModule.useEditorFields).toBe("function");
		expect(typeof createRuntimeValidationModule.createAttributeUpdater).toBe("function");
		expect(createRuntimeBlocksModule.buildScaffoldBlockRegistration).toBe(
			blockRuntimeBlocksModule.buildScaffoldBlockRegistration,
		);
		expect(createRuntimeBlocksModule.createTypiaWebpackConfig).toBe(
			blockRuntimeBlocksModule.createTypiaWebpackConfig,
		);
		expect(createRuntimeDefaultsModule.applyTemplateDefaultsFromManifest).toBe(
			blockRuntimeDefaultsModule.applyTemplateDefaultsFromManifest,
		);
		expect(createRuntimeEditorModule.createEditorModel).toBe(
			blockRuntimeEditorModule.createEditorModel,
		);
		expect(createRuntimeEditorModule.describeEditorField).toBe(
			blockRuntimeEditorModule.describeEditorField,
		);
		expect(createRuntimeEditorModule.formatEditorFieldLabel).toBe(
			blockRuntimeEditorModule.formatEditorFieldLabel,
		);
		expect(createRuntimeInspectorModule.useEditorFields).toBe(
			blockRuntimeInspectorModule.useEditorFields,
		);
		expect(createRuntimeInspectorModule.InspectorFromManifest).toBe(
			blockRuntimeInspectorModule.InspectorFromManifest,
		);
		expect(createRuntimeValidationModule.createAttributeUpdater).toBe(
			blockRuntimeValidationModule.createAttributeUpdater,
		);
		expect(createRuntimeValidationModule.createNestedAttributeUpdater).toBe(
			blockRuntimeValidationModule.createNestedAttributeUpdater,
		);
		expect(createRuntimeValidationModule.createScaffoldValidatorToolkit).toBe(
			blockRuntimeValidationModule.createScaffoldValidatorToolkit,
		);
		expect(createRuntimeValidationModule.toValidationResult).toBe(
			blockRuntimeValidationModule.toValidationResult,
		);
		expect(typeof schemaCoreModule.projectJsonSchemaDocument).toBe("function");
		expect(typeof schemaCoreModule.manifestToOpenApi).toBe("function");
		expect("generateBlockId" in blockRuntimeRootModule).toBe(false);
		expect("useEditorFields" in blockRuntimeRootModule).toBe(false);
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
		expect(runtimeSurfaceDoc).toContain("@wp-typia/block-runtime/identifiers");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/blocks");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/defaults");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/editor");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/identifiers");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/inspector");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/validation");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/metadata-core");
		expect(importPolicyDoc).toContain("@wp-typia/create/metadata-core");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/*");
		expect(importPolicyDoc).toContain("@wp-typia/create/runtime/schema-core");
		expect(importPolicyDoc).toContain("compatibility shims");
		expect(importPolicyDoc).toContain("@wp-typia/block-runtime/*` owns the");
		expect(importPolicyDoc).toMatch(/^- `@wp-typia\/block-runtime`$/m);
		expect(runtimeSurfaceDoc).toMatch(/compatibility\s+facades/);
		expect(runtimeSurfaceDoc).toMatch(/single maintained\s+source of truth/);
	});
});
