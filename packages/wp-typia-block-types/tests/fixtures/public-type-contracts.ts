import {
	BLOCK_ALIGNMENTS,
	BLOCK_CONTENT_POSITIONS,
	BLOCK_VERTICAL_ALIGNMENTS,
	JUSTIFY_CONTENT_OPTIONS,
	TEXT_ALIGNMENTS,
	type BlockAlignment,
	type BlockContentPosition,
	type BlockVerticalAlignment,
	type JustifyContent,
	type TextAlignment,
} from "@wp-typia/block-types/block-editor/alignment";
import {
	CSS_NAMED_COLORS,
	type CssNamedColor,
	type DuotonePalette,
} from "@wp-typia/block-types/block-editor/color";
import {
	ASPECT_RATIOS,
	MIN_HEIGHT_KEYWORDS,
	type AspectRatio,
	type MinHeightKeyword,
	type MinHeightValue,
} from "@wp-typia/block-types/block-editor/dimensions";
import {
	FLEX_WRAP_OPTIONS,
	LAYOUT_TYPES,
	ORIENTATIONS,
	type FlexWrap,
	type LayoutType,
	type Orientation,
} from "@wp-typia/block-types/block-editor/layout";
import {
	SPACING_AXES,
	SPACING_DIMENSIONS,
	SPACING_SIDES,
	type SpacingAxis,
	type SpacingDimension,
	type SpacingSide,
} from "@wp-typia/block-types/block-editor/spacing";
import type {
	BlockStyleAttributes,
	BlockStyleColorValue,
} from "@wp-typia/block-types/block-editor/style-attributes";
import {
	FONT_STYLES,
	TEXT_DECORATIONS,
	TEXT_TRANSFORMS,
	WRITING_MODES,
	type FontStyle,
	type TextDecoration,
	type TextTransform,
	type WritingMode,
} from "@wp-typia/block-types/block-editor/typography";
import {
	WORDPRESS_BLOCK_API_COMPATIBILITY,
	createWordPressBlockApiCompatibilityManifest,
	type WordPressBlockApiCompatibilityFeature,
	type WordPressBlockSupportCompatibilityFeature,
	type WordPressCompatibilitySettings,
	type WordPressVersion,
} from "@wp-typia/block-types/blocks/compatibility";
import {
	BLOCK_VARIATION_SCOPES,
	registerScaffoldBlockType,
	type BlockConfiguration,
	type BlockEditProps,
	type BlockVariation,
	type BlockVariationScope,
	type RegisterBlockTypeResult,
} from "@wp-typia/block-types/blocks/registration";
import {
	BLOCK_SUPPORT_FEATURES,
	SPACING_SUPPORT_KEYS,
	TYPOGRAPHY_SUPPORT_KEYS,
	defineSupports,
	getDefinedSupportsCompatibilityManifest,
	type BlockSupportFeature,
	type BlockSupports,
	type SpacingSupportKey,
	type SupportAttributes,
	type TypographySupportKey,
} from "@wp-typia/block-types/blocks/supports";

const alignments = BLOCK_ALIGNMENTS satisfies readonly BlockAlignment[];
const contentPositions =
	BLOCK_CONTENT_POSITIONS satisfies readonly BlockContentPosition[];
const verticalAlignments =
	BLOCK_VERTICAL_ALIGNMENTS satisfies readonly BlockVerticalAlignment[];
const textAlignments = TEXT_ALIGNMENTS satisfies readonly TextAlignment[];
const justifyContentOptions =
	JUSTIFY_CONTENT_OPTIONS satisfies readonly JustifyContent[];
const namedColors = CSS_NAMED_COLORS satisfies readonly CssNamedColor[];
const aspectRatios = ASPECT_RATIOS satisfies readonly AspectRatio[];
const minHeightKeywords =
	MIN_HEIGHT_KEYWORDS satisfies readonly MinHeightKeyword[];
const layoutTypes = LAYOUT_TYPES satisfies readonly LayoutType[];
const flexWrapOptions = FLEX_WRAP_OPTIONS satisfies readonly FlexWrap[];
const orientations = ORIENTATIONS satisfies readonly Orientation[];
const spacingSides = SPACING_SIDES satisfies readonly SpacingSide[];
const spacingAxes = SPACING_AXES satisfies readonly SpacingAxis[];
const spacingDimensions =
	SPACING_DIMENSIONS satisfies readonly SpacingDimension[];
const textTransforms = TEXT_TRANSFORMS satisfies readonly TextTransform[];
const textDecorations = TEXT_DECORATIONS satisfies readonly TextDecoration[];
const fontStyles = FONT_STYLES satisfies readonly FontStyle[];
const writingModes = WRITING_MODES satisfies readonly WritingMode[];
const variationScopes =
	BLOCK_VARIATION_SCOPES satisfies readonly BlockVariationScope[];
const supportFeatures =
	BLOCK_SUPPORT_FEATURES satisfies readonly BlockSupportFeature[];
const spacingSupportKeys =
	SPACING_SUPPORT_KEYS satisfies readonly SpacingSupportKey[];
const typographySupportKeys =
	TYPOGRAPHY_SUPPORT_KEYS satisfies readonly TypographySupportKey[];
const compatibilityMinVersion: WordPressVersion = "6.7";
const compatibilitySettings: WordPressCompatibilitySettings = {
	allowUnknownFutureKeys: false,
	minVersion: compatibilityMinVersion,
	strict: true,
};
const compatibilityFeature: WordPressBlockApiCompatibilityFeature = {
	area: "blockSupports",
	feature: "allowedBlocks",
};
const supportCompatibilityFeature: WordPressBlockSupportCompatibilityFeature =
	"typography.textAlign";
