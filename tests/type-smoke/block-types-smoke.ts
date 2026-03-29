import type {
	BlockAlignment,
	BlockContentPosition,
	BlockVerticalAlignment,
	TextAlignment,
} from "@wp-typia/block-types/block-editor/alignment";
import type {
	CssColorValue,
	CssNamedColor,
	DuotonePalette,
} from "@wp-typia/block-types/block-editor/color";
import type {
	AspectRatio,
	MinHeightKeyword,
	MinHeightValue,
} from "@wp-typia/block-types/block-editor/dimensions";
import type { LayoutType } from "@wp-typia/block-types/block-editor/layout";
import type { SpacingDimension } from "@wp-typia/block-types/block-editor/spacing";
import type { TextTransform } from "@wp-typia/block-types/block-editor/typography";
import type { TypographySupportKey } from "@wp-typia/block-types/blocks/supports";

const aspectRatio: AspectRatio = "16/9";
const blockAlignment: BlockAlignment = "wide";
const contentPosition: BlockContentPosition = "center right";
const layoutType: LayoutType = "flex";
const minHeightKeyword: MinHeightKeyword = "auto";
const minHeight: MinHeightValue = "320px";
const spacingDimension: SpacingDimension = "bottom";
const supportKey: TypographySupportKey = "fontStyle";
const textAlignment: TextAlignment = "justify";
const textTransform: TextTransform = "capitalize";
const blockVerticalAlignment: BlockVerticalAlignment = "top";
const namedColor: CssNamedColor = "transparent";
const textColor: CssColorValue = "var(--wp--preset--color--primary)";
const duotonePalette: DuotonePalette = {
	colors: ["#111111", "rgba(255, 255, 255, 0.95)"],
	name: "High contrast",
	slug: "high-contrast",
};

void aspectRatio;
void blockAlignment;
void contentPosition;
void duotonePalette;
void layoutType;
void minHeightKeyword;
void minHeight;
void namedColor;
void spacingDimension;
void supportKey;
void textAlignment;
void textColor;
void textTransform;
void blockVerticalAlignment;
