type EntryMap = Record<string, string>;

/**
 * A generated artifact file that should be copied into the webpack output.
 */
export interface TypiaWebpackArtifactEntry {
	inputPath: string;
	outputPath: string;
}

/**
 * Options for creating scaffold webpack configs with shared Typia artifact and
 * script-module handling.
 */
export interface TypiaWebpackConfigOptions {
	defaultConfig: unknown;
	fs: {
		existsSync(path: string): boolean;
		readFileSync(path: string, encoding?: string): string | Buffer;
		writeFileSync(path: string, data: string): void;
	};
	getArtifactEntries: () => TypiaWebpackArtifactEntry[];
	getEditorEntries?: () => EntryMap;
	getOptionalModuleEntries?: () => EntryMap;
	importTypiaWebpackPlugin: () => Promise<{ default: () => unknown }>;
	isScriptModuleAsset?: (assetName: string) => boolean;
	moduleEntriesMode?: "merge" | "replace";
	nonModuleEntriesMode?: "merge" | "replace";
	path: {
		join(...paths: string[]): string;
	};
}

interface ScaffoldBlockRegistrationSettings {
	attributes?: unknown;
	category?: unknown;
	description?: unknown;
	example?: unknown;
	icon?: unknown;
	parent?: unknown;
	supports?: unknown;
	title?: unknown;
}

interface BuildScaffoldBlockRegistrationResult<TSettings extends object> {
	name: string;
	settings: TSettings;
}

interface WebpackAsset {
	name: string;
	source: { source(): unknown };
}

interface WebpackCompilationLike {
	getAsset(name: string): unknown;
	getAssets(): WebpackAsset[];
	emitAsset(name: string, source: unknown): void;
	hooks: {
		processAssets: {
			tap(options: { name: string; stage: number }, cb: () => void): void;
		};
	};
	outputOptions: { path?: string };
	updateAsset(name: string, source: unknown): void;
}

function normalizeScriptModuleAssetSource(source: unknown): string {
	return String(source).replace(
		/'dependencies'\s*=>\s*array\([^)]*\)/,
		"'dependencies' => array()",
	);
}

function normalizeEntryMap(entry: unknown): Record<string, unknown> {
	if (entry && typeof entry === "object" && !Array.isArray(entry)) {
		return { ...(entry as Record<string, unknown>) };
	}

	return {};
}

function toWebpackConfigs(config: unknown): unknown[] {
	return Array.isArray(config) ? config : [config];
}

function isModuleConfig(config: unknown): boolean {
	return (
		typeof config === "object" &&
		config !== null &&
		(config as { output?: { module?: boolean } }).output?.module === true
	);
}

function mergeEntries(
	existingEntries: Record<string, unknown>,
	nextEntries: EntryMap | undefined,
	mode: "merge" | "replace",
): Record<string, unknown> {
	if (!nextEntries) {
		return existingEntries;
	}

	return mode === "replace"
		? { ...nextEntries }
		: {
				...existingEntries,
				...nextEntries,
			};
}

/**
 * Builds a generated block registration payload while centralizing scaffold
 * metadata casting and override merging.
 *
 * @param metadata Raw block metadata loaded from `block.json`.
 * @param overrides Generated edit/save/example overrides to merge on top.
 * @returns The block name and merged registration settings.
 */
export function buildScaffoldBlockRegistration<TSettings extends object>(
	metadata: Record<string, unknown>,
	overrides: Partial<TSettings> & Record<string, unknown>,
): BuildScaffoldBlockRegistrationResult<TSettings> {
	const name = metadata.name;
	if (typeof name !== "string" || name.length === 0) {
		throw new Error("Scaffold block metadata must include a string name.");
	}

	const filteredMetadata: ScaffoldBlockRegistrationSettings = {};
	for (const key of [
		"title",
		"description",
		"category",
		"icon",
		"supports",
		"attributes",
		"example",
		"parent",
	] as const) {
		const value = metadata[key];
		if (value !== undefined) {
			filteredMetadata[key] = value;
		}
	}

	return {
		name,
		settings: {
			...filteredMetadata,
			...overrides,
		} as TSettings,
	};
}

