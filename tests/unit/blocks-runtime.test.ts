import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

import {
	buildScaffoldBlockRegistration,
	createTypiaWebpackConfig,
} from "../../packages/wp-typia-block-runtime/src/blocks";
import { createTempDir, writeTextFile } from "../helpers/file-fixtures";

class FakeRawSource {
	constructor(private readonly value: unknown) {}

	source() {
		return this.value;
	}
}

function toAssetSource(value: unknown): { source(): unknown } {
	return value &&
		typeof value === "object" &&
		value !== null &&
		"source" in value &&
		typeof (value as { source?: unknown }).source === "function"
		? (value as { source(): unknown })
		: new FakeRawSource(value);
}

function assetToString(value: unknown): string {
	return Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
}

function createWebpackFsAdapter() {
	return {
		existsSync(targetPath: string) {
			return fs.existsSync(targetPath);
		},
		readFileSync(targetPath: string, encoding?: string) {
			return encoding
				? fs.readFileSync(targetPath, encoding as BufferEncoding)
				: fs.readFileSync(targetPath);
		},
		writeFileSync(targetPath: string, data: string) {
			fs.writeFileSync(targetPath, data);
		},
	};
}

function createFakeCompilation(
	initialAssets: Record<string, unknown> = {},
	outputPath?: string,
) {
	const assets = new Map<string, { source(): unknown }>(
		Object.entries(initialAssets).map(([name, value]) => [name, toAssetSource(value)]),
	);
	let processAssetsCallback: (() => void) | undefined;

	return {
		getAsset(name: string) {
			return assets.has(name)
				? {
						name,
						source: assets.get(name)!,
					}
				: undefined;
		},
		getAssets() {
			return Array.from(assets.entries()).map(([name, source]) => ({
				name,
				source,
			}));
		},
		emitAsset(name: string, source: unknown) {
			assets.set(name, toAssetSource(source));
		},
		hooks: {
			processAssets: {
				tap(
					_options: { name: string; stage: number },
					callback: () => void,
				) {
					processAssetsCallback = callback;
				},
			},
		},
		outputOptions: {
			path: outputPath,
		},
		readAsset(name: string) {
			return assets.get(name)?.source();
		},
		runProcessAssets() {
			processAssetsCallback?.();
		},
		updateAsset(name: string, source: unknown) {
			assets.set(name, toAssetSource(source));
		},
	};
}

function createFakeCompiler(compilation: ReturnType<typeof createFakeCompilation>) {
	let thisCompilationCallback:
		| ((compilationLike: ReturnType<typeof createFakeCompilation>) => void)
		| undefined;
	let afterEmitCallback:
		| ((compilationLike: ReturnType<typeof createFakeCompilation>) => void)
		| undefined;

	return {
		hooks: {
			afterEmit: {
				tap(
					_name: string,
					callback: (
						compilationLike: ReturnType<typeof createFakeCompilation>,
					) => void,
				) {
					afterEmitCallback = callback;
				},
			},
			thisCompilation: {
				tap(
					_name: string,
					callback: (
						compilationLike: ReturnType<typeof createFakeCompilation>,
					) => void,
				) {
					thisCompilationCallback = callback;
				},
			},
		},
		runLifecycle() {
			thisCompilationCallback?.(compilation);
			compilation.runProcessAssets();
			afterEmitCallback?.(compilation);
		},
		webpack: {
			Compilation: {
				PROCESS_ASSETS_STAGE_ADDITIONS: 1,
			},
			sources: {
				RawSource: FakeRawSource,
			},
		},
	};
}

