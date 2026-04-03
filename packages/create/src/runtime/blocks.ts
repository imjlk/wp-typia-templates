import type { BlockSupports as WordPressBlockSupports } from "@wordpress/blocks";

type EntryMap = Record<string, string>;
type ScaffoldLayoutType = "flow" | "constrained" | "flex" | "grid";
type ScaffoldFlexWrap = "wrap" | "nowrap";
type ScaffoldOrientation = "horizontal" | "vertical";
type ScaffoldJustifyContent = "left" | "center" | "right" | "space-between" | "stretch";
type ScaffoldBlockAlignment = "left" | "center" | "right" | "wide" | "full";
type ScaffoldSpacingAxis = "horizontal" | "vertical";
type ScaffoldSpacingDimension =
	| "top"
	| "right"
	| "bottom"
	| "left"
	| ScaffoldSpacingAxis;
type ScaffoldTypographySupportKey =
	| "fontFamily"
	| "fontSize"
	| "fontStyle"
	| "fontWeight"
	| "letterSpacing"
	| "lineHeight"
	| "textAlign"
	| "textColumns"
	| "textDecoration"
	| "textTransform"
	| "writingMode";
type ScaffoldSpacingSupportKey = "blockGap" | "margin" | "padding";

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

type OverrideProperties<TBase, TOverride> = Omit<TBase, keyof TOverride> & TOverride;
type ScaffoldSupportDefaultControls<TFeature extends string> = Readonly<
	Partial<Record<TFeature, boolean>> & Record<string, boolean | undefined>
>;

/**
 * Border support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockBorderSupport {
	readonly color?: boolean;
	readonly radius?: boolean;
	readonly style?: boolean;
	readonly width?: boolean;
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
		"color" | "radius" | "style" | "width"
	>;
}

/**
 * Color support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockColorSupport {
	readonly background?: boolean;
	readonly button?: boolean;
	readonly enableContrastChecker?: boolean;
	readonly gradients?: boolean;
	readonly heading?: boolean;
	readonly link?: boolean;
	readonly text?: boolean;
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
		"background" | "gradients" | "link" | "text"
	>;
}

/**
 * Dimension support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockDimensionsSupport {
	readonly aspectRatio?: boolean;
	readonly height?: boolean;
	readonly minHeight?: boolean;
	readonly width?: boolean;
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
		"aspectRatio" | "height" | "minHeight" | "width"
	>;
}

/**
 * Filter support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockFilterSupport {
	readonly duotone?: boolean;
}

/**
 * Interactivity support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockInteractivitySupport {
	readonly clientNavigation?: boolean;
	readonly interactive?: boolean;
}

/**
 * Default layout values accepted by scaffold block registrations.
 */
interface ScaffoldBlockLayoutDefault {
	readonly allowInheriting?: boolean;
	readonly allowSizingOnChildren?: boolean;
	readonly flexWrap?: ScaffoldFlexWrap;
	readonly justifyContent?: ScaffoldJustifyContent;
	readonly orientation?: ScaffoldOrientation;
	readonly type?: ScaffoldLayoutType;
}

/**
 * Layout support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockLayoutSupport {
	readonly allowCustomContentAndWideSize?: boolean;
	readonly allowEditing?: boolean;
	readonly allowInheriting?: boolean;
	readonly allowJustification?: boolean;
	readonly allowOrientation?: boolean;
	readonly allowSizingOnChildren?: boolean;
	readonly allowSwitching?: boolean;
	readonly default?: ScaffoldBlockLayoutDefault;
	readonly type?: ScaffoldLayoutType;
}

/**
 * Lightbox support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockLightboxSupport {
	readonly allowEditing?: boolean;
	readonly enabled?: boolean;
}

/**
 * Position support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockPositionSupport {
	readonly fixed?: boolean;
	readonly sticky?: boolean;
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
		"fixed" | "sticky"
	>;
}

/**
 * Shadow support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockShadowSupport {
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<"shadow">;
}

/**
 * Spacing support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockSpacingSupport {
	readonly blockGap?: boolean | readonly ScaffoldSpacingAxis[];
	readonly margin?: boolean | readonly ScaffoldSpacingDimension[];
	readonly padding?: boolean | readonly ScaffoldSpacingDimension[];
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<ScaffoldSpacingSupportKey>;
}

/**
 * Typography support configuration accepted by scaffold block registrations.
 */
