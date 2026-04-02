import { describe, expect, test } from "bun:test";

const importModule = (specifier: string) => import(specifier);

describe("@wp-typia/block-runtime", () => {
	test("supported self imports resolve through the published entrypoints", async () => {
		const [
			rootModule,
			defaultsModule,
			editorModule,
			validationModule,
			createDefaultsModule,
			createEditorModule,
			createValidationModule,
		] = await Promise.all([
			import("@wp-typia/block-runtime"),
			import("@wp-typia/block-runtime/defaults"),
			import("@wp-typia/block-runtime/editor"),
			import("@wp-typia/block-runtime/validation"),
			import("@wp-typia/create/runtime/defaults"),
			import("@wp-typia/create/runtime/editor"),
			import("@wp-typia/create/runtime/validation"),
		]);

		expect(typeof rootModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof rootModule.createEditorModel).toBe("function");
		expect(typeof rootModule.createAttributeUpdater).toBe("function");
		expect(typeof rootModule.createNestedAttributeUpdater).toBe("function");
		expect(typeof defaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof editorModule.createEditorModel).toBe("function");
		expect(typeof validationModule.toValidationResult).toBe("function");

		expect(rootModule.applyTemplateDefaultsFromManifest).toBe(
			createDefaultsModule.applyTemplateDefaultsFromManifest,
		);
		expect(rootModule.createEditorModel).toBe(createEditorModule.createEditorModel);
		expect(rootModule.createAttributeUpdater).toBe(
			createValidationModule.createAttributeUpdater,
		);
		expect(rootModule.createNestedAttributeUpdater).toBe(
			createValidationModule.createNestedAttributeUpdater,
		);
		expect(defaultsModule.applyTemplateDefaultsFromManifest).toBe(
			createDefaultsModule.applyTemplateDefaultsFromManifest,
		);
		expect(editorModule.describeEditorField).toBe(createEditorModule.describeEditorField);
		expect(validationModule.toValidationState).toBe(
			createValidationModule.toValidationState,
		);

		expect("manifestToOpenApi" in rootModule).toBe(false);
		expect("syncRestOpenApi" in rootModule).toBe(false);
	});

	test("unsupported subpaths are not exported", async () => {
		await expect(importModule("@wp-typia/block-runtime/schema-core")).rejects.toThrow();
		await expect(importModule("@wp-typia/block-runtime/metadata-core")).rejects.toThrow();
	});
});