describe("block runtime helpers", () => {
	test("buildScaffoldBlockRegistration merges metadata and overrides", () => {
		expect(
			buildScaffoldBlockRegistration<Record<string, unknown>>(
				{
					category: "widgets",
					name: "demo/block",
					supports: {
						align: true,
						html: false,
					},
					title: "Demo Block",
				},
				{
					edit: "edit-component",
					supports: {
						html: true,
					},
				},
			),
		).toEqual({
			name: "demo/block",
			settings: {
				category: "widgets",
				edit: "edit-component",
				supports: {
					html: true,
				},
				title: "Demo Block",
			},
		});
	});

	test("buildScaffoldBlockRegistration rejects missing or empty block names", () => {
		expect(() =>
			buildScaffoldBlockRegistration(
				{ name: "" } as never,
				{},
			),
		).toThrow("Scaffold block metadata must include a string name.");
		expect(() =>
			buildScaffoldBlockRegistration(
				{} as never,
				{},
			),
		).toThrow("Scaffold block metadata must include a string name.");
	});

	test("createTypiaWebpackConfig merges editor and module entries and preserves plugin ordering", async () => {
		const existingPlugin = { name: "existing-plugin" };
		const config = await createTypiaWebpackConfig({
			defaultConfig: async () => [
				{
					entry: {
						index: "./index.js",
					},
					plugins: [existingPlugin],
				},
				{
					entry: async () => ({
						view: "./view.js",
					}),
					output: {
						module: true,
					},
				},
			],
			fs: createWebpackFsAdapter(),
			getArtifactEntries: () => [],
			getEditorEntries: () => ({
				editor: "./editor.js",
			}),
			getOptionalModuleEntries: () => ({
				interactive: "./interactive.js",
			}),
			importTypiaWebpackPlugin: async () => ({
				default: () => ({ name: "typia-plugin" }),
			}),
			path,
		});

		expect(Array.isArray(config)).toBe(true);

		const [editorConfig, moduleConfig] = config as Array<{
			entry: () => Promise<Record<string, string>>;
			plugins: unknown[];
		}>;

		expect(await editorConfig.entry()).toEqual({
			editor: "./editor.js",
			index: "./index.js",
		});
		expect(await moduleConfig.entry()).toEqual({
			interactive: "./interactive.js",
			view: "./view.js",
		});
		expect(editorConfig.plugins[0]).toEqual({ name: "typia-plugin" });
		expect(editorConfig.plugins[1]).toBe(existingPlugin);
		expect(
			(editorConfig.plugins[2] as { constructor: { name: string } }).constructor.name,
		).toBe("TypiaArtifactAssetPlugin");
	});

	test("createTypiaWebpackConfig respects replace modes for editor and module entries", async () => {
		const config = await createTypiaWebpackConfig({
			defaultConfig: [
				{
					entry: {
						index: "./index.js",
					},
				},
				{
					entry: {
						view: "./view.js",
					},
					output: {
						module: true,
					},
				},
			],
			fs: createWebpackFsAdapter(),
			getArtifactEntries: () => [],
			getEditorEntries: () => ({
				editor: "./editor.js",
			}),
			getOptionalModuleEntries: () => ({
				interactive: "./interactive.js",
			}),
			importTypiaWebpackPlugin: async () => ({
				default: () => ({ name: "typia-plugin" }),
			}),
			moduleEntriesMode: "replace",
			nonModuleEntriesMode: "replace",
			path,
		});

		const [editorConfig, moduleConfig] = config as Array<{
			entry: () => Promise<Record<string, string>>;
		}>;

		expect(await editorConfig.entry()).toEqual({
			editor: "./editor.js",
		});
		expect(await moduleConfig.entry()).toEqual({
			interactive: "./interactive.js",
		});
	});

	test("createTypiaWebpackConfig copies missing artifacts and normalizes script-module assets", async () => {
		const outputDir = createTempDir("wp-typia-webpack-output-");
		const artifactPath = path.join(outputDir, "typia.manifest.json");
		const emittedAssetPath = path.join(outputDir, "view.asset.php");
		const rawAssetSource =
			"<?php return array( 'dependencies' => array( 'wp-i18n' ), 'version' => '1' );";

		writeTextFile(artifactPath, '{"manifestVersion":2}');
		writeTextFile(emittedAssetPath, rawAssetSource);

		const config = await createTypiaWebpackConfig({
			defaultConfig: {
				entry: {},
			},
			fs: createWebpackFsAdapter(),
			getArtifactEntries: () => [
				{
					inputPath: artifactPath,
					outputPath: "typia.manifest.json",
				},
			],
			importTypiaWebpackPlugin: async () => ({
				default: () => ({ name: "typia-plugin" }),
			}),
			isScriptModuleAsset: (assetName) => assetName === "view.asset.php",
			path,
		});
		const plugin = (config as { plugins: unknown[] }).plugins.find(
			(candidate) =>
				(candidate as { constructor?: { name?: string } })?.constructor?.name ===
				"TypiaArtifactAssetPlugin",
		) as
			| { apply(compiler: ReturnType<typeof createFakeCompiler>): void }
			| undefined;
		const compilation = createFakeCompilation(
			{
				"style.css": "body{color:red;}",
				"view.asset.php": rawAssetSource,
			},
			outputDir,
		);
		const compiler = createFakeCompiler(compilation);

		expect(plugin).toBeDefined();
		plugin!.apply(compiler);
		compiler.runLifecycle();

		expect(assetToString(compilation.readAsset("typia.manifest.json"))).toBe(
			'{"manifestVersion":2}',
		);
		expect(assetToString(compilation.readAsset("view.asset.php"))).toContain(
			"'dependencies' => array()",
		);
		expect(assetToString(compilation.readAsset("style.css"))).toBe("body{color:red;}");
		expect(fs.readFileSync(emittedAssetPath, "utf8")).toContain(
			"'dependencies' => array()",
		);
	});
});
