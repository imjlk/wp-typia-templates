import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const importModule = (specifier: string) => import(specifier);

function writeMockPackage(projectRoot: string, packageName: string, version: string) {
	const packageDir = resolve(projectRoot, "node_modules", ...packageName.split("/"));
	mkdirSync(packageDir, { recursive: true });
	writeFileSync(
		resolve(packageDir, "package.json"),
		JSON.stringify({ name: packageName, version }, null, 2),
		"utf8",
	);
}

describe("@wp-typia/block-runtime", () => {
	test("supported self imports resolve through the published entrypoints", async () => {
		const [
			rootModule,
			blocksModule,
			schemaCoreModule,
			migrationTypesModule,
			metadataCoreModule,
			defaultsModule,
			editorModule,
			identifiersModule,
			inspectorModule,
			validationModule,
		] = await Promise.all([
			import("@wp-typia/block-runtime"),
			import("@wp-typia/block-runtime/blocks"),
			import("@wp-typia/block-runtime/schema-core"),
			import("@wp-typia/block-runtime/migration-types"),
			import("@wp-typia/block-runtime/metadata-core"),
			import("@wp-typia/block-runtime/defaults"),
			import("@wp-typia/block-runtime/editor"),
			import("@wp-typia/block-runtime/identifiers"),
			import("@wp-typia/block-runtime/inspector"),
			import("@wp-typia/block-runtime/validation"),
		]);

		expect(typeof rootModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof rootModule.assertManifestDefaultsDocument).toBe("function");
		expect(typeof rootModule.assertManifestDocument).toBe("function");
		expect(typeof rootModule.assertScaffoldBlockMetadata).toBe("function");
		expect(typeof rootModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof rootModule.createEditorModel).toBe("function");
		expect(typeof rootModule.parseManifestDefaultsDocument).toBe("function");
		expect(typeof rootModule.parseManifestDocument).toBe("function");
		expect(typeof rootModule.parseScaffoldBlockMetadata).toBe("function");
		expect(typeof rootModule.createAttributeUpdater).toBe("function");
		expect(typeof rootModule.createNestedAttributeUpdater).toBe("function");
		expect(typeof blocksModule.createTypiaWebpackConfig).toBe("function");
		expect(typeof blocksModule.buildScaffoldBlockRegistration).toBe("function");
		expect(typeof blocksModule.defineScaffoldBlockMetadata).toBe("function");
		expect(typeof blocksModule.assertScaffoldBlockMetadata).toBe("function");
		expect(typeof blocksModule.parseScaffoldBlockMetadata).toBe("function");
		expect(typeof schemaCoreModule.manifestToJsonSchema).toBe("function");
		expect(typeof schemaCoreModule.manifestToOpenApi).toBe("function");
		expect(typeof schemaCoreModule.normalizeEndpointAuthDefinition).toBe("function");
		expect(Object.keys(migrationTypesModule)).toEqual([]);
		expect(typeof metadataCoreModule.defineEndpointManifest).toBe("function");
		expect(typeof metadataCoreModule.runSyncBlockMetadata).toBe("function");
		expect(typeof metadataCoreModule.syncEndpointClient).toBe("function");
		expect(typeof metadataCoreModule.syncRestOpenApi).toBe("function");
		expect(typeof defaultsModule.applyTemplateDefaultsFromManifest).toBe("function");
		expect(typeof defaultsModule.defineManifestDefaultsDocument).toBe("function");
		expect(typeof defaultsModule.assertManifestDefaultsDocument).toBe("function");
		expect(typeof defaultsModule.parseManifestDefaultsDocument).toBe("function");
		expect(typeof editorModule.createEditorModel).toBe("function");
		expect(typeof editorModule.defineManifestDocument).toBe("function");
		expect(typeof editorModule.assertManifestDocument).toBe("function");
		expect(typeof editorModule.parseManifestDocument).toBe("function");
		expect(typeof identifiersModule.generateBlockId).toBe("function");
		expect(typeof identifiersModule.generatePublicWriteRequestId).toBe("function");
		expect(typeof inspectorModule.useEditorFields).toBe("function");
		expect(typeof inspectorModule.parseManifestDocument).toBe("function");
		expect(typeof validationModule.toValidationResult).toBe("function");
		expect(typeof blocksModule.assertTypiaWebpackCompatibility).toBe("function");
		expect(typeof blocksModule.loadCompatibleTypiaWebpackPlugin).toBe("function");

		expect("generateBlockId" in rootModule).toBe(false);
		expect("manifestToOpenApi" in rootModule).toBe(false);
		expect("syncRestOpenApi" in rootModule).toBe(false);
	});

	test("unsupported subpaths are not exported", async () => {
		await expect(importModule("@wp-typia/block-runtime/runtime")).rejects.toThrow();
	});

	test("built root entry preserves ESM-safe .js re-export specifiers", () => {
		const packageRoot = resolve(import.meta.dir, "..");
		const builtIndexJs = readFileSync(resolve(packageRoot, "dist/index.js"), "utf8");
		const builtIndexDts = readFileSync(resolve(packageRoot, "dist/index.d.ts"), "utf8");
		const builtBlocksJs = readFileSync(resolve(packageRoot, "dist/blocks.js"), "utf8");
		const builtBlocksDts = readFileSync(resolve(packageRoot, "dist/blocks.d.ts"), "utf8");

		expect(builtIndexJs).toContain('export * from "./blocks.js";');
		expect(builtIndexJs).toContain('export * from "./defaults.js";');
		expect(builtIndexJs).toContain('export * from "./editor.js";');
		expect(builtIndexJs).toContain('export * from "./validation.js";');
		expect(builtIndexDts).toContain('export * from "./blocks.js";');
		expect(builtIndexDts).toContain('export * from "./defaults.js";');
		expect(builtIndexDts).toContain('export * from "./editor.js";');
		expect(builtIndexDts).toContain('export * from "./validation.js";');
		expect(builtBlocksJs).toContain("export * from './blocks-registration.js';");
		expect(builtBlocksJs).toContain("export * from './blocks-webpack.js';");
		expect(builtBlocksDts).toContain("export * from './blocks-registration.js';");
		expect(builtBlocksDts).toContain("export * from './blocks-webpack.js';");
	});

	test("Typia/Webpack compatibility preflight accepts the supported matrix", async () => {
		const blocksModule = await import("@wp-typia/block-runtime/blocks");
		const projectRoot = mkdtempSync(resolve(tmpdir(), "wp-typia-compat-ok-"));

		try {
			writeFileSync(
				resolve(projectRoot, "package.json"),
				JSON.stringify({ name: "compat-ok", private: true }, null, 2),
				"utf8",
			);
			writeMockPackage(projectRoot, "typia", "12.0.1");
			writeMockPackage(projectRoot, "@typia/unplugin", "12.0.1");
			writeMockPackage(projectRoot, "@wordpress/scripts", "30.22.0");
			writeMockPackage(projectRoot, "webpack", "5.106.0");

			await expect(
				blocksModule.assertTypiaWebpackCompatibility({ projectRoot }),
			).resolves.toEqual(
				expect.objectContaining({
					"@typia/unplugin": "12.0.1",
					"@wordpress/scripts": "30.22.0",
					typia: "12.0.1",
					webpack: "5.106.0",
				}),
			);
		} finally {
			rmSync(projectRoot, { force: true, recursive: true });
		}
	});

	test("Typia/Webpack compatibility preflight explains unsupported tuples", async () => {
		const blocksModule = await import("@wp-typia/block-runtime/blocks");
		const projectRoot = mkdtempSync(resolve(tmpdir(), "wp-typia-compat-bad-"));

		try {
			writeFileSync(
				resolve(projectRoot, "package.json"),
				JSON.stringify({ name: "compat-bad", private: true }, null, 2),
				"utf8",
			);
			writeMockPackage(projectRoot, "typia", "11.0.0");
			writeMockPackage(projectRoot, "@typia/unplugin", "12.0.1");
			writeMockPackage(projectRoot, "@wordpress/scripts", "30.22.0");
			writeMockPackage(projectRoot, "webpack", "5.106.0");

			await expect(
				blocksModule.assertTypiaWebpackCompatibility({ projectRoot }),
			).rejects.toThrow(
				/Installed versions: typia=11\.0\.0, @typia\/unplugin=12\.0\.1, @wordpress\/scripts=30\.22\.0, webpack=5\.106\.0\..*Supported matrix: typia 12\.x, @typia\/unplugin 12\.x, @wordpress\/scripts 30\.x with webpack 5\.x\./s,
			);
		} finally {
			rmSync(projectRoot, { force: true, recursive: true });
		}
	});

	test("Typia/Webpack compatibility preflight prefers webpack resolved from @wordpress/scripts", async () => {
		const blocksModule = await import("@wp-typia/block-runtime/blocks");
		const projectRoot = mkdtempSync(resolve(tmpdir(), "wp-typia-compat-nested-"));

		try {
			writeFileSync(
				resolve(projectRoot, "package.json"),
				JSON.stringify({ name: "compat-nested", private: true }, null, 2),
				"utf8",
			);
			writeMockPackage(projectRoot, "typia", "12.0.1");
			writeMockPackage(projectRoot, "@typia/unplugin", "12.0.1");
			writeMockPackage(projectRoot, "@wordpress/scripts", "30.22.0");
			writeMockPackage(projectRoot, "webpack", "4.47.0");

			const wordpressScriptsNodeModules = resolve(
				projectRoot,
				"node_modules",
				"@wordpress",
				"scripts",
				"node_modules",
			);
			mkdirSync(resolve(wordpressScriptsNodeModules, "webpack"), {
				recursive: true,
			});
			writeFileSync(
				resolve(wordpressScriptsNodeModules, "webpack", "package.json"),
				JSON.stringify({ name: "webpack", version: "5.106.0" }, null, 2),
				"utf8",
			);

			await expect(
				blocksModule.assertTypiaWebpackCompatibility({ projectRoot }),
			).resolves.toEqual(
				expect.objectContaining({
					webpack: "5.106.0",
				}),
			);
		} finally {
			rmSync(projectRoot, { force: true, recursive: true });
		}
	});
});
