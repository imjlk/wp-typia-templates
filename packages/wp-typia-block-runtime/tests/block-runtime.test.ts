import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const importModule = (specifier: string) => import(specifier);

describe("@wp-typia/block-runtime", () => {
	test("supported self imports resolve through the published entrypoints", async () => {
		const [
			rootModule,
			blocksModule,
			metadataCoreModule,
			defaultsModule,
			editorModule,
			inspectorModule,
			validationModule,
		] = await Promise.all([
			import("@wp-typia/block-runtime"),
			import("@wp-typia/block-runtime/blocks"),
			import("@wp-typia/block-runtime/metadata-core"),
			import("@wp-typia/block-runtime/defaults"),
			import("@wp-typia/block-runtime/editor"),
			import("@wp-typia/block-runtime/inspector"),
			import("@wp-typia/block-runtime/validation"),
		]);

		expect(typeof rootModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof rootModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof rootModule.createEditorModel).toBe("function");
		expect(typeof rootModule.useEditorFields).toBe("function");
		expect(typeof rootModule.createAttributeUpdater).toBe("function");
		expect(typeof rootModule.createNestedAttributeUpdater).toBe("function");
		expect(typeof blocksModule.createTypiaWebpackConfig).toBe("function");
		expect(typeof metadataCoreModule.runSyncBlockMetadata).toBe("function");
		expect(typeof metadataCoreModule.syncRestOpenApi).toBe("function");
		expect(typeof defaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof editorModule.createEditorModel).toBe("function");
		expect(typeof inspectorModule.useEditorFields).toBe("function");
		expect(typeof validationModule.toValidationResult).toBe("function");

		expect("manifestToOpenApi" in rootModule).toBe(false);
		expect("syncRestOpenApi" in rootModule).toBe(false);
	});

	test("unsupported subpaths are not exported", async () => {
		await expect(importModule("@wp-typia/block-runtime/schema-core")).rejects.toThrow();
	});

	test("built root entry preserves ESM-safe .js re-export specifiers", () => {
		const packageRoot = resolve(import.meta.dir, "..");
		const builtIndexJs = readFileSync(resolve(packageRoot, "dist/index.js"), "utf8");
		const builtIndexDts = readFileSync(resolve(packageRoot, "dist/index.d.ts"), "utf8");

		expect(builtIndexJs).toContain('export * from "./blocks.js";');
		expect(builtIndexJs).toContain('export * from "./defaults.js";');
		expect(builtIndexJs).toContain('export * from "./editor.js";');
		expect(builtIndexJs).toContain('export * from "./inspector.js";');
		expect(builtIndexJs).toContain('export * from "./validation.js";');
		expect(builtIndexDts).toContain('export * from "./blocks.js";');
		expect(builtIndexDts).toContain('export * from "./defaults.js";');
		expect(builtIndexDts).toContain('export * from "./editor.js";');
		expect(builtIndexDts).toContain('export * from "./inspector.js";');
		expect(builtIndexDts).toContain('export * from "./validation.js";');
	});
});