/**
 * Creates a webpack config that shares Typia artifact copying and script-module
 * normalization across generated scaffold templates.
 *
 * @param options Webpack config inputs plus template-specific discovery callbacks.
 * @returns A webpack config or config array that matches the default config shape.
 */
export async function createTypiaWebpackConfig({
	defaultConfig,
	fs,
	getArtifactEntries,
	getEditorEntries,
	getOptionalModuleEntries,
	importTypiaWebpackPlugin,
	isScriptModuleAsset = (assetName: string) =>
		/(^|\/)(interactivity|view)\.asset\.php$/.test(assetName),
	moduleEntriesMode = "merge",
	nonModuleEntriesMode = "merge",
	path,
}: TypiaWebpackConfigOptions) {
	const { default: UnpluginTypia } = await importTypiaWebpackPlugin();
	const resolvedDefaultConfig =
		typeof defaultConfig === "function"
			? await (defaultConfig as () => Promise<unknown> | unknown)()
			: defaultConfig;

	class TypiaArtifactAssetPlugin {
		apply(compiler: {
			hooks: {
				afterEmit: {
					tap(name: string, cb: (compilation: WebpackCompilationLike) => void): void;
				};
				thisCompilation: {
					tap(name: string, cb: (compilation: WebpackCompilationLike) => void): void;
				};
			};
			webpack: {
				Compilation: { PROCESS_ASSETS_STAGE_ADDITIONS: number };
				sources: { RawSource: new (source: unknown) => unknown };
			};
		}) {
			compiler.hooks.thisCompilation.tap(
				"TypiaArtifactAssetPlugin",
				(compilation) => {
					compilation.hooks.processAssets.tap(
						{
							name: "TypiaArtifactAssetPlugin",
							stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
						},
						() => {
							const artifactEntries = getArtifactEntries();
							for (const entry of artifactEntries) {
								if (compilation.getAsset(entry.outputPath)) {
									continue;
								}

								compilation.emitAsset(
									entry.outputPath,
									new compiler.webpack.sources.RawSource(
										fs.readFileSync(entry.inputPath),
									),
								);
							}

							for (const asset of compilation.getAssets()) {
								if (!isScriptModuleAsset(asset.name)) {
									continue;
								}

								compilation.updateAsset(
									asset.name,
									new compiler.webpack.sources.RawSource(
										normalizeScriptModuleAssetSource(asset.source.source()),
									),
								);
							}
						},
					);
				},
			);

			compiler.hooks.afterEmit.tap("TypiaArtifactAssetPlugin", (compilation) => {
				const outputPath = compilation.outputOptions.path;
				if (!outputPath) {
					return;
				}

				for (const asset of compilation.getAssets()) {
					if (!isScriptModuleAsset(asset.name)) {
						continue;
					}

					const assetPath = path.join(outputPath, asset.name);
					if (!fs.existsSync(assetPath)) {
						continue;
					}

					fs.writeFileSync(
						assetPath,
						normalizeScriptModuleAssetSource(
							fs.readFileSync(assetPath, "utf8"),
						),
					);
				}
			});
		}
	}

	const configs = toWebpackConfigs(resolvedDefaultConfig).map((config) => ({
		...(config as Record<string, unknown>),
		entry: async () => {
				const existingEntries = normalizeEntryMap(
					typeof (config as { entry?: unknown }).entry === "function"
						? await (config as { entry: () => Promise<unknown> | unknown }).entry()
						: (config as { entry?: unknown }).entry,
				);
				const editorEntries = getEditorEntries?.();
				const optionalModuleEntries = getOptionalModuleEntries?.();

				if (isModuleConfig(config)) {
					return mergeEntries(
					existingEntries,
					optionalModuleEntries,
					moduleEntriesMode,
				);
			}

			return mergeEntries(
				existingEntries,
				editorEntries,
				nonModuleEntriesMode,
			);
		},
		plugins: [
			UnpluginTypia(),
			...(((config as { plugins?: unknown[] }).plugins ?? []) as unknown[]),
			new TypiaArtifactAssetPlugin(),
		],
	}));

	return configs.length === 1 ? configs[0] : configs;
}