const compatibilityManifest = createWordPressBlockApiCompatibilityManifest(
	[compatibilityFeature],
	compatibilitySettings,
);
const supportsTextAlignSince =
	WORDPRESS_BLOCK_API_COMPATIBILITY.blockSupports["typography.textAlign"].since;
const proseSupports = defineSupports({
	minWordPress: "6.6",
	anchor: true,
	color: {
		background: true,
		text: true,
	},
	html: false,
	layout: {
		default: {
			type: "constrained",
		},
	},
	spacing: {
		blockGap: true,
		margin: true,
		padding: true,
	},
	typography: {
		fontSize: true,
		letterSpacing: true,
		lineHeight: true,
		textAlign: ["left", "center"],
	},
});
const proseSupportManifest =
	getDefinedSupportsCompatibilityManifest(proseSupports);
const alignSupports = defineSupports({
	align: ["wide", "full"],
});
type AlignSupportAttributes = SupportAttributes<typeof alignSupports>;
const alignSupportHasAlign: "align" extends keyof AlignSupportAttributes
	? true
	: never = true;
const alignWideOnlySupports = defineSupports({
	alignWide: true,
});
type AlignWideOnlySupportAttributes = SupportAttributes<
	typeof alignWideOnlySupports
>;
const alignWideDoesNotExposeAlign: "align" extends keyof AlignWideOnlySupportAttributes
	? never
	: true = true;

type ExampleAttributes = SupportAttributes<typeof proseSupports> & {
	content: string;
};

declare const configuration: BlockConfiguration<ExampleAttributes>;
declare const editProps: BlockEditProps<ExampleAttributes>;
declare const variation: BlockVariation<ExampleAttributes>;

const registrationResult: RegisterBlockTypeResult<ExampleAttributes> =
	registerScaffoldBlockType<ExampleAttributes>(
		"wp-typia/example-block",
		configuration,
	);

const content = editProps.attributes.content;
const maybeVariationTitle = variation.title;
const validColorValue: BlockStyleColorValue = "var:preset|color|primary";
const validMinHeightValue: MinHeightValue = "clamp(2rem, 10vh, 6rem)";
const duotonePalette: DuotonePalette = {
	colors: ["transparent", "currentColor"],
	name: "Neutral",
	slug: "neutral",
};

const styleAttributes: BlockStyleAttributes = {
	color: {
		text: validColorValue,
	},
	dimensions: {
		minHeight: "auto",
	},
	spacing: {
		padding: {
			top: "1rem",
			bottom: "2rem",
		},
	},
	typography: {
		textAlign: "center",
		textDecoration: "underline",
	},
};
const derivedSupportAttributes: SupportAttributes<typeof proseSupports> = {
	backgroundColor: "primary",
	fontSize: "large",
	layout: {
		type: "constrained",
	},
	style: {
		color: {
			text: "var:preset|color|primary",
		},
		spacing: {
			margin: "1rem",
			padding: {
				top: "1rem",
			},
		},
		typography: {
			letterSpacing: "0.02em",
			lineHeight: 1.5,
			textAlign: "center",
		},
	},
	textColor: "foreground",
};

const supports: BlockSupports = {
	allowedBlocks: true,
	color: {
		button: true,
		gradients: true,
		text: true,
	},
	layout: {
		default: {
			flexWrap: "wrap",
			justifyContent: "space-between",
			orientation: "horizontal",
			type: "flex",
		},
	},
	spacing: {
		padding: ["top", "bottom"],
		units: ["px", "rem"],
	},
	typography: {
		dropCap: true,
		textAlign: ["left", "center"],
	},
	visibility: true,
};

void alignments;
void contentPositions;
void verticalAlignments;
void textAlignments;
void justifyContentOptions;
void namedColors;
void aspectRatios;
void minHeightKeywords;
void layoutTypes;
void flexWrapOptions;
void orientations;
void spacingSides;
void spacingAxes;
void spacingDimensions;
void textTransforms;
void textDecorations;
void fontStyles;
void writingModes;
void variationScopes;
void supportFeatures;
void spacingSupportKeys;
void typographySupportKeys;
void compatibilityManifest;
void supportCompatibilityFeature;
void supportsTextAlignSince;
void proseSupports;
void proseSupportManifest;
void alignSupports;
void alignSupportHasAlign;
void alignWideOnlySupports;
void alignWideDoesNotExposeAlign;
void registrationResult;
void content;
void maybeVariationTitle;
void styleAttributes;
void derivedSupportAttributes;
void supports;
void duotonePalette;
void validMinHeightValue;

// @ts-expect-error BlockAlignment should stay narrower than text alignment.
const invalidBlockAlignment: BlockAlignment = "justify";

// @ts-expect-error CssNamedColor intentionally excludes arbitrary CSS values.
const invalidNamedColor: CssNamedColor = "#ffffff";

// @ts-expect-error Block variation scopes should stay within the published tuple.
const invalidVariationScope: BlockVariationScope = "toolbar";

// @ts-expect-error Typography textAlign should only accept text alignment values.
const invalidTextAlignments = ["wide"] satisfies readonly TextAlignment[];

void invalidBlockAlignment;
void invalidNamedColor;
void invalidVariationScope;
void invalidTextAlignments;