interface ScaffoldBlockTypographySupport {
	readonly fontFamily?: boolean;
	readonly fontSize?: boolean;
	readonly fontStyle?: boolean;
	readonly fontWeight?: boolean;
	readonly letterSpacing?: boolean;
	readonly lineHeight?: boolean;
	readonly textAlign?: boolean;
	readonly textColumns?: boolean;
	readonly textDecoration?: boolean;
	readonly textTransform?: boolean;
	readonly writingMode?: boolean;
	readonly __experimentalDefaultControls?: ScaffoldSupportDefaultControls<
		ScaffoldTypographySupportKey
	>;
}

/**
 * Scaffold-specific block support overrides that preserve WordPress-compatible
 * boolean branches for nested support objects.
 *
 * These stay local to `@wp-typia/create` so the runtime package can compile in
 * isolation without pulling sibling package source files into its `rootDir`.
 */
type ScaffoldBlockSupportsOverride = {
	readonly align?: boolean | readonly ScaffoldBlockAlignment[];
	readonly alignWide?: boolean;
	readonly anchor?: boolean;
	readonly ariaLabel?: boolean;
	readonly border?: boolean | ScaffoldBlockBorderSupport;
	readonly className?: boolean;
	readonly color?: boolean | ScaffoldBlockColorSupport;
	readonly customClassName?: boolean;
	readonly dimensions?: boolean | ScaffoldBlockDimensionsSupport;
	readonly filter?: boolean | ScaffoldBlockFilterSupport;
	readonly html?: boolean;
	readonly inserter?: boolean;
	readonly interactivity?: boolean | ScaffoldBlockInteractivitySupport;
	readonly layout?: boolean | ScaffoldBlockLayoutSupport;
	readonly lightbox?: boolean | ScaffoldBlockLightboxSupport;
	readonly lock?: boolean;
	readonly multiple?: boolean;
	readonly position?: boolean | ScaffoldBlockPositionSupport;
	readonly renaming?: boolean;
	readonly reusable?: boolean;
	readonly shadow?: boolean | ScaffoldBlockShadowSupport;
	readonly spacing?: boolean | ScaffoldBlockSpacingSupport;
	readonly typography?: boolean | ScaffoldBlockTypographySupport;
};

/**
 * Extended block support surface used by scaffold registration helpers.
 *
 * This keeps compatibility with `@wordpress/blocks` while replacing overlapping
 * support keys with WordPress-compatible boolean-or-object overrides.
 */
export type ScaffoldBlockSupports = OverrideProperties<
	WordPressBlockSupports,
	ScaffoldBlockSupportsOverride
>;

/**
 * Registration settings copied from scaffold block metadata and merged into the
 * final `registerBlockType` call.
 */
export interface ScaffoldBlockRegistrationSettings {
	/** Limits insertion to descendants of the listed ancestor block names. */
	ancestor?: readonly string[];
	/** Raw block attribute definitions from `block.json`. */
	attributes?: Record<string, unknown>;
	/** WordPress block category passed through to registration. */
	category?: unknown;
	/** Human-readable block description from metadata. */
	description?: unknown;
	/** Example payload used by inserter previews and fixture generation. */
	example?: unknown;
	/** Dashicon slug, SVG, or icon object accepted by WordPress. */
	icon?: unknown;
	/** Limits insertion to children of the listed parent block names. */
	parent?: readonly string[];
	/** Typed block support configuration for scaffolded registrations. */
	supports?: ScaffoldBlockSupports;
	/** Human-readable block title shown in the inserter. */
	title?: unknown;
}

/**
 * Scaffold block metadata consumed by registration helpers.
 *
 * This extends the registration settings with the required block name.
 */
export interface ScaffoldBlockMetadata extends ScaffoldBlockRegistrationSettings {
	name: string;
}

/**
 * Return shape for `buildScaffoldBlockRegistration`.
 */
export interface BuildScaffoldBlockRegistrationResult<TSettings extends object> {
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
 * metadata casting, override merging, and full `block.json` field forwarding.
 *
 * @param metadata Raw block metadata loaded from `block.json`.
 * @param overrides Generated edit/save/example overrides to merge on top.
 * @returns The block name and merged registration settings.
 */
export function buildScaffoldBlockRegistration<TSettings extends object>(
	metadata: ScaffoldBlockMetadata,
	overrides: Partial<TSettings> & Record<string, unknown>,
): BuildScaffoldBlockRegistrationResult<TSettings> {
	const name = metadata.name;
	if (typeof name !== "string" || name.length === 0) {
		throw new Error("Scaffold block metadata must include a string name.");
	}

	const { name: _ignoredName, ...metadataSettings } = metadata as ScaffoldBlockMetadata &
		Record<string, unknown>;

	return {
		name,
		settings: {
			...metadataSettings,
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
