type EntryMap = Record<string, string>;

export interface TypiaWebpackArtifactEntry {
	inputPath: string;
	outputPath: string;
}

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

interface BuildScaffoldBlockRegistrationResult<TSettings extends object> {
	name: string;
	settings: TSettings;
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

export function buildScaffoldBlockRegistration<TSettings extends object>(
	metadata: Record<string, unknown>,
	overrides: Partial<TSettings> & Record<string, unknown>,
): BuildScaffoldBlockRegistrationResult<TSettings> {
	const name = metadata.name;
	if (typeof name !== "string" || name.length === 0) {
		throw new Error("Scaffold block metadata must include a string name.");
	}

	return {
		name,
		settings: {
			title: metadata.title,
			description: metadata.description,
			category: metadata.category,
			icon: metadata.icon,
			supports: metadata.supports,
			attributes: metadata.attributes,
			example: metadata.example,
			parent: metadata.parent,
			...overrides,
		} as TSettings,
	};
}

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
	const artifactEntries = getArtifactEntries();
	const editorEntries = getEditorEntries?.();
	const optionalModuleEntries = getOptionalModuleEntries?.();

	class TypiaArtifactAssetPlugin {
		apply(compiler: {
			hooks: {
				afterEmit: { tap(name: string, cb: (compilation: any) => void): void };
				thisCompilation: { tap(name: string, cb: (compilation: any) => void): void };
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
